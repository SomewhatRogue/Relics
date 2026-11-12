/**
 * Instance puzzles on screen (sim/tubs.ts, shared/puzzle.ts): each plate an iron plate let into the floor with a
 * chalked square round it (lit gold on the glow layer once a tub's on it), the lever on its post, and the tubs:
 * plank ore tubs bound in iron, heaped with ore. From the map and the tubs' props, the same on every screen.
 */
import type { GameMap } from '../shared/arena';
import { centre, cellAt } from '../shared/puzzle';
import type { Prop } from '../sim/types';
import { shadow, type Ctx } from './draw';
import { OX, OY, PX } from './world';

const WOOD = '#6b4a2e', WOOD_HI = '#8a6440', WOOD_LO = '#4a321e', IRON = '#4a4652', IRON_HI = '#7a7684', ORE = '#5e5048', COPPER = '#b87a3a';
const CHALK = '#cfc6ae', GOLD = '#ffd27a';
const fill = (g: CanvasRenderingContext2D, col: string, x: number, y: number, w: number, h: number) => ((g.fillStyle = col), g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)));

/** The plates, on the floor (the lit layer, and the glow layer for a plate with a tub on it). */
export function drawPlates(c: Ctx, map: GameMap, props: Prop[], cx: number, cy: number, now: number): void {
  for (const p of map.puzzles ?? []) {
    const on = props.filter((q) => q.kind === 'tub' && !q.broken && !q.to).map((q) => cellAt(p, q.x, q.y));
    for (const cell of p.plates) {
      const m = centre(p, cell), s = Math.round(p.cell * PX * 0.78), x = Math.round(OX + m.x * PX - cx - s / 2), y = Math.round(OY + m.y * PX - cy - s / 2);
      const lit = on.some(([a, b]) => a === cell[0] && b === cell[1]);
      fill(c.lit, IRON, x + 2, y + 2, s - 4, s - 4);
      fill(c.lit, '#2e2b33', x + 3, y + 3, s - 6, s - 6);
      for (const [rx, ry] of [[x + 3, y + 3], [x + s - 4, y + 3], [x + 3, y + s - 4], [x + s - 4, y + s - 4]]) fill(c.lit, IRON_HI, rx, ry, 1, 1);
      // The chalked square: dashed, the miners' mark for where a tub tips.
      // (On the glow layer either way, faint till a tub's on it, so it reads in the adit's dark.)
      const g = c.glow, k = lit ? 1 : 0.32 + 0.1 * Math.sin(now * 2.2);
      g.globalAlpha = k;
      for (let i = 0; i < s; i += 3) fill(g, lit ? GOLD : CHALK, x + i, y, 2, 1), fill(g, lit ? GOLD : CHALK, x + i, y + s - 1, 2, 1), fill(g, lit ? GOLD : CHALK, x, y + i, 1, 2), fill(g, lit ? GOLD : CHALK, x + s - 1, y + i, 1, 2);
      g.globalAlpha = 1;
    }
  }
}

/** A puzzle's lever on its post, its foot (x, y) on screen. */
function drawLever(c: Ctx, x: number, y: number): void {
  const g = c.lit;
  shadow(c, x, y, 6);
  fill(g, WOOD_LO, x - 2, y - 14, 4, 14), fill(g, WOOD, x - 1, y - 14, 2, 13);
  fill(g, IRON, x - 3, y - 9, 6, 3);
  for (let i = 0; i < 7; i++) fill(g, i > 4 ? IRON_HI : IRON, x + Math.round(i * 0.8), y - 9 - i, 2, 1);
  fill(g, '#9a3a2a', x + 4, y - 17, 3, 2);
}

/** An ore tub at its foot (x, y) on screen. */
export function drawTub(c: Ctx, p: Prop, x: number, y: number): void {
  const g = c.lit, w = Math.round(PX * 1.0), h = Math.round(PX * 0.62), x0 = Math.round(x - w / 2), y0 = Math.round(y - h) - 1;
  shadow(c, x, y, Math.round(w * 0.55));
  fill(g, WOOD_LO, x0, y0, w, h);
  for (let i = 1; i < h - 1; i += 3) fill(g, i % 2 ? WOOD : WOOD_HI, x0 + 1, y0 + i, w - 2, 2);
  fill(g, IRON, x0, y0 + 1, w, 1), fill(g, IRON, x0, y0 + h - 2, w, 1);
  fill(g, IRON_HI, x0 + 2, y0 + 1, 1, 1), fill(g, IRON_HI, x0 + w - 3, y0 + 1, 1, 1);
  // Heaped with ore, a fleck or two of copper.
  for (let i = 0; i < 4; i++) fill(g, ORE, x0 + 2 + i * Math.round((w - 6) / 3), y0 - 2 - (i % 2), Math.round((w - 4) / 3), 3);
  fill(g, COPPER, x0 + Math.round(w * 0.3), y0 - 2, 1, 1), fill(g, COPPER, x0 + Math.round(w * 0.65), y0 - 1, 1, 1);
}

/** The puzzles' levers as scene items, sorted with the bodies by their foot. */
export function leverItems(c: Ctx, map: GameMap, cx: number, cy: number): { y: number; draw: () => void }[] {
  return (map.puzzles ?? []).map((p) => ({ y: OY + p.lever.y * PX, draw: () => drawLever(c, Math.round(OX + p.lever.x * PX - cx), Math.round(OY + p.lever.y * PX - cy)) }));
}
