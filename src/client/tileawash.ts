/**
 * The drowned chapel's echoes the tile way (docs/design/biome-sets.md: "grave slabs in the reeds, a sunk bell, pews in
 * the mud, crosses awash"; block `awash`, shared/fenroamland.ts): `look` 0 a grave slab leaning, 1 a stone cross, 2 a
 * pew sunk to its seat. Small cards, stone in three shades or timber in three, light from the upper left, a dark
 * outline, the water or the mud across the foot. Cosmetic only: the block is the room's.
 */
import type { Block } from '../shared/arena';
import type { Cut } from './three/propcards';
import { Grid } from './tiletrees';

const COLS = ['#0b0a0d', '#2b2d32', '#41434a', '#5a5b60', '#2a2118', '#4a3826', '#6a5236', '#1a2a2c', '#3a5654', '#26301f'];
const OUT = 0, ST_D = 1, ST = 2, ST_L = 3, WD_D = 4, WD = 5, WD_L = 6, WATER = 7, RIPPLE = 8, MOSS = 9;

const shade = (x: number, x0: number, x1: number, l: number, m: number, d: number) => (x - x0 < (x1 - x0) * 0.3 ? l : x - x0 < (x1 - x0) * 0.75 ? m : d);

function slab(G: Grid, base: number): void {
  // A round-topped slab, leaning a pixel right every four rows.
  for (let y = 2; y <= base; y++) {
    const lean = Math.floor((base - y) / 4), x0 = 3 + lean, x1 = 12 + lean, top = y < 5 ? 1 + (5 - y) : 0;
    for (let x = x0 + top; x <= x1 - top; x++) G.set(x, y, shade(x, x0, x1, ST_L, ST, ST_D));
  }
  for (const [x, y] of [[7, 7], [8, 7], [9, 7], [8, 6], [8, 8], [8, 9]]) G.set(x + Math.floor((base - y) / 4), y, ST_D);
}

function cross(G: Grid, base: number): void {
  for (let y = 1; y <= base; y++) for (let x = 6; x <= 9; x++) G.set(x, y, shade(x, 6, 9, ST_L, ST, ST_D));
  for (let y = 5; y <= 8; y++) for (let x = 2; x <= 13; x++) G.set(x, y, y === 5 ? ST_L : shade(x, 2, 13, ST_L, ST, ST_D));
}

function pew(G: Grid, base: number): void {
  // The back rail and the seat of a pew, sunk to the seat, the end board standing.
  for (let x = 2; x <= 31; x++) for (let y = base - 7; y <= base; y++) G.set(x, y, y < base - 5 ? WD_L : y === base - 3 ? WD : shade(x, 2, 31, WD, WD, WD_D));
  for (let y = base - 11; y <= base; y++) for (let x = 2; x <= 5; x++) G.set(x, y, x === 2 ? WD_L : WD);
  for (let x = 6; x <= 31; x += 6) G.set(x, base - 5, WD_D);
}

export function awashCut(b: Block): Cut {
  const look = Math.max(0, Math.min(2, b.look ?? 0));
  const W = look === 2 ? 34 : 16, H = look === 2 ? 18 : 22, base = H - 4, G = new Grid(W, H);
  (look === 0 ? slab : look === 1 ? cross : pew)(G, base);
  for (let x = 0; x < W; x++) if (G.get(x, base - 1) >= 0) G.set(x, base - 1, MOSS);
  G.outline(OUT);
  for (let x = 1; x < W - 1; x++) for (let y = base; y < H - 1; y++) G.set(x, y, y === base && x % 5 < 3 ? RIPPLE : WATER);
  return G.cut(COLS, Math.round(W / 2), base + 1);
}
