/**
 * The crossbow in the room (numbers: shared/ranger.ts XBOW). A tap of ATTACK is the short sword. A hold
 * of ATTACK with a bolt on it brings the crossbow up to aim, and letting go looses it. Reloading is its
 * own button (Kyle, 2026-11-04): RELOAD held winds, the hero standing to it; letting go or pushing the
 * stick ends the piece with what's wound kept, so a reload can be done in pieces between moving. Wound
 * full in one go from nothing, the bolt glints: the next shot is the perfect one. ATTACK held on an empty
 * crossbow winds nothing: the room says so (`reloadcue`) and the RELOAD button is shown pulsing.
 * It all lives on the hero, so a guest sees the same load the leader's room decided.
 */
import { WEAPONS, XBOW } from '../shared/tuning';
import type { FightEvent, Hero, Intent } from './types';

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

/** Read the RELOAD press counter (every tick, so a press is never saved up). True on a fresh press. */
export function reloadPressed(h: Hero, inp: Intent): boolean {
  const seq = inp.reloadSeq ?? h.seen.reload ?? 0, fresh = seq !== (h.seen.reload ?? 0);
  h.seen.reload = seq;
  return fresh;
}

/** Free and standing still, RELOAD held (or just tapped), the crossbow empty: a piece of winding starts. */
export function startWind(h: Hero, inp: Intent, pressed: boolean): boolean {
  if (!WEAPONS[h.weapon].reloads || !h.xbowEmpty || !(inp.reload || pressed) || Math.hypot(inp.mx, inp.my) >= 0.05) return false;
  Object.assign(h, { act: 'charge', actT: 0, heavy: false, winding: true, xbowClean: !(h.xbowWind ?? 0), attackQueuedAt: -9 });
  return true;
}

/** A winding hold, a tick. True while it has the hero (so the aim and the release are skipped). */
export function stepWind(h: Hero, inp: Intent, dt: number, ev: FightEvent[]): boolean {
  if (!h.winding) return false;
  // RELOAD let go, or the stick pushed: the piece ends where it is.
  if (!inp.reload || Math.hypot(inp.mx, inp.my) >= 0.05) {
    if (h.xbowEmpty) h.xbowClean = false;
    return void Object.assign(h, { act: 'idle', actT: 0, winding: false }), true;
  }
  if (h.actT <= dt * 1.5) ev.push({ k: 'wind', x: h.x, y: h.y });
  h.xbowWind = Math.min(1, (h.xbowWind ?? 0) + dt / XBOW.reload);
  if (h.xbowWind < 1 - 1e-9) return true;
  // Wound: a bolt on, and the hero's free again (holding RELOAD on now does nothing).
  Object.assign(h, { xbowEmpty: false, xbowWind: 0, xbowGlint: !!h.xbowClean, xbowClean: false, act: 'idle', actT: 0, winding: false });
  ev.push({ k: h.xbowGlint ? 'glint' : 'loaded', x: h.x, y: h.y });
  return true;
}

/** Let go while aiming: the glint (not the flash) is what makes it perfect, and the bolt is gone. */
export function looseBolt(h: Hero): void {
  if (!WEAPONS[h.weapon].reloads) return;
  Object.assign(h, { perfect: !!h.xbowGlint, power: 1, xbowEmpty: true, xbowGlint: false, xbowClean: false, xbowWind: 0 });
}
