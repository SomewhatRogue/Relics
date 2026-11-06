/**
 * Your own hero's walk on a friend's screen, frame by frame, by the room's own rules: the oil's slip on
 * the stick (sim/oil.ts), the pace (sim/walkspeed.ts: creeping, a block held, the shallows, brandy, the
 * bell's QUICK, the act's own pace) and the swept move that stops at a gap too narrow (shared/sweep.ts).
 * The leader's room walks you the same way a trip later, so the two agree and nothing pulls you back.
 */
import { travel } from '../shared/sweep';
import { HERO } from '../shared/tuning';
import { slipIntent } from '../sim/oil';
import type { Hero, Intent } from '../sim/types';
import { walkSpeed } from '../sim/walkspeed';

/** Where your hero is drawn: a body with a footing (`z`: up on a ledge or not), so deep water and ledges stop it. */
export interface Body { x: number; y: number; z?: number }
/** The stick as the oil has it, kept here (the room keeps its own on the hero). */
export interface Slip { slick?: boolean; slipX?: number; slipY?: number }

/**
 * Walk `p` for `dt` seconds on this stick at the act's `pace` (sim/walkspeed.ts actPace; null: this act
 * doesn't walk); returns the move. `h` is the hero as drawn (its kit, its gear, what it's drunk).
 */
export function walkStep(h: Hero, p: Body, inp: Intent, slip: Slip, dt: number, now: number, pace: number | null): [number, number] {
  slip.slick = h.slick;
  // (The slip goes on whether or not the act walks, as the room's does every tick.)
  const i = slipIntent(slip, inp, dt);
  if (pace === null) return [0, 0];
  const x0 = p.x, y0 = p.y, l = Math.hypot(i.mx, i.my) || 1;
  // (The shallows are judged where you stand now.)
  const at = h.x, bt = h.y;
  (h.x = p.x), (h.y = p.y);
  const sp = walkSpeed(h, i, now, pace);
  (h.x = at), (h.y = bt);
  if (sp) {
    // (A body with a footing: deep water and ledges stop it, as they stop the hero in the room.)
    const b = { x: p.x, y: p.y, z: p.z ?? h.z ?? 0 };
    travel(b, (i.mx / l) * sp * dt, (i.my / l) * sp * dt, HERO.radius);
    (p.x = b.x), (p.y = b.y), (p.z = b.z);
  }
  return [p.x - x0, p.y - y0];
}
