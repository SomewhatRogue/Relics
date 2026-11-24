// Titles (docs/design/titles.md): earned by deeds on a road, bought, worn only on their own road.
import { describe, expect, it } from 'vitest';
import { STEPS, TITLES, deed, deedsOn, earned, fitTitles, own, owns, roadTitles, shownTitle, titlePrice, titled, wear } from '../src/shared/titles';
import { AMENDS_STEPS } from '../src/shared/amends';
import { newProfile } from '../src/shared/progress';
import { rollHungry } from '../src/shared/hungry';
import { Rng } from '../src/shared/rng';
import { TITLEW } from '../src/client/titlewords';

const hero = () => newProfile('MAGE', 'TESS', 't');

describe('titles', () => {
  it('four a road, each needing more deeds and costing more', () => {
    expect(roadTitles('church')).toEqual(['given', 'vowed', 'steadfast', 'holy']);
    expect(roadTitles('under')).toEqual(['greedy', 'kept', 'shadow', 'gilded']);
    const p = hero(), prices = roadTitles('church').map((t) => titlePrice(p, t));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(prices[0]).toBeGreaterThan(0);
    p.level = 30;
    expect(titlePrice(p, 'holy')).toBeGreaterThan(prices[3]);
  });
  it('deeds earn them; amends steps count on the church road', () => {
    const p = hero();
    expect(earned(p, 'given')).toBe(false);
    deed(p, 'church');
    expect(earned(p, 'given')).toBe(true);
    expect(earned(p, 'vowed')).toBe(false);
    p.penance = AMENDS_STEPS[3];
    expect(deedsOn(p, 'church')).toBe(5);
    expect(earned(p, 'vowed')).toBe(true);
    expect(deedsOn(p, 'under')).toBe(0);
    deed(p, 'under', 0.2);
    expect(deedsOn(p, 'under')).toBe(0);
  });
  it('bought once, worn one at a time, shown only on its own road', () => {
    const p = hero();
    deed(p, 'church');
    deed(p, 'under', STEPS.deeds[3]);
    expect(own(p, 'given')).toBe(true);
    expect(own(p, 'given')).toBe(false);
    expect(own(p, 'gilded')).toBe(true);
    wear(p, 'given');
    expect(shownTitle(p)).toBe('given');
    expect(titled(p.name, shownTitle(p))).toBe('TESS THE GIVEN');
    // Corrupt: the church's title hides; the hungry road's would show.
    p.rings = [{ ...rollHungry(new Rng(1), 'MAGE'), slot: 'ring' }];
    expect(shownTitle(p)).toBeUndefined();
    wear(p, 'gilded');
    expect(titled(p.name, shownTitle(p))).toBe('GILDED TESS');
    wear(p, 'holy');
    expect(p.titles!.worn).toBe('gilded');
    expect(owns(p, 'holy')).toBe(false);
  });
  it('a save keeps them, and drops what makes no sense', () => {
    expect(fitTitles({ deeds: { church: 3, under: -2 }, owned: ['given', 'nope'], worn: 'given' })).toEqual({ deeds: { church: 3, under: 0 }, owned: ['given'], worn: 'given' });
    expect(fitTitles({ owned: [], worn: 'holy' })?.worn).toBeUndefined();
    expect(fitTitles(undefined)).toBeUndefined();
  });
  it('every title has its word, and the panel names neither the Want nor the road', () => {
    for (const t of Object.values(TITLES)) expect(t.word).toMatch(/^[A-Z ]+$/);
    for (const v of Object.values(TITLEW)) {
      const s = typeof v === 'function' ? (v as (...a: unknown[]) => string)(true, 2) : v;
      expect(s).not.toMatch(/\bthe want\b|\broad\b|\u2014/i);
    }
  });
});
