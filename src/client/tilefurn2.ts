/**
 * The tile redraw's round furniture (tilefurn.ts is the flat timber): casks, a tub, sacks, a cart and a stump, each
 * painted in the kit's pixels (20 across and 12 deep a tile, 16 up). Cosmetic only.
 */
import type { Rect } from './tilekit';
import { bulge, CLOTH, ell, IRON, paint, roundShade, slab, TIM as TIMBER, toCut } from './tilefurnkit';
import type { Cut } from './three/propcards';

const TIM = TIMBER;
interface Rnd { pal?: string[]; hoops?: boolean; lid?: 'planks' | 'water' | 'cut'; flare?: boolean }

/** A round wooden body (barrel, tub, trunk): top at row `top` with an ellipse lid d deep, standing to row `bottom`. */
function barrel(r: Rect, x: number, top: number, w: number, d: number, bottom: number, o: Rnd): void {
  const TIM = o.pal ?? TIMBER;
  const bodyTop = top + d / 2, bodyBot = bottom - d / 2;
  for (let c = 0; c < w; c++) {
    const b = bulge(c, w, d), y0 = Math.round(bodyTop - b), y1 = Math.round(bodyBot + b);
    // (Staves: a seam every fourth or fifth column, darker.)
    const base = roundShade(c, w, TIM), seam = o.lid === 'cut' ? c % 5 === 2 || c % 7 === 4 : c % 5 === 4;
    r(x + c, y0, 1, y1 - y0, seam && c > 0 && c < w - 1 ? TIM[Math.max(0, TIM.indexOf(base) - 1)] : base);
    if (o.hoops) for (const f of [0.22, 0.7]) {
      const hy = Math.round(bodyTop + (bodyBot - bodyTop) * f + b * 0.8);
      r(x + c, hy, 1, 2, c < w * 0.25 ? IRON[3] : c < w * 0.85 ? IRON[2] : IRON[1]);
    }
  }
  const rim = TIM[2];
  ell(r, x, top, w, d, rim);
  if (o.lid === 'water') {
    ell(r, x + 2, top + 1, w - 4, Math.max(2, d - 2), '#1c2228');
    r(x + 4, top + 2, Math.max(1, w - 9), 1, '#2c3640');
  } else if (o.lid === 'cut') {
    ell(r, x + 1, top + 1, w - 2, Math.max(2, d - 2), TIM[4]);
    if (w > 9 && d > 5) ell(r, x + 3, top + 2, w - 6, d - 4, TIM[1]);
    if (w > 9 && d > 5) ell(r, x + 4, top + 3, w - 8, d - 6, TIM[4]);
    if (w > 13 && d > 8) ell(r, x + 6, top + 4, w - 12, d - 8, TIM[1]), ell(r, x + 7, top + 5, w - 14, d - 10, TIM[4]);
    r(x + w - 3, top + Math.floor(d / 2), 1, 1, TIM[3]);
  } else {
    ell(r, x + 1, top + 1, w - 2, Math.max(2, d - 2), TIM[3]);
    r(x + Math.floor(w / 3), top + 2, 1, Math.max(1, d - 4), TIM[2]);
    r(x + Math.floor((2 * w) / 3), top + 2, 1, Math.max(1, d - 4), TIM[2]);
    r(x + 3, top + 1, Math.max(1, w - 8), 1, TIM[4]);
  }
}

/** A row (or grid) of barrels filling the footprint. */
export function casks(r: Rect, W: number, D: number, T: number): void {
  const nx = Math.max(1, Math.round(W / Math.max(14, Math.min(W, D * 1.7)))), ny = Math.max(1, Math.round(D / 12));
  const cw = Math.floor(W / nx), cd = Math.round(D / ny), x0 = Math.floor((W - cw * nx) / 2), H = D + T;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) barrel(r, x0 + i * cw, j * cd, cw, cd, H - (ny - 1 - j) * cd, { hoops: true });
}

/** A staved tub of water, whole footprint. */
export const tub = (r: Rect, W: number, D: number, T: number): void => barrel(r, 0, 0, W, D, D + T, { hoops: true, lid: 'water' });

/** The height casks stand at: a barrel is about as tall as it is wide and a third. */
export const caskTall = (W: number, D: number, T: number): number => Math.min(T, Math.round((W / Math.max(1, Math.round(W / Math.max(14, Math.min(W, D * 1.7))))) * 1.3));

/** One lumpy cloth sack at (x, y), w by h: a tied neck, a belly, a rounded foot. */
function sack(r: Rect, x: number, y: number, w: number, h: number): void {
  const nw = Math.max(3, Math.round(w * 0.4));
  for (let j = 0; j < h; j++) {
    const f = j / (h - 1), inset = j < 3 ? Math.round((w - nw) / 2) : j < h * 0.45 ? Math.round(((w - nw) / 2) * (1 - (j - 3) / (h * 0.45 - 3 + 0.01))) : j >= h - 2 ? 1 : 0;
    const lump = j > h * 0.5 && j < h * 0.8 ? ((j * 7) % 3 === 0 ? -1 : 0) : 0, a = x + inset + (lump < 0 ? 0 : 0), ww = w - inset * 2;
    for (let c = 0; c < ww; c++) r(a + c, y + j, 1, 1, c < ww * 0.3 ? CLOTH[3] : c < ww * 0.7 ? CLOTH[2] : c < ww - 1 ? CLOTH[1] : CLOTH[0]);
    if (f > 0.97) r(a, y + j, ww, 1, CLOTH[0]);
  }
  r(x + Math.round((w - nw) / 2), y + 3, nw, 1, CLOTH[0]);
  r(x + Math.round(w * 0.3), y + Math.round(h * 0.55), Math.max(1, Math.round(w * 0.3)), 1, CLOTH[3]);
}

/** A heap of sacks: a row at the foot and a smaller row up on the gaps. */
export function sacks(r: Rect, W: number, D: number, T: number): void {
  const H = D + T, nx = Math.max(1, Math.round(W / 13)), cw = Math.floor(W / nx), bh = Math.min(14, H - 6), x0 = Math.floor((W - cw * nx) / 2);
  if (nx > 1) for (let i = 1; i < nx; i++) sack(r, x0 + i * cw - Math.round(cw * 0.45), H - bh - Math.round(bh * 0.5), Math.round(cw * 0.9), bh - 1);
  for (let i = 0; i < nx; i++) sack(r, x0 + i * cw, H - bh, cw, bh);
}

/** A cart seen side on: the bed (its inside from above), the side board, two spoked wheels with iron tyres. */
export function cart(r: Rect, W: number, D: number, T: number): void {
  const H = D + T, bed = Math.min(8, T - 8);
  r(0, 0, W, D, TIM[1]);
  for (let j = 3; j < D - 1; j += 4) r(1, j, W - 2, 1, TIM[0]);
  r(0, 0, W, 1, TIM[4]), r(0, 0, 1, D, TIM[3]), r(W - 1, 0, 1, D, TIM[2]);
  slab(r, 0, D, W, bed, TIM);
  for (let x = 9; x < W - 2; x += 10) r(x, D + 1, 1, bed - 2, TIM[1]);
  const R = Math.min(14, T - 1), wy = H - R;
  for (const cx of [Math.round(W * 0.22), Math.round(W * 0.78)]) {
    const wx = cx - Math.floor(R / 2);
    ell(r, wx, wy, R, R, IRON[1]), ell(r, wx + 1, wy + 1, R - 2, R - 2, IRON[3]), ell(r, wx + 2, wy + 2, R - 4, R - 4, TIM[0]);
    r(wx + 2, wy + Math.floor(R / 2), R - 4, 1, TIM[3]), r(wx + Math.floor(R / 2), wy + 2, 1, R - 4, TIM[3]);
    r(wx + Math.floor(R / 2) - 1, wy + Math.floor(R / 2) - 1, 3, 3, TIM[4]);
  }
}

/** A stump of radius `rad` tiles: a short trunk, a lit cut ring on top, roots flaring at the foot. */
export function stumpCut(rad: number): Cut {
  const w = Math.max(15, Math.round(rad * 2.6 * 20)), d = Math.max(8, Math.round(rad * 2.6 * 12)), trunk = 6, H = d + trunk + 3, BARK = [TIM[2], TIM[3], TIM[4], '#7a5a3c', '#94724a'];
  return toCut(paint(w, H, (r) => {
    barrel(r, 2, 0, w - 4, d, H - 2, { lid: 'cut', pal: BARK });
    // Roots: the last rows flare out, three humps at the foot.
    r(1, H - 3, w - 2, 1, BARK[1]), r(0, H - 2, w, 1, BARK[1]), r(0, H - 1, w, 1, BARK[0]);
    r(1, H - 3, 3, 1, BARK[2]), r(0, H - 2, 3, 1, BARK[2]), r(w - 1, H - 2, 1, 1, BARK[0]), r(Math.floor(w / 2), H - 1, 1, 1, TIM[0]);
  }));
}
