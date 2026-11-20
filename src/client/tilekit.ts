/**
 * The tile redraw's kit (docs/design/tile-redraw.md): small stamps drawn by code at the redraw's size, where a tile is
 * 20 pixels across, a floor tile 12 pixels deep and a wall 16 pixels a tile of height (the 2.5D camera at 36.87
 * degrees). Each material keeps three to five shades, lit from the upper left. The greys are neutral and the timber
 * plain brown: the grade (darkgold.ts, TILES) turns them to the slate and timber shades once the canvas is drawn.
 * The floor stamp; a building's wall face (stone courses, or timber frame on daub over a stone plinth) with its windows
 * framed and a hole where the door is; a roof's front slope (slate or thatch). Cosmetic only.
 */
import type { Rng } from '../shared/rng';
import { gradeCanvas, MOSS } from './darkgold';

export type Rect = (x: number, y: number, w: number, h: number, col: string) => void;
/** Render pixels a tile across, a floor tile deep, and a wall a tile high. */
export const KX = 20, KZ = 12, KY = 16;

const MORTAR = '#141414', STONE = ['#2c2c2c', '#3c3c3c', '#4f4f4f'], LIGHT = ['#3c3c3c', '#4f4f4f', '#6b6b6b'];
const TIMBER = ['#24180f', '#3a2a1e', '#4e3826'], DAUB = ['#37342e', '#413d36', '#4b463e'];

function stone(rect: Rect, x: number, y: number, w: number, h: number, i: number): void {
  rect(x, y, w, h, STONE[i]);
  rect(x, y, w - 1, 1, LIGHT[i]);
  rect(x, y, 1, h, LIGHT[i]);
  if (i) rect(x + w - 1, y + 1, 1, h - 1, STONE[i - 1]);
}

/** One floor tile of a stone street or flags at (x, y): 20 by 12, four cobbles, two half slabs or one slab. */
export function floorStamp(rect: Rect, rng: Rng, x: number, y: number, slabs: boolean): void {
  rect(x, y, KX, KZ, MORTAR);
  const v = rng.next(), lit = () => (rng.next() < 0.55 ? 0 : 1);
  if (v < (slabs ? 0.45 : 0.08)) stone(rect, x, y, KX - 1, KZ - 1, lit());
  else if (v < (slabs ? 0.85 : 0.28)) stone(rect, x, y, KX - 1, 5, lit()), stone(rect, x, y + 6, KX - 1, 5, lit());
  else for (const [i, j] of [[0, 0], [10, 0], [0, 6], [10, 6]]) stone(rect, x + i, y + j, 9, 5, lit());
  if (rng.next() < 0.14) rect(x + rng.int(12), y + KZ - 1, 3 + rng.int(4), 1, MOSS[rng.int(3)]);
}

const canvas = (w: number, h: number): [HTMLCanvasElement, Rect, CanvasRenderingContext2D] => {
  const c = document.createElement('canvas');
  (c.width = Math.max(1, w)), (c.height = Math.max(1, h));
  const g = c.getContext('2d')!;
  return [c, (x, y, w2, h2, col) => ((g.fillStyle = col), g.fillRect(x, y, w2, h2)), g];
};

/** Stone courses over rows y0 to y1: four pixels a course, blocks of eight or ten, grime in the lowest two. */
function courses(rect: Rect, rng: Rng, W: number, y0: number, y1: number, low: number): void {
  rect(0, y0, W, y1 - y0, MORTAR);
  for (let y = y0, row = 0; y < y1; y += 4, row++) {
    const damp = y >= low;
    for (let x = row % 2 ? -5 : 0; x < W; ) {
      const len = rng.next() < 0.5 ? 8 : 10, i = damp ? 0 : 1 + (rng.next() < 0.35 ? 1 : 0);
      const a = Math.max(0, x), b = Math.min(W, x + len - 1);
      if (b - a > 1) stone(rect, a, y, b - a, Math.min(3, y1 - y), i);
      x += len;
    }
  }
}

export interface FaceWin { x: number; y: number; w: number; h: number }
export interface Face { w: number; h: number; stone: boolean; door?: { x: number; w: number; h: number }; wins?: FaceWin[]; seed: number }

/** A wall face, w by h tiles, as a canvas (graded). Positions in tiles from its left and its foot. */
export function faceCanvas(f: Face, rng: Rng): HTMLCanvasElement {
  const W = Math.round(f.w * KX), H = Math.round(f.h * KY), [c, rect, g] = canvas(W, H), row = (y: number) => H - Math.round(y * KY);
  if (f.stone) courses(rect, rng, W, 0, H, H - 8);
  else {
    // Daub between timbers over a stone plinth: the plinth four courses, the daub three shades in bands, damp low.
    const plinth = Math.min(H, 16);
    rect(0, 0, W, H - plinth, DAUB[1]);
    for (let y = 0; y < H - plinth; y += 6) if (rng.next() < 0.5) rect(0, y, W, 2, DAUB[rng.next() < 0.5 ? 0 : 2]);
    rect(0, H - plinth - 3, W, 3, DAUB[0]);
    courses(rect, rng, W, H - plinth, H, H - 8);
    const rail = Math.round((H - plinth) * 0.45), post = (x: number, w: number) => (rect(x, 0, w, H - plinth, TIMBER[1]), rect(x, 0, 1, H - plinth, TIMBER[2]), rect(x + w - 1, 0, 1, H - plinth, TIMBER[0]));
    rect(0, rail, W, 3, TIMBER[1]), rect(0, rail, W, 1, TIMBER[2]), rect(0, rail + 2, W, 1, TIMBER[0]);
    rect(0, 0, W, 3, TIMBER[1]), rect(0, 2, W, 1, TIMBER[0]);
    for (let x = KX; x < W - 6; x += KX) post(x - 1, 2);
    post(0, 3), post(W - 3, 3);
    // A brace in each end panel, from the rail down to the plinth.
    for (const [x0, dir] of [[3, 1], [W - 4, -1]] as const) for (let k = 0; k < H - plinth - rail - 3; k++) rect(x0 + dir * Math.round(k * 0.8), rail + 3 + k, 2, 1, TIMBER[k % 3 ? 1 : 0]);
  }
  for (const w of f.wins ?? []) {
    // A window: a timber frame two pixels round a dark pane (the lit pane is the 3D one in front), a stone sill.
    const x = Math.round(w.x * KX - (w.w * KX) / 2), y = row(w.y + w.h), ww = Math.round(w.w * KX), hh = Math.round(w.h * KY);
    rect(x - 2, y - 2, ww + 4, hh + 4, TIMBER[1]), rect(x - 2, y - 2, ww + 4, 1, TIMBER[2]);
    rect(x, y, ww, hh, '#0a0808');
    rect(x - 3, y + hh + 2, ww + 6, 2, LIGHT[1]), rect(x - 3, y + hh + 3, ww + 6, 1, STONE[0]);
  }
  gradeCanvas(c, 'wall');
  // The doorway: clear, so the 3D door, its frame and the dark within show through.
  if (f.door) g.clearRect(Math.round(f.door.x * KX - (f.door.w * KX) / 2), row(f.door.h), Math.round(f.door.w * KX), Math.round(f.door.h * KY));
  return c;
}

/** A roof's front slope, w tiles wide and `rows` pixels from ridge to eave, slate or thatch (graded). */
export function roofCanvas(w: number, rows: number, thatch: boolean, rng: Rng): HTMLCanvasElement {
  const W = Math.round(w * KX), [c, rect] = canvas(W, rows);
  rect(0, 0, W, rows, MORTAR);
  if (thatch) {
    // Thatch: courses five pixels deep, three straw browns, a ragged darker edge at each course's foot, a few strands.
    const T = ['#3e3220', '#4e3e26', '#5e4a2e'];
    for (let y = 0; y < rows; y += 5) {
      rect(0, y, W, 5, T[1]);
      for (let x = 0; x < W; x += 1 + rng.int(3)) rect(x, y + rng.int(3), 1, 2, T[rng.next() < 0.5 ? 2 : 0]);
      for (let x = 0; x < W; x++) rect(x, y + 4 - (rng.next() < 0.4 ? 1 : 0), 1, 1, T[0]);
    }
  } else {
    // Slate: courses four pixels deep, slates six or seven wide, staggered; the odd one gone darker or mossed.
    for (let y = 0, row = 0; y < rows; y += 4, row++) for (let x = row % 2 ? -3 : 0; x < W; ) {
      const len = rng.next() < 0.5 ? 6 : 7, a = Math.max(0, x), b = Math.min(W, x + len - 1);
      if (b - a > 1) {
        stone(rect, a, y, b - a, Math.min(3, rows - y), rng.next() < 0.12 ? 0 : 1);
        if (rng.next() < 0.03) rect(a + 1, y + 1, Math.min(3, b - a - 1), 2, MOSS[rng.int(3)]);
      }
      x += len;
    }
  }
  rect(0, rows - 1, W, 1, MORTAR);
  gradeCanvas(c, 'roof');
  return c;
}
