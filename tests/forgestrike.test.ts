/**
 * Striking on the glow at Halvard's anvil (shared/forgestrike.ts): paying is the plain plus; striking well adds a little on top, never more than a fifth of a level per upgrade,
 * drawn from the strike's own seed; a cold set adds nothing; a save can't claim more than that.
 */
import { describe, expect, it } from 'vitest';
import { STRIKE, glowAt, newStrike, stepStrike, strikeQuality, temperFrom, type StrikeState } from '../src/shared/forgestrike';
import { PLUS, TEMPER, gearStats, nextLevel, temperOf } from '../src/shared/gear';
import { seedOf } from '../src/shared/fishing';
import type { Item } from '../src/shared/loot';

const store = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
const { Game } = await import('../src/client/game');

/** Strike `off` seconds from each of the first three glows (null: never strike). */
function strike(seed: number, off: number | null): StrikeState {
  const s = newStrike(seed);
  const at = off === null ? [] : s.peaks.slice(0, 3).map((p) => Math.round((p + off) * STRIKE.fps));
  while (!s.over) stepStrike(s, at.includes(s.frame));
  return s;
}
const sword: Item = { slot: 'weapon', kit: 'sword', quality: 'forged', traits: [], mods: [{ id: 'damage', v: 0.1 }, { id: 'quick', v: 0.06 }], level: 0 };

describe('the strike', () => {
  it('the steel glows brightest at each peak and fades between; three strikes and it is done', () => {
    const s = newStrike(7);
    expect(s.peaks).toHaveLength(STRIKE.glows);
    for (const p of s.peaks) expect(glowAt(s, p)).toBeCloseTo(1, 5);
    expect(glowAt(s, s.peaks[0] - STRIKE.rise - 0.01)).toBe(0);
    for (let i = 1; i < s.peaks.length; i++) expect(s.peaks[i] - s.peaks[i - 1]).toBeGreaterThanOrEqual(STRIKE.gap[0] - 0.02);
    const done = strike(7, 0);
    expect(done.struck.map((x) => x.mark)).toEqual(['clean', 'clean', 'clean']);
    expect(strikeQuality(done)).toBe(1);
  });

  it('marks by how near the glow: clean, near enough, too cold; one strike a glow', () => {
    expect(strike(7, 0.12).struck.every((x) => x.mark === 'fair')).toBe(true);
    expect(strike(7, 0.3).struck.every((x) => x.mark === 'cold')).toBe(true);
    // Hammering away at one glow: the second blow is judged against the next glow, not the same one twice.
    const s = newStrike(7), p0 = Math.round(s.peaks[0] * STRIKE.fps);
    while (!s.over) stepStrike(s, s.frame === p0 || s.frame === p0 + Math.round(STRIKE.lock * STRIKE.fps) + 1);
    expect(s.struck[0].mark).toBe('clean');
    expect(s.struck[1].peak).toBe(s.peaks[1]);
  });

  it('the edge is small: at most a fifth of a level, nothing for a cold set, and from the seed', () => {
    for (let i = 0; i < 200; i++) {
      const seed = seedOf('hsmith01:forge', i), best = temperFrom(strike(seed, 0));
      expect(best).toBeLessThanOrEqual(TEMPER.max);
      expect(best).toBeGreaterThanOrEqual(TEMPER.max * TEMPER.floor - 0.001);
      expect(temperFrom(strike(seed, 0))).toBe(best);
      expect(temperFrom(strike(seed, 0.3))).toBe(0);
      expect(temperFrom(strike(seed, null))).toBe(0);
      expect(temperFrom(strike(seed, 0.12))).toBeLessThan(best);
    }
    // Every upgrade struck perfectly, all the way to the cap: still less than one more level would give.
    const top = { ...sword, level: 4 }, struck = { ...top, temper: 4 * TEMPER.max }, more = { ...top, level: 5 };
    const d = (a: Item) => gearStats(a, null).damage;
    expect(d(struck) - d(top)).toBeLessThan(d(more) - d(top) + 1e-9);
    expect(d(struck) - d(top)).toBeCloseTo(0.8 * (PLUS.damage + 0.1 * PLUS.mods), 6);
  });

  it('a save cannot claim more than a fifth of a level per upgrade', () => {
    expect(temperOf({ ...sword, level: 2, temper: 50 })).toBe(2 * TEMPER.max);
    expect(temperOf({ ...sword, level: 0, temper: 1 })).toBe(0);
    expect(temperOf({ ...sword, level: 3, temper: -4 })).toBe(0);
    expect(gearStats({ ...sword, level: 2, temper: 50 }, null).damage).toBe(gearStats({ ...sword, level: 2, temper: 0.4 }, null).damage);
  });
});

describe('at the forge', () => {
  const fresh = () => {
    const g = new Game();
    g.create('WARRIOR', 'smith');
    g.skipWood();
    Object.assign(g.profile, { gold: 2000, steel: 100 });
    return g;
  };

  it('paying is the plain plus: the price taken, the piece one up, no temper until the strikes land', () => {
    const a = fresh(), it = a.profile.armor!, cost = nextLevel(it)!;
    const up = a.levelUp(it)!;
    expect(a.profile.gold).toBe(2000 - cost.gold);
    expect(a.profile.armor).toEqual(up);
    expect(up.level).toBe(1);
    expect(up.temper).toBeUndefined();
  });

  it('struck well, the piece the hero wears gets the temper, and the hero fights with it', () => {
    const g = fresh(), up = g.levelUp(g.profile.armor!)!;
    const before = gearStats(undefined, g.hero.armor).tough;
    const after = g.temper(up, 0.18);
    expect(after.temper).toBe(0.18);
    expect(g.profile.armor).toBe(after);
    expect(g.hero.armor).toBe(after);
    expect(gearStats(undefined, g.hero.armor).tough).toBeCloseTo(before + 0.18 * PLUS.tough, 9);
    // Nothing for a piece the hero doesn't have, or for a cold set.
    expect(g.temper({ ...up }, 0.2).temper).toBeUndefined();
    expect(g.temper(after, 0)).toBe(after);
  });
});
