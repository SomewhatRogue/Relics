/** THE LISTENER, the old caves' boss of floor 10 (docs/design/deep-layer-bosses.md section 1): its floor, what it hears, and its moves. */
import { describe, expect, it } from 'vitest';
import { deepFloor, DEEP_BOSS } from '../src/shared/deep';
import { LISTENER as L, BOSS, TICK } from '../src/shared/tuning';
import { CAVE_SPOTS } from '../src/shared/cavearena';
import { LISTEN_NAME } from '../src/shared/bosswords';
import { newRun, runRoom } from '../src/sim/run';
import { plateOf } from '../src/sim/bossplate';
import { hear, loudest, listenState } from '../src/sim/listennoise';
import { listenRotation } from '../src/sim/listener';
import { newBook } from '../src/sim/bosskit';
import { NO_INTENT, type FightEvent, type Hero } from '../src/sim/types';

const floor = (n: number) => runRoom(newRun(deepFloor(n, 77, 'x')));
const hero = (id: string, x: number, y: number, o: Partial<Hero> = {}) =>
  ({ id, x, y, act: 'idle', moving: false, sneaking: false, out: false, seen: { attack: 0, relic: 0 }, ...o }) as unknown as Hero;

describe('THE LISTENER: the floor', () => {
  it('floor 10 (and 30) is its cave on every seed; floor 5 and 15 are not', () => {
    for (let seed = 0; seed < 40; seed++) {
      for (const n of [10, 30]) expect(deepFloor(n, seed, 'x'), `${seed}/${n}`).toMatchObject({ arena: 'listener', boss: LISTEN_NAME, objective: 'hunt' });
      expect(deepFloor(5, seed, 'x').arena).toBe(DEEP_BOSS.turn[(1 + seed) % 2]);
      expect(deepFloor(15, seed, 'x').arena).not.toBe('listener');
      expect(deepFloor(9, seed, 'x').arena).toBeUndefined();
    }
  });

  it('builds the cave: holes that do not block, column spots, torches, a chest, a lone boss on the plate', () => {
    const r = floor(10), m = r.map;
    expect(m.holes).toHaveLength(CAVE_SPOTS.holes.length);
    expect(m.holes!.length).toBeGreaterThanOrEqual(3);
    expect(m.columns!.length).toBeGreaterThanOrEqual(4);
    expect(m.torches.length).toBeGreaterThan(0);
    expect(r.chests.some((c) => c.chained)).toBe(true);
    const e = r.enemies.find((x) => x.boss)!;
    expect(e.boss!.who).toBe('listener');
    expect(e).toMatchObject({ radius: L.radius, name: LISTEN_NAME });
    expect(plateOf(r.enemies, 0)).toMatchObject({ name: LISTEN_NAME, pips: 2 });
    // The tougher floor 30 has more health.
    expect(floor(30).enemies.find((x) => x.boss)!.maxHp).toBeGreaterThan(e.maxHp);
  });

  it('keeps the drops and sweeps in order under the seeded swap', () => {
    for (const phase of [1, 2] as const) {
      for (let swap = 0; swap < 12; swap++) {
        const r = listenRotation(phase, 1, swap);
        expect(r.length).toBe(L.rotation[phase].length);
        r.forEach((m, i) => m === 'sweep' && expect(r[i - 1]).toBe('drop'));
      }
    }
    expect(listenRotation(1, 4, 0)).toHaveLength(L.rotation[1].length + 1);
  });
});

describe('THE LISTENER: what it hears', () => {
  const book = () => listenState(newBook(1, [0, 0], 'listener'));
  const ticks = (st: ReturnType<typeof book>, hs: Hero[], n: number) => { for (let i = 0; i < n; i++) hear(st, hs); };

  it('picks the hero who attacked over the one standing still, and a creeper is quiet', () => {
    const st = book(), still = hero('still', 3, 3), loud = hero('loud', 9, 9, { act: 'attack' }), creep = hero('creep', 4, 4, { moving: true, sneaking: true });
    ticks(st, [still, loud, creep], 3);
    loud.act = 'idle';
    expect(loudest([still, loud, creep], st.noise, { x: 3, y: 3 })).toBe(loud);
    expect(st.noise.get('creep')).toBe(0);
    expect(st.noise.get('still')).toBe(0);
    // A creeper against one standing still: both quiet, so the nearest.
    expect(loudest([still, creep], st.noise, { x: 4, y: 4 })).toBe(creep);
  });

  it('rises for a roll, a run, a blow counted between ticks and a relic, and falls off in a couple of seconds', () => {
    const st = book(), a = hero('a', 1, 1, { act: 'roll' }), b = hero('b', 2, 2, { moving: true }), c = hero('c', 3, 3), d = hero('d', 4, 4);
    hear(st, [a, b, c, d]);
    expect(st.noise.get('a')).toBeGreaterThanOrEqual(L.noise.roll - 0.05);
    expect(st.noise.get('b')).toBeGreaterThanOrEqual(L.noise.run - 0.05);
    c.seen = { attack: 1, relic: 0 } as Hero['seen'];
    d.seen = { attack: 0, relic: 1 } as Hero['seen'];
    hear(st, [a, b, c, d]);
    expect(st.noise.get('c')).toBeGreaterThanOrEqual(L.noise.attack - 0.05);
    expect(st.noise.get('d')).toBeGreaterThanOrEqual(L.noise.relic - 0.05);
    expect(loudest([a, b, c, d], st.noise, { x: 0, y: 0 })).toBe(d);
    a.act = 'idle';
    b.moving = false;
    ticks(st, [a, b, c, d], Math.ceil(3 / TICK));
    for (const id of ['a', 'b', 'c', 'd']) expect(st.noise.get(id), id).toBeLessThan(L.noise.quiet + 1e-9);
  });

  it('a hero who is down is not heard; nobody up, nobody', () => {
    const st = book(), dn = hero('dn', 1, 1, { act: 'down' });
    ticks(st, [dn], 2);
    expect(loudest([dn], st.noise, { x: 0, y: 0 })).toBeNull();
  });
});

describe('THE LISTENER: its moves', () => {
  const setup = (move: string, phase: 1 | 2 = 1) => {
    const r = floor(10), e = r.enemies.find((x) => x.boss)!;
    r.join('me');
    const me = r.heroes.find((x) => x.id === 'me')!;
    Object.assign(me, { hp: 9999, maxHp: 9999, safeT: 0 });
    Object.assign(e, { alert: true, cooldown: 0 });
    e.boss!.phase = phase;
    e.boss!.rot = listenRotation(phase, e.boss!.party, r.bosses!.swaps[phase - 1]).indexOf(move as never);
    return { r, e, me };
  };
  const run = (r: ReturnType<typeof floor>, secs: number, until?: () => boolean, intent = NO_INTENT) => {
    const ev: FightEvent[] = [];
    for (let i = 0; i < secs / TICK && !(until && until()); i++) (r.setIntent('me', intent), r.step(), ev.push(...r.events));
    return ev;
  };
  const hole = (i: number) => CAVE_SPOTS.holes[i];

  it('DROP: it walks to a hole and drops in, gone and untargetable, then RISES at the hole nearest the loudest hero and hurts them', () => {
    const { r, e, me } = setup('drop');
    // Boss by the west hole; the hero by the east hole.
    Object.assign(e, { x: hole(0).x + 0.3, y: hole(0).y });
    Object.assign(me, { x: hole(1).x, y: hole(1).y + 1 });
    run(r, 3, () => !!e.boss!.under);
    expect(e.boss!.under).toBe(true);
    expect(e).toMatchObject({ under: true, act: 'carried' });
    // The rise shows its striped circle at the hole nearest the hero.
    run(r, 4, () => (e.attack?.boss as string | undefined) === 'rise');
    expect(e.boss!.lmove).toBe('rise');
    expect(e.attack).toMatchObject({ kind: 'slam', unblockable: true, radius: L.rise.radius, cx: hole(1).x, cy: hole(1).y });
    expect(e.attack!.windup).toBeCloseTo(L.rise.windup + BOSS.tell, 1);
    expect(Math.hypot(e.x - hole(1).x, e.y - hole(1).y)).toBeLessThan(0.1);
    // Still under: a blow at it does nothing.
    const hp = e.hp;
    Object.assign(me, { x: hole(1).x + 0.8, y: hole(1).y });
    run(r, 0.5, undefined, { ...NO_INTENT, ax: -1, ay: 0, attack: true, attackSeq: 1 });
    expect(e.boss!.under).toBe(true);
    expect(e.hp).toBe(hp);
    // Then it bursts up, and the hero in the circle is hurt and knocked.
    const before = me.hp;
    run(r, 3, () => !e.boss!.under && me.hp < before);
    expect(e.boss!.under).toBeFalsy();
    expect(e.under).toBe(false);
    expect(me.hp).toBeLessThan(before);
  });

  it('while it is under, no hero blow finds it', () => {
    const { r, e, me } = setup('drop');
    Object.assign(e, { x: hole(2).x, y: hole(2).y });
    Object.assign(me, { x: hole(2).x + 1, y: hole(2).y });
    run(r, 3, () => !!e.boss!.under);
    expect(e.boss!.under).toBe(true);
    const hp = e.hp;
    run(r, 0.6, () => !e.boss!.under, { ...NO_INTENT, ax: -1, ay: 0, attack: true, attackSeq: 5 });
    expect(e.hp).toBe(hp);
  });

  it('ROCK: a red, blockable circle where it lands, on the loudest hero', () => {
    const { r, e, me } = setup('rock');
    Object.assign(me, { x: e.x + 4, y: e.y + 3 });
    run(r, 4, () => (e.attack?.boss as string | undefined) === 'rock');
    expect(e.attack).toMatchObject({ kind: 'slam', unblockable: false, radius: L.rock.radius });
    expect(e.boss!.lmove).toBe('rock');
    expect(Math.hypot(e.attack!.cx - me.x, e.attack!.cy - me.y)).toBeLessThan(0.3);
    expect(e.attack!.windup).toBeCloseTo(L.rock.windup + BOSS.tell, 1);
  });

  it('the rock goes for the loud hero, not the near quiet one', () => {
    const { r, e, me } = setup('rock');
    r.join('mate');
    const mate = r.heroes.find((x) => x.id === 'mate')!;
    Object.assign(mate, { hp: 9999, maxHp: 9999, x: e.x + 1.5, y: e.y + 1.5 });
    Object.assign(me, { x: e.x + 5, y: e.y + 4 });
    // (A beat for the noise to be made before it chooses.)
    e.cooldown = 0.4;
    const ev: FightEvent[] = [];
    for (let i = 0; i < 5 / TICK && (e.attack?.boss as string | undefined) !== 'rock'; i++) (r.setIntent('me', { ...NO_INTENT, attack: true, attackSeq: i + 1 }), r.setIntent('mate', NO_INTENT), r.step(), ev.push(...r.events));
    expect(e.attack?.boss).toBe('rock');
    expect(Math.hypot(e.attack!.cx - me.x, e.attack!.cy - me.y)).toBeLessThan(0.5);
  });

  it('SWEEP follows a RISE straight away: a quick wide red arc', () => {
    const { r, e, me } = setup('drop');
    Object.assign(e, { x: hole(0).x + 0.3, y: hole(0).y });
    Object.assign(me, { x: hole(1).x + 1.2, y: hole(1).y });
    const seen: string[] = [];
    for (let i = 0; i < 12 / TICK; i++) {
      r.setIntent('me', NO_INTENT);
      r.step();
      const m = e.attack?.boss as string | undefined;
      if (m && seen[seen.length - 1] !== m) seen.push(m);
      if (m === 'sweep') break;
    }
    expect(seen).toEqual(['drop', 'rise', 'sweep']);
    expect(e.attack).toMatchObject({ kind: 'cleave', unblockable: false, arc: L.sweep.arc });
    expect(e.attack!.windup).toBeLessThan(L.rise.windup);
  });

  it('CHARGE: a striped lane at the loudest hero across the room', () => {
    const { r, e, me } = setup('charge');
    Object.assign(me, { x: e.x, y: e.y + 7 });
    run(r, 4, () => (e.attack?.boss as string | undefined) === 'charge');
    expect(e.attack).toMatchObject({ kind: 'charge', unblockable: true, radius: L.charge.radius });
    expect(e.attack!.dy).toBeGreaterThan(0.9);
  });

  it('phase 2 at half health: a roar, the torches out (dark), quicker, and small ones out of the holes', () => {
    const { r, e, me } = setup('rock');
    Object.assign(me, { x: e.x + 4, y: e.y + 3 });
    run(r, 4, () => (e.attack?.boss as string | undefined) === 'rock');
    const slow = e.attack!.windup;
    expect(e.boss!.dark).toBeFalsy();
    e.attack = null;
    e.act = 'chase';
    e.hp = Math.floor(e.maxHp * L.phase2) - 1;
    const before = r.enemies.length;
    run(r, 1);
    expect(e.boss!.phase).toBe(2);
    expect(e.boss!.dark).toBe(true);
    expect(r.enemies.length).toBeGreaterThan(before);
    // Its pace and wind-ups are quicker: the same rock now winds up in less.
    e.boss!.roarUntil = -9;
    e.boss!.rot = listenRotation(2, e.boss!.party, r.bosses!.swaps[1]).indexOf('rock');
    Object.assign(e, { cooldown: 0, alert: true });
    run(r, 6, () => (e.attack?.boss as string | undefined) === 'rock');
    expect(e.attack).toBeTruthy();
    expect(e.attack!.windup).toBeLessThan(slow);
    // And it drops twice as often.
    const drops = (p: 1 | 2) => L.rotation[p].filter((m) => m === 'drop').length / L.rotation[p].length;
    expect(drops(2)).toBeGreaterThanOrEqual(drops(1) * 1.5);
  });
});
