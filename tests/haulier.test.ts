/** The Haulier, the Deep's boss of every fifth floor (docs/design/deep-bosses.md). */
import { describe, expect, it } from 'vitest';
import { deepFloor } from '../src/shared/deep';
import { HAULIER, SKY_STRIKE, TICK } from '../src/shared/tuning';
import { SUMP, SUMP_SPOTS } from '../src/shared/sumparena';
import { WEAPONS } from '../src/shared/tuning';
import { goal, newRun, runRoom } from '../src/sim/run';
import { plateOf } from '../src/sim/bossplate';
import { NO_INTENT, type FightEvent, type Hero } from '../src/sim/types';
import { haulRotation } from '../src/sim/haulier';
import { callStrike } from '../src/sim/skystrike';
import { armoured } from '../src/sim/ironhide';
import { haulState, nearestCart } from '../src/sim/haulcarts';
import { offTrack, pickTrack, trackShapes } from '../src/sim/trackshape';

const floor = (n: number) => runRoom(newRun(deepFloor(n, 77, 'x')));

describe('the Haulier', () => {
  it('every fifth floor is its working: the tracks to the edges, two carts on sidings, the gear, the sump, the adit, the chained chest', () => {
    // (Boss floors take it in turns with the Doorkeepers: tests/deepdoor.test.ts. On this seed, 5 and 25 are the Haulier's; 15 is THE LEECHMAN's: tests/leechman.test.ts.)
    for (const n of [5, 25]) expect(deepFloor(n, 77, 'x')).toMatchObject({ arena: 'haulier', objective: 'hunt' });
    for (const n of [4, 6, 9, 11]) expect(deepFloor(n, 77, 'x').arena).toBeUndefined();
    const r = floor(5), m = r.map;
    expect(m.tracks && m.gear && m.adits?.length && m.water?.length).toBeTruthy();
    expect(m.rail).toBeUndefined();
    // Several straight tracks, some across and some down, each reaching the room's edge at both ends (a tunnel mouth there).
    expect(m.tracks!.length).toBeGreaterThanOrEqual(3);
    expect(m.tracks!.some((t) => t.y0 === t.y1) && m.tracks!.some((t) => t.x0 === t.x1)).toBe(true);
    const edge = (x: number, y: number) => x <= 0 || y <= 0 || x >= SUMP.w || y >= SUMP.h;
    for (const t of m.tracks!) expect(edge(t.x0, t.y0) && edge(t.x1, t.y1), JSON.stringify(t)).toBe(true);
    const carts = r.props.filter((p) => p.kind === 'cart');
    expect(carts).toHaveLength(2);
    // (At rest beside the tracks, never on one.)
    for (const c of carts) for (const t of m.tracks!) expect(offTrack(t, c.x, c.y)).toBeGreaterThan(1.1);
    expect(r.chests.some((c) => c.chained)).toBe(true);
    const h = r.enemies.find((e) => e.boss?.who === 'haulier')!;
    expect(h).toMatchObject({ variant: 'ironhide', radius: HAULIER.radius });
    expect(plateOf(r.enemies, 0)).toMatchObject({ name: h.name, pips: 2 });
  });

  it('is tougher deeper, and the floor is done when it is dead', () => {
    const a = floor(5).enemies.find((e) => e.boss)!, b = floor(25).enemies.find((e) => e.boss)!;
    expect(b.maxHp).toBeGreaterThan(a.maxHp);
    const run = newRun(deepFloor(5, 77, 'x')), r = runRoom(run), h = r.enemies.find((e) => e.boss)!;
    expect(goal(run, r).done).toBe(false);
    Object.assign(h, { hp: 0, act: 'dead' });
    expect(goal(run, r).done).toBe(true);
  });

  it('wakes to a hero walking up, swings, and roars into phase 2 at half', () => {
    const r = floor(5), h = r.enemies.find((e) => e.boss)!;
    r.join('me');
    const me = r.heroes.find((x) => x.id === 'me')!;
    Object.assign(me, { x: h.x, y: h.y + 2, hp: 9999, maxHp: 9999 });
    let swung = false;
    for (let i = 0; i < 6 / TICK && !swung; i++) (r.setIntent('me', NO_INTENT), r.step(), (swung ||= !!h.attack));
    expect(swung).toBe(true);
    h.hp = Math.floor(h.maxHp * HAULIER.phase2) - 1;
    for (let i = 0; i < 3; i++) r.step();
    expect(h.boss!.phase).toBe(2);
  });

  const setup = () => {
    const r = floor(5), h = r.enemies.find((e) => e.boss)!;
    r.join('me');
    const me = r.heroes.find((x) => x.id === 'me')!;
    Object.assign(me, { hp: 9999, maxHp: 9999 });
    h.alert = true;
    return { r, h, me };
  };
  const run = (r: ReturnType<typeof floor>, ticks: number, until?: () => boolean) => {
    const ev: FightEvent[] = [];
    for (let i = 0; i < ticks && !(until && until()); i++) (r.step(), ev.push(...r.events));
    return ev;
  };
  const carts = (r: ReturnType<typeof floor>) => r.props.filter((p) => p.kind === 'cart');

  it('each move of its rotation begins: the right kind, boss.move set for the screen', () => {
    const want = { pick: 'cleave', overhead: 'slam', hurl: 'charge', drag: 'slam' } as const;
    for (const [phase, move] of [[1, 'pick'], [1, 'overhead'], [1, 'hurl'], [2, 'drag']] as const) {
      const { r, h, me } = setup();
      h.boss!.phase = phase;
      h.boss!.rot = haulRotation(phase, h.boss!.party, r.bosses!.swaps[phase - 1]).indexOf(move);
      h.cooldown = 0;
      if (move === 'hurl') Object.assign(h, { x: 3, y: 5.5 }), Object.assign(me, { x: 9, y: 11 });
      else Object.assign(me, { x: h.x, y: h.y + 2 });
      run(r, 6 / TICK, () => !!h.attack);
      expect(h.attack, move).toBeTruthy();
      expect(h.boss!.move).toBe(move);
      expect(h.attack!.kind).toBe(want[move]);
      if (move === 'drag') expect(h.attack).toMatchObject({ radius: HAULIER.drag.radius, unblockable: true });
      if (move === 'overhead') expect(h.attack).toMatchObject({ unblockable: true, radius: HAULIER.overhead.radius });
      if (move === 'hurl') expect(h.attack).toMatchObject({ radius: HAULIER.cart.width / 2, unblockable: true });
    }
  });

  /** The Haulier parked off every track (between the two down ones), roaring so it stays; the tracks quiet unless a test says. */
  const parked = () => {
    const t = setup();
    Object.assign(t.h, { x: 6.1, y: 11 });
    t.h.boss!.roarUntil = 1e9;
    t.r.bosses!.started = t.r.time;
    haulState(t.r.bosses!).next = Infinity;
    Object.assign(t.me, { x: 6.1, y: 12.8, safeT: 0 });
    return t;
  };
  const warn = (r: ReturnType<typeof floor>, h: ReturnType<typeof setup>['h'], i: number, from: 0 | 1, goIn = 1.6) => {
    h.boss!.track = { i, from, at: r.time, lane: r.time + goIn - HAULIER.track.lane, go: r.time + goIn };
  };
  const trackCarts = (r: ReturnType<typeof floor>) => carts(r).filter((p) => p.rollBy === 'track');

  it('a warning comes before every cart, the lane shows its last second, one cart at a time, the beat is 6 s then 4 s', () => {
    for (const phase of [1, 2] as const) {
      const { r, h } = parked();
      h.boss!.phase = phase;
      haulState(r.bosses!).next = r.time + 0.5;
      const warns: number[] = [], goes: number[] = [];
      let lane = 0, most = 0, warned = false;
      for (let i = 0; i < 26 / TICK; i++) {
        r.step();
        const w = h.boss!.track, n = trackCarts(r).length;
        most = Math.max(most, n);
        if (w && !warned) warns.push(r.time), (warned = true);
        if (!w) warned = false;
        if (w && r.time >= w.lane && r.time < w.go) {
          lane++;
          expect(trackShapes(h, r.time)).toHaveLength(1);
          expect(trackShapes(h, r.time)[0]).toMatchObject({ unblockable: true, radius: HAULIER.cart.width / 2 });
        } else expect(trackShapes(h, r.time)).toHaveLength(0);
        if (n && goes.length < warns.length && !h.boss!.track) goes.push(r.time);
      }
      expect(most).toBe(1);
      expect(warns.length).toBeGreaterThanOrEqual(3);
      // The cart goes HAULIER.track.warn s after its warning began (a tick or two).
      goes.forEach((g, k) => {
        expect(g - warns[k]).toBeGreaterThanOrEqual(HAULIER.track.warn - 0.01);
        expect(g - warns[k]).toBeLessThan(HAULIER.track.warn + 0.2);
      });
      expect(lane).toBeGreaterThanOrEqual(Math.floor(HAULIER.track.lane / TICK) * 2);
      for (let k = 1; k < warns.length; k++) expect(warns[k] - warns[k - 1]).toBeCloseTo(HAULIER.track.every[phase], 0);
    }
  });

  it('a cart bursts out of one mouth, rolls the whole track and is gone into the far one', () => {
    for (const from of [0, 1] as const) {
      const { r, h } = parked();
      const t = r.map.tracks![0];
      warn(r, h, 0, from, 0.3);
      const seen: { x: number; y: number }[] = [], ev: FightEvent[] = [];
      for (let i = 0; i < 6 / TICK; i++) {
        r.step();
        ev.push(...r.events);
        const c = trackCarts(r)[0];
        if (c) seen.push({ x: c.x, y: c.y });
        else if (seen.length) break;
      }
      expect(seen.length).toBeGreaterThan(5);
      const [a, b] = from ? [t.x1, t.x0] : [t.x0, t.x1];
      // Starts at the mouth it burst from, ends at the far one, along the track's line the whole way.
      expect(Math.abs(seen[0].x - a)).toBeLessThan(1.2);
      expect(Math.abs(seen[seen.length - 1].x - b)).toBeLessThan(1.5);
      for (const q of seen) expect(q.y).toBeCloseTo(t.y0, 5);
      expect(ev.find((x) => x.k === 'cart' && x.what === 'go')).toMatchObject({ by: 'track' });
      expect(ev.find((x) => x.k === 'cart' && x.what === 'gone')).toBeTruthy();
      expect(trackCarts(r)).toHaveLength(0);
      // And gone: not one cart more than the two on the sidings.
      expect(carts(r)).toHaveLength(2);
    }
  });

  it('a cart hits a hero standing on the track, once, and not one beside it; rolling out of the way saves you', () => {
    const { r, h, me } = parked();
    r.join('you');
    r.join('ally');
    const you = r.heroes.find((x) => x.id === 'you')!, ally = r.heroes.find((x) => x.id === 'ally')!;
    Object.assign(you, { hp: 9999, maxHp: 9999, safeT: 0, x: 9.6, y: 9.4 });
    Object.assign(ally, { hp: 9999, maxHp: 9999, safeT: 0, x: 11, y: 5.2 });
    Object.assign(me, { x: 9.6, y: 7.6 });
    warn(r, h, 0, 0, 0.3);
    const ev = run(r, 3 / TICK);
    expect(ev.filter((x) => x.k === 'cart' && x.what === 'hit' && x.on === 'me')).toHaveLength(1);
    expect(me.hp).toBeLessThan(9999);
    expect(ev.find((x) => x.k === 'cart' && x.what === 'hit' && x.on === 'you')).toBeFalsy();
    expect(you.hp).toBe(9999);
    expect(ally.hp).toBe(9999);
  });

  it('a cart knocks the Haulier down and cracks its plate if it is on the track; a second within the cooldown shrugs', () => {
    const { r, h } = parked();
    Object.assign(h, { x: 6, y: 7.6 });
    warn(r, h, 0, 0, 0.3);
    const ev = run(r, 3 / TICK);
    expect(ev.find((x) => x.k === 'cart' && x.what === 'hit' && x.on === 'haulier')).toBeTruthy();
    expect(h.boss!.downUntil).toBeGreaterThan(0);
    expect(h.cracked).toBe(true);
    const downUntil = h.boss!.downUntil;
    // The next, soon after: a shrug, and no new knock down.
    warn(r, h, 0, 1, 0.3);
    const ev2 = run(r, 3 / TICK);
    expect(ev2.find((x) => x.k === 'cart' && x.what === 'hit' && x.on === 'haulier')).toBeTruthy();
    expect(ev2.find((x) => x.k === 'shrug')).toBeTruthy();
    expect(h.boss!.downUntil).toBe(downUntil);
  });

  it('a cart that does not pass the Haulier leaves it standing', () => {
    const { r, h } = parked();
    warn(r, h, 0, 0, 0.3);
    const ev = run(r, 3 / TICK);
    expect(ev.find((x) => x.k === 'cart' && x.what === 'hit' && x.on === 'haulier')).toBeFalsy();
    expect(h.cracked).toBeFalsy();
  });

  it('the next track is picked by the room\'s seeded stream, leaning to one the Haulier stands near, and not the last one twice', () => {
    const { r } = setup();
    const tracks = r.map.tracks!;
    const share = (at: { x: number; y: number }, i: number, last = -1) => {
      let n = 0;
      for (let k = 0; k < 1000; k++) n += pickTrack(tracks, at, last, (k + 0.5) / 1000) === i ? 1 : 0;
      return n / 1000;
    };
    const near = share({ x: 4.4, y: 3 }, 1), far = share({ x: 11.5, y: 13.5 }, 1);
    expect(near).toBeGreaterThan(0.5);
    expect(far).toBeLessThan(0.4);
    expect(share({ x: 4.4, y: 3 }, 1, 1)).toBeLessThan(near);
    // Same room, same picks.
    const seq = () => {
      const t = parked();
      haulState(t.r.bosses!).next = t.r.time + 0.2;
      const out: number[] = [];
      let was = false;
      for (let i = 0; i < 40 / TICK; i++) {
        t.r.step();
        const w = t.h.boss!.track;
        if (w && !was) out.push(w.i * 2 + w.from);
        was = !!w;
      }
      return out;
    };
    const a = seq(), b = seq();
    expect(a.length).toBeGreaterThan(4);
    expect(a).toEqual(b);
  });

  it('its HURL lifts a cart from a siding and hurls it down a striped lane at its hero; the cart stops where it stops and can be hurled again; it never knocks its thrower down', () => {
    const { r, h, me } = setup();
    r.bosses!.started = r.time;
    h.boss!.rotAt = r.time;
    haulState(r.bosses!).next = Infinity;
    Object.assign(h, { x: 3, y: 5.5 });
    Object.assign(me, { x: 9, y: 11 });
    h.boss!.rot = haulRotation(1, h.boss!.party, r.bosses!.swaps[0]).indexOf('hurl');
    h.cooldown = 0;
    const c = carts(r).find((p) => p.x < 6)!;
    const ev = run(r, 3 / TICK, () => c.heldBy === 'haulier');
    expect(c.heldBy).toBe('haulier');
    // The lane: from just ahead of it, at its hero, out to where the cart will stop.
    const a = h.attack!;
    expect(a).toMatchObject({ unblockable: true, radius: HAULIER.cart.width / 2 });
    expect(a.dx * (me.x - h.x) + a.dy * (me.y - h.y)).toBeGreaterThan(0.95 * Math.hypot(me.x - h.x, me.y - h.y));
    expect(a.range).toBeGreaterThan(3);
    ev.push(...run(r, 3 / TICK, () => !!c.roll));
    expect(c.roll).not.toBe(0);
    expect(c.rollBy).toBe('haulier');
    expect(c.heldBy).toBeFalsy();
    expect(ev.find((x) => x.k === 'cart' && x.what === 'go')).toMatchObject({ by: 'haulier' });
    ev.push(...run(r, 6 / TICK, () => !c.roll));
    expect(ev.find((x) => x.k === 'cart' && x.what === 'stop')).toBeTruthy();
    expect(h.boss!.downUntil ?? -9).toBeLessThan(r.time);
    // At rest where it stopped, a cart like any other: the Haulier can hurl it again.
    expect(c.roll).toBeFalsy();
    expect(Math.hypot(c.x - 2.4, c.y - 5.9)).toBeGreaterThan(2);
    expect(nearestCart(r.props, c.x, c.y, 0.1)).toBe(c);
  });

  it('GRAB by a cart does nothing: no hold, no roll, no cart event, and the usual "nothing to grab" is not hidden', () => {
    const { r, h, me } = parked();
    const c = carts(r)[0], at = { x: c.x, y: c.y };
    Object.assign(me, { x: c.x + 1, y: c.y });
    run(r, 2 / TICK);
    const grabber = WEAPONS[me.weapon].cls === 'WARRIOR' || me.weapon === 'spellblade';
    r.setIntent('me', { ...NO_INTENT, ax: -1, ay: 0, grabSeq: 1 });
    const ev = run(r, 1.5 / TICK);
    expect(c.heldBy).toBeFalsy();
    expect(c.roll).toBeFalsy();
    expect({ x: c.x, y: c.y }).toEqual(at);
    expect(ev.some((x) => x.k === 'cart')).toBe(false);
    expect(trackCarts(r)).toHaveLength(0);
    expect(ev.some((x) => x.k === 'nograb')).toBe(grabber);
    void h;
  });

  it('lightning near the gear lands on it and cracks the Haulier underneath; away from it, nothing', () => {
    for (const under of [true, false]) {
      const { r, h, me } = setup();
      const g = r.map.gear!;
      h.boss!.roarUntil = 1e9;
      Object.assign(h, under ? { x: g.x, y: g.y + 1.3 } : { x: 3, y: 9 });
      Object.assign(me, { x: g.x, y: g.y + 4, fx: 0, fy: -1 });
      const w = { heroes: r.heroes, enemies: r.enemies, javelins: [], props: r.props, now: r.time, ev: [] as FightEvent[] };
      callStrike(me as Hero, { dmg: 10 } as never, 1, () => 3.4, r.zones, w);
      const z = r.zones.find((q) => q.kind === 'skystrike')!;
      expect(Math.hypot(z.x - g.x, z.y - g.y)).toBeLessThan(0.01);
      const ev = run(r, 2 * Math.ceil((SKY_STRIKE.delay + 0.2) / TICK));
      expect(ev.find((x) => x.k === 'gear')).toMatchObject({ x: g.x, y: g.y, hit: under });
      expect(!!h.cracked).toBe(under);
    }
  });

  it('phase 2: a roar, the plate off for good, quicker, and small ones out of the adit every so often', () => {
    const { r, h, me } = setup();
    Object.assign(me, { x: h.x, y: h.y + 2 });
    const before = r.enemies.length, slow = (() => { h.boss!.rot = 0; h.cooldown = 0; run(r, 4 / TICK, () => !!h.attack); return h.attack!.windup; })();
    Object.assign(h, { attack: null, act: 'chase', cooldown: 0 });
    h.hp = Math.floor(h.maxHp * HAULIER.phase2) - 1;
    const ev = run(r, 3);
    expect(h.boss).toMatchObject({ phase: 2, bare: true });
    expect(ev.filter((x) => x.k === 'bare')).toHaveLength(1);
    expect(ev.some((x) => x.k === 'roar')).toBe(true);
    expect(armoured(h)).toBe(false);
    expect(r.enemies.length).toBe(before + HAULIER.adds.n);
    // Quicker: the pick's wind-up is shorter than in phase 1 (after the roar).
    run(r, 2.2 / TICK);
    Object.assign(h, { attack: null, act: 'chase', cooldown: 0, x: me.x, y: me.y - 2, fx: 0, fy: 1 });
    h.boss!.rot = haulRotation(2, h.boss!.party, r.bosses!.swaps[1]).indexOf('pick');
    run(r, 4 / TICK, () => !!h.attack);
    expect(h.attack!.windup).toBeLessThan(slow);
    // And the next batch HAULIER.adds.every s after the first.
    run(r, (HAULIER.adds.every + 1) / TICK);
    expect(r.enemies.length).toBeGreaterThanOrEqual(before + 2 * HAULIER.adds.n);
  });
});

