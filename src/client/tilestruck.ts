/**
 * The lightning-struck pine the tile way (docs/design/tile-redraw.md, "Making a new asset"; docs/design/materials.md,
 * STRUCK PINE): a tall pine split down the middle, the left half torn off at the shoulder in a jag of pale wood, the
 * split charred black from crown to root, the right half still wearing its dark needles, a few splinters at its foot.
 * Bark and needles in three shades, light from the upper left, a clean dark outline, no noise. Cosmetic only: the
 * block is the room's (shared/gatefieldsdetail.ts, `struckpine`).
 */
import type { Block } from '../shared/arena';
import type { Cut } from './three/propcards';
import { Grid } from './tiletrees';

const COLS = ['#0c0b08', '#3a2a1c', '#5a4630', '#7a6244', '#14110e', '#2c211a', '#1b2c1e', '#2a4328', '#d6c796', '#a08c62'];
const OUT = 0, BARK_D = 1, BARK = 2, BARK_L = 3, CHAR = 4, CHAR_L = 5, NEEDLE_D = 6, NEEDLE = 7, WOOD = 8, WOOD_D = 9;

export function struckCut(_b: Block): Cut {
  const W = 34, H = 56, G = new Grid(W, H), base = H - 4, cx = 14, top = 4, torn = base - 26;
  // The trunk, 7 wide at the root and 5 at the crown; the left half stops at the tear, its top a jag of pale wood.
  for (let y = top; y <= base; y++) {
    const half = y > base - 4 ? 5 : y > top + 14 ? 4 : 3;
    for (let x = cx - half; x <= cx + half; x++) {
      if (x < cx && y < torn + ((x + y) % 3)) continue;
      G.set(x, y, x < cx - 1 ? BARK_L : x < cx + 1 ? BARK : BARK_D);
    }
  }
  // The pale heart showing along the tear, and a few splinters standing off it.
  for (let x = cx - 5; x < cx; x++) for (let y = torn + (x + torn) % 3; y < torn + 4 + (x % 2); y++) if (G.get(x, y) >= 0) G.set(x, y, y > torn + 1 ? WOOD_D : WOOD);
  for (const [dx, dy] of [[-4, -2], [-5, 1], [-3, -3]]) G.set(cx + dx, torn + dy, WOOD);
  // Needles only on the right: tiers narrowing upward, lit on their upper left.
  for (let t = 0; t < 4; t++) {
    const y1 = top + 9 + t * 9, w = 6 + t * 3;
    for (let y = y1 - 7; y <= y1; y++) {
      const f = (y - (y1 - 7)) / 7, r = Math.round(1 + f * w);
      for (let x = cx; x <= cx + r; x++) G.set(x, y, x - cx < r * 0.35 && f < 0.8 ? NEEDLE : (x + y) % 5 === 0 ? NEEDLE : NEEDLE_D);
    }
  }
  // The char: a two wide black split down the middle, crown to root, with a lighter singe to its left.
  for (let y = top + 1; y <= base; y++) {
    const x = cx - (y % 7 < 2 ? 1 : 0);
    for (const dx of [0, 1]) if (G.get(x + dx, y) >= 0) G.set(x + dx, y, CHAR);
    if (G.get(x - 1, y) >= 0 && y % 3 !== 0) G.set(x - 1, y, CHAR_L);
  }
  // A bare stub of a limb on the torn side, and splinters on the ground at the foot.
  for (const [dx, dy] of [[-5, -10], [-6, -11], [-7, -11]]) G.set(cx + dx, torn + 6 + dy + 10, BARK);
  for (const [dx, dy] of [[-6, 0], [-5, 0], [-7, 1], [3, 1], [4, 1], [5, 0], [-2, 2], [-1, 2], [7, 1]]) G.set(cx + dx, base + dy, dx % 2 ? WOOD : WOOD_D);
  G.outline(OUT);
  return G.cut(COLS, cx, base);
}
