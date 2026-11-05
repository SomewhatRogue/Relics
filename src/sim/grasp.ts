/**
 * GRASP, the Mage's class skill (a placeholder name until the lore pass; numbers: shared/magic.ts GRASP):
 * every goblin in a cone in front is dragged toward a spot just ahead of the Mage and staggers, bunched
 * up for a fire pit or a fireball. A butcher or a shield-bearer barely moves. It costs magic: short
 * of it, the press fizzles and nothing is spent. Judged in the room; the drag is the room's own tow
 * (sim/cleric.ts stepTows), swept so no goblin is pulled through a wall.
 */
import { GRASP } from '../shared/tuning';
import { inArc } from './combat';
import { isDead, isDummy } from './damage';
import type { World } from './elements';
import { stun } from './stuns';
import type { Enemy, FightEvent, Hero } from './types';

/** How far of the way a goblin comes: all of it, or GRASP.heavy for a butcher or a shield-bearer. */
export const graspShare = (e: Enemy) => (e.kind === 'butcher' || e.variant === 'shield' ? GRASP.heavy : 1);

/** Pressed: false (a fizzle, the press spent) if the Mage can't pay for it. */
export function graspRefused(h: Hero, ev: FightEvent[]): boolean {
  if (h.relic !== 'grasp' || (!h.winded && h.stamina >= GRASP.cost)) return false;
  h.relicQueuedAt = -9;
  ev.push({ k: 'fizzle', x: h.x, y: h.y });
  return true;
}

/** Cast: paid for, and every goblin in the cone dragged toward the spot and staggered. */
export function grasp(h: Hero, w: World): void {
  Object.assign(h, { stamina: Math.max(0, h.stamina - GRASP.cost), staminaAt: w.now });
  w.ev.push({ k: 'magic', x: h.x, y: h.y, n: GRASP.cost });
  const cast = { k: 'grasp' as const, x: h.x, y: h.y, dx: h.fx, dy: h.fy, r: GRASP.range, arc: GRASP.arc, n: 0 };
  w.ev.push(cast);
  const tx = h.x + h.fx * GRASP.to, ty = h.y + h.fy * GRASP.to;
  for (const e of w.enemies) {
    if (isDead(e) || isDummy(e) || e.kind === 'nest' || e.act === 'carried' || e.act === 'pinned' || !isFinite(e.weight) || (e.z ?? 0) !== (h.z ?? 0)) continue;
    if (!inArc(h.x, h.y, h.fx, h.fy, e.x, e.y, GRASP.range, GRASP.arc, e.radius)) continue;
    const k = graspShare(e), dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
    // (Already at the spot, or nearer you than it: left where it is.)
    if (d > e.radius) {
      // Stopped a body short of the spot, so the bunch doesn't land on one point.
      const go = Math.max(0, d - e.radius) * k;
      e.tow = { x: e.x + (dx / d) * go, y: e.y + (dy / d) * go, until: w.now + go / GRASP.speed + 0.1, speed: GRASP.speed };
      w.ev.push({ k: 'grasped', x: e.x, y: e.y, x2: e.tow.x, y2: e.tow.y });
    }
    cast.n++;
    e.lastBy = h.id;
    e.alert = true;
    // (A big one mid a blow that can't be blocked keeps swinging; it's still dragged.)
    if (e.weight <= 1 || !e.attack?.unblockable) stun(e, h.id, w.now, GRASP.stagger, w.ev, 'flinch');
  }
}
