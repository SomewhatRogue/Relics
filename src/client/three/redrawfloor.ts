/**
 * The tile redraw's floor (docs/design/tile-redraw.md, R0; `?redraw=1`, ../tilelook.ts): a stone street or flags drawn
 * at the redraw's size, 20 by 12 render pixels a tile (../tilekit.ts floorStamp), so at 36.87 degrees every floor pixel
 * is one render pixel. What lies on it is painted by the same painters as today's floor, onto this grid, not
 * stretched from today's picture: the soil on its own 20 by 12 grid (soil.ts `at`), and everything drawn a rectangle
 * at a time (water, scatter, marks, grime, a job's rock shelves, torch feet) through `onGrid`, which moves each
 * rectangle onto the grid with its edges on whole pixels, so a one-pixel fleck stays one pixel.
 * Other floors (grass, earth, planks, rock) keep today's painting: null.
 */
import type { GameMap } from '../../shared/arena';
import { Rng } from '../../shared/rng';
import { gradeCanvas } from '../darkgold';
import { floorStamp, KX, KZ, type Rect } from '../tilekit';
import { ledge, OX, OY, PX, toPx } from '../world';
import { paintSoil } from '../soil';
import { paintWater } from '../waterpaint';
import { paintScatter } from '../scatterpaint';
import { paintMarks } from '../marks';
import { paintGrim } from '../grimpaint';
import { stacked } from '../levelpaint';

/** Today's floor pixels (x, y, w, h) onto the redraw's grid, edges rounded so neighbours still meet. */
export function onGrid(g: CanvasRenderingContext2D): Rect {
  return (x, y, w, h, col) => {
    const x0 = Math.round(((x - OX) * KX) / PX), x1 = Math.round(((x + w - OX) * KX) / PX);
    const y0 = Math.round(((y - OY) * KZ) / PX), y1 = Math.round(((y + h - OY) * KZ) / PX);
    g.fillStyle = col;
    g.fillRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
  };
}

export function redrawFloor(m: GameMap): HTMLCanvasElement | null {
  const kind = m.theme.floor;
  if (kind !== 'cobble' && kind !== 'flagstone') return null;
  const c = document.createElement('canvas');
  (c.width = m.w * KX), (c.height = m.h * KZ);
  const g = c.getContext('2d')!, rect: Rect = (x, y, w, h, col) => ((g.fillStyle = col), g.fillRect(x, y, w, h));
  const rng = new Rng(m.w * 23 + m.h * 7 + 5);
  for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) floorStamp(rect, rng, tx * KX, ty * KZ, kind === 'flagstone');
  // What lies on the ground, in today's order (world.ts paintMap), each on this grid.
  const R = onGrid(g), r2 = new Rng(m.w * 7 + m.h * 13 + 1), pick = (a: string[]) => a[r2.int(a.length)];
  paintSoil(m, g, { x: 0, y: 0, sx: KX, sy: KZ });
  paintWater(m, R, r2, toPx, PX);
  paintScatter(m, R);
  paintMarks(m, R);
  paintGrim(m, R);
  R(OX, OY, m.w * PX, 4, 'rgba(0,0,0,0.35)');
  if (!stacked(m)) for (const l of m.ledges ?? []) ledge(l, R, r2, pick);
  for (const t of m.torches) {
    const [x, y] = toPx(t.x, t.y);
    R(x - 1, y, 3, 8, '#3a2a1a'), R(x - 2, y + 7, 5, 1, '#3a2a1a');
  }
  gradeCanvas(c, 'floor');
  return c;
}

/** A floor pixel of today's painting (x, y, painting pixels) in the redrawn floor's pixels. */
export const redrawPx = (x: number, y: number): [number, number] => [Math.floor(((x - OX) * KX) / PX), Math.floor(((y - OY) * KZ) / PX)];
