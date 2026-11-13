/**
 * Where a hurled cart will roll (sim/haulcarts.ts): straight on from (x, y) along (dx, dy) until
 * something stops it (a wall, a block, the edge), or HAULIER.cart.most tiles. One source: the room rolls it
 * and stops it there, and the screen draws the lane out to the same spot (sim/haulier.ts). Pure.
 */
import { collide } from '../shared/arena';
import { HAULIER as H } from '../shared/tuning';

export function cartPath(x: number, y: number, dx: number, dy: number, r: number): { x: number; y: number; len: number } {
  const l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, step = 0.2;
  let px = x, py = y, len = 0;
  while (len < H.cart.most) {
    const q = { x: px + ux * step, y: py + uy * step };
    collide(q, r);
    if (Math.hypot(q.x - (px + ux * step), q.y - (py + uy * step)) > 0.02) break;
    (px = q.x), (py = q.y), (len += step);
  }
  return { x: px, y: py, len };
}
