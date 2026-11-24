// VOWED gear and amends (docs/design/holy-gear.md): the nine, dim beside hunger, never put on over it.
import { describe, expect, it } from 'vitest';
import { VOWED, VOWED_ORDER, blocksVowed, dimmed, isVowed, rollVowed, vowedFor, vowedOf } from '../src/shared/vowed';
import { AMENDS_STEPS, amendsOf, stepCrossed } from '../src/shared/amends';
import { rollHungry } from '../src/shared/hungry';
import { Rng } from '../src/shared/rng';
import { budget, type Item } from '../src/shared/tuning';
import { statsOf } from '../src/sim/gearstats';
import { GEAR, applyGear } from '../src/sim/pack';
import { spoken } from '../src/client/vowedwords';
import type { Hero } from '../src/sim/types';
import { newHero } from '../src/sim/hero';

const CLASSES = ['WARRIOR', 'RANGER', 'ROGUE', 'MAGE', 'HEALER'] as const;
const hungryRing = { ...rollHungry(new Rng(4), 'WARRIOR'), slot: 'ring' as const };

describe('the nine', () => {
  it('one weapon a class, on its own kit; bodies and rings for anyone; no legs yet', () => {
    for (const c of CLASSES) {
      expect(vowedFor(c, 'weapon')).toHaveLength(1);
      expect(vowedFor(c, 'armor')).toEqual(['breach', 'carthand']);
      expect(vowedFor(c, 'ring')).toEqual(['swornoff', 'tithe']);
      expect(rollVowed(new Rng(1), c, 'legs')).toBeNull();
    }
    expect(VOWED_ORDER).toHaveLength(9);
  });
  it('rolls at PRE-WAR strength, two modifiers, and keeps its id', () => {
    const w = rollVowed(new Rng(2), 'ROGUE', 'weapon')!;
    expect(vowedOf(w)).toBe('returned');
    expect(w.kit).toBe('daggers');
    expect(w.mods).toHaveLength(2);
    expect(w.quality).toBe('tolmouth');
    expect(budget('tolmouth', 'weapon')).toBeGreaterThan(0);
  });
  it('a body piece follows the weight given up, else the class', () => {
    expect(vowedOf(rollVowed(new Rng(3), 'MAGE', 'armor', 'heavy'))).toBe('breach');
    expect(vowedOf(rollVowed(new Rng(3), 'WARRIOR', 'armor', 'light'))).toBe('carthand');
    expect(vowedOf(rollVowed(new Rng(3), 'WARRIOR', 'armor', 'medium'))).toBe('breach');
    expect(vowedOf(rollVowed(new Rng(3), 'HEALER', 'armor', 'medium'))).toBe('carthand');
  });
  it('every piece has words, and none says holy, blessed or the Lantern', () => {
    for (const id of VOWED_ORDER) for (const t of [VOWED[id].name, VOWED[id].gift, VOWED[id].cost]) {
      expect(t.length).toBeGreaterThan(5);
      expect(t).not.toMatch(/holy|bless|lantern|\u2014/i);
    }
  });
  it('says a name as spoken, not shouted', () => {
    expect(spoken("THE CART-HAND'S COAT")).toBe("The Cart-Hand's Coat");
  });
});

describe('never with hunger', () => {
  const hero = () => newHero('h', 5, 5);
  it('a vowed piece worn beside hungry gear gives nothing', () => {
    const h = hero(), mail = rollVowed(new Rng(5), 'WARRIOR', 'armor', 'heavy')!;
    h.armor = mail;
    const lit = statsOf(h);
    h.rings = [hungryRing];
    expect(dimmed(h)).toBe(true);
    const dim = statsOf(h);
    const m = mail.mods![0];
    expect(dim[m.id]).toBeLessThan(lit[m.id] + 1e-9);
    h.rings = [];
    expect(statsOf(h)[m.id]).toBeCloseTo(lit[m.id]);
  });
  it("won't go on over hungry gear", () => {
    const h = hero(), ring = rollVowed(new Rng(6), 'WARRIOR', 'ring')!;
    h.rings = [hungryRing];
    h.bag = [ring];
    expect(blocksVowed(h, ring)).toBe(true);
    applyGear(h, GEAR.equip, 0, []);
    expect(h.bag).toContain(ring);
    h.rings = [];
    applyGear(h, GEAR.equip, 0, []);
    expect(h.rings).toContain(ring);
    expect(isVowed(h.rings[0] as Item)).toBe(true);
  });
});

describe('amends', () => {
  it('a piece weighs 1, and 1 more for every twelve units worn', () => {
    expect(amendsOf(rollHungry(new Rng(1), 'MAGE'))).toBe(1);
    expect(amendsOf({ ...rollHungry(new Rng(1), 'MAGE'), worn: 25 } as Item)).toBe(3);
  });
  it('each step is crossed once', () => {
    expect(stepCrossed(0, 1)).toBe(-1);
    expect(stepCrossed(2, AMENDS_STEPS[0])).toBe(0);
    expect(stepCrossed(AMENDS_STEPS[0], AMENDS_STEPS[0] + 1)).toBe(-1);
    expect(stepCrossed(7, 9)).toBe(1);
  });
});
