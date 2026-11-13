// Health and damage shown ×SHOWN, the fight untouched (shared/shown.ts; docs/design/boss-threat.md step 1).
import { describe, expect, it } from 'vitest';
import { SHOWN, shown } from '../src/shared/shown';
import { drillGain } from '../src/shared/drills';
import { POTIONS } from '../src/shared/potions';
import { POTION } from '../src/shared/tuning';
import { HERO } from '../src/shared/tuning';

describe('the shown scale', () => {
  it('scales and rounds', () => {
    expect(shown(12)).toBe(Math.round(12 * SHOWN));
    expect(shown(6.66)).toBe(Math.round(6.66 * SHOWN));
  });
  it('drills, potions and health read in the big numbers; percents stay', () => {
    expect(drillGain('health', 'WARRIOR', 1)).toBe(`+${shown(13)} health`);
    expect(POTIONS.bitter.text).toContain(String(shown(POTION.heal)));
    expect(drillGain('wind', 'WARRIOR', 1)).toContain('13%');
    expect(HERO.hp).toBe(100);
  });
});
