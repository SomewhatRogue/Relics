import { describe, expect, it } from 'vitest';
import { CLIMB, climbOf, climbPlace, startClimb } from '../src/client/climbanim';

describe('climb animation', () => {
  it('runs 0 to 1 from the foot to the top, then ends', () => {
    startClimb(10, 10, 1, 0, 100);
    // The rules have the hero 1.3 on, along the climb.
    expect(climbOf('a', 11.3, 10, 100)!.k).toBe(0);
    const mid = climbOf('a', 11.3, 10, 100 + CLIMB.time / 2)!;
    expect(mid.k).toBeCloseTo(0.5);
    const first = climbOf('a', 11.3, 10, 100)!;
    expect(climbPlace(first, 11.3, 10, first.fx, first.fy, 0, 1)).toEqual([10, 10, 0]);
    const last = climbOf('a', 11.3, 10, 100 + CLIMB.time * 0.999)!;
    const [x, , h] = climbPlace(last, 11.3, 10, last.fx, last.fy, 0, 1);
    expect(x).toBeGreaterThan(11.25);
    expect(h).toBeCloseTo(1);
    expect(climbOf('a', 11.3, 10, 100 + CLIMB.time + 0.01)).toBeNull();
  });
  it('picks the hero in the way it went, not one beside it', () => {
    startClimb(0, 0, 0, -1, 50);
    expect(climbOf('far', 4, 0, 50.05)).toBeNull();
    expect(climbOf('near', 0, -1.3, 50.05)).not.toBeNull();
    expect(climbOf('far', 0, -1.3, 50.1)).toBeNull();
  });
});
