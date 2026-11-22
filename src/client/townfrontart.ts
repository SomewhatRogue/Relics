/**
 * The living world, L3: the small things by a door, drawn the tile way (three to five shades, lit from the upper
 * left, a dark outline, whole pixels, no noise) onto `c.lit` with the foot at (px, py): a barrel, a small crate, a
 * pail, a sack, a broom leant on the wall, and the pale notices pinned on the JOBS house. Paint only.
 */
import type { Ctx } from './draw';

/** Timber, cloth and iron, dark to light (the shades tilefurnkit.ts uses; copied, not shared). */
const TIM = ['#1a110a', '#24180f', '#3a2a1e', '#4e3826', '#654a33'];
const CLOTH = ['#2e2618', '#4a3c22', '#665430', '#85703c', '#a08a4c'];
const IRON = ['#101215', '#1c1f24', '#2c3138', '#414852', '#5e6874'];

export type Clutter = 'barrel' | 'crate' | 'pail' | 'sack' | 'broom';
export const CLUTTER: Clutter[] = ['barrel', 'crate', 'pail', 'sack', 'broom'];
/** How far along a wall each takes, in tiles (so two do not overlap). */
export const CLUTTER_W: Record<Clutter, number> = { barrel: 0.45, crate: 0.45, pail: 0.3, sack: 0.4, broom: 0.25 };

const R = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(x, y, w, h));

function barrel(g: CanvasRenderingContext2D, x: number, y: number): void {
  R(g, x - 3, y - 10, 6, 10, TIM[0]), R(g, x - 4, y - 9, 8, 8, TIM[0]);
  R(g, x - 3, y - 9, 6, 8, TIM[2]);
  R(g, x - 3, y - 9, 1, 8, TIM[3]), R(g, x + 2, y - 9, 1, 8, TIM[1]);
  R(g, x - 3, y - 9, 6, 2, TIM[4]), R(g, x - 2, y - 8, 4, 1, TIM[1]);
  R(g, x - 3, y - 6, 6, 1, IRON[2]), R(g, x - 3, y - 3, 6, 1, IRON[2]);
  R(g, x - 3, y - 6, 1, 1, IRON[4]), R(g, x - 3, y - 3, 1, 1, IRON[4]);
}

function crate(g: CanvasRenderingContext2D, x: number, y: number): void {
  R(g, x - 4, y - 7, 8, 7, TIM[0]);
  R(g, x - 3, y - 6, 6, 2, TIM[4]);
  R(g, x - 3, y - 4, 6, 3, TIM[2]);
  R(g, x - 3, y - 4, 1, 3, TIM[3]), R(g, x + 2, y - 4, 1, 3, TIM[1]);
  R(g, x - 2, y - 3, 1, 1, TIM[1]), R(g, x, y - 2, 1, 1, TIM[1]), R(g, x + 1, y - 3, 1, 1, TIM[1]);
}

function pail(g: CanvasRenderingContext2D, x: number, y: number): void {
  R(g, x - 3, y - 5, 6, 5, TIM[0]);
  R(g, x - 2, y - 4, 4, 4, TIM[2]), R(g, x - 2, y - 4, 4, 1, IRON[3]), R(g, x - 2, y - 4, 1, 4, TIM[3]), R(g, x + 1, y - 4, 1, 4, TIM[1]);
  R(g, x - 2, y - 2, 4, 1, IRON[2]);
  R(g, x - 2, y - 7, 1, 2, IRON[2]), R(g, x - 1, y - 8, 2, 1, IRON[2]), R(g, x + 1, y - 7, 1, 2, IRON[2]);
}

function sack(g: CanvasRenderingContext2D, x: number, y: number): void {
  R(g, x - 1, y - 8, 3, 1, CLOTH[0]), R(g, x - 2, y - 7, 5, 1, CLOTH[0]);
  R(g, x - 3, y - 6, 7, 6, CLOTH[0]);
  R(g, x - 2, y - 6, 5, 5, CLOTH[3]), R(g, x - 1, y - 7, 3, 1, CLOTH[3]);
  R(g, x - 2, y - 6, 1, 5, CLOTH[4]), R(g, x + 2, y - 6, 1, 5, CLOTH[2]), R(g, x - 2, y - 1, 5, 1, CLOTH[2]);
  R(g, x - 1, y - 7, 3, 1, CLOTH[1]), R(g, x, y - 5, 1, 2, CLOTH[2]);
}

/** A broom leant on the wall, bristles down: the handle leans one pixel in every four. */
function broom(g: CanvasRenderingContext2D, x: number, y: number): void {
  for (let i = 0; i < 12; i++) R(g, x + 3 - Math.floor(i / 4), y - 12 + i, 1, 1, i < 2 ? TIM[4] : TIM[3]);
  R(g, x - 1, y - 3, 4, 3, CLOTH[1]), R(g, x - 1, y - 3, 4, 1, CLOTH[3]), R(g, x - 1, y - 2, 1, 2, CLOTH[2]);
  R(g, x - 1, y - 1, 4, 1, CLOTH[0]);
}

const DRAW: Record<Clutter, (g: CanvasRenderingContext2D, x: number, y: number) => void> = { barrel, crate, pail, sack, broom };
export const drawClutter = (c: Ctx, kind: Clutter, px: number, py: number): void => DRAW[kind](c.lit, Math.round(px), Math.round(py));

/**
 * A pale notice pinned up, the foot at its bottom middle: paper in three shades, a few dark lines of writing, a red
 * pin. `stir` lifts its lower corner a pixel (a breath of wind); `n` picks the length of writing.
 */
export function drawNotice(c: Ctx, px: number, py: number, n: number, stir: boolean): void {
  const g = c.lit, x = Math.round(px), y = Math.round(py), h = 6 + (n % 2);
  R(g, x - 3, y - h - 1, 6, h + 2, '#1c1810');
  R(g, x - 2, y - h, 4, h, '#b9ae88');
  R(g, x - 2, y - h, 4, 1, '#d4cba6'), R(g, x - 2, y - h, 1, h, '#d4cba6'), R(g, x + 1, y - h, 1, h, '#948a68');
  for (let i = 0; i < h - 2; i += 2) R(g, x - 1, y - h + 2 + i, 2 + ((i + n) % 2) - 1, 1, '#4a4234');
  R(g, x, y - h, 1, 1, '#8a3030');
  if (stir) R(g, x + 1, y - 2, 2, 2, '#1c1810'), R(g, x + 1, y - 1, 1, 1, '#d4cba6'), R(g, x + 2, y, 1, 1, '#1c1810');
}
