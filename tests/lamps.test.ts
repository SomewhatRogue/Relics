/** The tended lamps: lit at dusk, out after dawn, one by one, never flickering; a job's by its hour. */
import { describe, expect, it } from 'vitest';
import { townLight } from '../src/shared/daylight';
import { LIT_AT, OUT_AT, ROUND, lampAt, lampsFor, lampsLit } from '../src/shared/lamps';
import { lightFor } from '../src/shared/timeofday';

const base = { floor: 'cobble' as const, back: 'stone' as const, ambient: [0.27, 0.25, 0.33] as [number, number, number], moon: 0.5 };

describe('the lamps', () => {
  it('are out at noon and lit at midnight, in town by the shared clock', () => {
    expect(lampsLit(0.5)).toBe(0);
    expect(lampsLit(0)).toBe(1);
    expect(lampAt(townLight(base, 0.5), 25, 15)).toBe(0);
    expect(lampAt(townLight(base, 0.02), 25, 15)).toBe(1);
  });
  it('come on one by one through the lamplighter\'s round, and go out the same way', () => {
    expect(lampsLit(LIT_AT - 0.001, 0)).toBe(0);
    expect(lampsLit(LIT_AT + ROUND / 2, 0)).toBe(1);
    expect(lampsLit(LIT_AT + ROUND / 2, 0.9)).toBe(0);
    expect(lampsLit(LIT_AT + ROUND + 0.01, 0.99)).toBe(1);
    expect(lampsLit(OUT_AT - 0.01, 0)).toBe(1);
    expect(lampsLit(OUT_AT + ROUND + 0.01, 0.99)).toBe(0);
  });
  it('never flicker: through the whole day each lamp lights once and goes out once', () => {
    for (const k of [0, 0.3, 0.77]) {
      let changes = 0, was = lampsLit(0, k) > 0.5;
      for (let p = 0; p < 1; p += 0.0002) {
        const now = lampsLit(p, k) > 0.5;
        if (now !== was) changes++, (was = now);
      }
      expect(changes).toBe(2);
    }
  });
  it('on a job follow its hour (out in broad day), and stay lit underground and indoors', () => {
    expect(lampsFor('day')).toBe(0);
    expect(['dawn', 'dusk', 'night'].map((t) => lampsFor(t as 'dawn'))).toEqual([1, 1, 1]);
    expect(lampAt(lightFor(base, 'village', 'day'), 4, -1.6)).toBe(0);
    expect(lampAt(lightFor(base, 'village', 'night'), 4, -1.6)).toBe(1);
    expect(lampAt(lightFor(base, 'mine', 'day'), 4, -1.6)).toBe(1);
    expect(lampAt(base, 4, 1)).toBe(1);
  });
});
