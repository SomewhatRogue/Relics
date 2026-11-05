/**
 * A palisade back wall in 2.5D, as the flat view paints its face (world.ts `back`): logs rammed in side
 * by side, one every 6 pixels (3/8 of a tile), each a little taller or shorter than the next, in the
 * same three browns with a dark seam down one side, sharpened at the top. Stood up as logs rather than
 * a painting on a plane; a dark backing behind them so the seams never show through.
 */
import { Seed, jit, type Boxes } from './boxes';

const LOGS = [0x4a3424, 0x523a28, 0x44301f], SEAM = 0x2e2016, TIP = 0x3a2a1c, BACK = 0x120f14;
/** One log every this far (tiles), this thick. */
const STEP = 0.375, THICK = 0.33;

/** Logs along the back wall from x = a to b, `h` tall; their faces stand at z = 0. */
export function palisadeRun(B: Boxes, a: number, b: number, h: number, r: Seed): void {
  const len = b - a;
  if (len < 0.05) return;
  B.b((a + b) / 2, 0, -0.75, len, h - 0.2, 0.8, BACK);
  const n = Math.max(1, Math.round(len / STEP)), step = len / n;
  for (let i = 0; i < n; i++) {
    const x = a + (i + 0.5) * step, tall = h - 0.1 + r.next() * 0.3, col = jit(LOGS[Math.floor(r.next() * 3)], 0.06, r), z = -THICK / 2 + (r.next() - 0.5) * 0.04;
    B.b(x, 0, z, step - 0.04, tall, THICK, col);
    B.b(x + step / 2 - 0.05, 0, z + 0.02, 0.05, tall, THICK - 0.02, SEAM);
    // Sharpened: a point on top, darker where it was cut.
    B.cone(x, tall + 0.14, z, step * 0.98, 0.28, TIP, r.next() * 2);
  }
}
