import { describe, expect, it } from 'vitest';
import { unite } from '../src/client/three/texpatch';

describe('texpatch: the changed patch of a texture', () => {
  it('grows to take in each rectangle', () => {
    let r = unite(null, 10, 20, 1, 1);
    expect(r).toEqual({ x: 10, y: 20, w: 1, h: 1 });
    r = unite(r, 4, 25, 2, 2);
    expect(r).toEqual({ x: 4, y: 20, w: 7, h: 7 });
  });
});
