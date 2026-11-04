/**
 * The crossbow's hold, in the room (numbers: shared/ranger.ts XBOW). A tap is the short sword. A hold
 * with a bolt on it brings the crossbow up to aim, and letting go looses it. A hold with no bolt winds a
 * reload instead: the hero stands to it, and letting go or pushing the stick ends the piece with what's
 * wound kept, so a reload can be done in pieces between moving. Wound full in one go from nothing, the
 * bolt glints: the next shot is the perfect one. Letting go after a wind never looses (a fresh hold aims).
 * It all lives on the hero, so a guest sees the same load the leader's room decided.
 */
import { WEAPONS, XBOW } from '../shared/tuning';
import type { FightEvent, Hero, Intent } from './types';

/** A hold begins: aim if there's a bolt on it, wind if not (a wind from nothing may glint). */
export function beginHold(h: Hero): void {
  h.winding = !!WEAPONS[h.weapon].reloads && !!h.xbowEmpty;
  if (h.winding) h.xbowClean = !(h.xbowWind ?? 0);
}

/** A winding hold, a tick. True while it has the hero (so the aim and the release are skipped). */
export function stepWind(h: Hero, inp: Intent, dt: number, ev: FightEvent[]): boolean {
  if (!h.winding) return false;
  // Let go, or the stick pushed: the piece ends where it is.
  if (!inp.attack || Math.hypot(inp.mx, inp.my) >= 0.05) {
    if (h.xbowEmpty) h.xbowClean = false;
    return void Object.assign(h, { act: 'idle', actT: 0, winding: false }), true;
  }
  // Wound already and still held: nothing more until you let go.
  if (!h.xbowEmpty) return true;
  if (h.actT <= dt * 1.5) ev.push({ k: 'wind', x: h.x, y: h.y });
  h.xbowWind = Math.min(1, (h.xbowWind ?? 0) + dt / XBOW.reload);
  if (h.xbowWind < 1 - 1e-9) return true;
  Object.assign(h, { xbowEmpty: false, xbowWind: 0, xbowGlint: !!h.xbowClean, xbowClean: false });
  ev.push({ k: h.xbowGlint ? 'glint' : 'loaded', x: h.x, y: h.y });
  return true;
}

/** Let go while aiming: the glint (not the flash) is what makes it perfect, and the bolt is gone. */
export function looseBolt(h: Hero): void {
  if (!WEAPONS[h.weapon].reloads) return;
  Object.assign(h, { perfect: !!h.xbowGlint, power: 1, xbowEmpty: true, xbowGlint: false, xbowClean: false, xbowWind: 0 });
}
