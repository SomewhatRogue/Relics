/**
 * Moving a body a long way in one tick without passing through anything. `collide` pushes a body out
 * of whatever it overlaps by the nearest side, so a body moved further than its own radius in one go
 * can land past the middle of a fence, a tree or a river and be pushed out the far side. A blink is
 * over a tile a tick, a shadowstep three tiles at once. `travel` goes there in small steps, colliding
 * after each, so the body slides along what's in the way and stops at it, never through it.
 */
import { collide } from './arena.js';

/** Under the smallest body's radius (a hero's is 0.32): a step can never reach past anything's middle. */
export const SWEEP_STEP = 0.2;

/** Move `p` by (dx, dy), stopping at and sliding along whatever is in the way. */
export function travel(p: { x: number; y: number }, dx: number, dy: number, r: number): void {
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / SWEEP_STEP));
  for (let i = 0; i < n; i++) {
    const x0 = p.x, y0 = p.y;
    p.x += dx / n;
    p.y += dy / n;
    collide(p, r);
    // Wedged into a gap narrower than the body (pushed out of one thing into another): back a step and stop.
    if (!settled(p, r)) return void ((p.x = x0), (p.y = y0));
  }
}

/** Where `collide` leaves a body be: it overlaps nothing it can't get out of. */
function settled(p: { x: number; y: number }, r: number): boolean {
  const q = { ...p };
  collide(q, r);
  return Math.hypot(q.x - p.x, q.y - p.y) < 1e-3;
}

/** Move `p` toward (x, y) the same way: it ends there if the way is clear, else where it was stopped. */
export const travelTo = (p: { x: number; y: number }, x: number, y: number, r: number) => travel(p, x - p.x, y - p.y, r);
