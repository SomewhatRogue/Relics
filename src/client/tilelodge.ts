/**
 * The Woodward's lodge the tile way (docs/design/the-high-wood.md, THE WOODWARD'S LODGE; docs/design/tile-redraw.md,
 * "Making a new asset"): a low timber lodge, split-oak logs laid in courses with their round ends crossing at the
 * corners, a dark door, one window with a dull fire in it, a stone chimney, and a steep shingle roof of cool grey
 * wood with a turf ridge along its top. The palisade is the room's stakes round it. Oak browns and grey, light from
 * the upper left, a clean dark outline, no noise. Cosmetic only: the block is the room's (`woodlodge`).
 */
import type { Block } from '../shared/arena';
import type { Cut } from './three/propcards';
import { KX } from './tilekit';
import { Grid } from './tiletrees';

const COLS = ['#07090a', '#1a120b', '#2b1d12', '#3f2b19', '#56402a', '#2c3033', '#3e4448', '#586064', '#1f3a22', '#34502a', '#0a0807', '#a8742a', '#5a5e60', '#3c4348'];
const OUT = 0, B_D = 1, B_M = 2, B_L = 3, B_H = 4, SH_D = 5, SH = 6, SH_L = 7, TURF_D = 8, TURF = 9, DARK = 10, FIRE = 11, ST_L = 12, ST = 13;

export function lodgeCut(b: Block): Cut {
  const wall = Math.round(b.w * KX), m = 8, W = wall + m * 2, H = 78, cx = W >> 1, base = H - 3, G = new Grid(W, H);
  const wx0 = m, wx1 = m + wall - 1, wallTop = base - 26, eave = wallTop + 2;
  // The walls: round logs in courses, each five rows, lit along the top and dark under; the ends stand out at the corners.
  for (let y = wallTop; y <= base; y++) {
    const c = (y - wallTop) % 5;
    for (let x = wx0; x <= wx1; x++) {
      const t = (x - wx0) / wall, end = x < wx0 + 3 || x > wx1 - 3;
      G.set(x, y, c === 4 ? B_D : c === 0 ? B_H : end ? (c % 2 ? B_L : B_M) : t < 0.5 ? B_L : B_M);
      if (c === 2 && (x * 5 + Math.floor((y - wallTop) / 5) * 11) % 17 === 0) G.set(x, y, B_D);
    }
  }
  // A stone footing under the lowest log.
  for (let x = wx0 - 1; x <= wx1 + 1; x++) for (let y = base - 2; y <= base; y++) G.set(x, y, (x + y * 3) % 8 < 2 || y === base ? ST : ST_L);
  // The door in the middle, dark, framed; a window to its right with the fire in it.
  const dx0 = cx - 6;
  for (let y = base - 19; y < base - 2; y++) for (let x = dx0; x < dx0 + 12; x++) G.set(x, y, DARK);
  for (let y = base - 20; y < base - 2; y++) G.set(dx0 - 1, y, B_H), G.set(dx0 + 12, y, B_D);
  for (let x = dx0 - 1; x <= dx0 + 12; x++) G.set(x, base - 20, B_H);
  const wx = cx + 14;
  for (let y = base - 16; y < base - 9; y++) for (let x = wx; x < wx + 8; x++) G.set(x, y, y > base - 12 && x > wx + 2 ? FIRE : DARK);
  for (let x = wx - 1; x <= wx + 8; x++) G.set(x, base - 17, B_H), G.set(x, base - 9, B_D);
  // The roof: a steep front slope, narrower at the ridge, shingles in rows of grey wood overlapping, a pale edge to each.
  const ridge = 8, pitch = (eave - ridge) / 1;
  for (let y = ridge; y <= eave; y++) {
    const t = (y - ridge) / pitch, inset = Math.round((1 - t) * 16), x0 = wx0 - 6 + inset, x1 = wx1 + 6 - inset;
    for (let x = x0; x <= x1; x++) {
      const row = Math.floor((y - ridge) / 4), r = (y - ridge) % 4, off = (row % 2) * 3, edge = (x + off) % 6 === 0, left = (x - x0) / (x1 - x0 + 1) < 0.4;
      G.set(x, y, r === 3 ? SH_D : edge ? SH_D : r === 0 ? (left ? SH_L : SH) : left ? SH : (row % 3 === 0 ? SH : SH_D));
    }
  }
  // The turf ridge: a green roll along the top, tufts standing off it.
  for (let x = wx0 + 8; x <= wx1 - 8; x++) {
    for (let y = ridge - 3; y <= ridge + 1; y++) G.set(x, y, y === ridge - 3 ? ((x * 3) % 4 === 0 ? TURF : -1) : y < ridge ? ((x - wx0) < wall * 0.5 ? TURF : TURF_D) : TURF_D);
    if ((x * 7) % 5 < 2) G.set(x, ridge - 4, TURF);
  }
  // The chimney: stone, on the left, a dull cap, up past the ridge.
  const kx = wx0 + 10;
  for (let y = ridge - 8; y < ridge + 14; y++) for (let x = kx; x < kx + 8; x++) G.set(x, y, x < kx + 3 ? ST_L : y % 5 === 0 ? ST : x < kx + 6 ? ST : SH_D);
  G.outline(OUT);
  return G.cut(COLS, cx, base);
}
