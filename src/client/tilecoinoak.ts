/**
 * The Coin Oak the tile way (docs/design/the-high-wood.md, "The look"; docs/design/tile-redraw.md, "Making a new asset"):
 * the landmark of THE HIGH WOOD (shared/highwoodland.ts, block `coinoak`). A trunk wide as a house, gnarled, flaring
 * into roots, a hollow at its foot (the den's mouth, dark); a vast crown in four dark greens over it; two low boughs
 * with three cut rope ends hanging empty (no ribbons, nobody hanging); and small bright coins hammered edgewise into
 * the bark HIGH up only, the low ones prised out and gone, a few dark pits where they were. Bark in four shades,
 * light from the upper left, a clean dark outline, no noise. Cosmetic only: the block is the room's.
 */
import type { Block } from '../shared/arena';
import type { Cut } from './three/propcards';
import { Grid, hash } from './tiletrees';

const COLS = ['#07090a', '#1a120b', '#2b1d12', '#3f2b19', '#56402a', '#0c180e', '#14251a', '#1d3721', '#2a4a2c', '#34502a', '#040506', '#e0c060', '#fff0a0', '#9a7a30', '#6a5a3a', '#463a26'];
const OUT = 0, B_D = 1, B_M = 2, B_L = 3, B_H = 4, F0 = 5, MOSS = 9, HOLE = 10, COIN = 11, COIN_H = 12, COIN_D = 13, ROPE = 14, ROPE_D = 15;

/** Bark shade at fraction `t` across a trunk (0 left, lit): four bands, a furrow dropping one. */
const bark = (t: number, furrow: boolean) => Math.max(B_D, (t < 0.18 ? B_H : t < 0.45 ? B_L : t < 0.75 ? B_M : B_D) - (furrow ? 1 : 0));

export function coinOakCut(_b: Block): Cut {
  const W = 270, H = 214, cx = 135, base = H - 6, G = new Grid(W, H), top = 90;
  // The trunk: gnarled sides, flaring at the foot; vertical furrows that wander.
  const half = (y: number) => {
    const t = (y - top) / (base - top), flare = t > 0.78 ? ((t - 0.78) / 0.22) ** 2 * 22 : 0;
    return Math.round(34 + t * 6 + flare + 3 * Math.sin(y * 0.09) + 2 * Math.sin(y * 0.23 + 1));
  };
  // Boughs first, behind the trunk and under the crown: out to either side, sagging, thick to thin.
  const boughs: { dir: number; y0: number; len: number; at: (i: number) => [number, number] }[] = [];
  for (const [dir, y0, len] of [[1, 126, 96], [-1, 132, 88]] as const) {
    const yAt = (i: number) => Math.round(y0 - i * 0.12 + (i * i) / (len * 7));
    for (let i = 0; i <= len; i++) {
      const x = cx + dir * (24 + i), th = Math.max(3, Math.round(11 - (i / len) * 8)), y = yAt(i);
      for (let k = 0; k < th; k++) G.set(x, y + k, k === 0 ? B_H : k < th - 2 ? B_L : k < th - 1 ? B_M : B_D);
    }
    boughs.push({ dir, y0, len, at: (i) => [cx + dir * (24 + i), yAt(i) + Math.max(3, Math.round(11 - (i / len) * 8))] });
  }
  for (let y = top; y <= base; y++) {
    const h = half(y), furrowAt = (x: number) => (x + Math.round(3 * Math.sin(y * 0.07 + x * 0.05))) % 7 === 0;
    for (let x = cx - h; x <= cx + h; x++) G.set(x, y, bark((x - (cx - h)) / (2 * h + 1), furrowAt(x) && y < base - 3));
  }
  // Roots spreading over the ground: a wedge each side and two smaller, lit along their tops.
  const root = (dir: number, y0: number, len: number, th: number) => {
    for (let i = 0; i <= len; i++) {
      const x = cx + dir * (half(base - 6) - 6 + i), t = i / len, y = Math.round(y0 + t * (base - y0) * 0.9 + Math.sin(i * 0.3) * 1.5), w = Math.max(2, Math.round(th * (1 - t * 0.8)));
      for (let k = 0; k < w; k++) G.set(x, Math.min(base, y + k), k === 0 ? B_H : k < w - 1 ? B_L : B_D);
    }
  };
  root(1, base - 34, 54, 12), root(-1, base - 30, 50, 12), root(1, base - 18, 30, 7), root(-1, base - 16, 34, 7);
  // The hollow at its foot: a tall dark arch, a lit lip of bark to its left and dark within.
  const hx = cx - 3, hw = 17, hh = 46;
  for (let y = base - hh; y <= base; y++) {
    const up = y - (base - hh), w = up < hw ? Math.round(Math.sqrt(Math.max(0, hw * hw - (hw - up) ** 2))) : hw;
    for (let x = hx - w; x <= hx + w; x++) G.set(x, y, HOLE);
    if (w > 0 && up > 2) G.set(hx - w - 1, y, B_D), G.set(hx - w - 2, y, B_D);
  }
  // The crown: lobes in rows, top row first, each lit on its own top left; the underside of each dark.
  const rows: [number, number, number][][] = [];
  const row = (y: number, n: number, r: number, spread: number) => rows.push(Array.from({ length: n }, (_, i) => [
    cx + (i / (n - 1) - 0.5) * spread + (hash(i, n, 71) - 0.5) * 6, y + (hash(i, n * 5, 72) - 0.5) * 6, r + (hash(i, n * 3, 73) - 0.5) * 5] as [number, number, number]));
  row(28, 4, 24, 110), row(52, 6, 26, 170), row(76, 7, 26, 210), row(96, 8, 22, 224);
  for (const lobes of rows) for (const [bx, by, br] of lobes) {
    for (let y = Math.floor(by - br); y <= by + br; y++) for (let x = Math.floor(bx - br); x <= bx + br; x++) {
      const dx = x + 0.5 - bx, dy = y + 0.5 - by, d = Math.hypot(dx, dy * 1.12);
      if (d > br - (hash(x >> 1, y >> 1, 17) < 0.3 ? 1.5 : 0)) continue;
      let lv = 0.62 - (dx / br) * 0.24 - (dy / br) * 0.34 - ((x - cx) / W) * 0.12 + (hash(x >> 2, y >> 2, 9) - 0.5) * 0.18;
      if (dy > br * 0.6) lv = Math.min(lv, 0.1);
      G.set(x, y, F0 + Math.max(0, Math.min(3, Math.round(lv * 3.6))));
    }
  }
  G.outline(OUT);
  // Moss on the roots' lit tops and the bough tops, a few patches.
  for (let x = 0; x < W; x++) for (let y = base - 22; y <= base; y++) if (G.get(x, y) === B_H && (x * 7 + y) % 5 < 2) G.set(x, y, MOSS);
  // Coins, HIGH only: small edgewise slivers a pixel wide, two tall, a bright one beside; the low ones prised out leave dark pits.
  for (let i = 0; i < 22; i++) {
    const y = top + 6 + Math.floor(hash(i, 1, 41) * 56), h = half(y), x = cx - h + 5 + Math.floor(hash(i, 2, 41) * (2 * h - 9));
    if (G.get(x, y) < 0 || G.get(x, y) === HOLE) continue;
    const tall = hash(i, 3, 41) < 0.6;
    G.set(x, y, i % 3 ? COIN : COIN_H), G.set(tall ? x : x + 1, tall ? y + 1 : y, i % 3 ? COIN_D : COIN);
    if (i % 4 === 0) G.set(x + 1, y, COIN_H);
  }
  for (let i = 0; i < 9; i++) {
    const y = top + 70 + Math.floor(hash(i, 4, 43) * 56), h = half(y), x = cx - h + 6 + Math.floor(hash(i, 5, 43) * (2 * h - 12));
    if (G.get(x, y) >= B_D && G.get(x, y) <= B_H && Math.abs(x - hx) > hw + 3) G.set(x, y, OUT), G.set(x, y + 1, OUT), G.set(x - 1, y, B_H);
  }
  // Rope ends hanging cut and empty from the low boughs: three, uneven, each frayed at its foot (a loose strand).
  for (const [bi, at, len] of [[0, 54, 17], [0, 74, 9], [1, 46, 13]] as const) {
    const [rx, ry] = boughs[bi].at(at);
    for (let y = 0; y < len; y++) G.set(rx, ry + y, y % 4 < 2 ? ROPE : ROPE_D), G.set(rx + 1, ry + y, ROPE_D);
    G.set(rx - 1, ry + len, ROPE), G.set(rx + 1, ry + len, ROPE_D), G.set(rx + 2, ry + len - 1, ROPE_D);
  }
  return G.cut(COLS, cx, base);
}
