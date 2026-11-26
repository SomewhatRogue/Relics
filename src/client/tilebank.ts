/**
 * An earth bank's face the tile way (docs/design/the-high-wood.md, THE SUNK LANES; docs/design/tile-redraw.md, "Making a
 * new asset"): the wall of a sunk lane seen from the camera. A turf lip with a dark shadow under it, earth in three
 * browns in loose strata, a few grey stones set in it, and roots coming down out of the lip, lit on their left, forking
 * and ending in the earth. The ground is the darkest tier along its foot. One drawn pixel to one render pixel (16 a
 * tile up); no noise: every root and stone is placed by a hash of the seed. Cosmetic only (`kind: 'earth'` ledges).
 */
import { hash } from './tiletrees';

const OUT = '#0a0807', E_D = '#241a11', E_M = '#33251a', E_L = '#463324', TURF_D = '#1f3a22', TURF = '#34502a', ROOT_D = '#1a120b', ROOT = '#4a3624', ROOT_L = '#6a5238', ST_D = '#2a2f33', ST = '#3c4348', ST_L = '#555d62';

export function earthBankCanvas(cols: number, rows: number, seed: number): HTMLCanvasElement {
  const c = Object.assign(document.createElement('canvas'), { width: Math.max(1, cols), height: Math.max(1, rows) }), g = c.getContext('2d')!;
  const px = (x: number, y: number, col: string, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  // Earth in strata: a band of each brown, the lighter one wavy.
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const s = Math.floor((y + Math.round(Math.sin((x + seed) * 0.21) * 1.5)) / 6);
    px(x, y, s % 3 === 1 ? E_L : s % 3 === 2 ? E_D : E_M);
  }
  // A few grey stones, lit top left.
  for (let i = 0, n = Math.max(1, Math.floor(cols / 14)); i < n; i++) {
    const x = Math.floor(hash(i, seed, 5) * (cols - 6)), y = 5 + Math.floor(hash(i, seed, 6) * Math.max(1, rows - 10));
    px(x, y, ST_D, 5, 3), px(x, y, ST_L, 3, 1), px(x, y + 1, ST, 4, 1), px(x + 1, y - 1, ST, 2, 1);
  }
  // Roots down from the lip: forking, lit on the left, dark on the right, ending short.
  for (let i = 0, x = 3 + Math.floor(hash(seed, 1, 7) * 6); x < cols - 3; i++, x += 8 + Math.floor(hash(i, seed, 8) * 14)) {
    const len = Math.min(rows - 3, 6 + Math.floor(hash(i, seed, 9) * 10)), dir = hash(i, seed, 10) < 0.5 ? -1 : 1;
    let rx = x;
    for (let y = 2; y < len; y++) {
      if (y % 4 === 0) rx += dir;
      const w = y < len * 0.5 ? 3 : 2;
      px(rx, y, ROOT_L), px(rx + 1, y, ROOT), w === 3 ? px(rx + 2, y, ROOT_D) : px(rx + 1, y, ROOT_D);
      if (y === Math.floor(len * 0.55) && len > 9) for (let k = 1; k < 6; k++) px(rx + dir * (k + 1), y + Math.floor(k / 2), k < 3 ? ROOT : ROOT_D);
    }
  }
  // The turf lip, a shadow under it, and the dark of the ground at the foot.
  px(0, 0, TURF, cols, 2);
  for (let x = 0; x < cols; x++) if ((x * 5 + seed) % 7 < 3) px(x, 2, TURF_D), px(x, 0, TURF_D, 1, 1);
  px(0, 3, OUT, cols, 1);
  for (let x = 0; x < cols; x++) if ((x + seed) % 4 < 2) px(x, 4, E_D);
  px(0, rows - 3, E_D, cols, 2), px(0, rows - 1, OUT, cols, 1);
  return c;
}
