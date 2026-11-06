/**
 * What idledraw.ts and idledraw2.ts share: where the drawing is this frame (the hero's feet, the posed
 * body, the weapon hand), a look's own colours, a pixel, a heart. Only draws.
 */
import type { Ctx } from './draw';
import { LAYOUT } from './figure';
import type { Pose } from './held';
import type { LookDef } from './lookkit';
import type { IdleOut } from './idlepose';
import type { WeaponId } from '../shared/tuning';

/** `x, y`: the feet; `bx, by`: the body (with its shift); `px, py`: the weapon hand; `side`: the way the
 *  hero looks now (1 right); `ey, exl, exr`: the eyes' row and columns; `el`: a Mage's element colour. */
export interface PropAt { x: number; y: number; bx: number; by: number; px: number; py: number; side: number; ey: number; exl: number; exr: number; def: LookDef; p: Pose; el: string; now: number; o: IdleOut; /** The weapon in hand. */ w: WeaponId }

/** A rect of `col` on one layer. */
export function dot(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string): void {
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), w, h);
}

/** A sprite pixel of the head (col, row in the look's own map) on screen this frame (after `layout`). */
export function headPx(col: number, row: number): [number, number] {
  const L = LAYOUT;
  return [(L.flip ? L.left + 12 - col : L.left + 1 + col) + L.lean, L.top + 1 + row + L.drop];
}

const cols = new WeakMap<LookDef, Map<number, string>>();
/** The colour of the look's own pixel at (col, row) facing you, or `or` if it's empty. */
export function colAt(d: LookDef, col: number, row: number, or = '#5a5048'): string {
  let m = cols.get(d);
  if (!m) {
    cols.set(d, (m = new Map()));
    for (const [, x, y, c] of d.down as unknown as [string, number, number, string][]) m.set(y * 16 + x, c);
  }
  return m.get(row * 16 + col) ?? or;
}
/** The look's skin (the pixel between the eyes). */
export const skinOf = (d: LookDef) => colAt(d, d.eyes[1] + 1, d.eyes[0], '#d8a07a');

/** A small heart of light, rising and fading over `k` (0..1). */
export function heart(c: Ctx, x: number, y: number, k: number): void {
  if (k < 0 || k > 1) return;
  const X = Math.round(x + Math.sin(k * 6) * 1.5), Y = Math.round(y - k * 10);
  c.glow.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3;
  c.glow.fillStyle = '#ff6a8a';
  c.glow.fillRect(X - 1, Y, 1, 1), c.glow.fillRect(X + 1, Y, 1, 1), c.glow.fillRect(X - 1, Y + 1, 3, 1), c.glow.fillRect(X, Y + 2, 1, 1);
  c.glow.fillStyle = '#ffd0dc';
  c.glow.fillRect(X - 1, Y, 1, 1);
  c.glow.globalAlpha = 1;
}

/** A stick (the Ranger's, for the hound) at (x, y), turned `a`. */
export function stick(g: CanvasRenderingContext2D, x: number, y: number, a: number): void {
  for (let r = -2; r <= 2; r++) dot(g, x + Math.cos(a) * r, y + Math.sin(a) * r, 1, 1, r === 2 ? '#6b4a2b' : '#8b6a3a');
}

/** A knife at (x, y), turned `a`: a spare off the belt (3 long), or one of the twin daggers (5, as held.ts draws them). */
export function knife(g: CanvasRenderingContext2D, x: number, y: number, a: number, len = 3): void {
  for (let r = 0; r <= len; r++) dot(g, x + Math.cos(a) * r, y + Math.sin(a) * r, 1, 1, r < (len > 3 ? 2 : 1) ? '#2a2420' : '#e6ecf0');
}

/** A share of the way through [t0, t1] (clamped). */
export const span = (t: number, t0: number, t1: number) => Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
