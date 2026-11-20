// VOWED gear in the fight (sim/vowed.ts): the costs, the guards, and the gifts paid for blows on goblins.
import { describe, expect, it } from 'vitest';
import { VOWED_FX, rollVowed, type VowedId } from '../src/shared/vowed';
import { rollHungry } from '../src/shared/hungry';
import { Rng } from '../src/shared/rng';
import { gearStats, type Item } from '../src/shared/tuning';
import { newHero } from '../src/sim/hero';
import { noteVowed, payVowed, vowedBlock, vowedGuard, vowedOn, withVowed } from '../src/sim/vowed';
import { goldKeep } from '../src/sim/bites';
import type { Hero } from '../src/sim/types';

const piece = (id: VowedId): Item => {
  const cls = id === 'widow' ? 'WARRIOR' : id === 'ketterby' ? 'RANGER' : id === 'returned' ? 'ROGUE' : id === 'apprentice' ? 'MAGE' : 'HEALER';
  const slot = ['breach', 'carthand'].includes(id) ? 'armor' : ['swornoff', 'tithe'].includes(id) ? 'ring' : 'weapon';
  for (let s = 0; s < 50; s++) { const it = rollVowed(new Rng(s), cls, slot, id === 'breach' ? 'heavy' : 'light'); if (it?.holy === id) return it; }
  throw new Error(id);
};
const wearing = (id: VowedId, x = 5, y = 5, name = id): Hero => {
  const h = newHero(name, x, y), it = piece(id);
  if (it.slot === 'weapon') (h.weapon = it.kit!), (h.arms = { [it.kit!]: it });
  else if (it.slot === 'armor') h.armor = it;
  else h.rings = [it];
  return h;
};
const hungryRing = { ...rollHungry(new Rng(4), 'WARRIOR'), slot: 'ring' as const };

describe('vowed costs', () => {
  it('slow the sword and the mail, the bow\'s draw, the skill; dear dodges; the coat lets more through', () => {
    const base = () => gearStats(undefined, null);
    const cost = (id: VowedId) => { const s = base(); withVowed(s, wearing(id)); return s; };
    expect(cost('widow').foot).toBeCloseTo(base().foot - VOWED_FX.slowSword);
    expect(cost('breach').foot).toBeCloseTo(base().foot - VOWED_FX.slowMail);
    expect(cost('ketterby').draw).toBeCloseTo(base().draw - VOWED_FX.drawLonger);
    expect(cost('returned').dodgeCost).toBeCloseTo(base().dodgeCost * 1.1);
    expect(cost('apprentice').focus).toBeCloseTo(base().focus - VOWED_FX.skill);
    expect(cost('carthand').taken).toBeCloseTo(base().taken * 1.05);
  });
  it('nothing, cost or gift, while dim', () => {
    const h = wearing('widow');
    h.rings = [hungryRing];
    const s = gearStats(undefined, null), was = s.foot;
    withVowed(s, h);
    expect(s.foot).toBe(was);
    expect(vowedOn(h, 'widow')).toBe(false);
  });
});

describe('vowed gifts', () => {
  it('THE BREACH MAIL: friends near take less, not the wearer, not those far off', () => {
    const mail = wearing('breach', 5, 5, 'm'), friend = newHero('f', 6, 5), far = newHero('x', 30, 5), party = [mail, friend, far];
    expect(vowedGuard(friend, party, 0)).toBeCloseTo(0.9);
    expect(vowedGuard(mail, party, 0)).toBe(1);
    expect(vowedGuard(far, party, 0)).toBe(1);
  });
  it("THE WIDOW'S SWORD: a block gives the nearest friend stamina", () => {
    const w = wearing('widow', 5, 5, 'w'), f = newHero('f', 7, 5);
    f.stamina = 10;
    vowedBlock(w, [w, f], 0);
    expect(f.stamina).toBe(10 + VOWED_FX.stam);
  });
  it("KETTERBY'S BOW: a full draw that hits heals the nearest friend", () => {
    const r = wearing('ketterby', 5, 5, 'r'), f = newHero('f', 6, 5);
    f.hp = f.maxHp - 20;
    noteVowed('r', { charged: true }, false);
    payVowed([r, f], 0, []);
    expect(f.hp).toBe(f.maxHp - 20 + VOWED_FX.draw);
    noteVowed('r', {}, false);
    payVowed([r, f], 0, []);
    expect(f.hp).toBe(f.maxHp - 20 + VOWED_FX.draw);
  });
  it('THE RETURNED PAIR: a backstab guards friends near for a moment', () => {
    const r = wearing('returned', 5, 5, 'r'), f = newHero('f', 6, 5);
    noteVowed('r', { backstab: true }, false);
    payVowed([r, f], 10, []);
    expect(vowedGuard(f, [r, f], 12)).toBeCloseTo(0.9);
    expect(vowedGuard(f, [r, f], 10 + VOWED_FX.wardFor + 0.1)).toBe(1);
  });
  it("THE APPRENTICE'S STAFF: a kill refills the nearest friend's bar", () => {
    const m = wearing('apprentice', 5, 5, 'm'), f = newHero('f', 6, 5);
    f.stamina = 0;
    noteVowed('m', {}, true);
    payVowed([m, f], 0, []);
    expect(f.stamina).toBe(VOWED_FX.stam);
  });
  it('THE TITHE RING: a tenth less coin', () => {
    expect(goldKeep(wearing('tithe'))).toBeCloseTo(VOWED_FX.kills);
  });
});
