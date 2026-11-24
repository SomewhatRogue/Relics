/**
 * Trees drawn the tile way (docs/design/forest-redraw.md, Kyle 2026-11-23 after Ruinsong): a pine and a broadleaf
 * by code, a few variants each. Six shades a material, light from the upper left, every needle clump or leaf clump
 * lit on its top left and dark beneath, each tier's underside dark where it hangs over the one below, a dark outline
 * round the whole. One drawn pixel to one render pixel (20 a tile across, 16 a tile up), stood up as a card.
 */
import type { Cut } from './three/propcards';
import { clumpLight as clump } from './tilegrounds';

const PINE = ['#060b0b', '#0b1615', '#10211e', '#162d27', '#1f3e31', '#2b523e'];
export const LEAF = ['#080d07', '#10180c', '#172211', '#203017', '#2b3f1d', '#3a5025'];
export const BARK = ['#120c08', '#24180f', '#352416', '#47321f'];

export const hash = (a: number, b: number, s: number) => {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(s | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** A pixel grid of palette indices (-1 clear), painted to a card at the end. */
export class Grid {
  readonly a: Int8Array;
  readonly pal: string[] = [];
  constructor(readonly w: number, readonly h: number) {
    this.a = new Int8Array(w * h).fill(-1);
  }
  set(x: number, y: number, v: number): void {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.a[y * this.w + x] = v;
  }
  get(x: number, y: number): number {
    return x < 0 || y < 0 || x >= this.w || y >= this.h ? -1 : this.a[y * this.w + x];
  }
  /** Every filled pixel next to a clear one (or the edge) takes `v`: the dark outline. */
  outline(v: number): void {
    const edge: number[] = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++)
      if (this.get(x, y) >= 0 && (this.get(x - 1, y) < 0 || this.get(x + 1, y) < 0 || this.get(x, y - 1) < 0 || this.get(x, y + 1) < 0)) edge.push(y * this.w + x);
    for (const i of edge) this.a[i] = v;
  }
  cut(cols: string[], ax: number, ay: number): Cut {
    const mk = () => Object.assign(document.createElement('canvas'), { width: this.w, height: this.h });
    const lit = mk(), g = lit.getContext('2d')!;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; ) {
      const v = this.get(x, y);
      let n = 1;
      while (x + n < this.w && this.get(x + n, y) === v) n++;
      if (v >= 0) (g.fillStyle = cols[v]), g.fillRect(x, y, n, 1);
      x += n;
    }
    return { lit, glow: mk(), w: this.w, h: this.h, ax, ay };
  }
}

/** Palette: 0..5 the foliage, 6..9 the bark. */
export const quant = (v: number) => Math.max(1, Math.min(5, Math.round(v * 5)));

/** A trunk from (cx, top) down to the foot, `w` wide, lit on its left. */
function trunk(G: Grid, cx: number, top: number, foot: number, w: number): void {
  for (let y = top; y <= foot; y++) {
    const flare = y > foot - 3 ? foot - y < 1 ? 2 : 1 : 0;
    for (let x = cx - Math.floor(w / 2) - flare; x < cx - Math.floor(w / 2) + w + flare; x++) {
      const t = (x - (cx - w / 2 - flare)) / (w + 2 * flare);
      G.set(x, y, 6 + (t < 0.3 ? 3 : t < 0.65 ? 2 : 1));
    }
  }
}

/** A pine, variant `v`: four or five tiers of hanging needle clumps on a short trunk. */
export function pineCut(v: number): Cut {
  const W = 44 + Math.floor(hash(v, 1, 3) * 3) * 2, H = 84 + Math.floor(hash(v, 2, 3) * 3) * 4, cx = W / 2;
  const G = new Grid(W, H), foot = H - 1, tiers = 5;
  trunk(G, Math.round(cx), foot - 14, foot, 6);
  // From the bottom tier up, so each tier's dark underside lies over the one beneath it.
  const top = 2, base = foot - 9;
  for (let i = 0; i < tiers; i++) {
    const f = i / (tiers - 1), yb = Math.round(base - f * (base - top) * 0.78), yt = Math.round(yb - (base - top) * (0.34 - f * 0.08));
    const hw = (W / 2 - 1) * (1 - f * 0.62), ph = hash(v, i, 7) * 6;
    for (let y = Math.max(0, yt); y <= yb + 2; y++) {
      const t = (y - yt) / Math.max(1, yb - yt);
      for (let x = 0; x < W; x++) {
        const dx = x + 0.5 - cx;
        // The lower edge hangs in clumps: scallops a few pixels wide.
        const hang = yb - 1 + Math.round(2.5 * Math.abs(Math.sin(dx * 0.55 + ph)));
        const half = hw * Math.min(1, t) ** 0.85 + (hash(x, y, 11 + i) < 0.25 ? 1 : 0);
        if (Math.abs(dx) > half || y > hang) continue;
        // Light: from the upper left across the tier, darker toward its hanging edge; clumps lit on their top left.
        let lv = 0.56 - (dx / Math.max(1, hw)) * 0.38 - Math.max(0, t - 0.62) * 0.95 + clump(x, y, 6, 4, 13 + i * 3) + f * 0.06;
        if (y >= hang - 1) lv = Math.min(lv, 0.2);
        G.set(x, y, quant(lv));
      }
    }
  }
  G.outline(0);
  return G.cut([...PINE, ...BARK], Math.round(cx), foot);
}

/** A broadleaf, variant `v`: a broad, lumpy crown in rows of lobes over a short trunk shaded beneath it. */
export function oakCut(v: number): Cut {
  const W = 64 + Math.floor(hash(v, 1, 5) * 3) * 2, H = 70 + Math.floor(hash(v, 2, 5) * 3) * 2, cx = W / 2;
  const G = new Grid(W, H), foot = H - 1, crownFoot = H - 15;
  trunk(G, Math.round(cx), crownFoot - 8, foot, 7);
  // Under the crown the trunk is in its shade.
  for (let y = crownFoot - 8; y < crownFoot + 3; y++) for (let x = 0; x < W; x++) if (G.get(x, y) >= 6) G.set(x, y, 6);
  // Lobes in rows, the top row first so the lower rows hang in front; each lobe lit on its own top left.
  const rows: [number, number, number][][] = [];
  const row = (y: number, n: number, r: number, spread: number) => rows.push(Array.from({ length: n }, (_, i) => {
    const x = cx + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread) + (hash(v, i + n * 7, 21) - 0.5) * 4;
    return [x, y + (hash(v, i + n * 5, 22) - 0.5) * 4, r + (hash(v, i + n * 3, 23) - 0.5) * 4] as [number, number, number];
  }));
  row(crownFoot - 40, 2, 11, W * 0.3);
  row(crownFoot - 27, 3, 12, W * 0.55);
  row(crownFoot - 12, 4, 11, W * 0.72);
  for (const lobes of rows) for (const [bx, by, br] of lobes) {
    for (let y = Math.floor(by - br); y <= by + br; y++) for (let x = Math.floor(bx - br); x <= bx + br; x++) {
      const dx = x + 0.5 - bx, dy = y + 0.5 - by, d = Math.hypot(dx, dy * 1.15);
      if (d > br - (hash(x >> 1, y >> 1, 17) < 0.35 ? 1.5 : 0)) continue;
      let lv = 0.55 - (dx / br) * 0.22 - (dy / br) * 0.36 - ((x - cx) / W) * 0.2 + clump(x, y, 7, 5, 19);
      if (dy > br * 0.62) lv = Math.min(lv, 0.22);
      G.set(x, y, quant(lv));
    }
  }
  G.outline(0);
  return G.cut([...LEAF, ...BARK], Math.round(cx), foot);
}

const REED = ['#0d110a', '#20261a', '#333a22', '#484c2a'], REED_HEAD = '#3d2a1b';

/** A clump of reeds, variant `v`: thin blades of uneven height leaning a little, the tall ones with a dark head. */
export function reedCut(v: number): Cut {
  const W = 13, H = 20, G = new Grid(W, H), foot = H - 1, n = 5 + Math.floor(hash(v, 1, 31) * 3);
  for (let i = 0; i < n; i++) {
    const x0 = 2 + Math.round((i / (n - 1)) * (W - 5) + (hash(v, i, 32) - 0.5) * 2), tall = 8 + Math.floor(hash(v, i, 33) * 11), lean = (hash(v, i, 34) - 0.4) * 0.22;
    for (let t = 0; t <= tall; t++) {
      const x = x0 + Math.round(lean * t), y = foot - t;
      // Lit on the left blades and toward the tips; the foot dark.
      G.set(x, y, t < 2 ? 0 : x0 < W / 2 ? (t > tall * 0.6 ? 3 : 2) : t > tall * 0.7 ? 2 : 1);
    }
    if (tall > 13) for (let t = 0; t < 3; t++) G.set(x0 + Math.round(lean * (tall - t)), foot - tall + t, 4);
  }
  return G.cut([...REED, REED_HEAD], W >> 1, foot);
}
