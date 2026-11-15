/** Gear you can see, slice 1 (docs/design/gear-looks.md): a weapon's look from the piece, packed for town, and the colour table. */
import { describe, expect, it } from 'vitest';
import { heldLook, packLook, unpackLook, weaponLookOf } from '../src/shared/gearlook';
import { TIER_ORDER } from '../src/shared/gear';
import { PAINT, tintOf, tintPixel, VEIN } from '../src/client/weaponlook';

describe('weapon looks', () => {
  it('reads tier, element and hungry id off the piece; no piece is plain', () => {
    expect(weaponLookOf(undefined)).toEqual({ tier: 'plain' });
    expect(weaponLookOf({ kit: 'sword', quality: 'forged', traits: ['rime'] })).toEqual({ tier: 'forged', el: 'frost' });
    expect(weaponLookOf({ kit: 'mace', quality: 'hungry', traits: [], hungry: 'cleaver' })).toEqual({ tier: 'hungry', hungry: 'cleaver' });
    expect(heldLook({ weapon: 'sword', arms: { sword: { kit: 'sword', quality: 'fine', traits: [] } } })).toEqual({ tier: 'fine' });
    // A friend's word wins over an empty kit.
    expect(heldLook({ weapon: 'sword', arms: {}, gearLook: { w: { tier: 'turning' } } })).toEqual({ tier: 'turning' });
  });

  it('packs small and back, every tier and element; anything odd is plain', () => {
    for (const tier of TIER_ORDER) for (const el of [undefined, 'fire', 'frost', 'storm'] as const) {
      const l = { tier, ...(el ? { el } : {}) };
      expect(unpackLook(packLook(l))).toEqual(l);
    }
    expect(unpackLook(packLook({ tier: 'hungry', hungry: 'pike' }))).toEqual({ tier: 'hungry', hungry: 'pike' });
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
});
