/** Gear you can see, slice 1 (docs/design/gear-looks.md): a weapon's look from the piece, packed for town, and the colour table. */
import { describe, expect, it } from 'vitest';
import { heldLook, packLook, unpackLook, weaponLookOf } from '../src/shared/gearlook';
import { TIER_ORDER } from '../src/shared/gear';
import { PAINT, tintOf, tintPixel, VEIN } from '../src/client/weaponlook';
import { NAMED } from '../src/client/namedlooks';
import { NAMED_FLOOR, NAMED_ICON } from '../src/client/namedart';
import { HUNGRY, HUNGRY_ORDER } from '../src/shared/hungry';
import type { Item } from '../src/shared/loot';

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
});
