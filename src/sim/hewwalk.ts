/**
 * Hew on his feet (Kyle, 2026-11-05: "Hew walks through trees"). He used to slide in a straight line to
 * wherever he was going, through trunks, kilns and the rest. Now he goes the way a goblin does
 * (sim/pathing.ts: straight when the line is clear, round by the flow field when it isn't) and is
 * stopped by the same things the hero is (collide). Every walk of his, waking, lesson to lesson and
 * round the hut, goes through here.
 */
import { collide, type Npc } from '../shared/arena';
import { wayTo } from './pathing';

/** His body for the trees: a little under a hero's. */
export const HEW_R = 0.3;

/** A step of Hew's walk toward (tx, ty) at `speed` tiles a second. The distance left after it. */
export function walkHew(n: Npc, tx: number, ty: number, speed: number, dt: number, stop = 0.05): number {
  const left = Math.hypot(tx - n.x, ty - n.y);
  if (left <= stop || dt <= 0) return left;
  const to = wayTo({ x: n.x, y: n.y, radius: HEW_R }, tx, ty), dx = to.x - n.x, dy = to.y - n.y, d = Math.hypot(dx, dy);
  if (d < 1e-6) return left;
  const s = Math.min(d, speed * dt);
  n.x += (dx / d) * s;
  n.y += (dy / d) * s;
  collide(n, HEW_R);
  return Math.hypot(tx - n.x, ty - n.y);
}
