/**
 * The market's named stalls told apart at a glance (Kyle, 2026-11-17: "kind of hard to tell and see them"), in the
 * flat view: each its own awning, and a ware hung either side of its name on the front. The tailor's: two cloaks with
 * their hems. The pawnbroker's: a lantern and a shield. blocks.ts paints the stall and asks here; the 2.5D view's is
 * three/stalldress3d.ts, with more hung along its longer front. Drawing only.
 */
import type { Block } from '../shared/arena';

/** A named stall's awning: its dark stripe, then its light one. The others keep the market's red and cream. */
export const STALL_STRIPES: Record<string, [string, string]> = { TAILOR: ['#1a2c50', '#9a8c6a'], PAWN: ['#221e1c', '#8a6a26'] };

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;

/** Over a stall already painted `w` wide: its roof is the top `roofH` rows, its front starts at `wallY`. */
export function dressStall(rect: Rect, b: Block, w: number, roofH: number, wallY: number): void {
  const s = b.label ? STALL_STRIPES[b.label] : undefined;
  if (!s) return;
  for (let x = 0; x < w; x += 6) rect(x, 0, Math.min(3, w - x), roofH, s[1]), x + 3 < w && rect(x + 3, 0, Math.min(3, w - x - 3), roofH, s[0]);
  if (b.label === 'TAILOR') {
    for (const [x, col, hem] of [[2, '#7a1a1c', '#c8962e'], [w - 7, '#1e3460', '#c8ced4']] as const) rect(x + 2, wallY, 1, 1, '#2a2018'), rect(x, wallY + 1, 5, 7, col), rect(x, wallY + 8, 5, 1, hem);
  } else {
    rect(4, wallY, 1, 2, '#2a2018'), rect(3, wallY + 2, 3, 5, '#b8923a'), rect(4, wallY + 3, 1, 3, '#f0d890');
    rect(w - 5, wallY, 1, 1, '#2a2018'), rect(w - 7, wallY + 1, 5, 6, '#641618'), rect(w - 5, wallY + 3, 1, 2, '#c8962e');
  }
}
