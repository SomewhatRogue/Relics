/**
 * A lightning strike's one shape (sim/storm.ts decides them): the circle the room judges and the
 * telegraph both views draw are the same (x, y, r) and the same LIGHTNING.warn, so the red you see is the
 * red that hurts. Also how bright the whole screen goes as one lands. Pure.
 */
import { HERO, LIGHTNING } from '../shared/tuning';
import type { EnemyAttack, Strike } from './types';

/** Whether a body standing at (x, y), `rad` round, is caught: its edge inside the circle. */
export const inStrike = (s: Strike, b: { x: number; y: number }, rad = HERO.radius) => Math.hypot(b.x - s.x, b.y - s.y) <= s.r + rad;

/** The strike as a round, striped (can't be blocked) telegraph, while it's coming; null once it's down. */
export function strikeShape(s: Strike, t: number): EnemyAttack | null {
  const lead = s.at - t;
  if (lead <= 0 || lead > LIGHTNING.warn) return null;
  return {
    kind: 'slam', t: LIGHTNING.warn - lead, windup: LIGHTNING.warn, active: 0.05, recover: 0, dmg: LIGHTNING.heroDmg, knock: LIGHTNING.knock, unblockable: true,
    dx: 0, dy: 1, ox: s.x, oy: s.y, range: s.r, arc: 360, cx: s.x, cy: s.y, radius: s.r, done: false,
  };
}

/**
 * How bright the flash is now (0 to 1): full as it lands, a flicker after, gone by LIGHTNING.flash; the
 * brightest of any strike just down.
 */
export function flashOf(strikes: Strike[] | undefined, t: number): number {
  let k = 0;
  for (const s of strikes ?? []) {
    const a = t - s.at;
    if (a < 0 || a > LIGHTNING.flash) continue;
    const q = a / LIGHTNING.flash, v = q < 0.3 ? 1 : q < 0.5 ? 0.35 : q < 0.65 ? 0.8 : (1 - q) * 1.4;
    k = Math.max(k, v);
  }
  return k;
}
