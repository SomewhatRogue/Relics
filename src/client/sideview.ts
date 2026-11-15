/**
 * When a hero is drawn in profile (docs/design/side-view.md): facing mostly east or west, for a look that
 * has a side map. A margin either way (in by `IN`, out only past `OUT`) so a hero walking on a diagonal
 * keeps one view instead of flickering between two. Drawing only: the room's facing is untouched.
 */
import type { Hero } from '../sim/types';

/** `front`: the lineup's old columns ask for the front view whatever the facing (lineup.ts). */
export const VIEW = { front: false };
/** How far |fx| must lead |fy| to turn to the side, and how far it may fall behind before turning back. */
const IN = 0.12, OUT = -0.12;
const was = new Map<string, boolean>();

export function sideOn(h: Hero, has: boolean): boolean {
  if (!has || VIEW.front) return false;
  const lead = Math.abs(h.fx) - Math.abs(h.fy), on = lead > (was.get(h.id) ? OUT : IN);
  was.set(h.id, on);
  return on;
}
