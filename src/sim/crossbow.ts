/**
 * The crossbow in the room (numbers: shared/ranger.ts XBOW). A tap of ATTACK is the short sword. A hold
 * of ATTACK with a bolt on it brings the crossbow up to aim, and letting go looses it. It reloads by
 * itself whenever the hero isn't attacking (Kyle, 2026-11-04: the RELOAD button was a pain): `reload`
 * seconds of winding, walking or not. Wound without moving at all, the bolt glints: the next shot is the
 * perfect one. ATTACK held on an empty crossbow looses nothing; the room says it's still winding.
 * It all lives on the hero, so a guest sees the same load the leader's room decided.
 */
import { WEAPONS, XBOW } from '../shared/tuning';
import type { FightEvent, Hero } from './types';

/** An ATTACK hold begins: always the aim now (an empty crossbow never gets here: emptyHold). */
export function beginHold(h: Hero): void {
  h.winding = false;
}

/** ATTACK held long enough to be a hold, on an empty crossbow: no wind, the press spent, and the cue
 *  (once a second). True if that's what it was. */
export function emptyHold(h: Hero, now: number, ev: FightEvent[]): boolean {
  if (!WEAPONS[h.weapon].reloads || !h.xbowEmpty) return false;
  h.attackQueuedAt = -9;
  if (now - h.toldAt > 1) (h.toldAt = now), ev.push({ k: 'reloadcue', x: h.x, y: h.y, id: h.id });
  return true;
}

/** Idle or walking with an empty crossbow, a tick: it winds itself. Moving spoils the glint. */
export function autoWind(h: Hero, moving: boolean, dt: number, ev: FightEvent[]): void {
  if (!WEAPONS[h.weapon].reloads || !h.xbowEmpty) return;
  if ((h.xbowWind ?? 0) === 0) ev.push({ k: 'wind', x: h.x, y: h.y });
  if (moving) h.xbowClean = false;
  h.xbowWind = Math.min(1, (h.xbowWind ?? 0) + dt / XBOW.reload);
  if (h.xbowWind < 1 - 1e-9) return;
  Object.assign(h, { xbowEmpty: false, xbowWind: 0, xbowGlint: !!h.xbowClean, xbowClean: false });
  ev.push({ k: h.xbowGlint ? 'glint' : 'loaded', x: h.x, y: h.y });
}

/** The old held-RELOAD winding is gone; nothing has the hero for it any more. */
export function stepWind(h: Hero): boolean {
  if (h.winding) h.winding = false;
  return false;
}

/** Let go while aiming: the glint (not the flash) is what makes it perfect, and the bolt is gone. */
export function looseBolt(h: Hero): void {
  if (!WEAPONS[h.weapon].reloads) return;
  Object.assign(h, { perfect: !!h.xbowGlint, power: 1, xbowEmpty: true, xbowGlint: false, xbowClean: true, xbowWind: 0 });
}
