/**
 * A charcoal clamp the tile way (docs/design/tile-redraw.md, "Making a new asset"): the burners' low dome of turf over
 * stacked wood, seen as the redraw sees everything, three quarters on. Turf in three shades, lit from the upper left,
 * an apron of bare earth at its foot, a few dark char gaps where the wood shows through, one ember in the dark, the
 * vent hole on top. A dark outline. Cosmetic only: the block is the room's (shared/gatefieldsdetail.ts, `clamp`).
 */
import type { Block } from '../shared/arena';
import type { Cut } from './three/propcards';
import { KX } from './tilekit';
import { Grid } from './tiletrees';

const COLS = ['#0c0b08', '#2a2118', '#2f3a22', '#44522e', '#5d6e3c', '#5a4630', '#070605', '#b04c1c'];
const EARTH_D = 1, TURF_D = 2, TURF = 3, TURF_L = 4, EARTH_L = 5, CHAR = 6, EMBER = 7;

export function clampCut(b: Block): Cut {
  const W = Math.max(30, Math.round(b.w * KX)), H = Math.round(W * 0.46), M = 3, apron = 3;
  const G = new Grid(W + M * 2, H + apron + 6), base = G.h - 3, cx = M + W / 2;
  for (let x = M; x < M + W; x++) {
    const t = (x + 0.5 - cx) / (W / 2), top = Math.round(base - apron - H * Math.sqrt(Math.max(0, 1 - t * t)));
    for (let y = top; y <= base; y++) {
      const f = (y - top) / Math.max(1, base - top), lit = -t * 0.7 + (1 - f) * 0.5;
      // Turf over the dome, bare earth in the apron at its foot, a seam of tufts every few rows.
      let v = y > base - apron ? (t < 0 ? EARTH_L : EARTH_D) : lit > 0.45 ? TURF_L : lit > -0.05 ? TURF : TURF_D;
      if (y <= base - apron && (y - top) % 5 === 3 && (x + y) % 4 === 0) v = v === TURF_D ? TURF : v === TURF ? TURF_L : TURF;
      G.set(x, y, v);
    }
  }
  // Char gaps at the foot where the wood shows through, one with an ember in it.
  for (const [gx, w] of [[-0.55, 4], [-0.1, 3], [0.5, 5]] as const) {
    const x0 = Math.round(cx + gx * (W / 2)) - 1;
    for (let x = x0; x < x0 + w; x++) for (let y = base - apron - 1; y <= base - 1; y++) G.set(x, y, CHAR);
    if (gx === -0.1) G.set(x0 + 1, base - 2, EMBER);
  }
  // The vent hole on top, a dark ring with the char inside.
  const vx = Math.round(cx), vy = base - apron - H + 3;
  for (const [dx, dy] of [[-1, 0], [0, 0], [1, 0], [0, 1], [-1, 1], [1, 1]]) G.set(vx + dx, vy + dy, CHAR);
  G.outline(0);
  return G.cut(COLS, Math.round(cx), base);
}
