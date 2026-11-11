/** The Haulier, the Deep's boss of every fifth floor (docs/design/deep-bosses.md). */
import { describe, expect, it } from 'vitest';
import { deepFloor } from '../src/shared/deep';
import { HAULIER, SKY_STRIKE, TICK } from '../src/shared/tuning';
import { SUMP_SPOTS } from '../src/shared/sumparena';
import { goal, newRun, runRoom } from '../src/sim/run';
import { plateOf } from '../src/sim/bossplate';
import { NO_INTENT, type FightEvent, type Hero } from '../src/sim/types';
import { haulRotation } from '../src/sim/haulier';
import { callStrike } from '../src/sim/skystrike';
import { armoured } from '../src/sim/ironhide';

const floor = (n: number) => runRoom(newRun(deepFloor(n, 77, 'x')));

describe('the Haulier', () => {
  it('every fifth floor is its working: the rail, two carts, the gear, the sump, the adit, the chained chest', () => {
    for (const n of [5, 10, 15, 20]) expect(deepFloor(n, 77, 'x')).toMatchObject({ arena: 'haulier', objective: 'hunt' });
    for (const n of [4, 6, 9, 11]) expect(deepFloor(n, 77, 'x').arena).toBeUndefined();
    const r = floor(5), m = r.map;
    expect(m.rail && m.gear && m.adits?.length && m.water?.length).toBeTruthy();
    expect(r.props.filter((p) => p.kind === 'cart')).toHaveLength(2);
    expect(r.chests.some((c) => c.chained)).toBe(true);
    const h = r.enemies.find((e) => e.boss?.who === 'haulier')!;
    expect(h).toMatchObject({ variant: 'ironhide', radius: HAULIER.radius });
    expect(plateOf(r.enemies, 0)).toMatchObject({ name: h.name, pips: 2 });
  });

  it('is tougher deeper, and the floor is done when it is dead', () => {
    const a = floor(5).enemies.find((e) => e.boss)!, b = floor(20).enemies.find((e) => e.boss)!;
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
  const rail = SUMP_SPOTS.rail;

  it('each move of its rotation begins: the right kind, boss.move set for the screen', () => {
    const want = { pick: 'cleave', overhead: 'slam', shove: 'charge', drag: 'slam' } as const;
    for (const [phase, move] of [[1, 'pick'], [1, 'overhead'], [1, 'shove'], [2, 'drag']] as const) {
      const { r, h, me } = setup();
      h.boss!.phase = phase;
      h.boss!.rot = haulRotation(phase, h.boss!.party, r.bosses!.swaps[phase - 1]).indexOf(move);
      h.cooldown = 0;
      if (move === 'shove') Object.assign(h, { x: 3, y: 5.5 }), Object.assign(me, { x: 9, y: 11 });
      else Object.assign(me, { x: h.x, y: h.y + 2 });
      run(r, 6 / TICK, () => !!h.attack);
      expect(h.attack, move).toBeTruthy();
      expect(h.boss!.move).toBe(move);
      expect(h.attack!.kind).toBe(want[move]);
      if (move === 'drag') expect(h.attack).toMatchObject({ radius: HAULIER.drag.radius, unblockable: true });
      if (move === 'overhead') expect(h.attack).toMatchObject({ unblockable: true, radius: HAULIER.overhead.radius });
      if (move === 'shove') expect(h.attack).toMatchObject({ dy: 0, radius: HAULIER.cart.width / 2, unblockable: true });
    }
  });

  it('a GRAB at a cart sends it down the rail: it hits a hero in the lane, knocks the Haulier down, cracks it, stops at the far stop', () => {
    const { r, h, me } = setup();
    const c = carts(r).find((p) => p.x < 6)!, start = c.x;
    // The Haulier stands in the rail's lane (roaring, so it stays), the hero beside the cart, also in the lane.
    Object.assign(h, { x: 6, y: rail.y });
    h.boss!.roarUntil = 1e9;
    Object.assign(me, { x: c.x + 1, y: rail.y });
    run(r, 3);
    expect(c.roll).toBeFalsy();
    r.setIntent('me', { ...NO_INTENT, grabSeq: 1 });
    const ev = run(r, 1 / TICK + 5, () => !!c.roll);
    expect(c.roll).toBeGreaterThan(0);
    expect(c.rollBy).toBe('me');
    ev.push(...run(r, 6 / TICK, () => !c.roll));
    expect(ev.find((x) => x.k === 'cart' && x.what === 'go')).toMatchObject({ by: 'me' });
    expect(ev.find((x) => x.k === 'cart' && x.what === 'hit' && x.on === 'me')).toBeTruthy();
    expect(me.hp).toBeLessThan(9999);
    expect(ev.find((x) => x.k === 'cart' && x.what === 'hit' && x.on === 'haulier')).toBeTruthy();
    expect(h.boss!.downUntil).toBeGreaterThan(0);
    expect(h.cracked).toBe(true);
    expect(ev.find((x) => x.k === 'cart' && x.what === 'stop')).toBeTruthy();
    // (The other cart stands at that stop: it stops a cart's length short of it.)
    expect(c.x).toBeGreaterThan(SUMP_SPOTS.stops[1].x - 1.5);
    expect(c.x).toBeLessThanOrEqual(SUMP_SPOTS.stops[1].x);
    expect(c.x).toBeGreaterThan(start);
    expect(c.roll).toBeFalsy();
  });

  it('a press and walking off sends nothing', () => {
    const { r, h, me } = setup();
    h.boss!.roarUntil = 1e9;
    const c = carts(r).find((p) => p.x < 6)!;
    Object.assign(me, { x: c.x + 1, y: rail.y });
    run(r, 3);
    r.setIntent('me', { ...NO_INTENT, grabSeq: 1 });
    run(r, 5);
    Object.assign(me, { x: c.x + 5, y: 10 });
    run(r, 1.5 / TICK);
    expect(c.roll).toBeFalsy();
  });

  it('its shove sends a cart rolling down the rail, and its own cart never knocks it down', () => {
    const { r, h, me } = setup();
    Object.assign(h, { x: 3, y: 5.5 });
    Object.assign(me, { x: 9, y: 11 });
    h.boss!.rot = haulRotation(1, h.boss!.party, r.bosses!.swaps[0]).indexOf('shove');
    h.cooldown = 0;
    const c = carts(r).find((p) => p.x < 6)!;
    const ev = run(r, 8 / TICK, () => !!c.roll);
    expect(c.roll).toBeGreaterThan(0);
    expect(c.rollBy).toBe('haulier');
    expect(ev.find((x) => x.k === 'cart' && x.what === 'go')).toMatchObject({ by: 'haulier' });
    run(r, 3 / TICK);
    expect(h.boss!.downUntil).toBeLessThan(r.time);
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

