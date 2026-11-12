// Health and damage shown ×SHOWN, the fight untouched (shared/shown.ts; docs/design/boss-threat.md step 1).
import { describe, expect, it } from 'vitest';
import { SHOWN, shown } from '../src/shared/shown';
import { drillGain } from '../src/shared/drills';
import { POTIONS } from '../src/shared/potions';
import { POTION } from '../src/shared/tuning';
import { HERO } from '../src/shared/tuning';

describe('the shown scale', () => {
  it('scales and rounds', () => {
    expect(SHOWN).toBe(10);
    expect(shown(12)).toBe(120);
    expect(shown(6.66)).toBe(67);
  });
  it('drills, potions and health read in the big numbers; percents stay', () => {
    expect(drillGain('health', 'WARRIOR', 1)).toBe('+80 health');
    expect(POTIONS.bitter.text).toContain(String(shown(POTION.heal)));
    expect(drillGain('wind', 'WARRIOR', 1)).toContain('8%');
    expect(HERO.hp).toBe(100);
  });
});
