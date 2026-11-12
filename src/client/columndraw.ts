/**
 * THE LISTENER's dripstone columns in the flat view (shared/cavearena.ts, sim/columns.ts, sim/columnshape.ts):
 * a tall tapered pillar of banded grey stone with green copper stain and a drip that runs down it, leaning the
 * way its `lean` points; set falling (`fallAt`) it topples along that lean, turning about its foot, to land at the
 * end of the striped lane; fallen it is a broken stump and a line of rubble. Drawing only.
 */
import { LISTENER } from '../shared/listentune';
import type { Prop } from '../sim/types';
import { shadow, type Ctx } from './draw';
import { PX } from './world';

/** How tall one stands (screen pixels). */
export const COL_H = 64;
const HI = ['#a09eb2', '#8a889c', '#6c6a80', '#4c4a5e', '#2e2c3a'];
const HI_TOP = ['#6e6c80', '#5c5a6e', '#484658', '#34323f', '#22202b'];
const hash = (n: number) => {
  const s = Math.sin(n * 91.7 + 3.3) * 43758.5453;
  return s - Math.floor(s);
};

/** Stone from `r0` to `r1` along an axis out of (bx, by): a tapered shaft in bands, light on the left, with copper stain. */
function shaft(g: CanvasRenderingContext2D, bx: number, by: number, ax: number, ay: number, r0: number, r1: number, w0: number, w1: number, seed: number, dim = 0): void {
  const px = -ay, py = ax;
  for (let r = r0; r < r1; r++) {
    const u = (r - r0) / Math.max(1, r1 - r0), w = (w0 + (w1 - w0) * u) * (0.95 + 0.1 * hash(seed + Math.floor(r / 3))), band = Math.floor((r + seed * 5) / 9) % 3, high = r / COL_H > 0.7 ? 1 : 0;
    const pal = high || dim ? HI_TOP : HI;
    for (let o = -w / 2; o <= w / 2; o += 1) {
      const q = o / (w / 2);
      let i = q < -0.55 ? 0 : q < 0 ? 1 : q < 0.55 ? 2 : 3;
      if (Math.abs(q) > 0.88) i = 4;
      else if (band === 1 && i > 0) i = Math.min(4, i + 1);
      let col = pal[i];
      // The drip's wet line down the lit side, and the green of copper in the bands.
      if (i === 1 && hash(seed * 7 + Math.floor(r / 5)) > 0.8 && Math.abs(q + 0.25) < 0.12) col = '#c4d8e8';
      else if (band === 2 && i >= 2 && hash(seed + r * 0.31 + o) > 0.9) col = dim ? '#2c4a46' : '#4f8f86';
      g.fillStyle = col;
      g.fillRect(Math.round(bx + ax * r + px * o), Math.round(by + ay * r + py * o), 1, 1);
    }
  }
}

/** A broken base: the stump a column leaves, its top jagged. */
function stump(g: CanvasRenderingContext2D, x: number, y: number, seed: number): void {
  const h = 9;
  shaft(g, x, y, 0, -1, 0, h, 15, 12, seed);
  g.fillStyle = '#2e2c3a';
  for (let i = -6; i <= 6; i += 2) g.fillRect(x + i, Math.round(y - h - hash(seed + i) * 3), 2, 1 + Math.floor(hash(seed + i + 9) * 3));
  g.fillStyle = '#8a889c';
  g.fillRect(x - 5, y - h - 1, 4, 1);
}

/** Standing columns are the same each frame: painted once per lean, then stamped. */
const cache = new Map<string, HTMLCanvasElement>();
function standing(lx: number, ly: number, seed: number): HTMLCanvasElement {
  const key = `${lx.toFixed(2)}:${ly.toFixed(2)}:${seed}`;
  let cv = cache.get(key);
  if (cv) return cv;
  cv = document.createElement('canvas');
  cv.width = 44, cv.height = COL_H + 10;
  const g = cv.getContext('2d')!, th = 0.1, bx = 22, by = COL_H + 6;
  shaft(g, bx, by, lx * Math.sin(th), ly * Math.sin(th) - Math.cos(th), 0, COL_H * (1 - 0.08 * Math.max(0, ly)), 16, 8, seed);
  // A lip of flowstone round the foot, and wet shine.
  g.fillStyle = '#34323f', g.fillRect(bx - 9, by - 1, 18, 2);
  g.fillStyle = '#8a889c', g.fillRect(bx - 8, by - 2, 6, 1);
  cache.set(key, cv);
  return cv;
}

const ease = (t: number) => t * t * (3 - 2 * t);

/** One column: standing, toppling about its foot, or lying broken. (x, y) is its foot on screen; `t` the room's time. */
export function drawColumn(c: Ctx, p: Prop, x: number, y: number, t: number): void {
  const g = c.lit, lean = p.lean ?? { x: 0, y: 1 }, n = Math.hypot(lean.x, lean.y) || 1, lx = lean.x / n, ly = lean.y / n, seed = Math.round(p.x * 7 + p.y * 3);
  const X = Math.round(x), Y = Math.round(y);
  if (p.fallen) {
    // Rubble: the stump, then the shaft in broken lengths down the lane, and grit between.
    stump(g, X, Y, seed);
    for (let i = 0; i < 5; i++) {
      const r0 = 12 + i * 10, len = 8 - i * 0.7, wob = (hash(seed + i) - 0.5) * 5;
      shaft(g, X + wob * -ly, Y + wob * lx, lx, ly * 0.9, r0, r0 + len, 14 - i * 1.6, 11 - i * 1.6, seed + i, 0);
    }
    g.fillStyle = '#6c6a80';
    for (let i = 0; i < 14; i++) {
      const r = 8 + hash(seed + i * 3) * 58, o = (hash(seed + i * 5) - 0.5) * 16;
      g.fillRect(Math.round(X + lx * r - ly * o), Math.round(Y + ly * r * 0.9 + lx * o), 1 + (i % 3 === 0 ? 1 : 0), 1);
    }
    return;
  }
  // Someone behind it (a hero or the Listener): the standing column goes see-through, so nobody's lost behind it.
  const fade = BEHIND.some((b) => b.y < p.y && p.y - b.y < COL_H / PX + 0.4 && Math.abs(b.x - p.x) < 0.9);
  if (fade) g.globalAlpha = 0.38;
  try {
    standingOrToppling(c, p, x, y, t, X, Y, lx, ly, seed);
  } finally {
    g.globalAlpha = 1;
  }
}

/** Who might be hidden behind a column this frame (scene.ts sets it before the props are drawn). */
let BEHIND: { x: number; y: number }[] = [];
export const columnWatch = (pts: { x: number; y: number }[]): void => void (BEHIND = pts);

function standingOrToppling(c: Ctx, p: Prop, x: number, y: number, t: number, X: number, Y: number, lx: number, ly: number, seed: number): void {
  const g = c.lit;
  void x, void y;
  if (p.fallAt !== undefined) {
    // Toppling: slow at first (the crack), then faster, turning about its foot toward the lean.
    const k = Math.min(1, Math.max(0, 1 - (p.fallAt - t) / LISTENER.column.fall)), th = 0.1 + (Math.PI / 2 - 0.1) * ease(k) ** 1.6;
    stump(g, X, Y, seed);
    const shake = k < 0.3 ? Math.round(Math.sin(c.now * 50) * (1 - k / 0.3)) : 0;
    shaft(g, X + shake, Y - 6, lx * Math.sin(th), ly * Math.sin(th) - Math.cos(th), 0, COL_H - 6, 16, 8, seed);
    // Grit shaken off it as it goes.
    if (k < 0.9) for (let i = 0; i < 4; i++) {
      const ph = (c.now * 3 + i * 0.27) % 1;
      g.fillStyle = '#8a8494', g.fillRect(Math.round(X + (hash(i + seed) - 0.5) * 14 * (1 + k)), Math.round(Y - 8 + ph * 12), 1, 1);
    }
    return;
  }
  shadow(c, X, Y, 9);
  g.drawImage(standing(lx, ly, seed), X - 22, Y - COL_H - 6);
  // The drip: a bead gathers at the lit edge, falls, and rings where it lands.
  const cyc = (c.now * 0.42 + hash(seed) * 5) % 1, gl = c.glow;
  const tipX = X + lx * 4 - 5, topY = Y - COL_H + 22;
  if (cyc < 0.6) {
    const d = cyc / 0.6, yy = topY + d * d * (COL_H - 22);
    gl.globalAlpha = 0.8, gl.fillStyle = '#d4ecff', gl.fillRect(Math.round(tipX), Math.round(yy), 1, d > 0.2 ? 2 : 1);
    gl.globalAlpha = 1;
  } else if (cyc < 0.78) {
    const d = (cyc - 0.6) / 0.18;
    gl.globalAlpha = 0.6 * (1 - d), gl.fillStyle = '#bfe0f4';
    gl.fillRect(Math.round(tipX - 1 - d * 3), Y + 1, 3 + Math.round(d * 6), 1);
    gl.globalAlpha = 1;
  }
}

/** The column's silhouette height, for callers that want it. */
export const columnH = () => COL_H;
