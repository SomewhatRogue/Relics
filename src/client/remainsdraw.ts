/**
 * What's left of a body, and a butcher at one (sim/meal.ts, sim/worldfire.ts). Eaten: a dark stain and a few
 * pale bones. Burned to ash: a grey heap with embers winking in it, so you can see it'll feed nothing. A
 * butcher at a body hunches and tears at it, red flicking off; FED, its eyes burn red and it drips. Drawn by
 * the flat view's figures, which the 2.5D view stands up in its world too (three/cards3d.ts), so both alike.
 */
import type { Ctx } from './draw';
import type { Enemy } from '../sim/types';

const px = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) => {
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), w, h);
};

/** Eaten: a stain and the bones. `big` a grown person's. */
export function drawEaten(c: Ctx, x: number, y: number, big = false): void {
  const w = big ? 9 : 7;
  px(c.lit, x - w / 2, y - 1, w, 2, '#4a0a0a');
  px(c.lit, x - w / 2 + 2, y - 2, w - 4, 1, '#5a0c0c');
  // Ribs, a long bone, the skull.
  px(c.lit, x - 2, y - 3, 1, 2, '#d8d0bc');
  px(c.lit, x, y - 3, 1, 2, '#c8c0aa');
  px(c.lit, x + 2, y - 3, 1, 2, '#d8d0bc');
  px(c.lit, x - 4, y - 1, 4, 1, '#e0d8c4');
  px(c.lit, x + 3, y - 4, 2, 2, '#e8e0cc');
}

/** Burned to ash: a low grey heap, embers winking. */
export function drawAsh(c: Ctx, x: number, y: number, now: number, seed: number, big = false): void {
  const w = big ? 10 : 8;
  px(c.lit, x - w / 2, y - 1, w, 2, '#2e2a32');
  px(c.lit, x - w / 2 + 1, y - 2, w - 2, 1, '#4a4652');
  px(c.lit, x - 2, y - 3, 4, 1, '#5e5a66');
  for (let i = 0; i < 3; i++) {
    if ((Math.floor(now * 3 + seed * 1.7 + i * 2.3) % 3) !== 0) continue;
    c.glow.fillStyle = i % 2 ? '#ff8a3c' : '#ffb35a';
    c.glow.fillRect(Math.round(x - w / 2 + 1 + ((seed * 3 + i * 3) % (w - 2))), Math.round(y - 1 - (i % 2)), 1, 1);
  }
}

/** A butcher at a meal (over its figure): red flicking off as it tears at the body. */
export function drawMealing(c: Ctx, e: Enemy, x: number, y: number, now: number): void {
  const m = e.meal;
  if (!m) return;
  const f = m.x >= e.x ? 1 : -1, cyc = (now * 1.6 + e.id * 0.37) % 1;
  if (cyc < 0.5) return;
  const k = (cyc - 0.5) / 0.5;
  for (let i = 0; i < 4; i++) px(c.lit, x + f * (6 + i * 2 * k), y - 12 - 8 * k + i * k * 3 + 10 * k * k, 1, 1, i % 2 ? '#9a1414' : '#c41a1a');
}

/** FED: eyes burning red, and it drips. */
export function drawFed(c: Ctx, e: Enemy, x: number, y: number, now: number): void {
  if (!e.fed) return;
  const f = e.fx >= -0.2 ? 1 : -1, beat = Math.floor(now * 6 + e.id) % 2;
  c.glow.fillStyle = beat ? '#ff3020' : '#ff7050';
  c.glow.fillRect(Math.round(x + f * 2), Math.round(y - 25), 2, 1);
  c.glow.fillRect(Math.round(x + f * 5), Math.round(y - 25), 1, 1);
  // A drip off the jaw, falling.
  const d = (now * 1.4 + e.id * 0.3) % 1;
  px(c.lit, x + f * 4, y - 20 + d * 8, 1, 1 + (d < 0.5 ? 1 : 0), '#9a1414');
}
