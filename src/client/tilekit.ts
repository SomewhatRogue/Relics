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
// (Daub is drawn grey, so it takes the house's own wall colour with the stone: tint below.)
const TIMBER = ['#24180f', '#3a2a1e', '#4e3826'], DAUB = ['#363636', '#404040', '#4a4a4a'];

function stone(rect: Rect, x: number, y: number, w: number, h: number, i: number): void {
  rect(x, y, w, h, STONE[i]);
  rect(x, y, w - 1, 1, LIGHT[i]);
  rect(x, y, 1, h, LIGHT[i]);
  if (i) rect(x + w - 1, y + 1, 1, h - 1, STONE[i - 1]);
}

/** One floor tile of a stone street or flags at (x, y): 20 by 12, four cobbles, two half slabs or one slab. */
export function floorStamp(rect: Rect, rng: Rng, x: number, y: number, slabs: boolean): void {
  rect(x, y, KX, KZ, MORTAR);
  // (Mostly the darker stone: the ground stays a step under the walls, the quietest tier.)
  const v = rng.next(), lit = () => (rng.next() < 0.7 ? 0 : 1);
  if (v < (slabs ? 0.45 : 0.08)) stone(rect, x, y, KX - 1, KZ - 1, lit());
  else if (v < (slabs ? 0.85 : 0.28)) stone(rect, x, y, KX - 1, 5, lit()), stone(rect, x, y + 6, KX - 1, 5, lit());
  else for (const [i, j] of [[0, 0], [10, 0], [0, 6], [10, 6]]) stone(rect, x + i, y + j, 9, 5, lit());
  if (rng.next() < 0.14) rect(x + rng.int(12), y + KZ - 1, 3 + rng.int(4), 1, MOSS[rng.int(3)]);
}

/**
 * A building's own colour on its drawn stone, daub or slate: every slate-grey pixel in rows 0 to `rows` takes the hue
 * and saturation of `base` (0xrrggbb, already graded), its lightness scaled so the middle shade lands on base's. The
 * few shades stay a few shades; timber, moss and thatch, not grey, keep theirs.
 */
export function tint(c: HTMLCanvasElement, base: number, rows = c.height): void {
  const g = c.getContext('2d')!, img = g.getImageData(0, 0, c.width, Math.min(rows, c.height)), d = img.data;
  const [bh, bs, bl] = hsl((base >> 16) & 255, (base >> 8) & 255, base & 255), k = bl / 0.25;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const [h, sat, l] = hsl(d[i], d[i + 1], d[i + 2]);
    if (!(sat < 0.06 || (sat < 0.3 && h >= 190 && h <= 335))) continue;
    const v = rgb(bh, Math.min(0.5, bs), Math.min(0.8, l * k));
    (d[i] = v >> 16), (d[i + 1] = (v >> 8) & 255), (d[i + 2] = v & 255);
  }
  g.putImageData(img, 0, 0);
}

function hsl(r: number, g: number, b: number): [number, number, number] {
  (r /= 255), (g /= 255), (b /= 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (d < 1e-6) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1)), h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function rgb(h: number, s: number, l: number): number {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const q = (v: number) => Math.max(0, Math.min(255, Math.round((v + m) * 255)));
  return (q(r) << 16) | (q(g) << 8) | q(b);
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
      const len = rng.next() < 0.5 ? 8 : 10, i = damp ? 0 : 1 + (rng.next() < 0.5 ? 1 : 0);
      const a = Math.max(0, x), b = Math.min(W, x + len - 1);
      if (b - a > 1) stone(rect, a, y, b - a, Math.min(3, y1 - y), i);
      x += len;
    }
  }
}

export interface FaceWin { x: number; y: number; w: number; h: number }
/** `base`: the building's own wall colour (graded), laid on its stone or daub (tint). */
export interface Face { w: number; h: number; stone: boolean; door?: { x: number; w: number; h: number }; wins?: FaceWin[]; seed: number; base?: number }

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
  // The living world's L3: grime under the eaves; ivy up a third of the stone faces from a foot corner (before the
  // windows, so it never covers one). Greens are not grey, so tint leaves them; the grade keeps moss's hue.
  rect(0, 0, W, 2, '#1c1c1c');
  const hs = (k: number) => ((Math.sin(f.seed * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
  if (f.stone && hs(1) < 0.34) {
    const left = hs(2) < 0.5, reach = Math.round(H * (0.45 + hs(3) * 0.3)), IVY = ['#18221a', '#25331f', '#344628'];
    for (let y = H - 3, k = 0; y > H - reach; y -= 3, k++) {
      const spread = Math.max(3, Math.round(10 - (k * 7) / Math.max(1, reach / 3))), x0 = left ? Math.round(hs(10 + k) * 3) : W - spread - Math.round(hs(10 + k) * 3);
      rect(x0, y, spread, 3, IVY[1]);
      rect(x0, y + 2, spread, 1, IVY[0]);
      rect(x0, y, Math.max(1, Math.floor(spread / 2)), 1, IVY[2]);
    }
  }
  for (const w of f.wins ?? []) {
    // A window: a timber frame two pixels round a dark pane (the lit pane is the 3D one in front), a stone sill.
    const x = Math.round(w.x * KX - (w.w * KX) / 2), y = row(w.y + w.h), ww = Math.round(w.w * KX), hh = Math.round(w.h * KY);
    // Soot over the window: a stain tapering up from its head.
    rect(x, y - 4, ww, 2, '#1e1e1e'), rect(x + 2, y - 6, Math.max(1, ww - 4), 2, '#262626');
    rect(x - 2, y - 2, ww + 4, hh + 4, TIMBER[1]), rect(x - 2, y - 2, ww + 4, 1, TIMBER[2]);
    rect(x, y, ww, hh, '#0a0808');
    rect(x - 3, y + hh + 2, ww + 6, 2, LIGHT[1]), rect(x - 3, y + hh + 3, ww + 6, 1, STONE[0]);
  }
  gradeCanvas(c, 'wall');
  // A timber house's colour is its daub's (its plinth stays stone); a stone one's is its stone's.
  if (f.base !== undefined) tint(c, f.base, f.stone ? H : H - Math.min(H, 16));
  // The doorway: clear, so the 3D door, its frame and the dark within show through.
  if (f.door) g.clearRect(Math.round(f.door.x * KX - (f.door.w * KX) / 2), row(f.door.h), Math.round(f.door.w * KX), Math.round(f.door.h * KY));
  return c;
}

/**
 * A roof slope as a cols by rows canvas, slate or thatch (graded). `side`: the slope runs down the screen's side, not
 * toward the camera (a building turned east or west), so its courses run up and down the picture.
 */
export function roofCanvas(cols: number, rows: number, thatch: boolean, rng: Rng, side = false, base?: number): HTMLCanvasElement {
  if (side) {
    const flat = roofCanvas(rows, cols, thatch, rng, false, base), [c, , g] = canvas(cols, rows);
    g.translate(cols, 0), g.rotate(Math.PI / 2), g.drawImage(flat, 0, 0);
    return c;
  }
  const W = cols, [c, rect] = canvas(W, rows);
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
  if (base !== undefined && !thatch) tint(c, base);
  return c;
}

/** A level's retaining wall, cols by rows: stone courses, damp at the foot, a pale coping along the top (graded). */
export function ledgeCanvas(cols: number, rows: number, rng: Rng): HTMLCanvasElement {
  const [c, rect] = canvas(cols, rows);
  courses(rect, rng, cols, 0, rows, rows - 8);
  rect(0, 0, cols, 2, LIGHT[2]), rect(0, 2, cols, 1, MORTAR);
  gradeCanvas(c, 'wall');
  return c;
}

/** A step's tread (lit, a pale front edge) or riser (in shadow), cols by rows, slabs ten pixels wide (graded). */
export function stepCanvas(cols: number, rows: number, riser: boolean, rng: Rng): HTMLCanvasElement {
  const [c, rect] = canvas(Math.max(1, cols), Math.max(1, rows));
  for (let x = 0, k = rng.int(10); x < cols; x += 10, k++) {
    stone(rect, x, 0, Math.min(10, cols - x), rows, riser ? 0 : k % 3 ? 0 : 1);
    rect(x + 9, 0, 1, rows, MORTAR);
  }
  // (A pale edge on every tread made a flight read as a grate: the nosing one shade up, not three.)
  if (riser) rect(0, 0, cols, 1, MORTAR);
  else rect(0, rows - 1, cols, 1, LIGHT[0]);
  gradeCanvas(c, 'wall');
  return c;
}
