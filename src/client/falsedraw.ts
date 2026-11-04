/**
 * A false prisoner (sim/falsecage.ts), drawn in the flat view and on its 2.5D card: it stands up where
 * the cage was like anyone freed, says nothing, and lurches, twitching harder and faster; near the end
 * it splits down the middle and something's eyes shine out of it. Then it tears open (gore.ts torn) and
 * the room has two goblins where it stood. No words: never the captives' lines, never "help me".
 * Drawing only.
 */
import type { Survivor } from '../sim/types';
import { FALSE_CAGE } from '../shared/tuning';
import { blit, shadow, type Ctx } from './draw';
import { SPRITES } from './sprites';

/** How far along its lurch (0 just stood up, 1 tearing open). */
export const lurchOf = (s: Survivor, now: number) => Math.min(1, Math.max(0, 1 - ((s.tearAt ?? now) - now) / FALSE_CAGE.lurch));

/** One at (x, y) on screen; `now` is the room's time. */
export function drawFalse(c: Ctx, s: Survivor, x: number, y: number, now: number): void {
  const k = lurchOf(s, now), beat = Math.floor(now * (6 + k * 16));
  // Held still, then a violent twitch, more often as it goes; at the end it shudders without stopping.
  const jerk = beat % 3 === 0 ? (beat % 2 ? 1 : -1) * (1 + Math.round(k * 2)) : 0, shudder = k > 0.6 ? Math.sin(now * 55) * 0.08 * k : 0;
  shadow(c, x, y + 2, 3);
  for (const g of [c.lit, c.glow]) g.save(), g.translate(Math.round(x + jerk), Math.round(y + 2)), g.rotate(jerk * 0.09 + shudder);
  blit(c, SPRITES.survivor, 0, k > 0.4 && beat % 2 ? -1 : 0, s.fx < 0, 0, 1 + k * 0.15);
  for (const g of [c.lit, c.glow]) g.restore();
  const cx = Math.round(x + jerk);
  if (k > 0.5) (c.lit.fillStyle = '#5a0c0c'), c.lit.fillRect(cx, Math.round(y - 8), 1, Math.round(2 + 6 * k));
  if (k > 0.75) (c.glow.fillStyle = '#ff4a3a'), c.glow.fillRect(cx - 1, Math.round(y - 6), 1, 1), c.glow.fillRect(cx + 1, Math.round(y - 6), 1, 1);
}
