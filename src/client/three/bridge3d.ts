/**
 * A broken bridge in 3D, over its painting on the floor (client/bridgepaint.ts): the deck's two ends
 * standing a little proud of the water on their beams, posts at the corners (tall at the banks, broken
 * short at the snapped ends), a rope hanging off the far end into the gap and a beam slanting down
 * into the river off the near one. Paint only; the water decides who crosses (shared/river.ts).
 */
import type { Mark } from '../../shared/arena';
import type { Boxes } from './boxes';

const DECK = 0x5e4228, BEAM = 0x3e2a18, ROPE = 0x9a8a62;

export function addBridge(B: Boxes, k: Mark): void {
  const len = k.h * 0.36, cx = k.x + k.w / 2;
  for (const [z0, dir] of [[k.y, 1], [k.y + k.h, -1]] as const) {
    const zc = z0 + (dir * len) / 2;
    B.b(cx, 0.02, zc, k.w - 0.3, 0.08, len, DECK);
    for (const sx of [k.x + 0.12, k.x + k.w - 0.12]) {
      B.b(sx, 0, zc, 0.16, 0.16, len + 0.12, BEAM);
      B.b(sx, 0, z0 + dir * 0.1, 0.16, 0.8, 0.16, BEAM);
      B.b(sx, 0, z0 + dir * (len - 0.1), 0.16, 0.38, 0.16, BEAM);
    }
  }
  // The rope off the far end, down into the gap; a beam slanting into the water off the near end.
  B.c(k.x + k.w - 0.5, -0.05, k.y + len + 0.3, 0.04, 0.04, 0.7, ROPE, 0, 0.9);
  B.c(cx - 0.4, -0.08, k.y + k.h - len - 0.35, 0.16, 0.16, 1.1, BEAM, 0.3, -0.35);
}
