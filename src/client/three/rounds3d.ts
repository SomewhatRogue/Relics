/**
 * The map's round things (trees, rocks, hay, a well, mine supports, posts with a flame, cookfires,
 * a washing line, a shrine...) built into the map's one merged mesh. Fires are returned as spots for
 * fire3d.ts and their light; the paint-only ones (crows, moths, a dog, smoke) are left to the floor.
 */
import type { Round } from '../../shared/arena';
import { Boxes, Seed, jit } from './boxes';

export type Spot = [number, number, number, number];

// The flat view's tree and pine colours (sprites.ts), so a wood is the same green in both.
const LEAF = [0x2f4a28, 0x3a5a30, 0x24391f], PINE = [0x1c3522, 0x24412a, 0x1f3a26];

export function addRound(B: Boxes, o: Round, fires: Spot[], r: Seed): void {
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
    case 'rock':
    case 'stone':
      for (let i = 0; i < (o.kind === 'rock' ? 3 : 1); i++) {
        const s = R * (1.3 - i * 0.3);
        B.c(x + (r.next() - 0.5) * R * 0.6, s * 0.35, z + (r.next() - 0.5) * R * 0.6, s, s * 0.7, s, jit(0x4a4652, 0.15, r), r.next() * 2, (r.next() - 0.5) * 0.4);
      }
      break;
    case 'hay':
      B.b(x, 0, z, R * 1.8, 0.6, R * 1.4, jit(0x9a8a4a, 0.1, r));
      B.b(x, 0.6, z, R * 1.4, 0.3, R * 1.1, jit(0xa8985a, 0.1, r));
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
    case 'lantern':
      B.b(x, 0, z, 0.14, o.kind === 'lantern' ? 2.0 : 1.4, 0.14, wood);
      fires.push([x, o.kind === 'lantern' ? 2.05 : 1.45, z, 0.6]);
      break;
    case 'cookfire':
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        B.b(x + Math.cos(a) * 0.35, 0, z + Math.sin(a) * 0.35, 0.16, 0.12, 0.16, jit(stone, 0.15, r));
      }
      fires.push([x, 0.05, z, 0.8]);
      break;
    case 'bush':
      for (let i = 0; i < 3; i++) B.c(x + (r.next() - 0.5) * R, 0.25 + i * 0.12, z + (r.next() - 0.5) * R * 0.6, R * 1.1, 0.45, R * 0.9, jit(LEAF[i % 3], 0.12, r), r.next());
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
    case 'clamp':
    case 'peat':
      B.b(x, 0, z, R * 1.6, 0.35, R * 1.6, jit(o.kind === 'clamp' ? 0x26201c : 0x3a2a1e, 0.1, r));
      B.b(x, 0.35, z, R * 1.1, 0.25, R * 1.1, jit(o.kind === 'clamp' ? 0x1e1a18 : 0x34261c, 0.1, r));
      break;
    case 'shrine':
    case 'cross':
    case 'statue':
    case 'fountain':
      B.b(x, 0, z, R * 1.6, 0.25, R * 1.6, stone);
      B.b(x, 0.25, z, 0.3, o.kind === 'fountain' ? 0.7 : 1.3, 0.3, jit(0x6a6470, 0.08, r));
      if (o.kind === 'cross') B.b(x, 1.2, z, 0.8, 0.14, 0.14, 0x6a6470);
      if (o.kind === 'shrine') B.c(x, 1.62, z, 0.7, 0.08, 0.5, 0x3a3a4a, 0, 0.3);
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
    case 'witchfire':
      B.b(x, 0, z, 0.3, 0.7, 0.3, 0x3a3640);
      fires.push([x, 0.72, z, 0.5]);
      break;
    default:
      // Paint only (crows, moths, a dog, smoke): nothing to stand up.
      break;
  }
}
