/**
 * The Night Watch's backdrop, side-on: the sky in stepped bands, two lines of hills with a few pines,
 * the fields rolling down to the ditch, and Wickhold's wall on the right with its walk, its stair and a
 * low parapet. Painted once per size (it never moves), flat; the lighting pass shades it. The moon,
 * its clouds and the stars are drawn on the glowing layer each frame (they light themselves).
 */
import { SIDE, WATCH, groundY } from '../shared/watchtune';

export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Ordered dither: whether pixel (x, y) takes the second colour at mix `k` (0..1). */
export const dith = (x: number, y: number, k: number) => BAYER[(y & 3) * 4 + (x & 3)] / 16 < k;

const hex = (s: string): [number, number, number] => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const SKY = ['#161b2c', '#1b2134', '#20273c', '#262e45', '#2d364f', '#353f59', '#3d4863'].map(hex);
const FAR = hex('#2b3343'), FAR_TOP = hex('#353e50'), MID = hex('#343e4c'), MID_TOP = hex('#404a58'), PINE = hex('#232a36');
const GRASS = hex('#6a7660'), GRASS_DARK = hex('#56624e'), SOIL = [hex('#4c4a40'), hex('#413d37'), hex('#36322e'), hex('#2c2926')];
const STONE = hex('#7c7c88'), STONE_DARK = hex('#686874'), MORTAR = hex('#4e4e5a'), WALK = hex('#9494a0'), EDGE = hex('#5a5a66'), PEBBLE = hex('#4a473f'), ROOT = hex('#3a2e24');

/** The far hills' and near hills' skylines at x. */
export const farHill = (x: number) => 94 + 6 * Math.sin(x / 31) + 4 * Math.sin(x / 13 + 2);
const midHill = (x: number) => 106 + 5 * Math.sin(x / 19 + 1) + 3 * Math.sin(x / 7);
const PINES = [14, 22, 71, 77, 83, 131, 140, -14, -30, 250];

/** Is this pixel stone of the wall (the face, the walk, the parapet), and which shade. */
function wallPx(x: number, y: number): [number, number, number] | null {
  const { wallX, walkY, parapetTop } = WATCH;
  // The low parapet on the field side of the walk.
  if (x >= wallX + 1 && x < wallX + 8 && y >= parapetTop && y < walkY) return y === parapetTop ? WALK : (x + y * 3) % 11 === 0 ? MORTAR : STONE;
  if (x < wallX || y < walkY) return null;
  if (y < walkY + 2) return WALK;
  if (x < wallX + 2) return EDGE;
  // Coursed stone: blocks 8 wide and 5 high, every other course offset.
  const row = Math.floor((y - walkY) / 5), bx = (x + (row % 2) * 4) % 8;
  if ((y - walkY) % 5 === 0 || bx === 0) return MORTAR;
  return (row * 7 + Math.floor((x + (row % 2) * 4) / 8) * 3) % 5 === 0 ? STONE_DARK : STONE;
}

/** The whole side-on backdrop for a canvas `lw` by `lh` with the field's corner at (ox, oy). */
export function paintLand(lw: number, lh: number, ox: number, oy: number): HTMLCanvasElement {
  const rise = SIDE.hills;
  const c = document.createElement('canvas');
  (c.width = lw), (c.height = lh);
  const g = c.getContext('2d')!, img = g.createImageData(lw, lh), d = img.data;
  for (let cy = 0; cy < lh; cy++) {
    for (let cx = 0; cx < lw; cx++) {
      const x = cx - ox, y = cy - oy, gy = Math.round(groundY(Math.min(x, WATCH.wallX)));
      let col = wallPx(x, y);
      if (!col && y >= gy && x < WATCH.wallX) {
        const deep = y - gy;
        if (deep < 2) col = (x * 7) % 5 === 0 && deep === 0 ? GRASS_DARK : GRASS;
        else {
          const band = Math.min(SOIL.length - 1, Math.floor(deep / 9)), k = (deep % 9) / 9;
          col = band < SOIL.length - 1 && dith(cx, cy, k * k) ? SOIL[band + 1] : SOIL[band];
          // Stones and roots in the earth (the ground under the field, a phone's long view of it).
          const h = ((x * 73856093) ^ (Math.floor(y / 2) * 19349663)) >>> 0;
          if (h % 151 === 0 || (h % 151 === 1 && deep > 6)) col = PEBBLE;
          else if (deep < 14 && (x * 31 + y * 7) % 53 === 0) col = ROOT;
        }
      }
      // A tuft of grass now and then on the field's top.
      if (!col && x < WATCH.wallX && y === gy - 1 && (x * 13) % 7 < 2) col = GRASS_DARK;
      if (!col) {
        const fh = farHill(x) + rise, mh = midHill(x) + rise, pine = PINES.some((p) => Math.abs(x - p) < Math.max(0, (y - (fh - 9)) * 0.35) && y < fh + 2);
        if (y >= mh) col = y < mh + 2 ? MID_TOP : MID;
        else if (y >= fh) col = y < fh + 2 ? FAR_TOP : FAR;
        else if (pine) col = PINE;
        else {
          const k = Math.max(0, Math.min(0.999, (y + 40) / 140)) * SKY.length, band = Math.floor(k);
          col = band < SKY.length - 1 && dith(cx, cy, k - band) ? SKY[band + 1] : SKY[band];
        }
      }
      const i = (cy * lw + cx) * 4;
      (d[i] = col[0]), (d[i + 1] = col[1]), (d[i + 2] = col[2]), (d[i + 3] = 255);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** Where the wall's torches burn (field pixels): on the parapet, on the face over the ditch, by the stair. */
export const WALL_TORCHES: [number, number][] = [[WATCH.wallX + 3, WATCH.parapetTop - 4], [WATCH.wallX - 2, 98], [WATCH.wallX + 30, WATCH.walkY - 8]];
