/**
 * An abandoned plough the tile way (docs/design/tile-redraw.md, "Making a new asset"): left where the ploughman dropped
 * it, tipped back on its share with the two handles up in the air. Wood in three shades, iron in three, lit from the
 * upper left, a clod of turned earth on the share, a spoked wheel at the beam's head, a dark outline. Cosmetic only: the
 * block is the room's (shared/gatefieldsstrips.ts, `plough`).
 */
import type { Block } from '../shared/arena';
import type { Cut } from './three/propcards';
import { KX } from './tilekit';
import { Grid } from './tiletrees';

const COLS = ['#0c0b08', '#2b1e12', '#4a3320', '#6a4a2e', '#2a2c33', '#4a4e58', '#6e7480', '#3a2c1c'];
const OUT = 0, W_D = 1, W_M = 2, W_L = 3, I_D = 4, I_M = 5, I_L = 6, EARTH = 7;

/** A line of `t` pixels' thickness from (x0, y0) to (x1, y1); lit on top, dark underneath. */
function beam(G: Grid, x0: number, y0: number, x1: number, y1: number, t: number): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
    for (let j = 0; j < t; j++) G.set(x, y + j, j === 0 ? W_L : j === t - 1 ? W_D : W_M);
  }
}

/** A dark halo round every filled pixel, outside the art (Grid.outline eats into thin parts: a handle is two pixels). */
function halo(G: Grid): void {
  const out: [number, number][] = [];
  for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++)
    if (G.get(x, y) < 0 && (G.get(x - 1, y) >= 0 || G.get(x + 1, y) >= 0 || G.get(x, y - 1) >= 0 || G.get(x, y + 1) >= 0)) out.push([x, y]);
  for (const [x, y] of out) G.set(x, y, OUT);
}

export function ploughCut(b: Block): Cut {
  const W = Math.max(40, Math.round(b.w * KX)), H = 30, M = 3, G = new Grid(W + M * 2, H + 8), base = G.h - 4, L = M, R = M + W;
  // The beam, from the share at the foot up to the wheel's yoke; the handles rise from it, up and back.
  beam(G, R - 12, base - 4, L + 18, base - 14, 3), beam(G, L + 20, base - 12, L + 3, base - 25, 2), beam(G, L + 25, base - 11, L + 10, base - 27, 2);
  beam(G, L + 7, base - 20, L + 13, base - 20, 1);
  // The share: an iron wedge on the ground, point to the right, a clod caught on it.
  for (let x = 0; x < 13; x++) for (let y = 0; y <= Math.max(0, 4 - Math.floor(x / 3.5)); y++) G.set(R - 14 + x, base - 3 + y, y === 0 ? I_L : x < 5 ? I_M : I_D);
  for (const [dx, dy] of [[-3, -1], [-2, -1], [-4, 0], [-3, 0]]) G.set(R - 8 + dx, base - 4 + dy, EARTH);
  // The wheel at the beam's head: a ring of wood with a hub, half sunk.
  const cx = L + 17, cy = base - 7;
  for (let a = 0; a < 24; a++) {
    const t = (a / 24) * Math.PI * 2, x = Math.round(cx + Math.cos(t) * 6), y = Math.round(cy + Math.sin(t) * 5);
    G.set(x, y, Math.cos(t) + Math.sin(t) < -0.3 ? W_L : Math.cos(t) + Math.sin(t) > 0.5 ? W_D : W_M);
  }
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [-2, 0], [2, 0], [0, -2], [0, 2]]) G.set(cx + dx, cy + dy, dx || dy ? W_M : I_M);
  halo(G);
  return G.cut(COLS, Math.round(M + W / 2), base);
}
