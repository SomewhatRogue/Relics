/** THE LISTENER's dripstone columns, the taunt's shout, BLINDED doing nothing to it, and its loot pool. */
import { describe, expect, it } from 'vitest';
import { deepFloor } from '../src/shared/deep';
import { LISTENER as L, TICK } from '../src/shared/tuning';
import { CAVE_SPOTS } from '../src/shared/cavearena';
import { UNIQUES, UNIQUE_DROP, poolOf } from '../src/shared/uniques';
import { Rng } from '../src/shared/rng';
import { newRun, runRoom } from '../src/sim/run';
import { columnShapes, columnLane } from '../src/sim/columnshape';
import { hear, listenState } from '../src/sim/listennoise';
import { newBook } from '../src/sim/bosskit';
import { blind } from '../src/sim/rangershots';
import { damageProp, newProp } from '../src/sim/props';
import { poolFor, uniqueDrops } from '../src/sim/uniquedrop';
import { newHero } from '../src/sim/hero';
import { NO_INTENT, type FightEvent, type Prop } from '../src/sim/types';

const floor = () => runRoom(newRun(deepFloor(10, 77, 'x')));
const setup = () => {
  const r = floor(), e = r.enemies.find((x) => x.boss)!;
  r.join('me');
  const me = r.heroes.find((x) => x.id === 'me')!;
  // Passive (a long roar), and the hero well off in a corner.
  Object.assign(me, { hp: 9999, maxHp: 9999, safeT: 0, x: 6, y: 12.5 });
  Object.assign(e, { alert: true, cooldown: 99 });
  e.boss!.roarUntil = 1e9;
  return { r, e, me };
};
const cols = (r: ReturnType<typeof floor>) => r.props.filter((p) => p.kind === 'column');
const run = (r: ReturnType<typeof floor>, secs: number, until?: () => boolean) => {
  const ev: FightEvent[] = [];
  for (let i = 0; i < secs / TICK && !(until && until()); i++) (r.setIntent('me', NO_INTENT), r.step(), ev.push(...r.events));
  return ev;
};
/** A hit on a column by anyone (what damageProp is given by blows, shots, spells). */
const hit = (r: ReturnType<typeof floor>, p: Prop, by = 'me') => {
  p.lastBy = by;
  const ev: FightEvent[] = [];
  damageProp(p, 10, { heroes: r.heroes, enemies: r.enemies, props: r.props, now: r.time, ev } as never);
  r.events.push(...ev);
  return ev;
};
const along = (p: Prop, d: number, side = 0) => {
  const a = columnLane(p);
  return { x: a.ox + a.dx * d - a.dy * side, y: a.oy + a.dy * d + a.dx * side };
};

describe('dripstone columns', () => {
  it('the cave stands a column prop on each reserved spot', () => {
    const { r } = setup();
    expect(cols(r)).toHaveLength(CAVE_SPOTS.columns.length);
    for (const s of CAVE_SPOTS.columns) expect(cols(r).some((p) => p.x === s.x && p.y === s.y)).toBe(true);
  });

  it('a hit sets it falling along its lean, with a striped lane for the fall; it lands, and is rubble', () => {
    const { r } = setup();
    const p = cols(r)[0], ev = hit(r, p);
    expect(ev.find((x) => x.k === 'column')).toMatchObject({ what: 'start' });
    const lean = CAVE_SPOTS.columns[0].lean, n = Math.hypot(lean.x, lean.y);
    expect(p.lean!.x).toBeCloseTo(lean.x / n);
    expect(p.fallAt).toBeCloseTo(r.time + L.column.fall);
    const shapes = columnShapes(r.props, r.time);
    expect(shapes).toHaveLength(1);
    expect(shapes[0]).toMatchObject({ kind: 'charge', unblockable: true, range: L.column.len, windup: L.column.fall, ox: p.x, oy: p.y });
    expect(shapes[0].radius).toBeCloseTo(L.column.width / 2);
    // Half way through, the lane is part filled; after it lands, no lane.
    run(r, L.column.fall / 2);
    expect(columnShapes(r.props, r.time)[0].t).toBeGreaterThan(0);
    const after = run(r, 1.5, () => !!p.fallen);
    expect(after.find((x) => x.k === 'column' && x.what === 'land')).toBeTruthy();
    expect(p.fallen).toBe(true);
    expect(columnShapes(r.props, r.time)).toHaveLength(0);
  });

  it('it hurts a hero in the lane and not one beside it', () => {
    const { r, e, me } = setup();
    const p = cols(r)[0];
    Object.assign(e, { x: 6, y: 12 });
    Object.assign(me, along(p, 2.5));
    hit(r, p);
    const hp = me.hp;
    run(r, 2, () => !!p.fallen);
    expect(me.hp).toBeLessThan(hp);
    // Beside the lane: safe.
    const q = cols(r)[1];
    Object.assign(me, along(q, 2.5, 2.4));
    const hp2 = me.hp;
    hit(r, q);
    run(r, 2, () => !!q.fallen);
    expect(q.fallen).toBe(true);
    expect(me.hp).toBe(hp2);
  });

  it('it knocks THE LISTENER down, and a second column within the cooldown only shrugs', () => {
    const { r, e } = setup();
    const p = cols(r)[0], q = cols(r)[1];
    Object.assign(e, along(p, 2.5));
    hit(r, p);
    let ev = run(r, 2, () => !!p.fallen);
    expect(ev.find((x) => x.k === 'column' && x.what === 'land')).toMatchObject({ down: true });
    expect(e.boss!.downUntil).toBeGreaterThan(r.time);
    expect(e.act).toBe('stunned');
    expect(e.holdUntil).toBeCloseTo(r.time + L.column.down + L.column.again, 0);
    // The second, soon after: it shrugs.
    e.boss!.downUntil = 0;
    Object.assign(e, along(q, 2.5), { act: 'chase' });
    hit(r, q);
    ev = run(r, 2, () => !!q.fallen);
    expect(ev.find((x) => x.k === 'column' && x.what === 'shrug')).toBeTruthy();
    expect(ev.find((x) => x.k === 'column' && x.what === 'land')).toMatchObject({ down: false });
    expect(e.boss!.downUntil).toBeLessThan(r.time);
  });

  it('a fallen column cannot be hit again, and a hit while it falls does not restart it', () => {
    const { r } = setup();
    const p = cols(r)[0];
    hit(r, p);
    const at = p.fallAt;
    run(r, 0.2);
    expect(hit(r, p).find((x) => x.k === 'column')).toBeFalsy();
    expect(p.fallAt).toBe(at);
    run(r, 2, () => !!p.fallen);
    expect(hit(r, p)).toHaveLength(0);
    expect(p.fallAt).toBeUndefined();
  });

  it('a thing thrown into one sets it falling', () => {
    const { r } = setup();
    const p = cols(r)[0], t = newProp('barrel', p.x + 0.4, p.y, false);
    Object.assign(t, { air: 0.4, lastBy: 'me', kvx: -10, kvy: 0 });
    r.props.push(t);
    const ev = run(r, 0.2);
    expect(ev.find((x) => x.k === 'column' && x.what === 'start')).toBeTruthy();
    expect(p.fallAt).toBeDefined();
  });
});

describe('THE LISTENER: taunt, blind, loot', () => {
  it('a taunt is the loudest noise there is', () => {
    const st = listenState(newBook(1, [0, 0], 'listener'));
    const w = Object.assign(newHero('w', 3, 3), { weapon: 'sword' as const, drills: { ladder: 1 } }), o = Object.assign(newHero('o', 9, 9), { act: 'attack' as const });
    hear(st, [w, o]);
    expect(st.noise.get('w')).toBe(0);
    expect(st.noise.get('o')).toBe(L.noise.attack);
    w.tauntRingAt = 5;
    hear(st, [w, o]);
    expect(st.noise.get('w')).toBe(L.noise.max);
    expect(st.noise.get('w')!).toBeGreaterThan(st.noise.get('o')!);
  });

  it('BLINDED does nothing to it, and says so', () => {
    const { r, e } = setup();
    const ev: FightEvent[] = [];
    blind(e, 'me', r.time, ev);
    expect(e.blindUntil ?? -9).toBeLessThan(r.time);
    expect(ev).toEqual([{ k: 'listenblind', x: e.x, y: e.y }]);
    expect(ev.some((x) => x.k === 'blinded')).toBe(false);
  });

  it("its death offers its pool (three pieces: weapon, armor, ring), found nowhere else", () => {
    const ids = poolOf('listener');
    expect(ids.map((i) => UNIQUES[i].slot).sort()).toEqual(['armor', 'ring', 'weapon']);
    const { r, e } = setup();
    expect(poolFor(e, 10)).toEqual({ pool: 'listener', chance: UNIQUE_DROP.boss });
    Object.assign(e, { act: 'dead', hp: 0 });
    for (let s = 1; s < 40 && !r.drops.length && !r.rolls.length; s++) uniqueDrops(r, [e], new Rng(s));
    const item = r.drops[0]?.item ?? r.rolls[0]?.item;
    expect(ids).toContain(item!.unique);
  });
});
