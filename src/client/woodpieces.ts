/**
 * Hangman's Wood's pieces as boxes (pieces.ts hands them here; the flat view paints them, the 2.5D view
 * builds the same): the Gospel Oak, huge and hollow, faded ribbons tied round it; the crossroads gibbet's
 * post, arm and winch (the cage that hangs from it moves, so it's drawn live: wooddraw.ts); a waymark stone
 * with its arrow cut. Paint only.
 */
import type { Block, Round } from '../shared/arena';
import type { Bx } from './pieces';

const BARK = 0x3e3226, DEEP = 0x2a2018, LEAF = 0x24391f, LEAF2 = 0x2f4a28, TIMBER = 0x4a3420, IRON = 0x55505e, ROPE = 0x8a7a5a;
const RIBBON = [0x8a5a5a, 0x6a7a8a, 0x8a845a];

export const WOOD_BLOCKS = new Set<Block['kind']>(['oak']);
export const WOOD_ROUNDS = new Set<Round['kind']>(['gibbet', 'waymark']);

/** The Gospel Oak, its footprint's top-left at the origin: a trunk wider than a cottage door, its hollow facing the path. */
export function oakBoxes(b: Pick<Block, 'w' | 'h' | 'ruined'>, r: () => number): Bx[] {
  const cx = b.w / 2, cz = b.h / 2, out: Bx[] = [];
  if (b.ruined) {
    // Burnt out: a black stump, split open, its roots.
    out.push([cx, 0, cz, 1.6, 1.1, 1.2, 0x1a1412], [cx - 0.5, 0, cz, 0.5, 1.5, 0.6, 0x141012], [cx + 0.6, 0, cz + 0.1, 0.4, 0.9, 0.5, 0x141012]);
    return out;
  }
  out.push([cx, 0, cz, 1.7, 3.3, 1.3, BARK], [cx - 0.95, 0, cz + 0.2, 0.7, 0.5, 0.9, DEEP, 'lump'], [cx + 0.95, 0, cz - 0.1, 0.7, 0.45, 0.8, DEEP, 'lump']);
  // The hollow: a dark split up the front of the trunk.
  out.push([cx, 0, b.h - 0.02 - 0.3, 0.62, 1.5, 0.08, 0x0d0b10]);
  // Limbs and the crown.
  out.push([cx - 1.2, 2.7, cz, 1.6, 0.26, 0.3, BARK], [cx + 1.3, 3.0, cz, 1.8, 0.24, 0.3, BARK]);
  out.push([cx, 3.2, cz, 4.2, 2.1, 3, LEAF, 'lump'], [cx - 1, 3.8, cz + 0.3, 2.6, 1.6, 2, LEAF2, 'lump'], [cx + 1.2, 3.6, cz - 0.2, 2.4, 1.5, 2, LEAF2, 'lump']);
  // Ribbons round the trunk, faded, from the last time the bounds were walked.
  for (let i = 0; i < 3; i++) out.push([cx, 1.1 + i * 0.28 + r() * 0.1, b.h - 0.32, 1.74, 0.06, 0.04, RIBBON[i]]);
  out.push([cx + 0.4, 0.5, b.h - 0.3, 0.06, 0.6, 0.04, RIBBON[0]], [cx - 0.5, 0.6, b.h - 0.3, 0.06, 0.5, 0.04, RIBBON[1]]);
  return out;
}

/** The gibbet's post at its foot, its arm out east over where the cage hangs, the winch drum at the post's foot. */
export function gibbetBoxes(): Bx[] {
  return [
    [0, 0, 0, 0.3, 3.4, 0.3, TIMBER], [0.75, 3.2, 0, 1.8, 0.22, 0.24, TIMBER], [0.4, 2.7, 0, 0.12, 0.7, 0.1, 0x3a2a1a],
    [1.2, 2.2, 0, 0.04, 1.0, 0.04, IRON], [1.55, 2.3, 0, 0.12, 0.12, 0.12, IRON],
    // The winch: a drum on two cheeks at the post's foot, its crank, the rope up the post.
    [-0.45, 0, 0.25, 0.08, 0.6, 0.3, TIMBER], [-0.05, 0, 0.25, 0.08, 0.6, 0.3, TIMBER], [-0.25, 0.42, 0.25, 0.4, 0.16, 0.16, 0x5a4a30], [-0.25, 0.45, 0.42, 0.06, 0.3, 0.06, IRON],
    [0.12, 0.5, 0.1, 0.03, 2.7, 0.03, ROPE],
    [0.2, 0, 0.1, 0.9, 0.1, 0.6, 0x3a3640, 'lump'],
  ];
}

/** A waymark: a squat stone with its arrow cut, moss at its foot. */
export function waymarkBoxes(): Bx[] {
  return [[0, 0, 0, 0.44, 0.7, 0.3, 0x6a6470], [0, 0.62, 0, 0.44, 0.16, 0.3, 0x6a6470, 'lump'], [0, 0.38, 0.16, 0.2, 0.05, 0.02, 0x3a3640], [0.08, 0.34, 0.16, 0.06, 0.12, 0.02, 0x3a3640], [0, 0, 0.14, 0.52, 0.05, 0.12, 0x3e4a36]];
}
