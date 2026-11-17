/** The testers' fresh start (client/save.ts FRESH; Kyle, 2026-11-16). */
import { describe, expect, it } from 'vitest';
import { FRESH, fromStored as fromJson } from '../src/client/save';
import { newProfile } from '../src/shared/progress';
import { newWorld } from '../src/shared/story';

describe('the fresh start', () => {
  it('a save from before it keeps only Ashe, the Mage, with their town; anyone else starts over', () => {
    const ashe = { ...newProfile('MAGE', 'ASHE'), level: 9 }, bo = newProfile('WARRIOR', 'BO');
    const kept = fromJson({ heroes: [bo, ashe], current: 1, world: { ...newWorld(), day: 40 } })!;
    expect(kept.heroes.map((h) => h.name)).toEqual(['ASHE']);
    expect(kept.heroes[0].level).toBe(9);
    expect(kept.world.day).toBe(40);
    expect(kept.epoch).toBe(FRESH);
    const gone = fromJson({ heroes: [bo, newProfile('WARRIOR', 'ASHE')], current: 0, world: { ...newWorld(), day: 40 } })!;
    expect(gone.heroes).toEqual([]);
    expect(gone.world.day).toBe(newWorld().day);
  });

  it('a save made since keeps everyone', () => {
    const s = fromJson({ heroes: [newProfile('WARRIOR', 'BO')], current: 0, world: newWorld(), epoch: FRESH })!;
    expect(s.heroes.map((h) => h.name)).toEqual(['BO']);
  });
});
