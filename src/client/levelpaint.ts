/**
 * Stacked levels in the flat view (docs/design/town-layout.md), as three/layoutledges.ts draws them in 2.5D: a map
 * whose ledges carry a level (`lv`, the new town) is painted with each level's top lifted `lv` times LIFT (the floor
 * already painted under it, moved up, so cobbles, soil and marks run on up as the 2.5D floor's UVs do), a coursed
 * stone face below its front wherever the ground there is lower, and its ramps as flights of steps. A land's raised
 * area (`kind: 'earth'`, docs/design/elevation.md "Raised areas") is an earth bank with a turf lip, leaning out at
 * its sides, and log steps between two posts, as three/landledges.ts draws it. Drawing only;
 * shared/arena.ts decides who stands where. `upAt` is how far up anything standing at a point is drawn.
 */
import { FACE_FOOT, levelAt, type Area, type GameMap, type Ledge } from '../shared/arena';
import { Rng } from '../shared/rng';
import { LIFT, OX, OY, PX } from './world';

/** Whether a map's ledges are stacked levels (the new town) rather than a job's rock shelves. */
export const stacked = (m: GameMap) => !!m.ledges?.some((l) => l.lv !== undefined);

/** How far up (pixels) something standing at (x, y) is drawn: its level's height, on a stacked map only. */
export const upAt = (m: GameMap, x: number, y: number) => (stacked(m) ? levelAt(m, x, y) * LIFT : 0);
/** `upAt` for one map, asked many times a frame: nothing at all off a stacked map. */
export const lifter = (m: GameMap): ((x: number, y: number) => number) => (stacked(m) ? (x, y) => levelAt(m, x, y) * LIFT : () => 0);

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;
const STONE = ['#5a5664', '#625d6c', '#545060', '#4e4a58'];

/** A coursed stone face, `x0`..`x1` (pixels) wide, from `top` down `h` pixels, and a shadow on the ground at its foot. */
function face(rect: Rect, rng: Rng, x0: number, x1: number, top: number, h: number): void {
  rect(x0, top, x1 - x0, h, '#2a2730');
  for (let y = 0, row = 0; y < h; y += 4, row++) {
    for (let x = x0 - (row % 2 ? 3 : 0); x < x1; ) {
      const len = 9 + rng.int(7), a = Math.max(x, x0), b = Math.min(x + len - 1, x1);
      if (b > a) rect(a, top + y, b - a, Math.min(3, h - y), STONE[rng.int(STONE.length)]);
      x += len;
    }
  }
  // A coping along the top, lit; the ground at its foot in shadow.
  rect(x0, top, x1 - x0, 2, '#7a7684');
  rect(x0, top + 2, x1 - x0, 1, '#24212a');
  rect(x0, top + h, x1 - x0, 4, 'rgba(0,0,0,0.4)');
}

// A land's bank: lit earth at the lip going dark at the foot, the turf along its top, the stones in it.
const EARTH = [0x7a, 0x64, 0x4a], FOOT = [0x2e, 0x24, 0x1a], TURF = '#6c8a3a', TURF2 = '#3a4a22', PEBBLE = ['#8a8478', '#6e685e'];
const mix = (k: number) => `rgb(${EARTH.map((v, i) => Math.round(v + (FOOT[i] - v) * k)).join(',')})`;

/** An earth bank's front, `x0`..`x1` wide, from `top` down `h` pixels: the same reading as the stone face, in earth. */
function bank(rect: Rect, rng: Rng, x0: number, x1: number, top: number, h: number): void {
  for (let y = 0; y < h; y++) rect(x0, top + y, x1 - x0, 1, mix(Math.min(1, (y / Math.max(1, h - 1)) * 0.95)));
  for (let x = x0; x < x1; x++) {
    if (rng.next() < 0.06 && h > 6) rect(x, top + 3 + rng.int(Math.max(1, h - 5)), 2, 1, PEBBLE[rng.int(2)]);
    // The turf lip, a tuft hanging over it here and there.
    rect(x, top, 1, 2, rng.next() < 0.75 ? TURF : TURF2);
    if (rng.next() < 0.22) rect(x, top + 2, 1, 1 + rng.int(2), TURF2);
  }
  rect(x0, top + h, x1 - x0, 5, 'rgba(0,0,0,0.38)');
}

/** An earth bank's side over one run of y: it leans out FACE_FOOT at its foot, so it shows as a strip going down and dark. */
function bankSide(rect: Rect, x: number, out: 1 | -1, y0: number, h: number, lo: number, up: number): void {
  const n = Math.round(FACE_FOOT * PX);
  for (let i = 0; i < n; i++) rect(out > 0 ? x + i : x - 1 - i, y0 - Math.round(lo + (up - lo) * (1 - (i + 0.5) / n)), 1, h, i ? mix(0.15 + (0.8 * i) / n) : TURF);
  rect(out > 0 ? x + n : x - n - 3, y0 - lo, 3, h, 'rgba(0,0,0,0.3)');
}

/** One level's top, moved up from the painting under it, and its faces where the ground beside is lower. */
function level(m: GameMap, l: Ledge, g: CanvasRenderingContext2D, snap: HTMLCanvasElement, rect: Rect, rng: Rng): void {
  const lv = l.lv ?? 1, up = lv * LIFT, x = OX + l.x * PX, y = OY + l.y * PX, w = l.w * PX, h = l.h * PX;
  g.drawImage(snap, x, y, w, h, x, y - up, w, h);
  // Its front, in half-tile runs: a face down to whatever level is in front.
  const fy = l.y + l.h;
  for (let a = l.x; a < l.x + l.w - 1e-6; a += 0.5) {
    const b = Math.min(a + 0.5, l.x + l.w), lo = fy < m.h ? levelAt(m, (a + b) / 2, fy + 0.2) : 0;
    if (lo < lv) (l.kind === 'earth' ? bank : face)(rect, rng, OX + a * PX, OX + b * PX, OY + fy * PX - up, (lv - lo) * LIFT);
  }
  // Its sides: a dark seam where the ground beside is lower (a three-quarter view doesn't show the side face).
  for (const [sx, dx] of [[l.x, -0.2], [l.x + l.w, 0.2]] as const) {
    if (sx <= 0 || sx >= m.w) continue;
    for (let a = l.y; a < l.y + l.h - 1e-6; a += 0.5) {
      const b = Math.min(a + 0.5, l.y + l.h);
      const lo = levelAt(m, sx + dx, (a + b) / 2);
      if (lo >= lv) continue;
      if (l.kind === 'earth') bankSide(rect, OX + sx * PX, dx < 0 ? -1 : 1, OY + a * PX, Math.ceil((b - a) * PX), lo * LIFT, up);
      else rect(OX + sx * PX - (dx < 0 ? 0 : 1), OY + a * PX - up, 1, (b - a) * PX, '#1d1b24');
    }
  }
}

/** A marker post at the foot of a land's steps (its feet at (x, y)): seen from across the field. */
function post(rect: Rect, x: number, y: number): void {
  rect(x, y - 13, 2, 13, '#3a2c1c'), rect(x - 1, y - 14, 4, 2, '#b8a070'), rect(x - 1, y, 5, 2, 'rgba(0,0,0,0.35)');
}

/** A ramp as a flight of steps from the level on its low side to the level on its high side (as layoutledges.ts),
 *  cut into the upper level: `k` steps, the top one at the high level. */
const STEP = { a: '#6a6674', b: '#5e5a68', lit: '#8a8694', dark: '#2e2b34', lip: '#4a4652', riser: '#3a3642', seam: '#1d1b24', edge: '#7a7684' };
// A land's steps: trodden earth treads, a log to each riser.
const LOGS = { a: '#74623f', b: '#665538', lit: '#9a8458', dark: '#2a2016', lip: '#4a3a24', riser: '#3a2c1c', seam: '#2a2016', edge: '#8a7450' };

function flight(m: GameMap, q: Area, rect: Rect, earth = false): void {
  const P = earth ? LOGS : STEP;
  const mx = q.x + q.w / 2, my = q.y + q.h / 2, lv = (x: number, y: number) => levelAt(m, x, y);
  const n = lv(mx, q.y - 0.2), s = lv(mx, q.y + q.h + 0.2), w = lv(q.x - 0.2, my), e = lv(q.x + q.w + 0.2, my);
  const alongY = n !== s || w === e, lo = alongY ? Math.min(n, s) : Math.min(w, e), hi = alongY ? Math.max(n, s) : Math.max(w, e);
  const len = alongY ? q.h : q.w, k = Math.max(2, Math.round(((hi - lo) * LIFT) / 3)), d = len / k;
  // Step i counted from the low end: how high its tread is drawn, and its colour.
  const H = (i: number) => Math.round((lo + ((hi - lo) * (i + 1)) / k) * LIFT), tread = (i: number) => (i % 2 ? P.b : P.a);
  if (alongY) {
    // North to south, so a step nearer you lies over the one behind it; risers show only on a flight up northward.
    const x0 = OX + q.x * PX, ww = q.w * PX, upN = n > s;
    for (let j = 0; j < k; j++) {
      const i = upN ? k - 1 - j : j, y0 = Math.round(OY + (q.y + j * d) * PX), y1 = Math.round(OY + (q.y + (j + 1) * d) * PX), ty = y0 - H(i);
      rect(x0, ty, ww, y1 - y0, tread(i));
      rect(x0, ty, ww, earth ? 2 : 1, upN ? P.lit : P.dark);
      if (!upN) rect(x0, y1 - H(i) - 1, ww, 1, P.lip);
      if (upN) rect(x0, y1 - H(i), ww, H(i) - (i ? H(i - 1) : lo * LIFT), P.riser);
    }
    for (const x of [x0, x0 + ww - 1]) rect(x, OY + q.y * PX - hi * LIFT, 1, q.h * PX + (hi - lo) * LIFT, P.seam);
    if (earth) for (const x of [x0 - 3, x0 + ww + 1]) post(rect, x, OY + (upN ? q.y + q.h : q.y) * PX - lo * LIFT);
    return;
  }
  // Across: a column per step, its tread lifted to its height and a face below it down to the ground in front.
  const upW = w > e, y0 = OY + q.y * PX, hh = q.h * PX;
  for (let j = 0; j < k; j++) {
    const i = upW ? k - 1 - j : j, x0 = Math.round(OX + (q.x + j * d) * PX), x1 = Math.round(OX + (q.x + (j + 1) * d) * PX);
    const front = Math.min(H(i), lv(q.x + (j + 0.5) * d, q.y + q.h + 0.2) * LIFT);
    rect(x0, y0 - H(i), x1 - x0, hh, tread(i));
    rect(x0, y0 - H(i) + hh, x1 - x0, H(i) - front, P.riser);
    rect(upW ? x1 - 1 : x0, y0 - H(i), 1, hh, P.edge);
  }
  if (earth) for (const y of [y0 - 2, y0 + hh + 2]) post(rect, OX + (upW ? q.x + q.w : q.x) * PX + (upW ? 1 : -3), y - lo * LIFT);
}

/** Every stacked level of the map, lowest first, then their steps. `g` holds the map's painting so far. */
export function paintLevels(m: GameMap, g: CanvasRenderingContext2D): void {
  const snap = document.createElement('canvas');
  snap.width = g.canvas.width;
  snap.height = g.canvas.height;
  snap.getContext('2d')!.drawImage(g.canvas, 0, 0);
  const rng = new Rng(m.w * 17 + m.h * 3), rect: Rect = (x, y, w, h, col) => ((g.fillStyle = col), g.fillRect(x, y, w, h));
  const all = [...(m.ledges ?? [])].sort((a, b) => (a.lv ?? 1) - (b.lv ?? 1));
  for (const l of all) level(m, l, g, snap, rect, rng);
  for (const l of all) for (const q of l.ramps) flight(m, q, rect, l.kind === 'earth');
}
