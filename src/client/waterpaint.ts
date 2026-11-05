/**
 * Water on the floor painting. Deep water runs dark with slow ripples and you can't wade it. A ford is
 * plainly the way over: paler shallows with the sandy bottom showing, a line of stepping stones across,
 * and white water breaking at its edges where the deep begins. Bog pools and streams are shallow
 * without the stones in a line.
 *
 * Flat (`flat`), the water also sits below the bank (Kyle: "maps with water look kind of weird ...
 * maybe water can be more 3D"): the far bank's face shows as a strip of earth along the top of the
 * water, a step of wet stone where shallows drop to deep, and deep water darkens toward its middle in
 * stepped bands with a little ordered dither (light.ts's look). The 2.5D view lays the painting without
 * those and builds the drop itself (three/water3d.ts); the moving surface is drawn each frame
 * (wetdraw.ts, three/water3d.ts).
 */
import type { GameMap, Water } from '../shared/arena';
import type { Rng } from '../shared/rng';
import { DEEP, DRY, waterField, type WaterField } from './waterfield';

type Rect = (x: number, y: number, w: number, h: number, c: string) => void;

const touches = (a: Water, b: Water) => Math.abs(a.y - b.y) < 0.6 && (Math.abs(a.x + a.w - b.x) < 0.05 || Math.abs(b.x + b.w - a.x) < 0.05);

export function paintWater(m: GameMap, rect: Rect, rng: Rng, toPx: (x: number, y: number) => [number, number], PX: number, g?: CanvasRenderingContext2D): void {
  const all = m.water ?? [];
  for (const wt of all) {
    const [x0, y0] = toPx(wt.x, wt.y), w = Math.round(wt.w * PX), h = Math.round(wt.h * PX);
    const ford = !wt.deep && all.some((d) => d.deep && touches(wt, d));
    rect(x0 - 1, y0 - 1, w + 2, h + 2, wt.deep ? '#1a2a22' : '#3a3a2a');
    rect(x0, y0, w, h, wt.deep ? '#122036' : ford ? '#557a7c' : '#3e5a62');
    if (wt.deep) {
      for (let i = 0; i < (w * h) / 60; i++) rect(x0 + rng.int(Math.max(1, w - 3)), y0 + rng.int(h), 3, 1, rng.next() < 0.5 ? '#1a2c46' : '#22405c');
      // The current: long faint streaks across.
      for (let i = 0; i < w / 14; i++) rect(x0 + rng.int(Math.max(1, w - 8)), y0 + 2 + rng.int(Math.max(1, h - 4)), 6 + rng.int(4), 1, '#2a4a66');
    } else {
      // The bottom showing through: sand and pebbles.
      for (let i = 0; i < (w * h) / (ford ? 9 : 14); i++) rect(x0 + rng.int(Math.max(1, w - 2)), y0 + rng.int(h), 2, 1, rng.next() < 0.5 ? (ford ? '#8a8666' : '#6a6a52') : '#5e7a76');
      if (ford) {
        // Stepping stones in a line across, a little off true, each with its lit top and a dark wet foot.
        const cx = x0 + Math.floor(w / 2);
        for (let y = y0 + 2, k = 0; y < y0 + h - 3; y += 6, k++) {
          const x = cx - 3 + (k % 2 ? 2 : -2) + rng.int(2);
          rect(x, y, 6, 4, '#8e8a78'), rect(x + 1, y, 4, 1, '#b8b4a0'), rect(x, y + 4, 6, 1, '#2e3e44');
        }
        // White water where it breaks over the lip into the deep, either side.
        for (const d of all) if (d.deep && touches(wt, d)) {
          const ex = d.x > wt.x ? x0 + w - 2 : x0;
          for (let y = y0; y < y0 + h; y += 2) if (rng.next() < 0.75) rect(ex + rng.int(2), y, 2, 1, rng.next() < 0.5 ? '#c8dcdc' : '#9ab8bc');
        }
      } else for (let y = y0 + 4; y < y0 + h - 3; y += 7) {
        const x = x0 + 3 + rng.int(Math.max(1, w - 10));
        rect(x, y, 5, 3, '#8a8474'), rect(x + 1, y, 3, 1, '#a8a290'), rect(x, y + 3, 5, 1, '#2e3e44');
      }
    }
    if (!g) rect(x0, y0, w, 1, wt.deep ? '#2a4a5a' : ford ? '#a2c0c0' : '#7a9a9a');
  }
  const f = waterField(m);
  if (g && f) sunk(m, g, f, toPx, PX);
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Deep water's shade by how far in from the bank (cells), in steps: lighter at the edge, darkest mid-river. */
const DEPTH = [1.18, 1, 0.82, 0.68];
/** The far bank's face, top row down: lit lip, earth, the dark wet line at the water. Then wet stone where shallows drop to deep. */
const BANK = [[86, 74, 54], [58, 48, 36], [40, 33, 26], [22, 20, 18]];
const STEP = [[120, 140, 132], [62, 80, 80]];

/** The drop to the water (flat only): the bank's face along its top, and depth in the deep. */
function sunk(m: GameMap, g: CanvasRenderingContext2D, f: WaterField, toPx: (x: number, y: number) => [number, number], PX: number): void {
  // Only round the water (a big map's river is a strip of it).
  const ws = m.water ?? [], x0 = Math.max(0, Math.floor(Math.min(...ws.map((w) => w.x)) * PX)), y0 = Math.max(0, Math.floor(Math.min(...ws.map((w) => w.y)) * PX));
  const x1 = Math.min(Math.round(m.w * PX), Math.ceil(Math.max(...ws.map((w) => w.x + w.w)) * PX)), y1 = Math.min(Math.round(m.h * PX), Math.ceil(Math.max(...ws.map((w) => w.y + w.h)) * PX));
  const [ox, oy] = toPx(0, 0), W = x1 - x0, H = y1 - y0;
  if (W <= 0 || H <= 0) return;
  const img = g.getImageData(ox + x0, oy + y0, W, H), d = img.data;
  const lv = (qx: number, qy: number) => {
    const px = qx + x0, py = qy + y0;
    const i = Math.floor((px / PX) * f.n), j = Math.floor((py / PX) * f.n);
    return i < 0 || j < 0 || i >= f.cols || j >= f.rows ? -1 : f.level[j * f.cols + i];
  };
  const far = (qx: number, qy: number) => f.far[Math.floor(((qy + y0) / PX) * f.n) * f.cols + Math.floor(((qx + x0) / PX) * f.n)] * (16 / f.n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const L = lv(x, y);
    if (L <= DRY) continue;
    const k = (y * W + x) * 4;
    // The face: how many rows down from a lower level above (map edges aren't banks).
    let row = -1, from = L;
    for (let r = 1; r <= (L === DEEP ? 4 : 2); r++) {
      const up = lv(x, y - r);
      if (up >= 0 && up < L) (row = r - 1), (from = up);
      if (up >= 0 && up < L) break;
    }
    if (row >= 0) {
      const c = from === DRY ? BANK[L === DEEP ? row : row + 2] : STEP[Math.min(row, 1)];
      if (c) [d[k], d[k + 1], d[k + 2]] = c;
      continue;
    }
    if (L !== DEEP) continue;
    const t = BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5, band = Math.max(0, Math.min(3, Math.floor(far(x, y) / 9 + t * 0.9)));
    const s = DEPTH[band];
    d[k] = Math.min(255, d[k] * s);
    d[k + 1] = Math.min(255, d[k + 1] * s);
    d[k + 2] = Math.min(255, d[k + 2] * s);
  }
  g.putImageData(img, ox + x0, oy + y0);
}
