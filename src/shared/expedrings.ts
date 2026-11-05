/**
 * The rings you stand in on an expedition, one size for what's drawn (client/expeddraw.ts, the map
 * screen) and what's judged (sim/exped.ts): the barrow shrine's hold, the beacon's, and the small ones
 * at a cookpot or a wayside shrine. Numbers in shared/tuning.ts EXPED.
 */
import type { GoalKind, SideKind } from './expedcamps.js';
import { EXPED } from './tuning.js';

/** The ring's radius for a job, or for the beacon. */
export function ringOf(kind: GoalKind | SideKind | 'beacon'): number {
  return kind === 'shrine' ? EXPED.holdR : kind === 'beacon' ? EXPED.extractR : EXPED.standR;
}

/** A hold with its grace: `away` is the seconds since anyone was in the ring (undefined: nobody yet). */
export interface Held { away?: number }

/**
 * One tick of a hold ring: whether it counts this tick. Someone in it: yes, and the grace is full again.
 * Nobody: yes for EXPED.grace seconds after the last one stepped out, then no; and never before anyone
 * has stood in it.
 */
export function holding(h: Held, inside: boolean, dt: number): boolean {
  if (inside) return (h.away = 0), true;
  if (h.away === undefined) return false;
  h.away += dt;
  return h.away <= EXPED.grace;
}
