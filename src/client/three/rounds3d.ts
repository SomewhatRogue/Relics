/**
 * The map's round things (trees, rocks, hay, a well, mine supports, posts with a flame, cookfires,
 * a washing line, a shrine...) built into the map's one merged mesh. Fires are returned as spots for
 * fire3d.ts and their light; the paint-only ones (crows, moths, a dog, smoke) are left to the floor.
 */
import type { Round } from '../../shared/arena';
import { Boxes, Seed, jit } from './boxes';
import { roundBoxes } from '../pieces';
import { putBoxes } from './pieces3d';
import { addNature } from './nature3d';

export type Spot = [number, number, number, number];

// The flat view's tree and pine colours (sprites.ts), so a wood is the same green in both.
const LEAF = [0x2f4a28, 0x3a5a30, 0x24391f], PINE = [0x1c3522, 0x24412a, 0x1f3a26];

export function addRound(B: Boxes, o: Round, fires: Spot[], r: Seed): void {
  // Boulders, standing stones, bushes, hay and clamps: rounded, as the flat view has them (nature3d.ts).
  if (addNature(B, o, r)) return;
  const x = o.x, z = o.y, R = Math.max(0.25, o.r), bark = 0x3a2a1e, wood = 0x5a3d22, stone = 0x55505e;
  switch (o.kind) {
    case 'tree':
    case 'deadtree': {
      B.b(x, 0, z, 0.3, 1.5, 0.3, jit(bark, 0.1, r));
      if (o.kind === 'deadtree') {
        for (let i = 0; i < 4; i++) B.c(x + (r.next() - 0.5) * 0.4, 1.2 + i * 0.2, z, 0.08, 0.7, 0.08, 0x4a3e34, r.next() * 3, 0, 0.6 * (i % 2 ? 1 : -1));
        break;
      }
      // A round crown of a few lumps, the biggest low, a lighter one up on the sunny side.
      B.lump(x, 1.85, z, R * 2.6, R * 2.1, R * 2.4, jit(LEAF[0], 0.08, r), r.next() * 3);
      B.lump(x + (r.next() - 0.5) * R, 1.75 + r.next() * 0.2, z + R * 0.5, R * 1.7, R * 1.4, R * 1.5, jit(LEAF[2], 0.08, r), r.next() * 3);
      B.lump(x - R * 0.35, 2.25, z + R * 0.2, R * 1.5, R * 1.2, R * 1.4, jit(LEAF[1], 0.08, r), r.next() * 3);
      break;
    }
    case 'pine':
      B.b(x, 0, z, 0.24, 0.8, 0.24, bark);
      // Three tiers, each a cone overlapping the one under it (the flat sprite's stacked triangles).
      for (let i = 0; i < 3; i++) B.cone(x, 1.25 + i * 0.62, z, R * (2.5 - i * 0.62), 1.1 - i * 0.12, jit(PINE[i], 0.06, r), r.next() * 2);
      break;
    case 'well':
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        B.b(x + Math.cos(a) * R * 0.8, 0, z + Math.sin(a) * R * 0.8, 0.36, 0.6, 0.36, jit(stone, 0.12, r), -a);
      }
      B.b(x, 0.02, z, R, 0.04, R, 0x08080c);
      for (const s of [-1, 1]) B.b(x + s * R * 0.85, 0.6, z, 0.1, 1.0, 0.1, wood);
      B.b(x, 1.55, z, R * 2, 0.1, 0.1, wood);
      B.c(x, 1.75, z, R * 2.2, 0.08, R * 1.2, 0x4a2e22, 0, 0.3);
      // The rope down from the beam (the sprite's), a bucket on it hauled up to the lip.
      B.b(x, 0.98, z, 0.03, 0.58, 0.03, 0x8a8494);
      B.b(x, 0.78, z, 0.2, 0.2, 0.2, 0x4a3420), B.b(x, 0.86, z, 0.22, 0.03, 0.22, 0x2a2630);
      break;
    case 'support':
      B.b(x, 0, z, 0.2, 2.1, 0.2, wood);
      B.b(x, 2.0, z, 1.2, 0.18, 0.22, wood);
      break;
    case 'pillar':
      B.b(x, 0, z, R * 1.4, 0.2, R * 1.4, stone);
      B.b(x, 0.2, z, R * 1.1, 2.2, R * 1.1, jit(0x5e5868, 0.06, r));
      break;
    case 'stump':
      B.b(x, 0, z, R * 1.2, 0.35, R * 1.2, bark);
      B.b(x, 0.35, z, R * 1.0, 0.02, R * 1.0, 0x8a6a3a);
      break;
    case 'post':
      B.b(x, 0, z, 0.14, 1.4, 0.14, wood);
      fires.push([x, 1.45, z, 0.6]);
      break;
    case 'lantern':
      // The Last Lantern (sprites.ts): an iron post on a foot, a brass housing with a cap, the flame inside.
      B.b(x, 0, z, 0.4, 0.1, 0.4, 0x2a2630);
      B.b(x, 0, z, 0.13, 1.95, 0.13, 0x3a3036);
      B.b(x, 1.95, z, 0.4, 0.05, 0.4, 0x5a4a2a);
      for (const [dx, dz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) B.b(x + dx, 2.0, z + dz, 0.05, 0.38, 0.05, 0x5a4a2a);
      B.b(x, 2.38, z, 0.46, 0.06, 0.46, 0x7a6a3a), B.b(x, 2.44, z, 0.2, 0.08, 0.2, 0x5a4a2a);
      fires.push([x, 2.03, z, 0.6]);
      break;
    case 'cookfire':
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        B.b(x + Math.cos(a) * 0.35, 0, z + Math.sin(a) * 0.35, 0.16, 0.12, 0.16, jit(stone, 0.15, r));
      }
      fires.push([x, 0.05, z, 0.8]);
      break;
    case 'reed':
      for (let i = 0; i < 7; i++) B.b(x + (r.next() - 0.5) * R * 1.6, 0, z + (r.next() - 0.5) * R, 0.04, 0.5 + r.next() * 0.5, 0.04, jit(0x5a6a3a, 0.15, r));
      break;
    case 'washline':
      for (const s of [-1, 1]) B.b(x + s * R, 0, z, 0.08, 1.3, 0.08, wood);
      B.b(x, 1.25, z, R * 2, 0.02, 0.02, 0xc8c0b0);
      for (let i = 0; i < 3; i++) B.b(x - R * 0.6 + i * R * 0.6, 0.8, z, 0.32, 0.42, 0.03, [0x8a6a5a, 0x6a7a8a, 0xb8b0a0][i]);
      break;
    case 'scarecrow':
      B.b(x, 0, z, 0.08, 1.6, 0.08, wood);
      B.b(x, 1.2, z, 0.9, 0.08, 0.08, wood);
      B.b(x, 0.9, z, 0.36, 0.45, 0.22, 0x6a5a3a);
      B.b(x, 1.4, z, 0.24, 0.24, 0.24, 0xb89a5a);
      break;
    case 'peat':
      B.b(x, 0, z, R * 1.6, 0.35, R * 1.6, jit(0x3a2a1e, 0.1, r));
      B.b(x, 0.35, z, R * 1.1, 0.25, R * 1.1, jit(0x34261c, 0.1, r));
      break;
    case 'shrine':
      // A wayside shrine (sitedraw.ts): a box on a post under a red roof, a candle stub in the dark of it.
      B.b(x, 0, z, 0.12, 0.9, 0.12, 0x4a3420);
      B.b(x, 0.9, z, 0.5, 0.42, 0.34, 0x3a2a1a), B.b(x, 0.95, z + 0.12, 0.34, 0.3, 0.12, 0x14100c);
      B.b(x, 1.0, z + 0.1, 0.08, 0.13, 0.08, 0xd8d0bc), B.b(x, 0.9, z, 0.6, 0.05, 0.4, 0x5a3d22);
      B.c(x, 1.38, z, 0.7, 0.07, 0.48, 0x6a2a1a, 0, 0.3);
      fires.push([x, 1.14, z + 0.1, 0.12]);
      break;
    case 'fountain':
      // A stone basin gone green, the water in it, a spout in the middle (sitedraw.ts).
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        B.b(x + Math.cos(a) * R * 1.1, 0, z + Math.sin(a) * R * 0.75, 0.42, 0.34, 0.3, jit(0x57525e, 0.1, r), -a);
      }
      B.b(x, 0, z, R * 2, 0.27, R * 1.3, 0x2e4a4a), B.b(x, 0.27, z, R * 1.3, 0.01, R * 0.8, 0x3e5a5e);
      B.b(x, 0, z, 0.2, 0.85, 0.2, 0x6a6470), B.b(x, 0.8, z, 0.45, 0.07, 0.12, 0x6a6470);
      break;
    case 'cross':
    case 'statue':
      B.b(x, 0, z, R * 1.6, 0.25, R * 1.6, stone);
      B.b(x, 0.25, z, 0.3, 1.3, 0.3, jit(0x6a6470, 0.08, r));
      if (o.kind === 'cross') B.b(x, 1.2, z, 0.8, 0.14, 0.14, 0x6a6470);
      break;
    case 'target':
      B.b(x, 0, z, 0.1, 0.9, 0.1, wood);
      B.c(x, 1.0, z, 0.6, 0.6, 0.08, 0xd8d0bc);
      B.c(x, 1.0, z + 0.03, 0.3, 0.3, 0.08, 0xa02820);
      break;
    case 'grate':
      for (let i = -2; i <= 2; i++) B.b(x + i * R * 0.35, 0.0, z, 0.05, 0.03, R * 1.6, 0x2a2733);
      break;
    case 'candles':
      // An iron stand, three candles of three heights, each with its own small flame (hallsdraw.ts).
      B.b(x, 0, z, 0.3, 0.04, 0.3, 0x2a2630), B.b(x, 0, z, 0.05, 0.75, 0.05, 0x2a2630), B.b(x, 0.72, z, 0.6, 0.05, 0.06, 0x2a2630);
      for (const [dx, h] of [[-0.25, 0.31], [0, 0.44], [0.25, 0.25]]) {
        B.b(x + dx, 0.77, z, 0.06, h, 0.06, 0xe8e0c8);
        fires.push([x + dx, 0.79 + h, z, 0.22]);
      }
      break;
    case 'witchfire':
      // An iron bowl on three legs; its fire, the wrong colours, is witch3d.ts.
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.5;
        B.c(x + Math.cos(a) * 0.2, 0.22, z + Math.sin(a) * 0.2, 0.05, 0.46, 0.05, 0x2a2630, -a, 0, 0.18);
      }
      B.b(x, 0.4, z, 0.62, 0.16, 0.5, 0x2a2630), B.b(x, 0.56, z, 0.54, 0.02, 0.42, 0x3a3046);
      break;
    case 'hangtree':
    case 'headstone':
    case 'apple':
      // Layout 4's pieces: the boxes the flat view paints (../pieces.ts).
      putBoxes(B, roundBoxes(o), x, z);
      break;
    default:
      // Paint only (crows, moths, a dog, smoke): nothing to stand up.
      break;
  }
}
