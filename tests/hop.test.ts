/** The hop drawn when a body changes level (client/three/hop.ts): drawing only. */
import { describe, expect, it } from 'vitest';
import { HOP, hopAt, hopHeight } from '../src/client/three/hop';

describe('the hop off a height', () => {
  it('follows small changes at once (a slope, a step)', () => {
    expect(hopHeight('a', 0, 10)).toBe(0);
    expect(hopHeight('a', 0.2, 10.01)).toBe(0.2);
    expect(hopHeight('a', 0.35, 10.02)).toBe(0.35);
  });

  it('down: rises off the lip, falls, and is on the ground when the hop is over', () => {
    hopHeight('b', 1.5, 20);
    const first = hopHeight('b', 0, 20.02), mid = hopHeight('b', 0, 20 + 0.02 + HOP.time * 0.85), end = hopHeight('b', 0, 20.02 + HOP.time + 0.01);
    expect(first).toBeCloseTo(1.5, 5);
    expect(hopHeight('b', 0, 20.02 + HOP.time * 0.15)).toBeGreaterThan(1.5);
    expect(mid).toBeGreaterThan(0), expect(mid).toBeLessThan(1.5);
    expect(end).toBe(0);
  });

  it('is a leap, not a drop: it starts where it stood on the lip, rises above it, and is carried out to where it lands', () => {
    // Stood on the lip at y 19.9, height 1.5; the rules set it down at y 20.9 on the ground.
    hopAt('j', 15, 19.9, 1.5, 15, 19.9, 40);
    const [, y0, h0] = hopAt('j', 15, 20.3, 0, 15, 20.9, 40.02);
    expect(y0).toBeCloseTo(19.9, 5), expect(h0).toBeCloseTo(1.5, 5);
    const [, y1, h1] = hopAt('j', 15, 20.9, 0, 15, 20.9, 40.02 + HOP.time * 0.25);
    expect(h1).toBeGreaterThan(1.8);
    expect(y1).toBeGreaterThan(20.0), expect(y1).toBeLessThan(20.4);
    const [, y2, h2] = hopAt('j', 15, 20.9, 0, 15, 20.9, 40.02 + HOP.time + 0.01);
    expect(y2).toBe(20.9), expect(h2).toBe(0);
    // A change of place too far to be a leap (set down elsewhere) carries nothing.
    hopAt('k', 5, 5, 1.5, 5, 5, 50);
    expect(hopAt('k', 30, 30, 0, 30, 30, 50.02)[0]).toBe(30);
  });

  it('up (a Rogue up a face): leaves the ground fast and is on the top when it is over', () => {
    hopHeight('c', 0, 30);
    expect(hopHeight('c', 1.5, 30.02)).toBeCloseTo(0, 5);
    expect(hopHeight('c', 1.5, 30.02 + HOP.time * 0.5)).toBeGreaterThan(0.75);
    expect(hopHeight('c', 1.5, 30.02 + HOP.time + 0.01)).toBe(1.5);
  });
});
