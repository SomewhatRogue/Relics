/**
 * A boss's leap coming down (the Haulier's LEAP, a Doorkeeper's VAULT: docs/design/boss-threat.md step 3): as
 * its wind-up ends it's moved to the middle of its circle, where the blow lands as any round one does. The
 * screen draws the flight from the same clock (client/hauldraw.ts, doordraw.ts). Called once a tick.
 */
import { TICK } from '../shared/tuning';
import type { Enemy, FightEvent } from './types';

export function leapLand(e: Enemy, move: string, ev: FightEvent[]): void {
  const a = e.attack;
  if (!a || (a.boss as string | undefined) !== move || a.t + TICK * 1.5 < a.windup) return;
  if (Math.hypot(e.x - a.cx, e.y - a.cy) < 0.05) return;
  Object.assign(e, { x: a.cx, y: a.cy, kvx: 0, kvy: 0 });
  ev.push({ k: 'haulleap', x: e.x, y: e.y });
}

/** How far into its flight a leaping boss is (0..1), or -1 when it isn't in the air (`air`: the last seconds of the wind-up). */
export function leapFlight(e: Enemy, move: string, air: number): number {
  const a = e.attack;
  if (!a || (a.boss as string | undefined) !== move) return -1;
  const from = a.windup - air;
  return a.t < from || a.t >= a.windup ? -1 : (a.t - from) / air;
}
