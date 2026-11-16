/** Gear you can see, slice 1 (docs/design/gear-looks.md): a weapon's look from the piece, packed for town, and the colour table. */
import { describe, expect, it } from 'vitest';
import { armourLookOf, heldLook, legsLook, packArmour, packLook, unpackArmour, unpackLook, weaponLookOf, wornLook } from '../src/shared/gearlook';
import { TIER_ORDER } from '../src/shared/gear';
import { PAINT, tintOf, tintPixel, VEIN } from '../src/client/weaponlook';
import { NAMED } from '../src/client/namedlooks';
import { NAMED_FLOOR, NAMED_ICON } from '../src/client/namedart';
import { HUNGRY, HUNGRY_ORDER } from '../src/shared/hungry';
import type { Item } from '../src/shared/loot';
import { UNIQUES } from '../src/shared/uniques';

describe('weapon looks', () => {
  it('reads tier, element and name (Hungry or unique) off the piece; no piece is plain', () => {
    expect(weaponLookOf(undefined)).toEqual({ tier: 'plain' });
    expect(weaponLookOf({ kit: 'sword', quality: 'forged', traits: ['rime'] })).toEqual({ tier: 'forged', el: 'frost' });
    expect(weaponLookOf({ kit: 'mace', quality: 'hungry', traits: [], hungry: 'cleaver' })).toEqual({ tier: 'hungry', named: 'cleaver' });
    expect(heldLook({ weapon: 'sword', arms: { sword: { kit: 'sword', quality: 'fine', traits: [] } } })).toEqual({ tier: 'fine' });
    // A friend's word wins over an empty kit.
    expect(heldLook({ weapon: 'sword', arms: {}, gearLook: { w: { tier: 'turning' } } })).toEqual({ tier: 'turning' });
  });

  it('packs small and back, every tier and element; anything odd is plain', () => {
    for (const tier of TIER_ORDER) for (const el of [undefined, 'fire', 'frost', 'storm'] as const) {
      const l = { tier, ...(el ? { el } : {}) };
      expect(unpackLook(packLook(l))).toEqual(l);
    }
    expect(unpackLook(packLook({ tier: 'hungry', named: 'pike' }))).toEqual({ tier: 'hungry', named: 'pike' });
    for (const bad of [undefined, 3, '9', 'x', '2q', '2f:<script>']) expect(unpackLook(bad)).toEqual({ tier: 'plain' });
  });

  it('fine is today\'s look; the others change the steel and leave a glove alone', () => {
    expect(tintOf({ tier: 'fine' })('#eef2f5')).toBe('#eef2f5');
    for (const tier of TIER_ORDER.filter((t) => t !== 'fine')) {
      const t = tintOf({ tier });
      expect(t('#9aa4ae')).not.toBe('#9aa4ae');
      expect(t('#d6aa70')).toBe('#d6aa70');
    }
  });

  it('cursed metal is veined, more each tier', () => {
    const count = (tier: (typeof TIER_ORDER)[number]) => {
      const t = tintPixel({ tier });
      let n = 0;
      for (let x = 0; x < 20; x++) for (let y = 0; y < 4; y++) n += t('#e8eef2', x, y) === VEIN ? 1 : 0;
      return n;
    };
    expect(count('forged')).toBe(0);
    expect(count('tolmouth')).toBeGreaterThan(0);
    expect(count('touched')).toBeGreaterThan(count('tolmouth'));
    expect(count('hungry')).toBeGreaterThan(count('touched'));
    expect(PAINT.plain.veins).toBe(0);
  });

  it('every Hungry weapon has its own look, held, on the floor and in the bag', () => {
    for (const id of HUNGRY_ORDER.filter((h) => HUNGRY[h].slot === 'weapon')) {
      expect(NAMED[id]?.held, id).toBeTypeOf('function');
      expect(NAMED_FLOOR[id], id).toBeDefined();
      expect(NAMED_ICON[id], id).toBeTypeOf('function');
    }
    // Its own stuff over the tier's: Spendthrift's string is gold, a plain hungry bow's is not.
    expect(tintOf({ tier: 'hungry', named: 'spendthrift' })('#d8d0bc')).toBe('#e8c050');
    expect(tintOf({ tier: 'hungry' })('#d8d0bc')).toBe('#d8d0bc');
  });

  it('shows a kept look over the piece worn, on the same kit only', () => {
    const fine: Item = { kit: 'greatsword', quality: 'fine', traits: [] };
    expect(heldLook({ weapon: 'greatsword', arms: { greatsword: { ...fine } }, keep: { weapon: 'haulpick' } })).toEqual({ tier: 'fine', named: 'haulpick' });
    expect(heldLook({ weapon: 'sword', arms: { sword: { ...fine, kit: 'sword' } }, keep: { weapon: 'haulpick' } })).toEqual({ tier: 'fine' });
  });

  it('every unique weapon is its own thing: held, floor and bag, its own colours and no veins', () => {
    const ids = Object.entries(UNIQUES).filter(([, u]) => u.slot === 'weapon').map(([id]) => id);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(NAMED[id], id).toBeDefined();
      expect(NAMED_FLOOR[id], id).toBeDefined();
      expect(NAMED_ICON[id], id).toBeTypeOf('function');
      const t = tintPixel({ tier: 'tolmouth', named: id });
      for (let x = 0; x < 20; x++) expect(t('#e8eef2', x, 0)).not.toBe(VEIN);
    }
    // Over today's art, not its PRE-WAR tier: a unique's gold stays gold unless it swaps it.
    expect(tintOf({ tier: 'tolmouth', named: 'doorbow' })('#d4a537')).toBe('#d4a537');
  });

  it('armour: the body and legs pieces by weight and tier, kept looks, a friend\'s word, packed small', () => {
    const plate: Item = { slot: 'armor', armor: 'heavy', quality: 'forged', traits: [] }, wraps: Item = { slot: 'legs', armor: 'light', quality: 'plain', traits: [] };
    expect(armourLookOf(null)).toBeNull();
    expect(wornLook({ armor: plate })).toEqual({ weight: 'heavy', tier: 'forged' });
    expect(legsLook({ legs: wraps })).toEqual({ weight: 'light', tier: 'plain' });
    expect(wornLook({ armor: plate, keep: { armor: 'smeltplate' } })).toEqual({ weight: 'heavy', tier: 'forged', named: 'smeltplate' });
    expect(wornLook({ armor: plate, gearLook: { a: null } })).toBeNull();
    for (const l of [{ weight: 'medium', tier: 'turning' }, { weight: 'heavy', tier: 'hungry', named: 'apron' }] as const) expect(unpackArmour(packArmour(l))).toEqual(l);
    expect(packArmour(null)).toBe('');
    for (const bad of [undefined, '', '9h', '2x', 7]) expect(unpackArmour(bad)).toBeNull();
  });
});
