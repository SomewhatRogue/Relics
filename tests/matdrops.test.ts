/**
 * Materials from the land (docs/design/materials.md, slice 1): what a beast leaves on a roaming land, that walking over it
 * is heard as a `mat` event, that it repeats from a seed, and that a save's satchel is fitted.
 */
import { describe, expect, it } from 'vitest';
import { fitMats } from '../src/shared/materials';
import { Rng } from '../src/shared/rng';
import { landJob } from '../src/shared/territory';
import { TICK } from '../src/shared/tuning';
import { dropMats } from '../src/sim/matdrops';
import type { Pickup } from '../src/sim/pickups';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT, type Enemy, type FightEvent } from '../src/sim/types';

const room = () => {
  const r = runRoom({ ...newRun(landJob('gatefields', 3)), index: 0 }), h = r.join('me');
  r.setIntent('me', NO_INTENT);
  return { r, h, base: r.allEnemies[0] as Enemy };
};
const beast = (base: Enemy, over: Partial<Enemy>): Enemy => ({ ...base, x: 5, y: 5, respawns: false, ...over });
const spider = (base: Enemy) => beast(base, { kind: 'spider' as Enemy['kind'] });
const run = (e: Enemy, n: number, seed: number, roam = true): Pickup[] => {
  const rng = new Rng(seed), ps: Pickup[] = [];
  for (let i = 0; i < n; i++) dropMats(e, ps, rng, roam);
  return ps;
};

describe('what beasts leave on the land', () => {
  const { base } = room();
  it('wolves and pouncers leave HIDE about 40% of the time', () => {
    for (const v of ['wolf', 'pouncer'] as const) {
      const ps = run(beast(base, { variant: v }), 1000, 7);
      expect(ps.every((p) => p.mat === 'hide')).toBe(true);
      expect(ps.length).toBeGreaterThan(330);
      expect(ps.length).toBeLessThan(470);
    }
  });
  it('spiders leave SILK about 35% of the time', () => {
    const ps = run(spider(base), 1000, 9);
    expect(ps.every((p) => p.mat === 'silk')).toBe(true);
    expect(ps.length).toBeGreaterThan(290);
    expect(ps.length).toBeLessThan(410);
  });
  it('the nest always leaves a BROOD SILK', () => {
    const ps = run(beast(base, { kind: 'nest' }), 50, 3);
    expect(ps.length).toBe(50);
    expect(ps.every((p) => p.mat === 'brood')).toBe(true);
  });
  it('a plain goblin leaves none, and nothing drops off the land', () => {
    expect(run(beast(base, {}), 200, 1).length).toBe(0);
    expect(run(beast(base, { variant: 'wolf' }), 200, 1, false).length).toBe(0);
    expect(run(beast(base, { kind: 'nest' }), 5, 1, false).length).toBe(0);
  });
  it('the same seed gives the same drops', () => {
    const a = run(beast(base, { variant: 'wolf' }), 100, 42).length, b = run(beast(base, { variant: 'wolf' }), 100, 42).length;
    expect(a).toBe(b);
  });
});

describe('picking one up', () => {
  it('walking over a material takes it and says so', () => {
    const { r, h } = room();
    for (const e of r.allEnemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false });
    r.pickups.push({ id: 900, x: h.x, y: h.y, life: 30, mat: 'hide' });
    const log: FightEvent[] = [];
    for (let i = 0; i < 5; i++) (r.step(), log.push(...r.events));
    const got = log.filter((e) => e.k === 'mat');
    expect(got.length).toBe(1);
    expect(got[0]).toMatchObject({ id: 'me', what: 'hide', n: 1 });
    expect(r.pickups.some((p) => p.id === 900)).toBe(false);
    expect(TICK).toBeGreaterThan(0);
  });
});

describe('the satchel on a save', () => {
  it('keeps good counts and drops junk', () => {
    expect(fitMats({ hide: 3, silk: 2.7, brood: 1, charcoal: 4 })).toEqual({ hide: 3, silk: 2, brood: 1, charcoal: 4 });
    expect(fitMats({ hide: -1, silk: 'x', nope: 5, heart: 0 })).toEqual({});
    expect(fitMats(null)).toEqual({});
    expect(fitMats([1, 2])).toEqual({});
  });
});
