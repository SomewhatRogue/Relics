/**
 * RAISE, shown (sim/raise.ts decides it): a friend who is out with a Cleric kneeling by them has a column
 * of gold light standing up out of them, motes climbing it, and a ring at their feet filling as the raise
 * goes on (worked out from when it began, `riseAt`, so nothing more comes over the wire a tick). Drawing
 * only, on the glow layer, in both views (the 2.5D figures are the flat view's own on cards).
 */
import { RAISE } from '../shared/tuning';
import type { Hero } from '../sim/types';
import { ring, type Ctx } from './draw';

const GOLD = '#ffe9a8', DEEP = '#e0a040', HIGH = 26;

/** Over a friend who is out, (x, y) where they lie on screen; `t` the room's time. */
export function drawRaise(c: Ctx, h: Hero, x: number, y: number, t: number): void {
  if (!h.out || !h.riseBy || h.riseAt === undefined || h.riseAt < 0) return;
  const share = Math.max(0, Math.min(1, (t - h.riseAt) / RAISE.time)), g = c.glow;
  ring(c, x, y, 9, GOLD, share, '#3a3428');
  // The column: brighter and taller as it goes on, flickering a little.
  const tall = Math.round(HIGH * (0.4 + 0.6 * share));
  for (let k = 0; k < tall; k++) {
    const a = (0.55 + 0.4 * share) * (1 - (0.7 * k) / tall) * (0.85 + 0.15 * Math.sin(c.now * 9 + k));
    // A soft edge either side, a bright core.
    g.globalAlpha = a * 0.45;
    g.fillStyle = DEEP;
    g.fillRect(Math.round(x - 3), Math.round(y - 3 - k), 7, 1);
    g.globalAlpha = a;
    g.fillStyle = k % 3 ? GOLD : '#ffffff';
    g.fillRect(Math.round(x - 1), Math.round(y - 3 - k), 3, 1);
  }
  // Motes climbing it.
  for (let i = 0; i < 5; i++) {
    const p = (c.now * 0.7 + i / 5) % 1;
    g.globalAlpha = (1 - p) * (0.4 + 0.5 * share);
    g.fillStyle = i % 2 ? GOLD : DEEP;
    g.fillRect(Math.round(x + Math.sin(i * 2.3 + c.now * 2) * 4), Math.round(y - 3 - p * tall), 1, 1);
  }
  g.globalAlpha = 1;
}
