/**
 * The water in the flat view, each frame (paint only): a slow surface of stepped highlights moving
 * with the current (east or down a river, barely stirring in a pool), blood clouding in it, rings
 * spreading from feet and splashes, and chunks going under. Drawn into the lit layer over the painted
 * water and under everyone, clipped to the water, from small sprites made once (cheap on a phone).
 */
import type { GameMap, Water } from '../shared/arena';
import { DEEP, DRY, SOUTH, STILL, levelAt, type WaterField } from './waterfield';
import { cloudStrength, ringStrength, WET, type Wet } from './wetfx';
import { OX, OY, PX } from './world';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x: number, y: number) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  (c.width = w), (c.height = h);
  return [c, c.getContext('2d')!];
}

/** The surface's highlights: wavy bands of short dashes in two tones, tiling, laid along the current. */
const tiles = new Map<string, HTMLCanvasElement>();
function surface(deep: boolean, down: boolean): HTMLCanvasElement {
  const key = `${deep}${down}`, had = tiles.get(key);
  if (had) return had;
  const S = 64, [c, g] = canvas(S, S), lo = deep ? '#24425c' : '#7aa2a4', hi = deep ? '#36607a' : '#a8cccc';
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    // Along (a) and across (b) the current; long thin bands of light, broken up, a brighter crest in each.
    const a = down ? y : x, b = down ? x : y, n = Math.sin((a / S) * Math.PI * 4 + Math.sin((b / S) * Math.PI * 6) * 1.4) * Math.sin((b / S) * Math.PI * (deep ? 6 : 8) + Math.sin((a / S) * Math.PI * 2) * 0.8);
    if (n > 0.86 + bay(x, y) * 0.12) (g.fillStyle = hi), g.fillRect(x, y, 1, 1);
    else if (n > 0.68 + bay(x, y) * 0.24) (g.fillStyle = lo), g.fillRect(x, y, 1, 1);
  }
  tiles.set(key, c);
  return c;
}

/** A cloud of blood as a dithered blob, `lvl` of 4 strong, radius r pixels. */
const blobs = new Map<string, HTMLCanvasElement>();
function blob(r: number, lvl: number, deep: boolean): HTMLCanvasElement {
  const key = `${r}:${lvl}:${deep}`, had = blobs.get(key);
  if (had) return had;
  const S = r * 2 + 1, [c, g] = canvas(S, S), cols = deep ? ['#3a1018', '#521420'] : ['#5a1a1e', '#7a1d1d'];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const d = Math.hypot(x - r, (y - r) * 1.35) / r, v = (lvl / 4) * (1 - d * d);
    // A solid body, dithered only at its thin edge (no lace of single pixels).
    if (v > 0.12 + bay(x, y) * 0.18) (g.fillStyle = cols[v > 0.55 ? 1 : 0]), g.fillRect(x, y, 1, 1);
  }
  blobs.set(key, c);
  return c;
}

/** A ring on the water, r pixels across (squashed for the three-quarter view); `weak` every other dot. */
const rings = new Map<string, HTMLCanvasElement>();
function ring(r: number, weak: boolean): HTMLCanvasElement {
  const key = `${r}:${weak}`, had = rings.get(key);
  if (had) return had;
  const ry = Math.max(1, Math.round(r * 0.6)), [c, g] = canvas(r * 2 + 1, ry * 2 + 1), n = Math.max(8, Math.round(r * 6));
  g.fillStyle = weak ? '#7a9aa4' : '#b8d4d8';
  for (let i = 0; i < n; i++) if (!weak || i % 2 === 0) g.fillRect(Math.round(r + Math.cos((i / n) * 6.283) * r), Math.round(ry + Math.sin((i / n) * 6.283) * ry), 1, 1);
  rings.set(key, c);
  return c;
}

/** The water's boxes on screen, each with whether it's deep and which way it runs. */
interface Box { w: Water; deep: boolean; way: number; top: number }
function onScreen(m: GameMap, f: WaterField, cx: number, cy: number, vw: number, vh: number): Box[] {
  const out: Box[] = [];
  for (const w of m.water ?? []) {
    const x = OX + w.x * PX - cx, y = OY + w.y * PX - cy;
    if (x > vw || y > vh || x + w.w * PX < 0 || y + w.h * PX < 0) continue;
    const i = Math.floor((w.x + w.w / 2) * f.n), j = Math.floor((w.y + w.h / 2) * f.n), way = f.flow[Math.min(f.rows - 1, j) * f.cols + Math.min(f.cols - 1, i)];
    // Under the far bank's face (waterpaint.ts) the surface starts a few pixels down.
    const top = levelAt(f, w.x + w.w / 2, w.y - 0.05) === DRY ? (w.deep ? 4 : 2) : 0;
    out.push({ w, deep: !!w.deep, way, top });
  }
  return out;
}

export function drawWet(g: CanvasRenderingContext2D, wet: Wet, m: GameMap, cx: number, cy: number, now: number): void {
  const f = wet.field;
  if (!f) return;
  const vw = g.canvas.width, vh = g.canvas.height, boxes = onScreen(m, f, cx, cy, vw, vh);
  if (!boxes.length) return;
  const clip = (keep: (b: Box) => boolean) => {
    g.beginPath();
    for (const b of boxes) if (keep(b)) g.rect(Math.round(OX + b.w.x * PX - cx), Math.round(OY + b.w.y * PX - cy) + b.top, Math.round(b.w.w * PX), Math.round(b.w.h * PX) - b.top);
    g.clip();
  };
  // The moving surface: one tiled fill for each kind of water, shifted along its current (a pool barely stirs).
  for (const deep of [true, false]) for (const way of [STILL, 1, SOUTH]) {
    if (!boxes.some((b) => b.deep === deep && b.way === way)) continue;
    const down = way === SOUTH, run = Math.floor(now * (way === STILL ? 1.2 : deep ? 7 : 4.5)) % 64;
    g.save();
    clip((b) => b.deep === deep && b.way === way);
    const t = surface(deep, down), ox = ((((-cx + (down ? 0 : run)) % 64) + 64) % 64) - 64, oy = ((((-cy + (down ? run : 0)) % 64) + 64) % 64) - 64;
    for (let y = oy; y < vh; y += 64) for (let x = ox; x < vw; x += 64) g.drawImage(t, x, y);
    g.restore();
  }
  // Blood clouding in the water, rings, and what's going under.
  g.save();
  clip(() => true);
  for (const c of wet.clouds) {
    const s = cloudStrength(c), lvl = Math.round(s * 4);
    if (lvl < 1) continue;
    const r = Math.max(3, Math.min(24, Math.round(c.r * PX))), x = OX + c.x * PX - cx, y = OY + c.y * PX - cy;
    // Three lobes that turn slowly, so it billows rather than sits as a disc.
    for (let k = 0; k < 3; k++) {
      const a = now * 0.4 + k * 2.1 + c.life * 3, rr = k ? Math.max(2, Math.round(r * 0.6)) : r, b = blob(rr, k ? Math.max(1, lvl - 1) : lvl, c.deep);
      g.drawImage(b, Math.round(x + (k ? Math.cos(a) * r * 0.5 : 0) - rr), Math.round(y + (k ? Math.sin(a) * r * 0.35 : 0) - rr));
    }
  }
  for (const rp of wet.ripples) {
    const r = Math.max(1, Math.round(rp.r * PX)), im = ring(r, ringStrength(rp) < 0.45);
    g.drawImage(im, Math.round(OX + rp.x * PX - cx - r), Math.round(OY + rp.y * PX - cy - im.height / 2));
  }
  for (const s of wet.sinks) {
    const q = s.age / WET.sinkLife, n = Math.max(1, Math.round(s.size * (1 - q))), x = Math.round(OX + s.x * PX - cx), y = Math.round(OY + s.y * PX - cy + q * 2);
    g.fillStyle = q < 0.5 ? s.col : levelAt(f, s.x, s.y) === DEEP ? '#1a2c46' : '#3e5a62';
    g.fillRect(x - Math.floor(n / 2), y, n, n);
  }
  g.restore();
}
