/**
 * Dark and gold, the flat view's buildings (docs/design/dark-gold.md, slice 1): what the reference dungeon has
 * that a plain wall doesn't. Moss on the roofs and in the lowest joints, rubble heaped at the wall's foot,
 * columns either side of a stone building's door, and its step broken. Painted after the grade (darkgold.ts)
 * in the final colours, onto the block's cached canvas (blocks.ts), so it costs nothing per frame.
 * three/darkdress3d.ts is the same for 2.5D.
 */
import type { Block } from '../shared/arena';
import { MOSS } from './darkgold';

type Rect = (x: number, y: number, w: number, h: number, c: string) => void;

/** Roofed buildings (the rest are furniture, fences, stalls). */
export const ROOFED = new Set<Block['kind']>(['house', 'barn', 'hall', 'church', 'forge', 'tavern', 'granary', 'tower', 'shack', 'den']);
/** Stone buildings get columns at the door and a broken stone step. */
export const COLUMNED = new Set<Block['kind']>(['church', 'hall', 'tower']);
/** Green-grey stone for rubble and columns: dark, mid, light, the shadow under them. */
export const STONE = ['#4e5744', '#6a735c', '#868f73', '#20251b'];

export function dressFlat(rect: Rect, b: Block, w: number, roofH: number, tall: number): void {
  const walled = b.kind === 'wall' || b.kind === 'rockwall';
  if (!ROOFED.has(b.kind) && !walled) return;
  let seed = Math.round(b.x * 53 + b.y * 29 + 11);
  const rnd = (n: number) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), seed % Math.max(1, n));
  const foot = roofH + tall, door = doorSpan(b, w);
  // Moss on the roof, thickest along the eave, in small clumps.
  if (ROOFED.has(b.kind)) for (let i = 0; i < (w * roofH) / 70; i++) {
    const x = rnd(w - 3), y = rnd(3) ? roofH - 2 - rnd(Math.max(1, Math.round(roofH * 0.45))) : rnd(roofH - 2);
    rect(x, y, 2 + rnd(3), 1, MOSS[1 + rnd(3)]);
    if (rnd(2)) rect(x + 1, y + 1, 1 + rnd(2), 1, MOSS[0]);
  }
  // Moss in the lowest joints of the wall, where the wet sits.
  for (let i = 0; i < w / 4; i++) {
    const x = rnd(w - 2), y = foot - 2 - rnd(Math.min(10, tall - 2));
    if (door && x > door[0] - 1 && x < door[1] + 1) continue;
    rect(x, y, 1 + rnd(3), 1, MOSS[rnd(3)]);
  }
  // Rubble heaped at the wall's foot: at both corners and once more along it, never in the doorway.
  const heaps = [1 + rnd(4), w - 9 - rnd(4), 8 + rnd(Math.max(1, w - 24))];
  for (const hx of heaps) {
    if (door && hx + 8 > door[0] - 2 && hx < door[1] + 2) continue;
    heap(rect, hx, foot, 5 + rnd(4), rnd);
  }
  if (!COLUMNED.has(b.kind) || !door) return;
  // Columns either side of the door, and the step before it cracked, a corner fallen away.
  const ch = Math.min(tall - 3, door[2] + 8);
  for (const cx of [door[0] - 7, door[1] + 2]) column(rect, cx, foot, ch);
  const sx = door[0] - 3, sw = door[1] - door[0] + 6;
  rect(sx, foot - 3, sw, 3, STONE[1]);
  rect(sx, foot - 3, sw, 1, STONE[2]);
  rect(sx + sw - 4, foot - 3, 4, 2, STONE[3]);
  rect(sx + 3 + rnd(Math.max(1, sw - 8)), foot - 2, 1, 2, STONE[3]);
}

/** The door's left and right x on the canvas and its height, as blocks.ts paints it; null if it has none. */
function doorSpan(b: Block, w: number): [number, number, number] | null {
  if (!b.door && b.kind !== 'den' && b.kind !== 'granary') return null;
  const dw = b.kind === 'barn' ? 24 : b.kind === 'den' ? 14 : 12, x = Math.round(w / 2 - dw / 2);
  return [x, x + dw, b.kind === 'barn' ? 36 : 28];
}

/** A heap of fallen stones against the wall, its foot at `foot`. */
function heap(rect: Rect, x: number, foot: number, n: number, rnd: (n: number) => number): void {
  for (let i = 0; i < n; i++) {
    const sw = 2 + rnd(3), sh = 1 + rnd(2), sx = x + rnd(8), sy = foot - sh - rnd(i < 3 ? 1 : 3);
    rect(sx, sy, sw, sh, STONE[rnd(3)]);
    rect(sx, sy, sw, 1, STONE[2]);
    rect(sx, sy + sh, sw, 1, STONE[3]);
  }
}

/** A square column: a plinth, the shaft lit on its left, a capital. */
function column(rect: Rect, x: number, foot: number, h: number): void {
  rect(x - 1, foot - 3, 7, 3, STONE[1]);
  rect(x, foot - h, 5, h - 3, STONE[1]);
  rect(x, foot - h, 1, h - 3, STONE[2]);
  rect(x + 4, foot - h, 1, h - 3, STONE[3]);
  rect(x - 1, foot - h - 2, 7, 2, STONE[2]);
  rect(x - 1, foot - h, 7, 1, STONE[3]);
  rect(x + 1, foot - h - 3, 1, 1, MOSS[2]);
}
