/** Item level (docs/design/gear-levels.md section 1): the second axis, the closer tiers, old pieces as they were. */
import { describe, expect, it } from 'vitest';
import { COST_POINTS, ILVL, MOD_COUNT, PER_MOD, TIER_ORDER, budgetAt, dropLevel, gearStats, growAt, ilvlOf, itemPoints, raise, rollGear, rollQuality, type Item, type Tier } from '../src/shared/tuning';
import { rollAny } from '../src/shared/hungry';
import { Rng } from '../src/shared/rng';
import { board, type Job } from '../src/shared/jobs';
import { treasure } from '../src/shared/treasure';

/** What a tier is worth at a level after its cost: the number the spec's crossings are about. */
const net = (t: Tier, lv: number) => budgetAt(t, 'ring', undefined, lv) - (COST_POINTS[t] ?? 0) * growAt(lv);

describe('item level', () => {
  it('sets the tiers close, 13 to 32 after costs, at LV 1', () => {
    expect(TIER_ORDER.slice(1).map((t) => Math.round(net(t, 1)))).toEqual([13, 16, 20, 24, 28, 32]);
    expect(MOD_COUNT.touched * PER_MOD.touched).toBeCloseTo(29);
  });

  it('lets a level beat a tier: PRE-WAR over a TOUCHED three under, TURNING five, HUNGRY seven; LV 9 purple over LV 2 red', () => {
    for (let lv = 1; lv <= 10; lv++) {
      expect(net('tolmouth', lv + 3)).toBeGreaterThan(net('touched', lv));
      expect(net('tolmouth', lv + 5)).toBeGreaterThan(net('turning', lv));
      expect(net('tolmouth', lv + 7)).toBeGreaterThan(net('hungry', lv));
      // A red at your own level is still the best thing there is.
      for (const t of TIER_ORDER.slice(0, -1)) expect(net('hungry', lv)).toBeGreaterThan(net(t, lv));
    }
    expect(net('tolmouth', 9)).toBeGreaterThan(net('hungry', 2));
    expect(growAt(2) / growAt(1)).toBeCloseTo(ILVL.grow);
  });

  it('raises a rolled piece by its level, light and heavy armor kept level, the roll quality unmoved', () => {
    const rng = new Rng(7);
    for (const t of ['fine', 'forged', 'tolmouth', 'touched', 'turning', 'hungry'] as Tier[]) {
      for (const slot of ['weapon', 'armor', 'ring'] as const) {
        const a = rollAny(rng, 'RANGER', t, slot), b = raise(a, 9);
        expect(a.ilvl).toBe(1);
        expect(b.ilvl).toBe(9);
        expect(rollQuality(b)).toBeCloseTo(rollQuality(a), 1);
        if (a.cost) expect(b.cost!.v).toBeGreaterThan(a.cost.v);
        expect(raise(b, 4)).toBe(b); // never lowered
      }
    }
    // A light piece and plate add up the same at LV 10, as at LV 1 (budget.ts lift isn't grown).
    const mean = (kind: 'light' | 'heavy') => {
      let s = 0;
      for (let k = 0; k < 400; k++) s += itemPoints(raise(rollGear(rng, null, 'tolmouth', 'armor', undefined, kind), 10));
      return s / 400;
    };
    expect(mean('light') / mean('heavy')).toBeGreaterThan(0.95);
    expect(mean('light') / mean('heavy')).toBeLessThan(1.05);
  });

  it('lifts the base with the level: a plain sword from LV 8 hits harder than one from LV 1', () => {
    const plain = (ilvl: number): Item => ({ slot: 'weapon', kit: 'sword', quality: 'plain', traits: [], mods: [], level: 0, ilvl });
    expect(gearStats(plain(8), null).damage).toBeCloseTo(7 * ILVL.base.damage);
    expect(gearStats(plain(1), null).damage).toBe(0);
  });

  it('reads a piece from before levels as the level its points reach, and leaves what it gives alone', () => {
    // An old TOUCHED ring, 42 points then, no ilvl: it reads high, and the fight counts it as it was.
    const old: Item = { slot: 'ring', quality: 'touched', traits: [], level: 2, mods: [{ id: 'damage', v: 0.12 }, { id: 'crit', v: 0.1 }, { id: 'focus', v: 0.15 }] };
    const lv = ilvlOf(old), pts = itemPoints(old);
    expect(lv).toBeGreaterThan(1);
    expect(budgetAt('touched', 'ring', undefined, lv)).toBeLessThanOrEqual(pts + 1e-9);
    expect(gearStats(undefined, null, [old]).damage).toBeCloseTo(0.12 * 1.2);
    expect(raise(old, 9)).toBe(old);
    expect(ilvlOf({ ...old, mods: [] })).toBe(1);
  });

  it('drops treasure at the party level, one more from a hard place, never as a free plus', () => {
    const job: Job = { ...board(2)[1], layout: undefined, rooms: 3, place: { name: 'Test', kind: 'forest', region: 'Fenmere', ruin: 1 }, objective: 'rescue', seed: 41 };
    for (const it of treasure(job, 'WARRIOR', 'hkyle0000001', 1, 1, 0, 7)) expect([it.ilvl, it.level]).toEqual([7, 0]);
    for (const it of treasure({ ...job, place: { ...job.place, ruin: 3 } }, 'WARRIOR', 'hkyle0000001', 1, 1, 0, 7)) expect(it.ilvl).toBe(8);
    expect(dropLevel(0.4)).toBe(1);
  });
});
