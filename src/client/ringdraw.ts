/**
 * The clearing for choosing a new hero (heroring.ts, docs/design/hero-select.md): night at the edge of the
 * wood above Wickhold, a campfire in the middle, pines round it, the road's head going off down the hill.
 * The ground and trees are painted once into a big canvas (fire at its middle) and blitted with the
 * camera; the fire is drawn each frame, its stones and logs lit, its flames and embers on the glow layer.
 * Drawing only; cosmetic randomness only.
 */
import type { Ctx } from './draw';
import type { Light } from './light';

/** The painted ground's size and where the fire sits in it (scene pixels). */
export const BG = { w: 720, h: 640, fx: 360, fy: 270 };
/** Where the road leaves the clearing and where it goes (fire at 0, 0). */
export const ROAD = { from: [-70, 26], to: [-330, 330] } as const;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)] / 16;
/** A steady number in [0, 1) for a cell (so the ground is the same every time). */
const hash = (x: number, y: number) => {
  let h = Math.imul(x * 374761393 + y * 668265263, 1274126177);
  h ^= h >>> 13;
  return ((h >>> 0) % 1000) / 1000;
};

const GRASS = ['#26332a', '#29372c', '#243028', '#2c3a2e'];
const DIRT = ['#4a3f34', '#463b31', '#4e4237', '#433930'];

/** How far (x, y) is from the road's middle (Infinity before it starts; fire at 0, 0). */
function roadDist(x: number, y: number): number {
  const [ax, ay] = ROAD.from, [bx, by] = ROAD.to, dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
  const k = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2));
  if (k <= 0) return Infinity;
  const px = ax + dx * k + Math.sin(k * 9) * 10, py = ay + dy * k;
  return Math.hypot(x - px, (y - py) * 1.2);
}
/** How far inside the road's band: above 0 on it, 1 at its middle. */
const onRoad = (x: number, y: number) => 1 - roadDist(x, y) / 13;

/** The clearing's bare earth round the fire: above 1 inside, 0 at its edge. */
const inClearing = (x: number, y: number) => 1 - Math.hypot(x / 96, y / 42);

/** The ground and the trees, painted once. */
export function paintClearing(): HTMLCanvasElement {
  const cv = Object.assign(document.createElement('canvas'), { width: BG.w, height: BG.h }), g = cv.getContext('2d')!;
  // Grass in 4 px cells, a dithered edge onto the earth of the clearing and the road.
  for (let y = 0; y < BG.h; y += 2) for (let x = 0; x < BG.w; x += 2) {
    const wx = x - BG.fx, wy = y - BG.fy, e = Math.max(inClearing(wx, wy), onRoad(wx, wy));
    const n = Math.floor(hash(x >> 2, y >> 2) * 4), dirt = e * 3 > bay(x >> 1, y >> 1);
    g.fillStyle = dirt ? DIRT[n] : GRASS[n];
    g.fillRect(x, y, 2, 2);
  }
  // Tufts on the grass, pebbles on the earth, ruts in the road.
  for (let i = 0; i < 1400; i++) {
    const x = Math.floor(hash(i, 7) * BG.w), y = Math.floor(hash(i, 13) * BG.h), wx = x - BG.fx, wy = y - BG.fy;
    const earth = inClearing(wx, wy) > 0.15 || onRoad(wx, wy) > 0.15;
    if (earth) (g.fillStyle = i % 3 ? '#5a4e40' : '#3a3129'), g.fillRect(x, y, 1, 1);
    else (g.fillStyle = i % 2 ? '#34463a' : '#1e2922'), g.fillRect(x, y, 1, 2), g.fillRect(x + 1, y + 1, 1, 1);
  }
  for (let k = 0.05; k < 1; k += 0.004) for (const off of [-4, 4]) {
    const [ax, ay] = ROAD.from, [bx, by] = ROAD.to, x = ax + (bx - ax) * k + Math.sin(k * 9) * 10 + off, y = ay + (by - ay) * k;
    g.fillStyle = '#3a3129', g.fillRect(Math.round(x + BG.fx), Math.round(y + BG.fy), 1, 1);
  }
  // Two logs to sit on, by the fire.
  log(g, BG.fx - 44, BG.fy + 16, 18), log(g, BG.fx + 30, BG.fy + 18, 16);
  // The pines: a ring well outside the heroes, none on the road, back ones first.
  const pines: [number, number, number][] = [];
  for (let i = 0; i < 70; i++) {
    const a = hash(i, 3) * Math.PI * 2, r = 1.25 + hash(i, 5) * 1.6, x = Math.cos(a) * 120 * r, y = Math.sin(a) * 66 * r;
    if (roadDist(x, y) < 34 || Math.abs(x) > BG.fx - 10 || y < -BG.fy + 50 || y > BG.h - BG.fy - 4) continue;
    pines.push([x, y, 0.8 + hash(i, 9) * 0.5]);
  }
  pines.sort((a, b) => a[1] - b[1]).forEach(([x, y, s]) => pine(g, Math.round(x + BG.fx), Math.round(y + BG.fy), s));
  return cv;
}

function log(g: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  g.fillStyle = '#14100c', g.fillRect(x - 1, y - 5, w + 2, 7);
  g.fillStyle = '#5a4030', g.fillRect(x, y - 4, w, 5);
  g.fillStyle = '#6e5038', g.fillRect(x, y - 4, w, 1);
  g.fillStyle = '#8a6a48', g.fillRect(x, y - 4, 2, 5), g.fillRect(x + w - 2, y - 4, 2, 5);
}

/** A dark pine: a trunk, its shadow, three tiers of needles, a lighter edge toward the fire. */
function pine(g: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const H = Math.round(54 * s), W = Math.round(17 * s), side = x < BG.fx ? 1 : -1;
  g.globalAlpha = 0.35, (g.fillStyle = '#000'), g.fillRect(x - W, y - 2, W * 2, 4), (g.globalAlpha = 1);
  g.fillStyle = '#120e0a', g.fillRect(x - 3, y - 13, 6, 14);
  g.fillStyle = '#3a2a1e', g.fillRect(x - 2, y - 12, 4, 12);
  for (let tier = 0; tier < 3; tier++) {
    const top = y - H + tier * Math.round(H * 0.2), bot = y - 10 - (2 - tier) * Math.round(H * 0.16), w = Math.round(W * (0.55 + tier * 0.22));
    for (let yy = top; yy <= bot; yy++) {
      const k = (yy - top) / Math.max(1, bot - top), half = Math.max(1, Math.round(w * k));
      g.fillStyle = '#0e1410', g.fillRect(x - half - 1, yy, half * 2 + 2, 1);
      g.fillStyle = (yy + tier) % 3 ? '#1c2a20' : '#203024', g.fillRect(x - half, yy, half * 2, 1);
      g.fillStyle = '#2c4232', g.fillRect(side > 0 ? x + half - 2 : x - half, yy, 2, 1);
    }
  }
}

/** The campfire at (x, y): a ring of stones, crossed logs, flames and embers. `flare` 0..1 when a hero leaves. */
export function drawCampfire(c: Ctx, x: number, y: number, now: number, flare: number): void {
  const g = c.lit;
  g.fillStyle = '#1a1614', g.fillRect(x - 10, y - 4, 20, 7);
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2, sx = Math.round(x + Math.cos(a) * 11) - 2, sy = Math.round(y + Math.sin(a) * 4) - 1;
    g.fillStyle = '#2a2630', g.fillRect(sx, sy, 5, 3);
    g.fillStyle = i % 2 ? '#7a7480' : '#6a6470', g.fillRect(sx, sy, 4, 2);
  }
  g.fillStyle = '#3a2a1e', g.fillRect(x - 7, y - 3, 14, 2), g.fillRect(x - 3, y - 5, 6, 2);
  g.fillStyle = '#ff6a2a', g.fillRect(x - 5, y - 2, 10, 1);
  // Flames: tongues of three colours, taller on a flare.
  const gl = c.glow, tall = 1 + flare * 0.7;
  for (let i = 0; i < 7; i++) {
    const fx = x - 6 + i * 2, k = 0.5 + 0.5 * Math.sin(now * (8 + i) + i * 1.9), mid = 1 - Math.abs(i - 3) / 4;
    const h = Math.round((4 + 9 * mid + 4 * k) * tall), lean = Math.round(Math.sin(now * 3 + i) * 1.2);
    gl.fillStyle = '#c8401a', gl.fillRect(fx, y - 2 - h, 2, h);
    gl.fillStyle = '#ff9a3c', gl.fillRect(fx + (lean > 0 ? 1 : 0), y - 2 - Math.round(h * 0.75), 1, Math.round(h * 0.7));
    if (mid > 0.4) (gl.fillStyle = '#ffe0a0'), gl.fillRect(fx, y - 2 - Math.round(h * 0.4), 2, Math.round(h * 0.35));
  }
  // Embers going up and winking out.
  for (let i = 0; i < 9 + Math.round(flare * 14); i++) {
    const life = 1.6 + (i % 4) * 0.4, p = ((now + i * 0.37) % life) / life, ex = x + Math.round(Math.sin(i * 2.3 + now * 1.5 + p * 4) * (3 + p * 6)), ey = y - 10 - Math.round(p * (34 + flare * 40));
    if (p > 0.85 && i % 2) continue;
    gl.fillStyle = p < 0.5 ? '#ffd27a' : '#ff7a3a', gl.fillRect(ex, ey, 1, 1);
  }
}

/** The fire's light, flickering; brighter and wider on a flare. */
export function fireLights(x: number, y: number, now: number, flare: number): Light[] {
  const f = Math.sin(now * 7.3) * 3 + Math.sin(now * 13.1) * 2;
  return [
    { x, y: y - 6, r: 118 + f + flare * 70, i: 0.95 + flare * 0.7, c: [1, 0.6, 0.3] },
    { x, y: y - 4, r: 34 + f, i: 0.5 + flare * 0.4, c: [1, 0.78, 0.5] },
  ];
}
