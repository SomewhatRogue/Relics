/**
 * Dark and gold in 2.5D, what the reference dungeon has round its walls (docs/design/dark-gold.md, slice 1):
 * rubble heaped at a building's corners and along its foot, and at a stone building's door two columns and a
 * broken step. Boxes into the building's own merged mesh (houses3d.ts), seeded by the block so every screen
 * draws the same; cosmetic, never collided. ../darkdress.ts is the flat view's.
 */
import type { Block } from '../../shared/arena';
import { COLUMNED } from '../darkdress';
import { Boxes, Seed, jit } from './boxes';

const STONE = [0x3c4236, 0x4a5242, 0x5c6450];

/** The building's walls run x0..x1 by z0..z1, H high; `door` its x (or null), dw half its width, dh its height. */
export function dress3d(W: Boxes, b: Block, x0: number, x1: number, z0: number, z1: number, H: number, door: number | null, dw: number, dh: number): void {
  const r = new Seed(Math.round(b.x * 53 + b.y * 29 + 11));
  const clear = (x: number) => door === null || Math.abs(x - door) > dw + 0.45;
  // Heaps at the four corners, and one along the front and one along a side.
  const spots: [number, number][] = [[x0 - 0.05, z1 + 0.12], [x1 + 0.05, z1 + 0.12], [x0 - 0.12, z0 + 0.2], [x1 + 0.12, z0 + 0.2]];
  spots.push([x0 + 0.6 + r.next() * (x1 - x0 - 1.2), z1 + 0.14], [r.next() < 0.5 ? x0 - 0.14 : x1 + 0.14, z0 + 0.5 + r.next() * Math.max(0.1, z1 - z0 - 1)]);
  for (const [hx, hz] of spots) if (clear(hx)) heap(W, hx, hz, 3 + Math.floor(r.next() * 4), r);
  if (!COLUMNED.has(b.kind) || door === null) return;
  // Columns either side of the door: a plinth, a square shaft, a capital.
  const ch = Math.min(H - 0.25, dh + 0.45);
  for (const s of [-1, 1]) {
    const cx = door + s * (dw + 0.36), cz = z1 + 0.2;
    W.b(cx, 0, cz, 0.46, 0.2, 0.46, STONE[1]);
    W.b(cx, 0.2, cz, 0.3, ch - 0.38, 0.3, jit(STONE[1], 0.06, r));
    W.b(cx, ch - 0.18, cz, 0.48, 0.18, 0.48, STONE[2]);
  }
  // The step before the door, a corner broken off and lying beside it.
  const sw = dw * 2 + 0.7, side = r.next() < 0.5 ? -1 : 1, bit = 0.32;
  W.b(door - (side * bit) / 2, 0, z1 + 0.42, sw - bit, 0.12, 0.34, jit(STONE[1], 0.05, r));
  W.b(door + side * (sw / 2 - bit / 2 - 0.02), 0, z1 + 0.38, bit - 0.06, 0.07, 0.24, STONE[0]);
  W.c(door + side * (sw / 2 + 0.22), 0.06, z1 + 0.55, 0.24, 0.1, 0.16, STONE[2], 0.7, 0.3);
}

/** A heap of fallen stones round (x, z), the biggest at the bottom. */
function heap(W: Boxes, x: number, z: number, n: number, r: Seed): void {
  for (let i = 0; i < n; i++) {
    const s = 0.26 - i * 0.03 + r.next() * 0.08, a = r.next() * 6.28, d = 0.08 + r.next() * 0.22;
    const y = s * 0.35 + (i > 2 ? 0.1 : 0);
    W.c(x + Math.cos(a) * d, y, z + Math.sin(a) * d * 0.7, s, s * 0.7, s * 0.85, jit(STONE[Math.floor(r.next() * 3)], 0.08, r), r.next() * 3, (r.next() - 0.5) * 0.5, (r.next() - 0.5) * 0.5);
  }
}
