import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { Block, GameMap, Round } from '../src/shared/arena';
import { board, PLACES, SEWERS, type Job } from '../src/shared/jobs';
import { planRoom } from '../src/shared/terrain';
import { expedition } from '../src/shared/expedjob';
import { expedPlan } from '../src/shared/expedmap';
import { Boxes, Seed } from '../src/client/three/boxes';
import { flatBlock } from '../src/client/three/walls3d';
import { addRound } from '../src/client/three/rounds3d';
import { addBrazier, BRAZIER_TOP } from '../src/client/three/brazier3d';
import { palisadeRun } from '../src/client/three/palisade3d';
import { addMounds } from '../src/client/three/mounds3d';
import { beaconPile } from '../src/client/three/beacon3d';
import type { Lamp3 } from '../src/client/three/lamps3d';

// Kyle (2026-11-05): "Some maps don't seem 2.5D, with braziers or goblin post-fence walls etc." Every
// piece the second parity pass stood up builds as itself, never the plain box or a painting.
const ROOFED = new Set(['house', 'barn', 'hall', 'church', 'forge', 'tavern', 'granary', 'tower', 'shack', 'den', 'sideway']);
/** The plain box walls3d.ts falls back to: two boxes, 72 corners. */
const PLAIN = 72;
const corners = (B: Boxes) => B.geometry().getAttribute('position').count;
const top = (B: Boxes) => {
  const g = B.geometry();
  g.computeBoundingBox();
  return g.boundingBox!;
};
const blockCorners = (b: Block) => {
  const g = flatBlock(b, new THREE.Group(), []), m = g.children[0] as THREE.Mesh | undefined;
  return m ? m.geometry.getAttribute('position').count : 0;
};

/** Layout 4's rooms (every kind, a few seeds and places) and the Barrowfields. */
function maps(): GameMap[] {
  const out: GameMap[] = [expedPlan(expedition(3)).map];
  for (const place of [...PLACES.slice(0, 8), SEWERS]) for (const seed of [1, 2, 3]) {
    const j: Job = { ...board(1)[1], place, rooms: 5, seed, objective: 'hunt', layout: 4, deep: false };
    for (let i = 0; i < 4; i++) out.push(planRoom(j, i).map);
  }
  return out;
}

describe('2.5D parity, second pass', () => {
  const all = maps();

  it('stands every block of layout 4 and the Barrowfields up as itself, never the plain box', () => {
    const seen = new Set<string>();
    for (const m of all) for (const b of m.blocks) {
      if (ROOFED.has(b.kind) || b.ruined) continue;
      seen.add(b.kind);
      expect(blockCorners(b), `${m.name} ${b.kind}`).not.toBe(PLAIN);
    }
    for (const k of ['fence', 'hurdle', 'stakes', 'cart', 'tent']) expect(seen.has(k), k).toBe(true);
  });

  it('builds a fence as FLAT paints it: a post every 5 pixels, two rails', () => {
    const b = { kind: 'fence', x: 2, y: 3, w: 2.5, h: 0.35 } as Block;
    expect(blockCorners(b)).toBe((8 + 2) * 36);
  });

  it('weaves a hurdle: withies in front of one stake and behind the next', () => {
    const b = { kind: 'hurdle', x: 0, y: 0, w: 5.2, h: 0.4 } as Block;
    const g = flatBlock(b, new THREE.Group(), []), p = (g.children[0] as THREE.Mesh).geometry.getAttribute('position');
    const zs = new Set<number>();
    for (let i = 0; i < p.count; i++) zs.add(Math.round(p.getZ(i) * 100));
    expect(zs.has(Math.round((0.2 + 0.04 + 0.0225) * 100))).toBe(true);
    expect(zs.has(Math.round((0.2 - 0.04 - 0.0225) * 100))).toBe(true);
  });

  it('puts a brazier on legs, its flames in the bowl and its light in the room', () => {
    const B = new Boxes(), lamps: Lamp3[] = [];
    addBrazier(B, { x: 5, y: 5, r: 0.4, wild: true }, lamps);
    expect(corners(B)).toBeGreaterThan(14 * 36);
    expect(top(B).max.y).toBeCloseTo(BRAZIER_TOP, 1);
    expect(lamps).toHaveLength(1);
    expect(lamps[0].always).toBe(true);
    for (const f of lamps[0].fires) expect(f[1]).toBeLessThan(BRAZIER_TOP);
    expect(lamps[0].light.r).toBeGreaterThan(4);
  });

  it('stands a palisade up as logs, one every 3/8 of a tile, each sharpened', () => {
    const B = new Boxes();
    palisadeRun(B, 0, 6, 2.4, new Seed(3));
    // A backing, then for each of 16 logs: the log, its seam (boxes) and its point (a cone of 54 corners).
    expect(corners(B)).toBe(36 + 16 * (72 + 54));
    expect(top(B).max.y).toBeGreaterThan(2.4);
  });

  it('rounds the boulders, bushes, bales and clamps, and stands the stones upright', () => {
    // Boxes are 36 corners, a rounded lump (an icosahedron) 60: rocks were three boxes, bushes three,
    // bales and clamps two, a standing stone one.
    const want: [Round['kind'], number][] = [['rock', 3 * 60], ['bush', 3 * 60 + 2 * 36], ['hay', 2 * 36 + 2 * 60], ['clamp', 3 * 60 + 2 * 36], ['stone', 3 * 36 + 60]];
    for (const [kind, n] of want) {
      const B = new Boxes();
      addRound(B, { kind, x: 4, y: 4, r: 0.45 }, [], new Seed(1));
      expect(corners(B), kind).toBe(n);
    }
    const S = new Boxes();
    addRound(S, { kind: 'stone', x: 4, y: 4, r: 0.4 }, [], new Seed(1));
    const bb = top(S);
    expect(bb.max.y).toBeGreaterThan(bb.max.x - bb.min.x);
  });

  it('heaps every grave and barrow and stands its marker', () => {
    const m = all.find((q) => (q.marks ?? []).some((k) => k.kind === 'mound'))!;
    expect(m).toBeTruthy();
    const B = new Boxes();
    addMounds(B, m, new Seed(1));
    expect(top(B).max.y).toBeGreaterThan(0.5);
  });

  it('stacks the beacon in four courses', () => {
    const B = new Boxes();
    expect(beaconPile(B, 10, 10, new Seed(1))).toBeGreaterThan(0.5);
    expect(corners(B)).toBeGreaterThan(10 * 36);
  });

  it('is the same every time', () => {
    const b = all[0].blocks.find((q) => q.kind === 'hurdle' || q.kind === 'tent')!;
    expect(blockCorners(b)).toBe(blockCorners(b));
  });
});
