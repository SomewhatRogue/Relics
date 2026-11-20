// Amends pay out, and Odric's shelf (docs/design/holy-gear.md slice 7).
import { describe, expect, it } from 'vitest';
import { PAYOUT, canPay, owed, payOut, shelfFor, shelfNames, shelfPrice, takenNow } from '../src/shared/shelf';
import { AMENDS_STEPS } from '../src/shared/amends';
import { grown, ripe } from '../src/shared/vowgrow';
import { isVowed } from '../src/shared/vowed';
import { rollHungry } from '../src/shared/hungry';
import { Rng } from '../src/shared/rng';
import type { Item } from '../src/shared/tuning';
import { SHELFW } from '../src/client/shelfwords';

const hero = (penance = 0) => ({ cls: 'ROGUE' as const, level: 3, weapon: 'daggers', arms: {}, armor: null, legs: null, rings: [] as Item[], bag: [] as Item[], want: 0, penance, amendsPaid: 0 });

describe('amends pay out', () => {
  it('one payout per step reached, paid in order, each more grown, never ripe', () => {
    const p = hero(AMENDS_STEPS[3]);
    expect(owed(p)).toBe(4);
    const got = [0, 1, 2, 3].map((i) => payOut(p, i % 2 ? 'ring' : 'weapon', new Rng(i))!);
    got.forEach((it, i) => expect(grown(it)).toBeCloseTo(PAYOUT[i]));
    expect(got.some((it) => ripe(it))).toBe(false);
    expect(got.every((it) => isVowed(it))).toBe(true);
    expect(p.bag).toHaveLength(4);
    expect(owed(p)).toBe(0);
    expect(payOut(p, 'weapon', new Rng(9))).toBeNull();
  });
  it('waits while the hero is corrupt', () => {
    const p = hero(AMENDS_STEPS[0]);
    p.want = 40;
    expect(canPay(p)).toBe(false);
    expect(payOut(p, 'ring', new Rng(1))).toBeNull();
    p.want = 0;
    p.rings = [{ ...rollHungry(new Rng(2), 'ROGUE'), slot: 'ring' }];
    expect(canPay(p)).toBe(false);
    p.rings = [];
    expect(canPay(p)).toBe(true);
  });
});

describe("Odric's shelf", () => {
  it('three for the class, the same for a window, fresh, priced as a gift', () => {
    const a = shelfFor('ROGUE', 7, 3), b = shelfFor('ROGUE', 7, 3);
    expect(a).toHaveLength(3);
    expect(shelfNames(a)).toEqual(shelfNames(b));
    expect(shelfNames(a)[0]).toBe('THE RETURNED PAIR');
    expect(a.every((it) => isVowed(it) && grown(it) === 0)).toBe(true);
    expect(a.every((it) => shelfPrice(it) > 0 && shelfPrice(it) % 5 === 0)).toBe(true);
  });
  it('remembers what was taken this window only', () => {
    expect(takenNow({ win: 7, took: [1] }, 7)).toEqual([1]);
    expect(takenNow({ win: 7, took: [1] }, 8)).toEqual([]);
    expect(takenNow(undefined, 8)).toEqual([]);
  });
  it('has its words', () => {
    expect(SHELFW.take('5c')).toContain('5c');
    expect(SHELFW.shelfLine).not.toMatch(/holy|bless|lent/i);
  });
});
