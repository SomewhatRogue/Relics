import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { Block } from '../src/shared/arena';
import { townInterior } from '../src/shared/interiors';
import { newWorld } from '../src/shared/story';
import { Boxes, Seed } from '../src/client/three/boxes';
import { furnish3d } from '../src/client/three/furnish3d';
import { hallFurn3d } from '../src/client/three/hallfurn3d';

// Every piece of furniture FLAT paints in Wickhold's halls stands up as its own shape in 2.5D, never
// the plain box (Kyle: "in flat it has books and stairs; in 2.5D it just doesn't").
describe('2.5D furniture', () => {
  const world = { ...newWorld(), rescued: 9 };
  const doors = ['tower', 'hall', 'lodge', 'church', 'tavern', 'forge', 'bank', 'townhall', 'infirmary', 'granary', 'home:0'];
  const build = (b: Block) => {
    const B = new Boxes(), ok = furnish3d(B, b, new Seed(1), (c) => c, new THREE.Group()) || hallFurn3d(B, b, new Seed(1), (c) => c);
    return { ok, n: B.count };
  };

  it('builds every hall piece as itself', () => {
    for (const d of doors) for (const b of townInterior(d, world).blocks) {
      if (b.kind === 'rubble') continue;
      const { ok, n } = build(b);
      expect(ok, `${d} ${b.kind}`).toBe(true);
      expect(n, `${d} ${b.kind}`).toBeGreaterThan(2);
    }
  });

  it('builds the tower the way FLAT has it: shelves of books, a stair of nine steps', () => {
    const t = townInterior('tower', world).blocks;
    expect(build(t.find((b) => b.kind === 'books')!).n).toBeGreaterThan(60);
    expect(build(t.find((b) => b.kind === 'stair')!).n).toBeGreaterThanOrEqual(9 * 3);
  });

  it('is the same every time (looks come from the block, not from chance)', () => {
    const b = townInterior('tower', world).blocks[0];
    expect(build(b).n).toBe(build(b).n);
  });
});
