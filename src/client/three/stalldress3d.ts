/**
 * The market's named stalls told apart at a glance (Kyle, 2026-11-17: "kind of hard to tell and see them"): each its
 * own awning, and its wares hung from the awning's front lip, where they show under it from the square. The tailor's:
 * four cloaks, each with its hem. The pawnbroker's: a lantern, a pot, a shield and a sword. walls3d.ts builds the
 * stall and asks here; the flat view's is ../stalldress.ts. Drawing only: nothing here is walked into.
 */
import type { Block } from '../../shared/arena';
import { STALL_STRIPES } from '../stalldress';
import type { Boxes } from './boxes';
import { hex } from './mats';

/** A named stall's awning, dark stripe then light, or null for the market's usual red and cream. */
export function stallStripes3d(b: Block): [number, number] | null {
  const s = b.label ? STALL_STRIPES[b.label] : undefined;
  return s ? [hex(s[0]), hex(s[1])] : null;
}

const WOOD = 0x2a2018;

/** The wares along the front: `dk` darkens them with the stall (a ruin, a fire). */
export function stallDress3d(B: Boxes, b: Block, dk: (c: number) => number): void {
  const x0 = b.x, x1 = b.x + b.w, z = b.y + b.h + 0.32;
  const cord = (x: number, y: number) => B.b(x, y, z, 0.03, 1 - y, 0.03, dk(WOOD));
  if (b.label === 'TAILOR') {
    const cloak = (x: number, col: number, hem: number) => {
      cord(x, 0.95);
      B.b(x, 0.33, z, 0.44, 0.62, 0.05, dk(col));
      B.b(x, 0.33, z + 0.02, 0.44, 0.06, 0.05, dk(hem));
    };
    cloak(x0 + 0.34, 0x7a1a1c, 0xc8962e);
    cloak(x0 + 0.86, 0x22462a, 0xc8ced4);
    cloak(x1 - 0.86, 0x8a6a26, 0x4a3812);
    cloak(x1 - 0.34, 0x1e3460, 0xc8ced4);
  } else if (b.label === 'PAWN') {
    // A lantern with its pane, a pot with its rim, a shield with its boss, a sword by its hilt.
    cord(x0 + 0.32, 0.88);
    B.b(x0 + 0.32, 0.62, z, 0.2, 0.26, 0.2, dk(0xb8923a));
    B.b(x0 + 0.32, 0.66, z + 0.02, 0.1, 0.16, 0.2, dk(0xf0d890));
    cord(x0 + 0.84, 0.8);
    B.b(x0 + 0.84, 0.5, z, 0.3, 0.26, 0.26, dk(0x34343a));
    B.b(x0 + 0.84, 0.75, z, 0.36, 0.05, 0.3, dk(0x5a5a62));
    cord(x1 - 0.84, 0.92);
    B.b(x1 - 0.84, 0.44, z, 0.42, 0.48, 0.05, dk(0x641618));
    B.b(x1 - 0.84, 0.61, z + 0.02, 0.12, 0.14, 0.05, dk(0xc8962e));
    B.b(x1 - 0.32, 0.3, z, 0.06, 0.6, 0.04, dk(0xa8b0b8));
    B.b(x1 - 0.32, 0.86, z, 0.22, 0.05, 0.05, dk(0x6a4a2a));
    B.b(x1 - 0.32, 0.9, z, 0.05, 0.1, 0.04, dk(0x6a4a2a));
  }
}
