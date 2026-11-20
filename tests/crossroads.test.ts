// The crossroads (docs/design/holy-and-hungry.md 5b): a ripe vowed piece given up, or kept and fallen.
import { describe, expect, it } from 'vitest';
import { FALL, fallWith, firstRipe, giveRipe, onceOf } from '../src/shared/crossroads';
import { GROW, grownBy, ripe } from '../src/shared/vowgrow';
import { isVowed, rollVowed, vowedOf } from '../src/shared/vowed';
import { bitesOf } from '../src/shared/hunger';
import { isCorrupt } from '../src/shared/corrupt';
import { Rng } from '../src/shared/rng';
import { budget, type Item } from '../src/shared/tuning';

const fullRing = () => grownBy(rollVowed(new Rng(3), 'RANGER', 'ring')!, GROW.span);
const kit = (ring: Item) => ({ cls: 'RANGER' as const, level: 1, weapon: 'longbow', arms: {}, armor: null, legs: null, rings: [ring], bag: [] as Item[], penance: 0 });
const sum = (it: Item) => (it.mods ?? []).reduce((s, m) => s + m.v, 0);

describe('the crossroads', () => {
  it('finds a ripe piece worn or packed; none else', () => {
    const r = fullRing(), p = kit(r);
    expect(firstRipe(p)).toBe(r);
    p.rings = [];
    p.bag = [r];
    expect(firstRipe(p)).toBe(r);
    p.bag = [rollVowed(new Rng(1), 'RANGER', 'ring')!];
    expect(firstRipe(p)).toBeUndefined();
  });
  it('given up: large amends, a fresh vowed piece where it was', () => {
    const r = fullRing(), p = kit(r), next = giveRipe(p, r, new Rng(9))!;
    expect(p.penance).toBe(FALL.amends);
    expect(isVowed(next)).toBe(true);
    expect(ripe(next)).toBe(false);
    expect(p.rings).toEqual([next]);
  });
  it('kept: it falls, hungry and stronger than a fresh hungry piece, bites from 5%, remembers it was vowed', () => {
    const r = fullRing(), p = kit(r), f = fallWith(p, r)!;
    expect(f.quality).toBe('hungry');
    expect(isVowed(f)).toBe(false);
    expect(onceOf(f)).toBe(vowedOf(r));
    expect(sum(f)).toBeCloseTo(budget('hungry', 'ring') * FALL.power * (sum({ ...r, mods: (r as { vowBase?: Item['mods'] }).vowBase }) / budget('tolmouth', 'ring')), 1);
    expect(bitesOf(f)[0].share).toBe(0.05);
    expect(p.rings).toEqual([f]);
    expect(isCorrupt(p)).toBe(true);
    expect(firstRipe(p)).toBeUndefined();
  });
  it('a piece not ripe is left alone', () => {
    const r = rollVowed(new Rng(3), 'RANGER', 'ring')!, p = kit(r);
    expect(giveRipe(p, r, new Rng(1))).toBeNull();
    expect(fallWith(p, r)).toBeNull();
    expect(p.rings).toEqual([r]);
  });
});
