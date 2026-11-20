/**
 * The tile redraw's floor (docs/design/tile-redraw.md, R0; `?redraw=1`, ../tilelook.ts): a stone street or flags drawn
 * at the redraw's size, 20 by 12 render pixels a tile (../tilekit.ts floorStamp), so at 36.87 degrees every floor pixel
 * is one render pixel. What lies on the ground (soil, marks, water, scatter, blood) is today's painting with the base
 * left out (world.ts paintMap `bare`), laid over at the new size: those are not redrawn yet (R0's second half).
 * Other floors (grass, earth, planks, rock) keep today's painting: null.
 */
import type { GameMap } from '../../shared/arena';
import { Rng } from '../../shared/rng';
import { gradeCanvas } from '../darkgold';
import { floorStamp, KX, KZ, type Rect } from '../tilekit';
import { OX, OY, paintMap, PX } from '../world';

export function redrawFloor(m: GameMap): HTMLCanvasElement | null {
  const kind = m.theme.floor;
  if (kind !== 'cobble' && kind !== 'flagstone') return null;
  const c = document.createElement('canvas');
  (c.width = m.w * KX), (c.height = m.h * KZ);
  const g = c.getContext('2d')!, rect: Rect = (x, y, w, h, col) => ((g.fillStyle = col), g.fillRect(x, y, w, h));
  const rng = new Rng(m.w * 23 + m.h * 7 + 5);
  for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) floorStamp(rect, rng, tx * KX, ty * KZ, kind === 'flagstone');
  gradeCanvas(c, 'floor');
  g.imageSmoothingEnabled = false;
  g.drawImage(paintMap(m, false, true), OX, OY, m.w * PX, m.h * PX, 0, 0, c.width, c.height);
  return c;
}

/** A floor pixel of today's painting (x, y, painting pixels) in the redrawn floor's pixels. */
export const redrawPx = (x: number, y: number): [number, number] => [Math.floor(((x - OX) * KX) / PX), Math.floor(((y - OY) * KZ) / PX)];
