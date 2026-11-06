/**
 * Rods (numbers: shared/worldfx.ts ROD; Kyle, 2026-11-05): an ironhide wears iron, and iron draws
 * lightning. A storm strike (the wand's hold, sim/skystrike.ts, or the sky's own, sim/storm.ts) that would
 * fall within ROD.reach of one falls on it instead, and the storm stream taking a new goblin takes an
 * ironhide near that one (sim/stream.ts). Lightning into it, or a jolt through the water it stands in
 * (sim/pools.ts, sim/elements.ts), breaks its guard (sim/ironhide.ts crack). Both views draw the bolt bending
 * into it from the `rodhit` event, and crackling on it from `rodAt`.
 */
import { ROD } from '../shared/tuning';
import { isDead } from './damage';
import { crack } from './ironhide';
import type { Enemy, FightEvent } from './types';

/** Iron that can draw lightning: an ironhide on its feet, on the ground, not carried or under. */
export const isRod = (e: Enemy) => e.variant === 'ironhide' && !isDead(e) && !e.under && !e.dozing && (e.z ?? 0) === 0 && e.act !== 'carried';

/** The rod nearest (x, y) within `reach` (the edge of its body), if any. */
export function rodNear(enemies: Enemy[], x: number, y: number, reach = ROD.reach, ok: (e: Enemy) => boolean = () => true): Enemy | undefined {
  let best: Enemy | undefined, bd = Infinity;
  for (const e of enemies) {
    if (!isRod(e) || !ok(e)) continue;
    const d = Math.hypot(e.x - x, e.y - y) - e.radius;
    if (d <= reach && d < bd) (bd = d), (best = e);
  }
  return best;
}

/** Lightning has gone into it (drawn from (x, y)): its guard breaks and it crackles. */
export function rodHit(e: Enemy, x: number, y: number, now: number, ev: FightEvent[]): void {
  if (isDead(e)) return;
  crack(e, now, ev);
  e.rodAt = now;
  ev.push({ k: 'rodhit', x, y, x2: e.x, y2: e.y });
}

/** Storm jolted it (a jump, a pool): its guard breaks, crackling, no bolt drawn. */
export function jolt(e: Enemy, now: number, ev: FightEvent[]): void {
  if (e.variant !== 'ironhide' || isDead(e)) return;
  crack(e, now, ev);
  e.rodAt = now;
}
