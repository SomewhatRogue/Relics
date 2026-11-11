/**
 * The caged and the freed, drawn so you know them: someone in a cage waves and calls out when you're
 * near (the gold quest mark over it, questmarks.ts, says it's someone to save); once it breaks they
 * stand up where it was, say their thanks, and follow (the room moves them: sim/survivors.ts, the same on every screen).
 * Hurt, they flash; burning, they smoulder; killed, they fall and stay down; home, they walk off and fade.
 * Drawing only.
 */
import { drawNetOver } from './staithedraw';
import { drawAsh, drawEaten } from './remainsdraw';
import { SPRITES } from './sprites';
import { blit, ring, shadow, type Ctx } from './draw';
import { drawText, textWidth } from './pixfont';
import type { Survivor } from '../sim/types';
import { DROVER, SURVIVOR } from '../shared/tuning';
import { drawFalse } from './falsedraw';

/** What the caged call out (lore keeper and line editor), and what the freed say. */
export const BEG = ['Please! Over here!', "Don't leave us in here!", "They'll be back. Please!"];
export const THANKS = ['Lantern keep you.', 'Thank you. Thank you.', "I can walk, I can, I'll keep up."];
/** What one of them cries out when the party hurts them (lore keeper and line editor). */
export const CRY = 'Ah!';

/** At a cage: an arm waving through the bars, and their call when you're close. */
export function drawCaged(c: Ctx, x: number, y: number, now: number, near: boolean, k: number): void {
  // An arm out through the bars, waving.
  c.lit.fillStyle = '#c79c78';
  c.lit.fillRect(Math.round(x + 7), Math.round(y - 8 - (Math.floor(now * 4 + k) % 2)), 3, 1);
  if (!near || (now + k) % 4 > 2.6) return;
  const s = BEG[Math.floor((now + k) / 4) % BEG.length];
  drawText(c.glow, s, Math.round(x - textWidth(s) / 2), Math.round(y - 36), '#f0e0b0');
}

/** One of the freed at (sx, sy) on screen; `now` is the room's time. */
export function drawSurvivor(c: Ctx, s: Survivor, sx: number, sy: number, now: number): void {
  const spr = SPRITES.survivor;
  // Not who they seem: it lurches, then tears open (falsedraw.ts).
  if (s.tearAt !== undefined) return s.gone ? undefined : drawFalse(c, s, sx, sy, now);
  if (s.dead) return drawFallen(c, s, sx, sy, now);
  const t = now - s.at, home = s.home >= 0 ? now - s.home : -1;
  // Walking home, fading out toward the way in.
  const fade = home < 0 ? 1 : Math.max(0, 1 - home / SURVIVOR.walkOff);
  c.lit.globalAlpha = c.glow.globalAlpha = Math.max(0.15, fade);
  shadow(c, sx, sy + 2, 3);
  const up = t < 1.5 && Math.floor(t * 6) % 2 === 0 ? -1 : 0, step = s.moving && Math.floor(now * 7 + s.id) % 2 ? -1 : 0;
  const flash = now - s.hitAt < 0.12 ? 1 : 0;
  blit(c, spr, sx, sy + 2 + up + step, s.fx < 0, flash);
  // The Staithe's: netted on the bank (a net over them, weights on its edge), or waiting on the jetty (no thanks yet).
  if (s.netted) return void (drawNetOver(c, sx, sy, now), (c.lit.globalAlpha = c.glow.globalAlpha = 1));
  if (s.stay) return void (c.lit.globalAlpha = c.glow.globalAlpha = 1);
  // On a rope (layout 4): hands bound in front, the rope round the waist; no thanks yet.
  // Being cut loose off THE DROVER's rope (sim/drover.ts): the clock as a ring on the glow layer.
  if (s.led && s.cutT) ring(c, sx, sy, 8, '#ffd27a', s.cutT / DROVER.cut, '#3a3428');
  if (s.led) return void ((c.lit.fillStyle = '#8a7a5a'), c.lit.fillRect(Math.round(sx - 3), Math.round(sy - 5 + step), 7, 1), c.lit.fillRect(Math.round(sx - 1), Math.round(sy - 7 + step), 3, 2), (c.lit.globalAlpha = c.glow.globalAlpha = 1));
  if (t < 1.2) (c.lit.fillStyle = '#c79c78'), c.lit.fillRect(Math.round(sx - 4), Math.round(sy - 11 + up), 1, 3), c.lit.fillRect(Math.round(sx + 3), Math.round(sy - 11 + up), 1, 3);
  // Smouldering: a few sparks rising off them.
  if (s.burnUntil > now) {
    c.glow.fillStyle = Math.floor(now * 10) % 2 ? '#ffb040' : '#ff6a20';
    for (let i = 0; i < 3; i++) c.glow.fillRect(Math.round(sx - 3 + i * 3), Math.round(sy - 6 - ((now * 14 + i * 5) % 8)), 1, 1);
  }
  c.lit.globalAlpha = c.glow.globalAlpha = 1;
  if (t < 3.5) {
    const line = THANKS[(s.id - 1) % THANKS.length];
    drawText(c.glow, line, Math.round(sx - textWidth(line) / 2), Math.round(sy - 22), '#c8f0c0');
  }
}

/** Killed: they go over in a moment and stay down, a dark pool under them. */
function drawFallen(c: Ctx, s: Survivor, x: number, y: number, now: number): void {
  // Eaten by a butcher, or burned to ash first (sim/meal.ts, worldfire.ts).
  if (s.eaten) return drawEaten(c, x, y, true);
  if (s.ashed) return drawAsh(c, x, y, now, s.id, true);
  const spr = SPRITES.survivor, k = Math.min(1, (now - s.deadAt) / 0.3), side = s.fx < 0 ? -1 : 1;
  if (k >= 1) {
    c.lit.fillStyle = '#5a0c0c';
    c.lit.fillRect(Math.round(x - 4), Math.round(y), 8, 2);
    c.lit.fillRect(Math.round(x - 2), Math.round(y - 1), 5, 1);
  }
  for (const g of [c.lit, c.glow]) g.save(), g.translate(Math.round(x), Math.round(y + 2)), g.rotate(side * k * (Math.PI / 2));
  blit(c, spr, 0, 0, s.fx < 0);
  for (const g of [c.lit, c.glow]) g.restore();
}
