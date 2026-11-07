/**
 * A Doorkeeper's door (numbers shared/bosstune.ts DOORKEEPERS). Shut, it covers its front: a blade or a
 * shot coming at it from within DOORKEEPERS.cone of its facing is stopped dead (sparks, a thunk). From the
 * side or behind it lands in full. The door is swung aside while one of its big blows lands and for
 * DOORKEEPERS.aside of its recover (a jab goes round the door's edge: it stays shut), while it's stunned,
 * staggered or rebounding, for a moment after a lock, and while it's DOWN. Bursts and fire
 * go round a door; storm too. A shot stopped by a shut door cuts at its straps (a charged or perfect shot
 * twice): DOORKEEPERS.straps cuts and the door is DOWN for DOORKEEPERS.down seconds. While a boss roars
 * (a phase change) nothing lands on it at all.
 */
import { DOORKEEPERS } from '../shared/tuning';
import { isDead } from './damage';
import type { Bolt, Enemy, FightEvent } from './types';

/** Its door is up and covering its front. */
export function doorShut(e: Enemy, now: number): boolean {
  const b = e.boss;
  if (!b || b.who === 'hempen' || isDead(e) || b.downUntil > now || b.openUntil > now || e.act === 'stunned' || e.act === 'flinch') return false;
  const a = e.attack;
  if (!a || a.t < a.windup) return true;
  const aside = a.boss && a.boss in DOORKEEPERS.aside ? DOORKEEPERS.aside[a.boss as keyof typeof DOORKEEPERS.aside] : a.recover;
  return aside <= 0 || a.t >= a.windup + a.active + Math.min(a.recover, aside);
}

/** Something travelling (dx, dy) comes at its front. */
export function atFront(e: Enemy, dx: number, dy: number): boolean {
  const l = Math.hypot(dx, dy);
  return l > 0 && (e.fx * -dx + e.fy * -dy) / l > DOORKEEPERS.cone;
}

/** What of `n` gets through, for something travelling (dx, dy) (0, 0: from no way, round the door). */
export function doorTake(e: Enemy, n: number, dx: number, dy: number, now: number): number {
  const b = e.boss;
  if (!b) return n;
  if (b.roarUntil > now) return 0;
  return doorShut(e, now) && atFront(e, dx, dy) ? 0 : n;
}

/** A shot meeting a shut door: it cuts at a strap, and enough cuts bring the door DOWN. */
export function shotAtDoor(e: Enemy, s: Pick<Bolt, 'dx' | 'dy' | 'el' | 'charged' | 'perfect'>, now: number, ev: FightEvent[]): void {
  const b = e.boss;
  if (!b || s.el === 'storm' || !doorShut(e, now) || !atFront(e, s.dx, s.dy)) return;
  b.straps += s.charged || s.perfect ? 2 : 1;
  if (b.straps < DOORKEEPERS.straps) return;
  b.straps = 0;
  b.downUntil = now + DOORKEEPERS.down;
  ev.push({ k: 'doordown', x: e.x, y: e.y });
}
