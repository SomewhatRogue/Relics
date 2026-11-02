/**
 * The caged and the freed, drawn so you know them: someone in a cage waves and calls out when you're
 * near (a glowing mark over the cage says it's someone to save); once it breaks they stand up where it
 * was, say their thanks, and follow (the room moves them: sim/survivors.ts, the same on every screen).
 * Hurt, they flash; burning, they smoulder; killed, they fall and stay down; home, they walk off and fade.
 * Drawing only.
 */
import { SPRITES } from './sprites';
import { blit, shadow, type Ctx } from './draw';
import { drawText, textWidth } from './pixfont';
import type { Survivor } from '../sim/types';
import { SURVIVOR } from '../shared/tuning';

/** What the caged call out (lore keeper and line editor), and what the freed say. */
export const BEG = ['Please! Over here!', "Don't leave us in here!", "They'll be back. Please!"];
export const THANKS = ['Lantern keep you.', 'Thank you. Thank you.', "I can walk, I can, I'll keep up."];
/** What one of them cries out when the party hurts them (lore keeper and line editor). */
export const CRY = 'Ah!';

/** Over a cage: the mark, and their call when you're close. */
export function drawCaged(c: Ctx, x: number, y: number, now: number, near: boolean, k: number): void {
  const bob = Math.round(Math.sin(now * 5 + k) * 1.5);
  c.glow.fillStyle = '#ffe070';
  c.glow.fillRect(Math.round(x), Math.round(y - 26 + bob), 2, 5);
  c.glow.fillRect(Math.round(x), Math.round(y - 19 + bob), 2, 2);
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
  if (s.dead) return drawFallen(c, s, sx, sy, now);
  const t = now - s.at, home = s.home >= 0 ? now - s.home : -1;
  // Walking home, fading out toward the way in.
  const fade = home < 0 ? 1 : Math.max(0, 1 - home / SURVIVOR.walkOff);
  c.lit.globalAlpha = c.glow.globalAlpha = Math.max(0.15, fade);
  shadow(c, sx, sy + 2, 3);
  const up = t < 1.5 && Math.floor(t * 6) % 2 === 0 ? -1 : 0, step = s.moving && Math.floor(now * 7 + s.id) % 2 ? -1 : 0;
  const flash = now - s.hitAt < 0.12 ? 1 : 0;
  blit(c, spr, sx, sy + 2 + up + step, s.fx < 0, flash);
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
