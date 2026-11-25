/**
 * The drowned chapel the tile way (docs/design/tile-redraw.md, "Making a new asset"; docs/design/biome-sets.md, the
 * fen's set, the drowned chapel): the landmark of THE FEN (shared/fenroamland.ts, block `chapel`). Its belfry on the
 * left, leaning a little, its belfry arch empty and dark; the nave between, its walls broken down to
 * a run of arches; the west gable on the right standing alone, its top torn off on one side round a tall pointed
 * window. Grey stone in four shades in courses, light from the upper left, moss at the water line, a dark outline, no
 * noise; the flood across its foot. Cosmetic only: the block is the room's.
 */
import type { Block } from '../shared/arena';
import type { Cut } from './three/propcards';
import { KX } from './tilekit';
import { Grid } from './tiletrees';

const COLS = ['#0b0a0d', '#171c1f', '#232a2c', '#303738', '#3e4647', '#111115', '#26301f', '#3a4a2c', '#6a5a34', '#1a2a2c', '#3a5654', '#4c4030'];
const OUT = 0, ST_D = 1, ST = 2, ST_M = 3, ST_L = 4, DARK = 5, MOSS_D = 6, MOSS = 7, BELL = 8, WATER = 9, RIPPLE = 10, BELL_D = 11;

/** Stone at column `x` of a wall running x0 to x1, row `y`: lit from the left, a mortar course every five rows. */
function stone(x: number, y: number, x0: number, x1: number): number {
  const f = (x - x0) / Math.max(1, x1 - x0);
  let v = f < 0.22 ? ST_L : f < 0.6 ? ST_M : f < 0.88 ? ST : ST_D;
  if (y % 5 === 0 && v > ST_D) v--;
  else if (y % 5 !== 0 && (x + (Math.floor(y / 5) % 2) * 3) % 7 === 0 && v > ST_D) v--;
  return v;
}

/** An arched hole: `w` wide, `h` tall, its foot at (x, y): dark inside. */
function arch(G: Grid, x: number, y: number, w: number, h: number, pointed = false): void {
  const r = w / 2;
  for (let yy = y - h; yy <= y; yy++) for (let xx = x; xx < x + w; xx++) {
    const dx = xx + 0.5 - (x + r), up = y - h + r - yy;
    if (up > 0 && (pointed ? Math.abs(dx) > r - up * 0.9 : dx * dx + up * up > r * r)) continue;
    G.set(xx, yy, DARK);
  }
}

export function chapelCut(b: Block): Cut {
  const W = Math.max(120, Math.round(b.w * KX) + 10), H = 132, base = H - 7, G = new Grid(W, H);
  const tx0 = 8, tx1 = 38, top = 6;
  // The belfry, leaning a pixel to the right every fourteen rows up; a broken parapet on top.
  for (let y = top; y <= base; y++) {
    const lean = Math.floor((base - y) / 14);
    for (let x = tx0 + lean; x <= tx1 + lean; x++) {
      if (y < top + 4 && ((x - tx0 - lean) % 7 > 3 || x > tx1 + lean - 4)) continue;
      G.set(x, y, stone(x - lean, y, tx0, tx1));
    }
  }
  // Its belfry arch, empty (no bell: the lore keeper, 2026-11-25, bells are the town's hope, kept for later), and a slit below.
  const bl = Math.floor((base - 30) / 14);
  arch(G, 15 + bl + 2, 34, 12, 20);
  arch(G, 21 + Math.floor((base - 60) / 14), 66, 3, 12);
  // The nave: low broken walls between, a run of round arches through them, the top ragged.
  const nx0 = tx1 + 1, nx1 = W - 40;
  for (let x = nx0; x <= nx1; x++) {
    const t = base - 34 - ((x * 7) % 11 < 4 ? 3 : 0) - (x % 23 < 6 ? 5 : 0) + (x > nx1 - 10 ? 6 : 0);
    for (let y = t; y <= base; y++) G.set(x, y, stone(x, y, nx0 - 30, nx1 + 30));
  }
  for (let x = nx0 + 4; x + 12 < nx1; x += 17) arch(G, x, base - 4, 11, 22);
  // The west gable alone on the right: a steep triangle, its top torn off on the left side, a tall pointed window.
  const gx0 = W - 40, gx1 = W - 6, gm = (gx0 + gx1) / 2, gtop = 22;
  for (let x = gx0; x <= gx1; x++) {
    const slope = gtop + Math.abs(x - gm) * 1.7, torn = x < gm + 2 ? Math.max(slope, gtop + 16 + ((x * 5) % 4)) : slope;
    for (let y = Math.round(torn); y <= base; y++) G.set(x, y, stone(x, y, gx0, gx1));
  }
  arch(G, Math.round(gm) - 4, base - 24, 9, 34, true);
  // Moss at the water line along everything standing.
  for (let x = 0; x < W; x++) for (let y = base - 6; y <= base; y++) if (G.get(x, y) >= 0 && G.get(x, y) !== DARK) G.set(x, y, y > base - 3 || (x + y) % 3 === 0 ? MOSS_D : MOSS);
  G.outline(OUT);
  // The flood across its foot: dark water, a lighter line where it laps.
  for (let x = 2; x < W - 2; x++) for (let y = base - 1; y < H - 1; y++) G.set(x, y, y === base - 1 && x % 9 < 5 ? RIPPLE : y === base + 3 && x % 13 > 8 ? RIPPLE : WATER);
  return G.cut(COLS, Math.round(W / 2), base + 2);
}
