// Hungry pieces get hungrier (docs/design/holy-and-hungry.md section 2b) and jobs count by size.
import { describe, expect, it } from 'vitest';
import { BITE_ORDER, HUNGER, biteOn, biteShare, bitesOf, fed, feedKit, toNextStep, type FedItem } from '../src/shared/hunger';
import { UNITS, jobUnits } from '../src/shared/jobunits';
import { rollHungry } from '../src/shared/hungry';
import { Rng } from '../src/shared/rng';
import { gearStats, type Item } from '../src/shared/tuning';
import { withBites, healBite } from '../src/sim/bites';
import { biteLines } from '../src/client/bitewords';
import type { Job } from '../src/shared/jobs';
import type { Hero } from '../src/sim/types';

const job = (o: Partial<Job> = {}) => ({ size: 'medium', ...o }) as Job;
const piece = (seed = 3): FedItem => rollHungry(new Rng(seed), 'WARRIOR');
const plain: Item = { slot: 'weapon', kit: 'sword', quality: 'forged', traits: [], mods: [{ id: 'damage', v: 0.1 }], level: 0 };

describe('jobs by size', () => {
  it('counts a job by its size, a big one more, a great boss most', () => {
    expect(jobUnits(job({ size: 'short' }), 'won')).toBe(0.5);
    expect(jobUnits(job(), 'won')).toBe(1);
    expect(jobUnits(job({ size: undefined }), 'won')).toBe(1);
    expect(jobUnits(job({ size: 'long' }), 'won')).toBe(2);
    expect(jobUnits(job({ deep: true, size: 'long' }), 'won')).toBe(UNITS.big);
    expect(jobUnits(job({ exped: 'fen' }), 'won')).toBe(UNITS.big);
    expect(jobUnits(job({ exped: 'hangmans' }), 'won')).toBe(UNITS.great);
    expect(jobUnits(job({ arena: 'doorkeepers' }), 'won')).toBe(UNITS.great);
    expect(jobUnits(job({ arena: 'doorkeepers', deep: true, floor: 4 }), 'won')).toBe(UNITS.big);
    expect(jobUnits(job({ instance: 'opencut' as Job['instance'] }), 'won')).toBe(UNITS.great);
  });
  it('driven back counts half its size; gone early, nothing', () => {
    expect(jobUnits(job({ size: 'long' }), 'beaten')).toBe(1);
    expect(jobUnits(job({ instance: 'opencut' as Job['instance'] }), 'beaten')).toBe(1);
    expect(jobUnits(job(), 'left')).toBe(0);
    expect(jobUnits(job(), 'dropped')).toBe(0);
  });
});

describe('a bite grows', () => {
  it('5% at first, 50% at twelve units, in steps of 5%', () => {
    expect(biteShare(0, 0)).toBe(0.05);
    expect(biteShare(HUNGER.span, 0)).toBe(0.5);
    expect(biteShare(99, 0)).toBe(0.5);
    for (let w = 0; w <= 30; w += 0.5) {
      const s = biteShare(w, 0);
      expect(Math.round(s * 100) % 5).toBe(0);
      expect(s).toBeGreaterThanOrEqual(biteShare(Math.max(0, w - 0.5), 0));
    }
  });
  it('a second bite comes at 50% and grows the same way', () => {
    expect(biteShare(11.9, 1)).toBe(0);
    expect(biteShare(12, 1)).toBe(0.05);
    expect(biteShare(24, 1)).toBe(0.5);
  });
  it('says how far it is to the next step, and nothing at its worst', () => {
    expect(toNextStep(0, 0)).toBeCloseTo(12 / 9);
    expect(toNextStep(12, 0)).toBeNull();
    expect(toNextStep(5, 1)).toBe(7);
    expect(toNextStep(24, 1)).toBeNull();
  });
});

describe('a piece keeps its count', () => {
  it('a fresh hungry piece bites 5% from the start, and its bite never changes', () => {
    const p = piece(), b = bitesOf(p);
    expect(b).toHaveLength(1);
    expect(b[0].share).toBe(0.05);
    const after = fed(p, 3);
    expect(after).not.toBe(p);
    expect(after.worn).toBe(3);
    expect(after.bites).toEqual([b[0].id]);
    expect(bitesOf(after)[0].id).toBe(b[0].id);
  });
  it('bites twice past twelve units, with two different bites', () => {
    const p = fed(piece(7), 13), b = bitesOf(p);
    expect(b.map((x) => x.share)).toEqual([0.5, 0.05]);
    expect(b[0].id).not.toBe(b[1].id);
    expect(p.bites).toEqual(b.map((x) => x.id));
  });
  it('rolls every bite across pieces', () => {
    const seen = new Set(Array.from({ length: 60 }, (_, i) => bitesOf(piece(i))[0].id));
    expect([...seen].sort()).toEqual([...BITE_ORDER].sort());
  });
  it("never a dearer dodge for a class that can't dodge", () => {
    for (let i = 0; i < 80; i++) {
      const p = piece(i), cls = p.hungry === 'cleaver' || p.hungry === 'pike' ? undefined : ('HEALER' as const);
      expect(bitesOf(fed(p, 13, cls), cls).map((b) => b.id)).not.toContain('clumsy');
    }
  });
  it('feeds only hungry pieces worn, as new pieces', () => {
    const h = piece(), ring = { ...piece(11), slot: 'ring' as const }, bagged = piece(12);
    const p = { weapon: 'sword', arms: { sword: h, spear: plain }, armor: plain, legs: null, rings: [ring], bag: [bagged] };
    feedKit(p, 2);
    expect((p.arms.sword as FedItem).worn).toBe(2);
    expect(p.arms.sword).not.toBe(h);
    expect((p.rings[0] as FedItem).worn).toBe(2);
    expect(p.armor).toBe(plain);
    expect(p.arms.spear).toBe(plain);
    expect((p.bag[0] as FedItem).worn).toBeUndefined();
    feedKit(p, 0);
    expect((p.arms.sword as FedItem).worn).toBe(2);
  });
  it('plain gear has no bite', () => {
    expect(bitesOf(plain)).toEqual([]);
    expect(biteLines(plain)).toEqual([]);
  });
});

describe('bites in the fight', () => {
  const withBite = (id: (typeof BITE_ORDER)[number], worn: number): FedItem => ({ ...piece(), worn, bites: [id] });
  const hero = (arms: Item, rings: Item[] = []) => ({ weapon: arms.kit ?? 'greatsword', arms: { [arms.kit ?? 'greatsword']: arms }, armor: null, legs: null, rings, baseHp: 100 }) as unknown as Hero;

  it('two of a kind take their shares together, never past the most', () => {
    const a = withBite('frail', 12), b = { ...withBite('frail', 12), slot: 'ring' as const };
    expect(biteOn([a], 'frail')).toBe(0.5);
    expect(biteOn([a, b], 'frail')).toBe(0.75);
    expect(biteOn([a, b, { ...b }], 'frail')).toBe(HUNGER.most);
    expect(biteOn([withBite('frail', 0)], 'winded')).toBe(0);
  });
  it('frail takes health, winded the refill, clumsy the dodge', () => {
    const base = () => gearStats(undefined, null);
    let s = base();
    withBites(s, hero(withBite('frail', 12)));
    expect(s.health).toBeCloseTo(-50);
    s = base();
    withBites(s, hero(withBite('winded', 12)));
    expect(1 + s.breath).toBeCloseTo(0.5);
    s = base();
    const was = s.dodgeCost;
    withBites(s, hero(withBite('clumsy', 0)));
    expect(s.dodgeCost).toBeCloseTo(was * 1.05);
  });
  it('starved takes a share of heals on you', () => {
    expect(healBite(hero(withBite('starved', 12)))).toBeCloseTo(0.5);
    expect(healBite(hero(plain))).toBe(1);
    expect(healBite(undefined)).toBe(1);
  });
  it('the card says the share and the jobs to the next step', () => {
    const [row] = biteLines(withBite('winded', 0), 'MAGE');
    expect(row[0]).toBe('BITE');
    expect(row[1]).toContain('5%');
    expect(row[1]).toContain('Magic');
    expect(row[1]).toContain('in about 2 jobs');
    const lines = biteLines(withBite('frail', 12));
    expect(lines).toHaveLength(2);
    expect(lines[0][1]).toContain('50%');
    expect(biteLines(withBite('frail', 11.5))[0][1]).toContain('second bite');
  });
});
