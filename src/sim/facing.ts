/**
 * Who a skill means: the goblin the hero faces (within `range`, nearest the line first), else the
 * nearest in reach; and a spot to throw at (the pointer on a laptop, else that goblin, else ahead).
 */
import { collide } from '../shared/arena';
import { isDead, isDummy } from './damage';
import type { Enemy, Hero, Intent } from './types';

/** The goblin the hero faces within `range` (a narrow cone first, then anything in reach). Dummies last. */
export function faced(h: Hero, enemies: Enemy[], range: number): Enemy | null {
  let best: Enemy | null = null, bd = Infinity;
  for (const e of enemies) {
    if (isDead(e) || e.act === 'carried' || (e.z ?? 0) !== (h.z ?? 0)) continue;
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy);
    if (d > range + e.radius) continue;
    const dot = (dx * h.fx + dy * h.fy) / (d || 1), score = d + (1 - dot) * 6 + (isDummy(e) ? 20 : 0);
    if (score < bd) (bd = score), (best = e);
  }
  return best;
}

/** Where to drop something at most `range` away: the pointer, the goblin faced, or `fallback` ahead. */
export function spotFor(h: Hero, enemies: Enemy[], aim: Intent | undefined, range: number, fallback: number): { x: number; y: number } {
  let t: { x: number; y: number };
  if (aim && (aim.ax || aim.ay)) {
    const d = Math.hypot(aim.ax, aim.ay), k = Math.min(1, range / (d || 1));
    t = { x: h.x + aim.ax * k, y: h.y + aim.ay * k };
  } else {
    const e = faced(h, enemies, range);
    t = e ? { x: e.x, y: e.y } : { x: h.x + h.fx * fallback, y: h.y + h.fy * fallback };
  }
  collide(t, 0.2);
  return t;
}
