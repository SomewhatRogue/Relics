import { describe, expect, it } from 'vitest';
import { DEEDS, ROWS, defaultCloth, earned, fitCloth, packCloth, tally, unpackCloth, wearable, wearsCloth } from '../src/shared/clothlook';
import { QUESTS } from '../src/shared/heroquests';
import { newProfile } from '../src/shared/progress';

describe('the cloth a hero wears', () => {
  it('a new hero has only the look\'s own, and the lined cut', () => {
    const p = newProfile('WARRIOR');
    expect(earned(p, 'dye', 0) && earned(p, 'edge', 0) && earned(p, 'cut', 0)).toBe(true);
    expect(earned(p, 'cut', 1)).toBe(true);
    for (const d of DEEDS) expect(earned(p, d.row, d.i)).toBe(false);
  });

  it('deeds already on the tally count, each for its own entry', () => {
    const p = newProfile('WARRIOR');
    p.stats.kills = 100;
    expect(earned(p, 'dye', 1)).toBe(true);
    expect(earned(p, 'dye', 2)).toBe(false);
    p.stats.jobs = 25;
    expect(earned(p, 'dye', 2) && earned(p, 'edge', 1) && earned(p, 'cut', 2)).toBe(true);
    p.deepBest = 4;
    expect(earned(p, 'edge', 2)).toBe(false);
    p.deepBest = 5;
    expect(earned(p, 'edge', 2)).toBe(true);
  });

  it('hero quests count as done, and an old hero without the record is read by level', () => {
    const p = newProfile('WARRIOR');
    p.quests = { at: null, n: 0, done: QUESTS.map((q) => q.id) };
    expect(tally(p, 'quests')).toBe(QUESTS.length);
    expect(earned(p, 'edge', 3)).toBe(true);
    const old = { ...newProfile('WARRIOR'), quests: undefined, level: 1 };
    expect(tally(old, 'quests')).toBe(QUESTS.filter((q) => q.level <= 1).length);
  });

  it('every deed names a real entry, and no entry has two', () => {
    const seen = new Set<string>();
    for (const d of DEEDS) {
      expect(d.i).toBeGreaterThan(0);
      expect(d.i).toBeLessThan(ROWS[d.row].length);
      expect(seen.has(d.row + d.i)).toBe(false);
      seen.add(d.row + d.i);
    }
  });

  it('anything heard is fitted, and what is not earned is not worn', () => {
    expect(fitCloth(null)).toEqual(defaultCloth());
    expect(fitCloth({ dye: 99, edge: -1, cut: 1.5 })).toEqual(defaultCloth());
    expect(fitCloth({ dye: 6, edge: 3, cut: 2 })).toEqual({ dye: 6, edge: 3, cut: 2 });
    const p = newProfile('WARRIOR');
    p.stats.kills = 100;
    expect(wearable(p, { dye: 1, edge: 3, cut: 1 })).toEqual({ dye: 1, edge: 0, cut: 1 });
  });

  it('packs to three numbers and back', () => {
    const c = { dye: 4, edge: 2, cut: 1 };
    expect(unpackCloth(packCloth(c))).toEqual(c);
    expect(unpackCloth([1, 2])).toBeUndefined();
    expect(unpackCloth(['x', 9, 1])).toEqual({ dye: 0, edge: 0, cut: 1 });
  });

  it('only the Warrior wears one, for now', () => {
    expect(wearsCloth('WARRIOR')).toBe(true);
    expect(['RANGER', 'ROGUE', 'MAGE', 'HEALER'].some(wearsCloth)).toBe(false);
  });
});
