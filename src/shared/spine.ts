/**
 * A room's spine: the bent line (or lines, at a fork) from the way in to each way out. Everything solid
 * keeps off it, and plans lay their paths along it (docs/terrain-nodes.md 3.5). A polyline of points.
 */
import type { Rng } from './rng.js';

export type Pt = [number, number];

/** Distance from a point to a polyline (a plain loop: it's called a great deal). */
export const off = (pts: Pt[], x: number, y: number): number => {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1][0], ay = pts[i - 1][1], dx = pts[i][0] - ax, dy = pts[i][1] - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    const d = Math.hypot(x - ax - dx * t, y - ay - dy * t);
    if (d < best) best = d;
  }
  return best;
};

/** Distance from a point to the nearest of several polylines. */
export const offAll = (lines: Pt[][], x: number, y: number): number => {
  let best = Infinity;
  for (const p of lines) {
    const d = off(p, x, y);
    if (d < best) best = d;
  }
  return best;
};

/** Distance from a box to a polyline (sampled along the box's edges and middle; near enough for clearing). */
export function boxOff(lines: Pt[][], a: { x: number; y: number; w: number; h: number }): number {
  let d = Infinity;
  const nx = Math.max(1, Math.ceil(a.w / 0.4)), ny = Math.max(1, Math.ceil(a.h / 0.4));
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
    if (i > 0 && i < nx && j > 0 && j < ny && (i + j) % 2) continue;
    d = Math.min(d, offAll(lines, a.x + (a.w * i) / nx, a.y + (a.h * j) / ny));
  }
  return d;
}

/** Where a mostly up-and-down line crosses height y (its x there). */
export function laneAt(pts: Pt[], y: number): number {
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    if ((y <= ay && y >= by) || (y >= ay && y <= by)) return ay === by ? (ax + bx) / 2 : ax + ((bx - ax) * (y - ay)) / (by - ay);
  }
  return y > pts[0][1] ? pts[0][0] : pts[pts.length - 1][0];
}

/**
 * A spine from the way in at the bottom (x `inX`) to the way out at the top (x `outX`), bending on the
 * way by `bend` tiles at most, kept `margin` in from the side walls.
 */
export function spineFor(rng: Rng, w: number, h: number, inX: number, outX: number, bend: number, margin = 4): Pt[] {
  const clamp = (x: number) => Math.max(margin, Math.min(w - margin, x));
  const a = clamp(inX + (outX - inX) * 0.3 + rng.range(-bend, bend)), b = clamp(inX + (outX - inX) * 0.7 + rng.range(-bend, bend));
  return [[inX, h], [inX, h - 2.5], [a, h * 0.64], [b, h * 0.34], [outX, 2.6], [outX, 0]];
}

/** A heart's way in: from wherever you came in at the bottom, over to its own lane a little way up. */
export const approachTo = (inX: number, laneX: number, h: number): Pt[] => [[inX, h], [inX, h - 1.6], [laneX, h - 4.4], [laneX, 0]];

/** The same line moved `dx` across (a bank beside a track). */
export const shift = (pts: Pt[], dx: number): Pt[] => pts.map(([x, y]) => [x + dx, y]);

/** Points every `step` along a polyline, from its start, with the way it runs there. */
export function along(pts: Pt[], step: number): { x: number; y: number; t: number; dx: number; dy: number }[] {
  const out: { x: number; y: number; t: number; dx: number; dy: number }[] = [];
  let total = 0;
  const lens = pts.slice(1).map(([x, y], i) => Math.hypot(x - pts[i][0], y - pts[i][1]));
  const all = lens.reduce((s, l) => s + l, 0) || 1;
  for (let i = 0; i < lens.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], l = lens[i] || 1;
    for (let d = (step - (total % step)) % step; d < l; d += step) out.push({ x: ax + ((bx - ax) * d) / l, y: ay + ((by - ay) * d) / l, t: (total + d) / all, dx: (bx - ax) / l, dy: (by - ay) / l });
    total += l;
  }
  return out;
}
