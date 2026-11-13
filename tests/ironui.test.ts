import { describe, expect, it } from 'vitest';
import { motionWanted } from '../src/client/ironui';

describe('the MOTION switch (ironui.ts)', () => {
  it('a choice made on this device holds', () => {
    expect(motionWanted('1', true)).toBe(true);
    expect(motionWanted('0', false)).toBe(false);
  });
  it('with no choice, a device that asks for less motion starts still', () => {
    expect(motionWanted(null, true)).toBe(false);
    expect(motionWanted(null, false)).toBe(true);
  });
});
