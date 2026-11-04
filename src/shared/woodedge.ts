/**
 * The edge of the way through the prologue wood (shared/wood.ts): the clearings and the ways between
 * them are the only ground you can walk. Every tile outside them that touches one is filled, a tree
 * to a tile (round, 0.6 across the middle, so no gap between neighbours, even corner to corner, is
 * wide enough for a body), with a second row behind it, and the wood going on past that, thinner,
 * out to the map's edge. Where a scene is played out past the trees (shared/woodscenes.ts) the edge
 * in front of it is brambles, rocks and stumps you can see over, and the wood round it is left open.
 * Pure: the room collides against it and both views draw it.
 */
import type { Round, RoundKind } from './arena.js';
import type { Vignette } from './woodscenes.js';

type Rect = { x: number; y: number; w: number; h: number };
const inside = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
/** A steady number from 0 to 1 for a tile (the wood is the same every time). */
const hash = (i: number, j: number, k = 0) => {
  const s = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453;
  return s - Math.floor(s);
};
const TALL: RoundKind[] = ['pine', 'tree', 'pine', 'pine', 'tree', 'deadtree'];
const LOW: RoundKind[] = ['bush', 'bush', 'rock', 'bush', 'bush', 'rock'];

/** The edge tree's reach: two neighbours a tile apart overlap, and corner to corner leave under a body's width. */
export const EDGE_R = 0.6;

export function thicket(open: Rect[], w: number, h: number, scenes: Vignette[]): Round[] {
  const walk = (i: number, j: number) => open.some((r) => inside(r, i + 0.5, j + 0.5));
  const out: Round[] = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (walk(i, j)) continue;
    // How far (in tiles, either way) to the nearest ground you can walk.
    let d = 9;
    for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) if (walk(i + di, j + dj)) d = Math.min(d, Math.max(Math.abs(di), Math.abs(dj)));
    const x = i + 0.5, y = j + 0.5, low = scenes.some((s) => inside(s.window, x, y)), k = hash(i, j);
    if (d === 1) {
      // The edge itself: one to a tile, nudged a little so it's not a fence.
      const kind = (low ? LOW : TALL)[Math.floor(k * 6)];
      out.push({ x: x + (hash(i, j, 1) - 0.5) * 0.16, y: y + (hash(i, j, 2) - 0.5) * 0.16, r: EDGE_R, kind });
      continue;
    }
    // Behind a window's edge, a few more brambles, so it's a thicket and not a hedge.
    if (low && d === 2 && k < 0.45) out.push({ x: x + (hash(i, j, 1) - 0.5) * 0.7, y: y + (hash(i, j, 2) - 0.5) * 0.5, r: 0.45, kind: 'bush' });
    // Behind it: thick near the edge, thinning out; nothing in a window or round a scene.
    if (low || scenes.some((s) => near(s, x, y))) continue;
    if (k > (d === 2 ? 0.85 : d === 3 ? 0.55 : 0.32)) continue;
    out.push({ x: x + (hash(i, j, 1) - 0.5) * 0.6, y: y + (hash(i, j, 2) - 0.5) * 0.6, r: 0.5, kind: hash(i, j, 3) < 0.12 ? 'bush' : TALL[Math.floor(hash(i, j, 4) * 5)] });
  }
  return out;
}

/** Round a scene, and along the way it goes: left open so it can be seen. */
function near(s: Vignette, x: number, y: number): boolean {
  // (And a stretch in front of it, south, where a tree's crown would stand up over it.)
  const front = (px: number, py: number) => y > py && y < py + s.keep + 1 && Math.abs(x - px) < s.keep;
  if (Math.hypot(x - s.x, y - s.y) < s.keep || front(s.x, s.y) || (s.to && front(s.to[0], s.to[1]))) return true;
  if (!s.to) return false;
  const [tx, ty] = s.to, dx = tx - s.x, dy = ty - s.y, l = Math.hypot(dx, dy) || 1, u = Math.max(0, Math.min(1, ((x - s.x) * dx + (y - s.y) * dy) / (l * l)));
  return Math.hypot(x - s.x - dx * u, y - s.y - dy * u) < s.keep * 0.8;
}
