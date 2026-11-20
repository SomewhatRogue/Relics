/**
 * A stone floor laid tile by tile (the tile look, tilelook.ts TILES): every 16 pixel tile is its own piece of work,
 * four cobbles, two half slabs or one whole slab, so the grid reads under everything. Each stone is lit from the
 * upper left (a lighter top edge and left edge) and sits in dark mortar. No flecks. Moss lies in
 * the joints in short runs. A street is mostly small cobbles, so the ground ticks past under a walking hero. Everything vertical is two pixels at a time, so a 2.5D camera looking down at 30 degrees
 * (half the rows) keeps every edge, and at 36 loses none of them.
 * The greys are neutral; the grade (darkgold.ts) turns them to the slate shades, one shade each.
 */
import type { Rng } from '../shared/rng';
import { MOSS } from './darkgold';

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;

/**
 * Mortar, then two stone shades and the lit edge a shade above each: four slate shades once graded (darkgold.ts),
 * kept to the bottom of the ladder so the ground stays the quietest thing on screen.
 */
const MORTAR = '#141414', STONE = ['#2c2c2c', '#3c3c3c'], LIGHT = ['#3c3c3c', '#4f4f4f'];

function stone(rect: Rect, x: number, y: number, w: number, h: number, i: number): void {
  rect(x, y, w, h, STONE[i]);
  rect(x, y, w - 1, 2, LIGHT[i]);
  rect(x, y, 1, h, LIGHT[i]);
  if (i) rect(x + w - 1, y + 2, 1, h - 2, STONE[0]);
}

/** Lay the floor of `fw` by `fh` pixels at (ox, oy); `slabs` for a flagstone floor (more whole slabs). */
export function tileFloor(rect: Rect, rng: Rng, ox: number, oy: number, fw: number, fh: number, slabs: boolean): void {
  rect(ox, oy, fw, fh, MORTAR);
  for (let ty = 0; ty < fh; ty += 16) for (let tx = 0; tx < fw; tx += 16) {
    const x = ox + tx, y = oy + ty, v = rng.next(), lit = () => (rng.next() < 0.55 ? 0 : 1);
    if (v < (slabs ? 0.45 : 0.08)) stone(rect, x, y, 15, 14, lit());
    else if (v < (slabs ? 0.85 : 0.28)) stone(rect, x, y, 15, 6, lit()), stone(rect, x, y + 8, 15, 6, lit());
    else for (let j = 0; j < 16; j += 8) for (let i = 0; i < 16; i += 8) stone(rect, x + i, y + j, 7, 6, lit());
    // Damp: now and then a tile's stones a shade darker, in the mortar's grime.
    if (rng.next() < 0.08) rect(x + 1, y + 2, 13, 2, STONE[0]);
    // Moss in a joint, a short run along the bottom mortar.
    if (rng.next() < 0.14) rect(x + rng.int(10), y + 14, 3 + rng.int(4), 2, MOSS[rng.int(3)]);
  }
}
