/**
 * Standing water beside a track (layout 3): the fen's pools, a carr's wet ground, the bog on both sides
 * of a causeway. Laid on a fine grid, kept `near` off every line of the room's spine, in runs merged
 * into boxes (the room's water is boxes: deep stops a body, shallow slows it). `density` 1 floods
 * everything off the track; less, only inside a few round patches, so it lies in pools.
 */
import type { Water } from './arena.js';
import type { Rng } from './rng.js';
import { offAll, type Pt } from './spine.js';

export function wetBeside(lines: Pt[][], w: number, h: number, near: number, rng: Rng, deepFrac: number, density = 1): Water[] {
  const blobs = density >= 1 ? null : Array.from({ length: Math.round(9 * density) + 2 }, () => ({ x: rng.range(1, w - 1), y: rng.range(2, h - 3), r: rng.range(1.3, 2.8) }));
  const edge = density >= 1 ? 0 : 0.8, out: Water[] = [];
  for (let y = 1 + edge; y < h - 1.2 - edge; y += 1) {
    let start = -1;
    for (let x = edge; x <= w - edge; x += 0.5) {
      const cx = x + 0.25, cy = y + 0.5;
      const wet = x < w - edge - 0.01 && offAll(lines, cx, cy) > near && (!blobs || blobs.some((b) => Math.hypot(b.x - cx, (b.y - cy) * 1.4) < b.r));
      if (wet && start < 0) start = x;
      if (!wet && start >= 0) {
        if (x - start >= 1) out.push({ x: start, y, w: x - start, h: 1, ...(rng.next() < deepFrac ? { deep: true } : {}) });
        start = -1;
      }
    }
  }
  // Rows of a pool share their depth with the row above where they overlap (a pool is one depth).
  for (let i = 1; i < out.length; i++) {
    const a = out[i], b = out.find((q) => q.y === a.y - 1 && q.x < a.x + a.w && q.x + q.w > a.x);
    if (b) b.deep ? (a.deep = true) : delete a.deep;
  }
  return out;
}
