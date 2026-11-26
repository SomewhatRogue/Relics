/**
 * The lightning-split oak the tile way (docs/design/the-high-wood.md, THE STRUCK OAKS; docs/design/tile-redraw.md,
 * "Making a new asset"): an old oak split from crown to root, the left half torn away at the shoulder in a jag of pale
 * heartwood, the split burnt black and a singe along it, the right half standing bare with three dead boughs, roots
 * flaring and splinters at the foot. Oak bark in four shades, light from the upper left, a clean dark outline, no
 * noise. Cosmetic only: the block is the room's (shared/highwoodland.ts, `struckoak`).
 */
import type { Block } from '../shared/arena';
import type { Cut } from './three/propcards';
import { Grid } from './tiletrees';

const COLS = ['#07090a', '#1a120b', '#2b1d12', '#3f2b19', '#56402a', '#0d0b0a', '#241c18', '#cdbf94', '#9a875c', '#6a5a3a'];
const OUT = 0, B_D = 1, B_M = 2, B_L = 3, B_H = 4, CHAR = 5, CHAR_L = 6, HEART = 7, HEART_D = 8, DEAD = 9;

export function struckOakCut(_b: Block): Cut {
  const W = 78, H = 92, cx = 34, base = H - 4, top = 8, torn = 50, G = new Grid(W, H);
  const half = (y: number) => (y > base - 6 ? 10 + (base - y < 2 ? 3 : 0) : y > top + 20 ? 8 : 6);
  // The trunk: the left half stops at the tear, the right half runs up to a snapped top.
  for (let y = top; y <= base; y++) {
    const h = half(y);
    for (let x = cx - h; x <= cx + h; x++) {
      if (x < cx && y < torn + ((x * 3 + y) % 4)) continue;
      if (x >= cx && y < top + 3 + (x - cx) % 3 * 2) continue;
      const t = (x - (cx - h)) / (2 * h + 1);
      G.set(x, y, (x + (y >> 3)) % 6 === 0 ? B_M : t < 0.2 ? B_H : t < 0.5 ? B_L : t < 0.8 ? B_M : B_D);
    }
  }
  // The pale heart showing along the tear, and splinters standing off it.
  for (let x = cx - 10; x < cx; x++) for (let y = torn + (x * 3) % 4; y < torn + 5; y++) if (G.get(x, y) >= 0) G.set(x, y, y > torn + 2 ? HEART_D : HEART);
  for (const [dx, dy] of [[-8, -3], [-6, -5], [-9, -1], [-4, -4]]) G.set(cx + dx, torn + dy, HEART), G.set(cx + dx, torn + dy + 1, HEART_D);
  // Roots flaring out of the foot, lit on top.
  for (const dir of [-1, 1]) for (let i = 0; i < 16; i++) {
    const x = cx + dir * (12 + i), y = base - 4 + Math.round(i * 0.25), w = Math.max(1, 4 - (i >> 2));
    for (let k = 0; k < w; k++) G.set(x, Math.min(base, y + k), k === 0 ? B_L : k < w - 1 ? B_M : B_D);
  }
  // Three dead boughs off the right half: bare, forking, lit along the top, one with a snapped fork.
  for (const [y0, len, rise] of [[top + 22, 26, 0.55], [top + 36, 20, 0.4], [top + 12, 16, 0.9]] as const) for (let i = 0; i <= len; i++) {
    const x = cx + 7 + i, y = Math.round(y0 - i * rise), th = Math.max(1, 3 - (i >> 3));
    for (let k = 0; k < th; k++) G.set(x, y + k, k === 0 ? B_L : k < th - 1 ? B_M : B_D);
    if (i === Math.floor(len * 0.6)) for (let j = 1; j < 7; j++) G.set(x + j, y - j - Math.round(j * rise), DEAD), G.set(x + j, y - j - Math.round(j * rise) + 1, B_D);
  }
  // The char: a two wide black split down the middle crown to root, jogging, a singe to its left.
  for (let y = top + 3; y <= base; y++) {
    const x = cx - (y % 9 < 3 ? 1 : 0);
    for (const dx of [0, 1]) if (G.get(x + dx, y) >= 0) G.set(x + dx, y, CHAR);
    if (G.get(x - 1, y) >= 0 && y % 3 !== 0) G.set(x - 1, y, CHAR_L);
    if (G.get(x + 2, y) >= 0 && y % 4 === 0) G.set(x + 2, y, CHAR_L);
  }
  G.outline(OUT);
  // Splinters at the foot.
  for (const [dx, dy] of [[-14, 0], [-13, 0], [-16, 1], [14, 1], [15, 1], [18, 0], [-3, 3], [-2, 3], [9, 3]]) G.set(cx + dx, base + dy, dx % 2 ? HEART : HEART_D);
  return G.cut(COLS, cx, base);
}
