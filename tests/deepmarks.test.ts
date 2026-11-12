/** The Deep's curses and blessings (docs/design/the-deep.md step 6; shared/deepmarks.ts). */
import { describe, expect, it, vi } from 'vitest';
import { BLESSINGS, CURSES, blessingsAt, blessesAt, cursesAt, forksAt, markSum } from '../src/shared/deepmarks';
import { TICK } from '../src/shared/tuning';
import { NO_INTENT } from '../src/sim/types';

const done = { on: false };
vi.mock('../src/sim/run', async (orig) => {
  const m = await orig<typeof import('../src/sim/run')>();
  return { ...m, goal: (...a: Parameters<typeof m.goal>) => (done.on ? { text: '', done: true } : m.goal(...a)) };
});
vi.stubGlobal('addEventListener', () => {});
vi.stubGlobal('document', { addEventListener: () => {}, visibilityState: 'visible', hidden: false });
const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
const { Game } = await import('../src/client/game');
const { statsOf, refreshHealth } = await import('../src/sim/gearstats');
const { syncMarks } = await import('../src/sim/deepmarks');

const hero = () => {
  store.clear();
  const g = new Game();
  g.create('WARRIOR', 'BRAM');
  if (g.mode === 'wood') g.skipWood();
  return g;
};
function toEnd(g: InstanceType<typeof Game>): void {
  done.on = true;
  const e = g.room.map.exit!;
  Object.assign(g.hero, { x: e.x + e.w / 2, y: e.y + e.h / 2 });
  g.step(TICK, NO_INTENT);
  done.on = false;
}
/** Down to the end of floor `n`, taking the first way on at each fork and the first blessing. */
function downTo(g: InstanceType<typeof Game>, n: number): void {
  for (let f = 1; f < n; f++) {
    toEnd(g);
    const d = g.profile.deep!;
    if (blessesAt(f)) g.deepMark(blessingsAt(d.seed, f)[0]);
    if (forksAt(f)) g.deepMark(cursesAt(d.seed, f)[0]);
    else g.deeper();
  }
  toEnd(g);
}

describe('what is offered', () => {
  it('three different ways at every fifth floor, three blessings at every tenth, the same for the same run', () => {
    expect([4, 5, 9, 10, 15, 20].map(forksAt)).toEqual([false, true, false, true, true, true]);
    expect([5, 10, 15, 20].map(blessesAt)).toEqual([false, true, false, true]);
    const c = cursesAt(7, 5);
    expect(new Set(c).size).toBe(3);
    expect(cursesAt(7, 5)).toEqual(c);
    expect(c.every((id) => id in CURSES)).toBe(true);
    expect(blessingsAt(7, 10).every((id) => id in BLESSINGS)).toBe(true);
    expect(markSum(['dull', 'dull', 'keen'], 'damage')).toBeCloseTo(CURSES.dull.v * 2 + BLESSINGS.keen.v);
  });
});

describe('on a hero', () => {
  it('a player sends their marks; the room puts them on the hero, into its numbers and its health', () => {
    const g = hero();
    g.enterDeep();
    const h = g.hero, base = statsOf(h), hp = h.maxHp;
    syncMarks([h], new Map([[h.id, { ...NO_INTENT, marks: ['dull', 'frail', 'heavy', 'nonsense'] }]]));
    expect(h.marks).toEqual(['dull', 'frail', 'heavy']);
    const s = statsOf(h);
    expect(s.damage).toBeCloseTo(base.damage + CURSES.dull.v);
    expect(s.speed).toBeCloseTo(base.speed * (1 + CURSES.heavy.v));
    expect(h.maxHp).toBe(hp + CURSES.frail.v);
    refreshHealth(h);
  });
});

describe('in a run', () => {
  it('at a fork, GO DEEPER alone does nothing: you take a way, its curse, and go down', () => {
    const g = hero();
    g.enterDeep();
    downTo(g, 5);
    const d = g.profile.deep!, offered = cursesAt(d.seed, 5);
    g.deeper();
    expect(g.run!.job.floor).toBe(5);
    const other = (Object.keys(CURSES) as (keyof typeof CURSES)[]).find((id) => !offered.includes(id))!;
    g.deepMark(other);
    expect(g.run!.job.floor).toBe(5);
    g.deepMark(offered[1]);
    expect(g.run!.job.floor).toBe(6);
    expect(d.marks).toEqual([offered[1]]);
    expect(g.own(NO_INTENT).marks).toEqual([offered[1]]);
    g.step(TICK, NO_INTENT);
    expect(g.hero.marks).toEqual([offered[1]]);
  });

  it('at floor 10, a blessing first, once; then a way on; both stack, and none of it outlasts the run', () => {
    const g = hero();
    g.enterDeep();
    downTo(g, 10);
    const d = g.profile.deep!, b = blessingsAt(d.seed, 10);
    g.deepMark(b[0]);
    g.deepMark(b[1]);
    expect(d.marks!.filter((m) => m in BLESSINGS)).toEqual([b[0]]);
    expect(g.run!.job.floor).toBe(10);
    g.deepMark(cursesAt(d.seed, 10)[0]);
    expect(g.run!.job.floor).toBe(11);
    expect(d.marks).toHaveLength(3);
    g.leaveJob();
    expect(g.profile.deep).toBeUndefined();
    expect(g.own(NO_INTENT).marks).toBeUndefined();
  });

  it('a blessing of a relic use back gives the carried relic a use at the start of each floor', () => {
    const g = hero();
    g.enterDeep();
    downTo(g, 10);
    const d = g.profile.deep!;
    d.marks = [...(d.marks ?? []), 'relic'];
    g.step(TICK, NO_INTENT);
    // (A relic carried, as the save has it: a new floor dresses its heroes from the save.)
    Object.assign(g.profile, { relics: [{ id: 'r1', kind: 'bell', tier: 1, el: '', charge: 1, v: 2 }], relic: 'r1' });
    d.blessed = [10];
    g.deepMark(cursesAt(d.seed, 10)[0]);
    expect(g.run!.job.floor).toBe(11);
    expect(g.hero.found.find((r) => r.id === 'r1')?.charge).toBe(2);
  });
});
