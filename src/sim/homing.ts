/**
 * A goblin that gave up at a way station's edge (sim/landrules.ts) walks back to where it was put, calm, and looks at
 * nothing on the way. Plain data on the goblin (`homing`, and `giveT` as its walking clock), so a saved room keeps it.
 */
import { collide } from '../shared/arena';
import { LAND } from '../shared/tuning';
import type { Enemy } from './types';

/** Longest it walks before it just stops where it is and looks about again, s. */
const LONGEST = 10;

/** One tick of the walk home. True while it is still walking (its tick is taken); false once it is home or has walked long enough. */
export function stepHoming(e: Enemy, dt: number): boolean {
  if (!e.homing) return false;
  const dx = e.home.x - e.x, dy = e.home.y - e.y, d = Math.hypot(dx, dy);
  e.giveT = (e.giveT ?? 0) + dt;
  if (d < 0.3 || e.giveT > LONGEST) return (e.homing = false), (e.giveT = undefined), false;
  e.fx = dx / d;
  e.fy = dy / d;
  e.x += e.fx * LAND.homeSpeed * dt;
  e.y += e.fy * LAND.homeSpeed * dt;
  e.moving = true;
  collide(e, e.radius);
  return true;
}
