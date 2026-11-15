/** Keeping a unique's look (docs/design/gear-levels.md section 3): the record, the choice, what's drawn. */
import { describe, expect, it } from 'vitest';
import { keepLook, lookChoices, noteLooks, shownItem, type Looks } from '../src/shared/keptlook';
import { UNIQUES } from '../src/shared/uniques';
import type { Item } from '../src/shared/tuning';

const U = UNIQUES as Record<string, { slot: 'weapon' | 'armor' | 'ring'; kit?: string }>;
const slotFor = (u: string) => U[u]?.slot, kitFor = (u: string) => U[u]?.kit;
const pick: Item = { slot: 'weapon', kit: 'greatsword', quality: 'tolmouth', traits: [], mods: [], unique: 'haulpick' };
const plainGs: Item = { slot: 'weapon', kit: 'greatsword', quality: 'touched', traits: [], mods: [{ id: 'quick', v: 0.1 }], ilvl: 9 };

describe('kept looks', () => {
  it('notes a unique once it is worn, and only then can its look be kept, in its own slot', () => {
    const p: Looks = { arms: { greatsword: pick }, weapon: 'greatsword', armor: null, rings: [] };
    expect(keepLook(p, 'weapon', 'haulpick', slotFor)).toBe(false);
    expect(noteLooks(p)).toBe(true);
    expect(noteLooks(p)).toBe(false);
    expect(lookChoices(p, 'weapon', slotFor)).toEqual(['haulpick']);
    expect(keepLook(p, 'armor', 'haulpick', slotFor)).toBe(false);
    expect(keepLook(p, 'weapon', 'haulpick', slotFor)).toBe(true);
    expect(keepLook(p, 'weapon', '', slotFor)).toBe(true);
    expect(p.keep).toEqual({});
  });

  it('draws the kept look over a stronger piece of the same kit, and changes nothing it gives', () => {
    const keep = { weapon: 'haulpick' };
    const shown = shownItem(plainGs, keep, kitFor)!;
    expect([shown.unique, shown.mods, shown.ilvl, shown.quality]).toEqual(['haulpick', plainGs.mods, 9, 'touched']);
    expect(shownItem({ ...plainGs, kit: 'spear' }, keep, kitFor)!.unique).toBeUndefined();
    expect(shownItem(plainGs, {}, kitFor)).toBe(plainGs);
    expect(shownItem(null, keep, kitFor)).toBeNull();
  });
});
