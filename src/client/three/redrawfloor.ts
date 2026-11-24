/**
 * The tile redraw's floor (docs/design/tile-redraw.md, R0; `?redraw=1`, ../tilelook.ts): a stone street or flags drawn
 * at the redraw's size, 20 by 12 render pixels a tile (../tilekit.ts floorStamp), so at 36.87 degrees every floor pixel
 * is one render pixel. What lies on it is painted by the same painters as today's floor, onto this grid, not
 * stretched from today's picture: the soil on its own 20 by 12 grid (soil.ts `at`), and everything drawn a rectangle
 * at a time (water, scatter, marks, grime, a job's rock shelves, torch feet) through `onGrid`, which moves each
 * rectangle onto the grid with its edges on whole pixels, so a one-pixel fleck stays one pixel.
 * Grass, dirt, mud, rock and planks are drawn the same way (../tilegrounds.ts); wheat keeps today's painting: null.
 */
import type { GameMap } from '../../shared/arena';
import { Rng } from '../../shared/rng';
import { gradeCanvas } from '../darkgold';
import { floorStamp, KX, KZ, type Rect } from '../tilekit';
import { groundStamp, grounds } from '../tilegrounds';
import { ledge, OX, OY, PX, toPx } from '../world';
import { paintSoil, soilAt } from '../soil';
import { softEdges } from '../tileedges';
import { paintWater } from '../waterpaint';
import { groveFloors } from '../tilelitter';
import { strew } from '../tilestrew';
import { paintScenes } from '../tilescenes';
import { paintDrifts, paintZones } from '../tilemotifs';
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

const STREWN_KINDS = new Set(['sawdust', 'rushes']);
/** Sawdust or rushes the tile way: about one fleck or straw a tile, two dull shades, whole pixels. */
function strewn(rect: Rect, rng: Rng, k: { kind: string; x: number; y: number; w: number; h: number }): void {
  const cols = k.kind === 'rushes' ? ['#4e4a2a', '#5c5632'] : ['#5a4c34', '#6a5a3e'], n = Math.round(k.w * k.h * 1.1);
  for (let i = 0; i < n; i++) {
    const x = Math.floor((k.x + rng.next() * k.w) * KX), y = Math.floor((k.y + rng.next() * k.h) * KZ);
    rect(x, y, k.kind === 'rushes' ? 3 : 2, 1, cols[rng.int(2)]);
  }
}

export function redrawFloor(m: GameMap): HTMLCanvasElement | null {
  // A village (a stone floor anywhere but the town, whose back is stone: shared/terrain.ts, a job's trees or palisade
  // behind) lies on trodden earth, not one cobble pattern under its ploughland and all (graphics-overhaul.md slice 5,
  // approved with the plan); its swept yards and lanes are earth.
  const village = m.theme.floor === 'cobble' && m.theme.back !== 'stone', kind = village ? 'dirt' : m.theme.floor;
  const street = kind === 'cobble' || kind === 'flagstone';
  if (!street && !grounds(kind)) return null;
  const c = document.createElement('canvas');
  (c.width = m.w * KX), (c.height = m.h * KZ);
  const g = c.getContext('2d')!, rect: Rect = (x, y, w, h, col) => ((g.fillStyle = col), g.fillRect(x, y, w, h));
  const rng = new Rng(m.w * 23 + m.h * 7 + 5);
  for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
    if (street) floorStamp(rect, rng, tx * KX, ty * KZ, kind === 'flagstone');
    else groundStamp(kind, rect, rng, tx * KX, ty * KZ);
  }
  // What lies on the ground, in today's order (world.ts paintMap), each on this grid.
  const R = onGrid(g), r2 = new Rng(m.w * 7 + m.h * 13 + 1), pick = (a: string[]) => a[r2.int(a.length)];
  paintSoil(m, g, { x: 0, y: 0, sx: KX, sy: KZ, calm: true });
  // Where the materials meet, drawn as tile art draws an edge (tileedges.ts: the living world's L1).
  softEdges(m, rect, KX, KZ);
  // (Ground laid with intent: a grove's floor of needle litter and roots under the trees, tilelitter.ts; and what
  // lies about, thick round things and thin in the open, drawn the tile way, tilestrew.ts.)
  // (The pattern book's zones for this map's look, looks.ts: a hollow, a worn patch, tall grass, a burn.)
  paintZones(m, rect);
  groveFloors(m, rect);
  paintWater(m, R, r2, toPx, PX);
  const laid = new Set(['earth', 'swept', 'flags', 'furrow', 'crop', 'straw', 'ash', 'wet', 'mud']);
  strew(m, rect, (x, y) => !!m.soil?.length && laid.has(soilAt(m, x, y)));
  // (The look's drifts and mushroom rings, over whatever is strewn.)
  paintDrifts(m, rect);
  // (The small scenes' part in the floor: a grave's mound, a dead fire's ring, a stain: tilescenes.ts.)
  paintScenes(m, rect);
  // (A hall's sawdust and rushes, hallfloor.ts, are a tenth of the floor in pale flecks: on drawn planks that reads
  // as speckle. Here a few dull ones a tile, on the grid. The living world's L3, 2026-11-22.)
  paintMarks({ ...m, marks: (m.marks ?? []).filter((k) => !STREWN_KINDS.has(k.kind)) }, R);
  for (const k of m.marks ?? []) if (STREWN_KINDS.has(k.kind)) strewn(rect, r2, k);
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
