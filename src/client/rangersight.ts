/**
 * A Ranger can see what they're shooting at (Kyle, 2026-11-27, a friend's word: "too dark for the ranger, can't
 * see what they're shooting"). A bow or crossbow drawn throws a soft, pale light out along the aim, further as
 * the draw fills, out toward the shot's reach, so the goblins out there show; and on a dark map a Ranger's
 * lantern reaches further than the others'. Lights in tiles; scene.ts and three/roomlights.ts draw them.
 */
import { WEAPONS } from '../shared/tuning';
import { chargeFull } from '../sim/hero';
import type { Hero } from '../sim/types';

export interface SightLight { x: number; y: number; r: number; i: number; c: [number, number, number] }

/** How much further a Ranger's lantern reaches on a dark map (its radius times this). */
export const RANGER_LAMP = 1.5;
const PALE: [number, number, number] = [0.85, 0.9, 1];

/** The light out along a drawn Ranger's aim, or null: `x`, `y` where the hero's drawn (tiles). */
export function rangerSight(h: Hero, x: number, y: number): SightLight | null {
  const w = WEAPONS[h.weapon];
  if (!w || w.cls !== 'RANGER' || h.act !== 'charge' || !w.heavy.shot) return null;
  const k = Math.min(1, Math.max(0, h.actT / Math.max(0.05, chargeFull(w, h)))), len = Math.hypot(h.fx, h.fy) || 1;
  // (From half way at the nock to most of the reach at full draw, never past 9 tiles: the screen's edge.)
  const d = Math.min(9, (w.heavy.range ?? 8) * (0.35 + 0.35 * k));
  return { x: x + (h.fx / len) * d, y: y + (h.fy / len) * d, r: 70 + 30 * k, i: 0.35 + 0.3 * k, c: PALE };
}
