/** Wickhold's shared day: light at noon, dark at midnight, the same hour for everyone. */
import { describe, expect, it } from 'vitest';
import { DAY_MINUTES, dayPhase, daylight, townLight } from '../src/shared/daylight';

describe('the town day', () => {
  it('is light at noon and dark at midnight, and the whole cycle takes DAY_MINUTES', () => {
    expect(daylight(0.5)).toBe(1);
    expect(daylight(0)).toBe(0);
    expect(dayPhase(DAY_MINUTES * 60000 * 3.5)).toBeCloseTo(0.5);
    const base = { floor: 'cobble' as const, back: 'stone' as const, ambient: [0.27, 0.25, 0.33] as [number, number, number], moon: 0.5 };
    expect(townLight(base, 0.5).day).toBe(true);
    expect(townLight(base, 0).ambient).toEqual(base.ambient);
    expect(townLight(base, 0).moon).toBe(0.5);
  });
});
