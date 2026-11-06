/**
 * The upright view's backdrop, painted once per size: the night sky in stepped bands down to the
 * horizon, low hills and pines along it, the fields running out to it in perspective (furrows that meet
 * at the horizon, a line across every few metres near in, stones), darker in bands the further out, and
 * the parapet across the bottom with its merlons, the wall walk under it. Flat; the lighting shades it.
 */
import { DEEP, EYE } from '../shared/deeptune';
import { dith } from './watchland';
import type { Lens } from './deepview';

const hex = (s: string): [number, number, number] => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const SKY = ['#161b2c', '#1b2134', '#20273c', '#262e45', '#2d364f', '#353f59'].map(hex);
const HILL = hex('#262d3b'), PINE = hex('#1d2330');
/** The field from near (bright) to far (dark), in steps. */
const FIELD = ['#6a7660', '#5f6a56', '#55604e', '#4b5546', '#424a3f', '#394037', '#313730'].map(hex);
const FURROW = hex('#3e4638'), STONE = hex('#7a7a74'), WALL = hex('#7c7c88'), WALL_DARK = hex('#686874'), MORTAR = hex('#4e4e5a'), TOP = hex('#9494a0'), WALK = hex('#5a5a64');

/** The merlons along the parapet's top: whether column x has one, and how tall. */
export const merlon = (x: number, lw: number) => (Math.floor((x - lw / 2 + 200) / 12) % 2 === 0 ? 7 : 0);
/** The wall walk starts this far under the parapet's top. */
export const PARAPET = 22;

export function paintDeep(l: Lens): HTMLCanvasElement {
  const c = document.createElement('canvas');
  (c.width = l.lw), (c.height = l.lh);
  const g = c.getContext('2d')!, img = g.createImageData(l.lw, l.lh), px = img.data;
  for (let y = 0; y < l.lh; y++) {
    for (let x = 0; x < l.lw; x++) {
      const col = pixel(l, x, y), i = (y * l.lw + x) * 4;
      (px[i] = col[0]), (px[i + 1] = col[1]), (px[i + 2] = col[2]), (px[i + 3] = 255);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

function pixel(l: Lens, x: number, y: number): [number, number, number] {
  // The parapet (its top course and merlons, coursed stone) and the walk below it.
  const m = merlon(x, l.lw);
  if (y >= l.par - m) {
    const into = y - (l.par - m);
    if (y >= l.par + PARAPET) return (x + y) % 9 === 0 ? MORTAR : WALK;
    if (into < 2) return TOP;
    const row = Math.floor((y - l.par + 8) / 5), bx = (x + (row % 2) * 6) % 12;
    if ((y - l.par + 8) % 5 === 0 || bx === 0) return MORTAR;
    return (row * 5 + Math.floor(x / 12)) % 4 === 0 ? WALL_DARK : WALL;
  }
  // Hills along the horizon, pines on them.
  const hill = l.hz - 3 - 2.5 * Math.sin(x / 13) - 1.5 * Math.sin(x / 5 + 1), pine = PINES.some((p) => Math.abs(x - p * l.lw) < (y - (hill - 7)) * 0.4);
  if (y < l.hz) {
    if (y >= hill || (pine && y < hill + 1)) return pine && y < hill ? PINE : HILL;
    const k = Math.max(0, Math.min(0.999, y / l.hz)) * SKY.length, b = Math.floor(k);
    return b < SKY.length - 1 && dith(x, y, k - b) ? SKY[b + 1] : SKY[b];
  }
  // The field: how far out this row is, and how far across this pixel.
  const D = (l.f * EYE.up) / Math.max(0.5, y - l.hz + 0.5), d = D - EYE.back, u = ((x - l.cx) * D) / l.f;
  const k = Math.max(0, Math.min(0.999, Math.sqrt(Math.max(0, d) / (DEEP.far + 10)))) * FIELD.length, b = Math.floor(k);
  let col = b < FIELD.length - 1 && dith(x, y, k - b) ? FIELD[b + 1] : FIELD[b];
  const per = l.f / D;
  // Furrows running out to the horizon, a line across every 6 m (near in, where it reads), stones.
  if (per > 1.2 && Math.abs(((u % 2.5) + 2.5) % 2.5 - 1.25) > 1.25 - 0.5 / per) col = FURROW;
  if (per > 6 && ((d % 6) + 6) % 6 < 0.7 / per) col = FURROW;
  const cu = Math.floor(u / 1.6), cd = Math.floor(d / 1.6), h = ((cu * 73856093) ^ (cd * 19349663)) >>> 0;
  if (per > 2 && h % 13 === 0 && Math.hypot(u - (cu + 0.5) * 1.6, d - (cd + 0.5) * 1.6) * per < Math.max(0.7, per * 0.12)) col = STONE;
  return col;
}

const PINES = [0.08, 0.13, 0.42, 0.47, 0.71, 0.88];
