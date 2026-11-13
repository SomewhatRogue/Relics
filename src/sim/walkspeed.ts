/**
 * How fast a hero walks, one rule for the room and for a friend's own screen (client/ownwalk.ts walks
 * your hero the moment you press with the same numbers, so it never runs ahead of where the leader's
 * room will put it and gets pulled back). Everything that changes a walk is here: the kit and gear,
 * creeping (a stick pushed less than STEALTH.slow), a block held (the kit's blockSpeed), the shallows
 * (wading), Wall Brandy, the bell's QUICK, and what the act allows (a charge, a wand's cast walk).
 * An oil slick works on the stick before it gets here (sim/oil.ts slipIntent), the same on both sides.
 */
import { wadeAt } from '../shared/arena';
import { HERO, STEALTH, WEAPONS, guardOf } from '../shared/tuning';
import { brandySpeed } from './brandy';
import { quickMult } from './charge';
import { statsOf } from './gearstats';
import type { Hero, Intent } from './types';

/** The guard is up this tick: block held, breath left, not winded, and a kit that holds a block. */
export const guardUp = (h: Hero, inp: Intent) => inp.block && h.stamina > 0 && !h.winded && guardOf(WEAPONS[h.weapon]) === 'full';

/**
 * Tiles a second on this stick, `k` the act's own pace (1 walking; the kit's blockSpeed with the guard
 * up; chargeSpeed drawing; a wand's castWalk). Nothing under a twentieth of a push.
 */
export function walkSpeed(h: Hero, inp: Intent, now: number, k = 1): number {
  const m = Math.min(1, Math.hypot(inp.mx, inp.my));
  if (m < 0.05) return 0;
  return HERO.speed * WEAPONS[h.weapon].speed * statsOf(h).speed * k * (m >= STEALTH.slow ? 1 : STEALTH.creep) * wadeAt(h.x, h.y) * brandySpeed(h, now) * quickMult(h, now);
}

/** The walking pace of what the hero is doing now (`null`: this act doesn't walk on the stick). */
export function actPace(h: Hero, inp: Intent): number | null {
  const w = WEAPONS[h.weapon];
  if (h.carrying || h.lifting) return null;
  if (h.act === 'idle') return guardUp(h, inp) ? w.blockSpeed : 1;
  if (h.act === 'charge') return w.chargeSpeed;
  if (h.act === 'attack' && !h.heavy && w.castWalk) return w.castWalk;
  return null;
}
