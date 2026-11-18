/** The hop drawn when a body changes level (client/three/hop.ts): drawing only. */
import { describe, expect, it } from 'vitest';
import { HOP, hopHeight } from '../src/client/three/hop';

describe('the hop off a height', () => {
  it('follows small changes at once (a slope, a step)', () => {
    expect(hopHeight('a', 0, 10)).toBe(0);
    expect(hopHeight('a', 0.2, 10.01)).toBe(0.2);
    expect(hopHeight('a', 0.35, 10.02)).toBe(0.35);
  });

  it('down: rises a little off the lip, falls, and is on the ground when the hop is over', () => {
    hopHeight('b', 1.5, 20);
    const first = hopHeight('b', 0, 20.02), mid = hopHeight('b', 0, 20 + 0.02 + HOP.time * 0.6), end = hopHeight('b', 0, 20.02 + HOP.time + 0.01);
    expect(first).toBeCloseTo(1.5, 5);
    expect(hopHeight('b', 0, 20.02 + HOP.time * 0.15)).toBeGreaterThan(1.5);
    expect(mid).toBeGreaterThan(0), expect(mid).toBeLessThan(1.5);
    expect(end).toBe(0);
  });

  it('up (a Rogue up a face): leaves the ground fast and is on the top when it is over', () => {
    hopHeight('c', 0, 30);
    expect(hopHeight('c', 1.5, 30.02)).toBeCloseTo(0, 5);
    expect(hopHeight('c', 1.5, 30.02 + HOP.time * 0.5)).toBeGreaterThan(0.75);
    expect(hopHeight('c', 1.5, 30.02 + HOP.time + 0.01)).toBe(1.5);
  });
});
