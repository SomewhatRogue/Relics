/**
 * The training yard's straw men, flat view (shared/practice.ts RACK): a frame of poles in the top left
 * corner, straw men in scraps of hungry kit hanging from its bar on ropes or propped against its poles
 * while they wait, two of Corporal Brisk's watch with ropes in hand, and the post with Pell's board. As
 * straw men are set going (sim/practice.ts), fewer wait on the rack. No live goblin is kept in Wickhold.
 */
import type { Npc } from '../shared/arena';
import { RACK } from '../shared/practice';
import type { Ctx } from './draw';
import { drawNpc } from './npcs';
import { PX } from './world';

const POLE = '#5d4a36', DARK = '#3a2d20', ROPE = '#a08a5a', BOARD = '#8a6f4a';
/** Straw, its shade and its pale ends; the hungry kit (rag, the green of a hood) and painted eyes. */
export const STRAW = { body: '#c9a35a', shade: '#9a7a3a', pale: '#ead08a', rag: '#4a3a2a', hood: '#5b6b2a', eye: '#2a1a10' };

/** One straw man, its feet at (x, y): a stuffed body, a rag tunic, a green hood with its ears, painted eyes, straw out at the ends. */
export function drawStrawMan(g: CanvasRenderingContext2D, x: number, y: number, k: number): void {
  const r = (dx: number, dy: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(Math.round(x + dx), Math.round(y + dy), w, h));
  r(-3, -4, 2, 4, STRAW.shade), r(1, -4, 2, 4, STRAW.shade);
  r(-4, -8, 8, 5, STRAW.body), r(-4, -6, 8, 1, STRAW.shade);
  r(-4, -8, 8, 3, STRAW.rag);
  r(-3, -13, 6, 5, STRAW.body), r(-3, -13, 6, 2, STRAW.hood), r(-5, -12, 2, 1, STRAW.hood), r(3, -12, 2, 1, STRAW.hood);
  r(-2, -10, 1, 1, STRAW.eye), r(1, -10, 1, 1, STRAW.eye);
  // Straw sticking out at the neck, the cuffs and the feet.
  r(-5, -7, 1, 2, STRAW.pale), r(4, -7, 1, 2, STRAW.pale), r(-1 + (k % 2), -14, 1, 1, STRAW.pale), r(-4, -1, 1, 1, STRAW.pale), r(3, -1, 1, 1, STRAW.pale);
}

/** A straw man knocked down: a slumped heap of straw with its rag and hood on top. */
export function drawStrawHeap(g: CanvasRenderingContext2D, x: number, y: number, k: number): void {
  const r = (dx: number, dy: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(Math.round(x + dx), Math.round(y + dy), w, h));
  r(-7, -3, 14, 3, STRAW.shade), r(-6, -4, 12, 2, STRAW.body), r(-4, -5, 7, 1, STRAW.body);
  r(-3 + (k % 3), -4, 5, 2, STRAW.rag), r(2 - (k % 2) * 4, -3, 3, 1, STRAW.hood);
  for (let i = 0; i < 5; i++) r(-8 + i * 4 + (k % 2), -1 - (i % 2), 1, 1, STRAW.pale);
}

/** Where the straw men wait on the rack (tiles, at the rack's front), and which hang from its bar (feet off the ground). */
export function rackMen(n: number): { x: number; y: number; hung: boolean; i: number }[] {
  return Array.from({ length: n }, (_, i) => ({ x: RACK.x + 0.55 + (i * (RACK.w - 1.1)) / Math.max(1, RACK.holds - 1), y: RACK.y + RACK.h - 0.05, hung: i % 2 === 0, i }));
}
/** How far a hung one's feet are off the ground (pixels flat, tiles in 2.5D: rack3d.ts). */
export const HUNG = 4;
const BAR = 30;

/** A waiting straw man at its feet (x, y) on screen: a hung one on its rope, swaying a little. */
export function drawWaiting(g: CanvasRenderingContext2D, x: number, y: number, hung: boolean, i: number, now: number): void {
  const swing = hung && Math.floor(now * 0.9 + i * 1.3) % 6 === 0 ? 1 : 0;
  if (hung) (g.fillStyle = ROPE), g.fillRect(Math.round(x + swing), Math.round(y - BAR + 2), 1, BAR - 2 - HUNG - 13);
  drawStrawMan(g, x + swing, hung ? y - HUNG : y, i);
}

/** The rack's frame (x, y: its top left corner on screen): two poles and a bar across, with `n` waiting on it. */
export function drawRack(c: Ctx, x: number, y: number, now: number, n: number): void {
  const w = RACK.w * PX, floor = y + RACK.h * PX, bar = floor - BAR, g = c.lit;
  g.fillStyle = DARK;
  g.fillRect(Math.round(x), Math.round(bar), 2, BAR), g.fillRect(Math.round(x + w - 2), Math.round(bar), 2, BAR);
  g.fillStyle = POLE;
  g.fillRect(Math.round(x), Math.round(bar), Math.round(w), 2);
  for (const m of rackMen(n)) drawWaiting(g, x + (m.x - RACK.x) * PX, floor, m.hung, m.i, now);
}

/** Two of the watch, ropes in hand, run out to the rack's bar. */
export function drawWatch(c: Ctx, x: number, y: number, i: number, barX: number, barY: number, now: number): void {
  drawNpc(c, { name: 'THE WATCH', x: 0, y: 0, look: 'guard', mute: true } as Npc, x, y, false, i ? -1 : 1);
  c.lit.fillStyle = ROPE;
  const hx = x + (i ? -4 : 4), hy = y - 9, sag = 3 + (Math.floor(now * 0.7 + i) % 3 === 0 ? 1 : 0), steps = 12;
  for (let k = 0; k <= steps; k++) {
    const t = k / steps, px = hx + (barX - hx) * t, py = hy + (barY - hy) * t + Math.sin(t * Math.PI) * sag;
    c.lit.fillRect(Math.round(px), Math.round(py), 1, 1);
  }
}

/** The board on its post (x, y: the post's foot on screen). */
export function drawPost(c: Ctx, x: number, y: number): void {
  const g = c.lit;
  g.fillStyle = DARK;
  g.fillRect(Math.round(x - 1), Math.round(y - 20), 2, 20);
  g.fillStyle = BOARD;
  g.fillRect(Math.round(x - 7), Math.round(y - 22), 14, 9);
  g.fillStyle = '#d8c8a0';
  for (let k = 0; k < 3; k++) g.fillRect(Math.round(x - 5), Math.round(y - 20 + k * 2.5), 8 - k * 2, 1);
}
