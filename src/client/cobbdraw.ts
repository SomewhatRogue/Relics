/**
 * Cobb at the top of the Deep's ladder (client/deepwords.ts: "sits on a crate at the top of it with a lamp and a
 * slate"; Kyle, 2026-11-11: "draw it"): a crate he sits on, behind him, his legs over its front; a lamp on the
 * flags beside him, lit (its light: scene.ts); the slate on his knee with the names chalked on it. Drawn through
 * the pen in the old pixels (gobpen.ts), around his feet.
 */
import type { Ctx } from './draw';
import { gobPen } from './gobpen';

/** How far he sits up off the flags, in screen pixels (the sprite is lifted by this onto the crate). */
export const COBB_SIT = 6;

const r = (g: CanvasRenderingContext2D, col: string, x: number, y: number, w: number, h: number) => ((g.fillStyle = col), g.fillRect(Math.round(x), Math.round(y), w, h));

/** Behind him: the crate. */
export function drawCobbCrate(c: Ctx, x: number, y: number): void {
  const g = gobPen(c, x, y).lit, l = x - 6, t = y - 7;
  r(g, '#4a3420', l, t, 12, 7);
  r(g, '#6a4c2c', l, t, 12, 1);
  r(g, '#2e2014', l, t + 3, 12, 1);
  r(g, '#2e2014', l, t + 6, 12, 1);
  r(g, '#5a4026', l + 1, t + 1, 1, 5);
  r(g, '#5a4026', l + 10, t + 1, 1, 5);
  r(g, '#8a8494', l + 1, t + 1, 1, 1);
  r(g, '#8a8494', l + 10, t + 1, 1, 1);
}

/** In front of him: the slate on his knee, and the lamp on the flags with its flame. */
export function drawCobbThings(c: Ctx, x: number, y: number): void {
  const p = gobPen(c, x, y), g = p.lit, lap = y - 4 - COBB_SIT / 1.5;
  // The slate: dark, a wooden frame, the names chalked in rows.
  r(g, '#5a4026', x - 4, lap - 3, 7, 5);
  r(g, '#2c2c34', x - 3, lap - 2, 5, 3);
  r(g, '#c8c8c0', x - 3, lap - 2, 2, 1);
  r(g, '#c8c8c0', x, lap - 2, 1, 1);
  r(g, '#a8a8a0', x - 2, lap, 3, 1);
  // The lamp: an iron foot and cap, the glass, and the flame in it.
  const lx = x + 8, ly = y;
  r(g, '#2a2830', lx - 2, ly - 1, 5, 1);
  r(g, '#3a3640', lx - 2, ly - 6, 1, 5);
  r(g, '#3a3640', lx + 2, ly - 6, 1, 5);
  r(g, '#2a2830', lx - 2, ly - 7, 5, 1);
  r(g, '#3a3640', lx, ly - 9, 1, 2);
  const f = Math.floor(c.now * 9) % 3, gl = p.glow;
  r(gl, '#7a4a20', lx - 1, ly - 6, 3, 5);
  r(gl, '#ffb050', lx - 1, ly - 4 - (f === 0 ? 1 : 0), 3, 3);
  r(gl, '#fff0b0', lx, ly - 3 - (f === 1 ? 1 : 0), 1, 2);
}
