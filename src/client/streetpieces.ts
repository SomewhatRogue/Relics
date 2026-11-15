/**
 * A lived-in town's street things as boxes (pieces.ts's way: the flat view paints the list, the 2.5D view builds
 * it): barrels in a huddle, a stack of crates, sacks, a handcart, a woodpile with its cut ends out, the smith's
 * anvil on its stump with the quench tub, a washtub with its board and basket, a clothesline hung with washing, a
 * chopping block, a hen coop, pots of flowers. (x, z) from the round's foot, in tiles. Paint only.
 */
import type { Round } from '../shared/arena';
import { CRATES_UP } from '../shared/townlife';
import type { Bx } from './pieces';

export const STREET_KINDS = new Set<Round['kind']>(['barrels', 'crates', 'sacks', 'handcart', 'woodpile', 'anvil', 'washtub', 'clothesline', 'chopblock', 'coop', 'pots']);

const OAK = 0x6b4a2b, OAK_D = 0x4a3420, HOOP = 0x3a3640, IRON = 0x4a4852, SACK = 0x8a7a5a, SACK_D = 0x6e6046, BARK = 0x4a3a2a, PALE = 0x9a7a4a;
const WATER = 0x2a3a4a, THATCH = 0x7a6a3a, CLAY = 0x8a4a32, LEAF = 0x3a5a2a;
const CLOTH = [0x8a8070, 0x6a5a48, 0x7a6a8a, 0x9a8a6a, 0x5a6a7a, 0x8a5a4a];

/** One barrel: staves, two iron hoops, a dark lid. */
function barrel(out: Bx[], x: number, z: number, s = 1): void {
  out.push([x, 0, z, 0.48 * s, 0.68 * s, 0.46 * s, OAK]);
  for (const y of [0.12, 0.5]) out.push([x, y * s, z, 0.5 * s, 0.05, 0.48 * s, HOOP]);
  out.push([x, 0.68 * s, z, 0.4 * s, 0.02, 0.38 * s, OAK_D]);
}

/** One crate: the box, a darker band round it, its lid's edge. */
function crate(out: Bx[], x: number, y: number, z: number, w: number, h: number, d: number): void {
  out.push([x, y, z, w, h, d, 0x7a5a32], [x, y + h * 0.42, z, w + 0.02, 0.06, d + 0.02, 0x4e3820], [x, y + h - 0.03, z, w, 0.03, d, 0x8a6a3e]);
  out.push([x - w * 0.36, y, z, 0.05, h, d + 0.02, 0x4e3820], [x + w * 0.36, y, z, 0.05, h, d + 0.02, 0x4e3820]);
}

/** A sack: its belly, the slumped top, the tied neck. */
const sack = (out: Bx[], x: number, y: number, z: number, s = 1) =>
  out.push([x, y, z, 0.4 * s, 0.26 * s, 0.32 * s, SACK], [x, y + 0.26 * s, z, 0.32 * s, 0.07 * s, 0.26 * s, SACK_D], [x, y + 0.33 * s, z, 0.1 * s, 0.07 * s, 0.08 * s, SACK_D]);

export function streetBoxes(o: Pick<Round, 'kind' | 'x' | 'y'>, r: () => number): Bx[] {
  const out: Bx[] = [];
  switch (o.kind) {
    case 'barrels':
      barrel(out, -0.28, -0.12), barrel(out, 0.26, -0.18, 0.95), barrel(out, 0.02, 0.24, 0.9);
      break;
    case 'crates':
      // Two crates and a third on top (the cat sits up there: CRATES_UP).
      crate(out, -0.12, 0, 0, 0.56, 0.5, 0.52), crate(out, 0.42, 0, 0.08, 0.42, 0.4, 0.42), crate(out, -0.08, 0.5, -0.02, 0.48, CRATES_UP - 0.5, 0.46);
      break;
    case 'sacks':
      sack(out, -0.22, 0, -0.05), sack(out, 0.2, 0, -0.1, 0.95), sack(out, 0, 0, 0.2, 0.9), sack(out, -0.02, 0.28, 0, 0.85);
      break;
    case 'handcart':
      // The bed on two wheels, its sides, the handles out to the east, a load of sacks.
      out.push([0, 0.32, 0, 1.1, 0.1, 0.7, OAK], [0, 0.42, -0.33, 1.1, 0.18, 0.05, OAK_D], [0, 0.42, 0.33, 1.1, 0.18, 0.05, OAK_D], [-0.53, 0.42, 0, 0.05, 0.18, 0.7, OAK_D]);
      for (const z of [-0.4, 0.4]) out.push([0, 0, z, 0.52, 0.52, 0.06, 0x3a2a1a], [0, 0.2, z, 0.12, 0.12, 0.07, IRON]);
      for (const z of [-0.24, 0.24]) out.push([0.85, 0.36, z, 0.6, 0.05, 0.05, OAK_D]);
      out.push([0.66, 0, 0, 0.05, 0.34, 0.05, OAK_D]);
      sack(out, -0.22, 0.42, -0.08, 0.8), sack(out, 0.2, 0.42, 0.06, 0.8);
      break;
    case 'woodpile':
      // Split logs stacked in rows along the wall, their pale cut ends toward you.
      for (let row = 0; row < 3; row++) for (let i = 0; i < 5 - row; i++) {
        const x = -0.44 + row * 0.11 + i * 0.22 + (r() - 0.5) * 0.03, y = row * 0.19;
        out.push([x, y, 0, 0.2, 0.19, 0.62, r() < 0.5 ? BARK : 0x3e3022], [x, y + 0.02, 0.31, 0.16, 0.15, 0.02, r() < 0.5 ? PALE : 0x8a6a40]);
      }
      break;
    case 'anvil':
      // The anvil on its stump, horn to the west; the quench tub beside it, a pair of tongs across it.
      out.push([0, 0, 0, 0.42, 0.36, 0.4, BARK], [0, 0.36, 0, 0.26, 0.08, 0.2, IRON], [0, 0.44, 0, 0.48, 0.12, 0.22, 0x5a5862], [-0.31, 0.47, 0, 0.16, 0.07, 0.1, 0x5a5862]);
      out.push([0.55, 0, 0.12, 0.38, 0.3, 0.36, OAK], [0.55, 0.12, 0.12, 0.4, 0.04, 0.38, HOOP], [0.55, 0.29, 0.12, 0.32, 0.01, 0.3, WATER], [0.55, 0.31, 0.12, 0.42, 0.02, 0.03, IRON]);
      break;
    case 'washtub':
      // The tub of grey water, the board leaning in it, a basket of washing beside.
      out.push([0, 0, 0, 0.62, 0.28, 0.5, OAK], [0, 0.1, 0, 0.64, 0.04, 0.52, HOOP], [0, 0.27, 0, 0.54, 0.01, 0.42, 0x5a6670], [0.12, 0.2, 0.05, 0.22, 0.36, 0.03, PALE]);
      out.push([-0.58, 0, 0.08, 0.42, 0.22, 0.36, 0x8a7448], [-0.58, 0.18, 0.08, 0.34, 0.1, 0.28, CLOTH[0], 'lump'], [-0.5, 0.24, 0.06, 0.16, 0.06, 0.14, CLOTH[2]]);
      break;
    case 'clothesline': {
      // Two posts 2.4 apart, the line between, washing pegged out along it.
      out.push([0, 0, 0, 0.1, 1.6, 0.1, OAK_D], [2.4, 0, 0, 0.1, 1.6, 0.1, OAK_D], [1.2, 1.5, 0, 2.4, 0.02, 0.02, 0x8a7a5a]);
      for (let x = 0.3; x < 2.2; x += 0.42 + r() * 0.1) {
        const tall = 0.3 + r() * 0.3, w = 0.22 + r() * 0.16, sag = Math.sin((x / 2.4) * Math.PI) * 0.08;
        out.push([x, 1.5 - sag - tall, 0, w, tall, 0.03, CLOTH[Math.floor(r() * CLOTH.length)]]);
      }
      break;
    }
    case 'chopblock':
      // A wide stump, its top pale and hacked, split pieces about it.
      out.push([0, 0, 0, 0.5, 0.34, 0.48, BARK], [0, 0.34, 0, 0.44, 0.01, 0.42, PALE]);
      for (let i = 0; i < 4; i++) out.push([(r() - 0.5) * 0.9, 0, 0.2 + r() * 0.3, 0.1, 0.08, 0.22, i % 2 ? PALE : 0x8a6a40]);
      break;
    case 'coop':
      // A little house on legs, a thatched roof, the hatch and its ramp, straw at the foot.
      for (const [x, z] of [[-0.36, -0.26], [0.36, -0.26], [-0.36, 0.26], [0.36, 0.26]]) out.push([x, 0, z, 0.07, 0.2, 0.07, OAK_D]);
      out.push([0, 0, 0, 1.1, 0.02, 0.9, 0x9a8448], [0, 0.2, 0, 0.84, 0.44, 0.6, OAK], [0, 0.2, 0.3, 0.86, 0.05, 0.02, OAK_D], [0, 0.3, 0.31, 0.22, 0.24, 0.02, 0x1e1610]);
      out.push([0, 0.64, 0, 1.02, 0.1, 0.78, THATCH], [0, 0.74, 0, 0.84, 0.1, 0.58, 0x6a5a30], [0, 0.84, 0, 0.6, 0.06, 0.3, THATCH], [0, 0, 0.5, 0.22, 0.2, 0.4, OAK_D]);
      break;
    case 'pots':
      // Two clay pots and a little one, green spilling over, a few flowers.
      for (const [x, z, s] of [[-0.14, 0, 1], [0.16, 0.04, 0.85], [0.02, 0.2, 0.7]] as const) {
        out.push([x, 0, z, 0.22 * s, 0.2 * s, 0.22 * s, CLAY], [x, 0.2 * s, z, 0.28 * s, 0.18 * s, 0.26 * s, LEAF, 'lump']);
        out.push([x + 0.05, 0.3 * s, z + 0.05, 0.05, 0.05, 0.05, r() < 0.5 ? 0xb84a3a : 0xc8a848]);
      }
      break;
  }
  return out;
}
