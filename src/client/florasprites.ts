/**
 * The flat view's trees, pines and bushes in all their looks (flora.ts; docs/design/flora.md, slice 2): the one
 * drawing of each (sprites.ts `FLORA_PARTS`) reshaped, recoloured and sized, made the first time it is wanted
 * and kept. The mirror is done when it is drawn (blocks.ts).
 */
import { CROWN, SIZES, tintCss, type FloraKind, type FloraLook } from './flora';
import { FLORA_PARTS, grown, type Part, type Sprite } from './sprites';

/** Each drawing's box, where its crown's foot is (it is stretched from there), and how big the middling one is drawn. */
const BASE: Record<FloraKind, { w: number; h: number; foot: number; k: number }> = {
  tree: { w: 20, h: 26, foot: 15, k: 2 }, pine: { w: 16, h: 28, foot: 28, k: 2 }, bush: { w: 14, h: 10, foot: 10, k: 1.5 }, willow: { w: 22, h: 25, foot: 14, k: 2 },
};
/** A shoot's tip: pixels one over another (pixels move with the crown when it is reshaped; a rect would not). */
const tip = (x: number, y: number, n: number, col: string): Part[] => Array.from({ length: n }, (_, i): Part => ['p', x, y + i, col]);
/**
 * A pollard willow (slice 3): a short fat trunk, the knuckled head it has been cut back to, a dark mass of leaf and
 * five narrow sprays standing up out of it in grey-green, pale at their tops, the shoots' tips above.
 */
const WILLOW: Part[] = [
  ['r', 9, 15, 5, 10, '#4c4032'], ['r', 10, 16, 1, 8, '#3a3026'], ['r', 13, 17, 1, 6, '#5e5040'], ['r', 8, 24, 2, 1, '#3a3026'], ['r', 13, 24, 2, 1, '#3a3026'],
  ['r', 7, 13, 9, 3, '#584a3a'], ['r', 8, 12, 7, 1, '#584a3a'], ['r', 8, 13, 2, 1, '#6a5c48'], ['r', 14, 15, 2, 1, '#3a3026'], ['r', 11, 12, 2, 1, '#6a5c48'],
  ['e', 11, 8, 9.5, 5.6, '#34493a'], ['e', 11, 11.6, 8, 1.5, '#28382c'],
  ['e', 4.5, 8.5, 2.4, 4.4, '#4a6450'], ['e', 8, 6.4, 2.2, 5.4, '#567260'], ['e', 12, 5.8, 2.2, 5.6, '#4f6a58'], ['e', 15.5, 6.8, 2.2, 5, '#567260'], ['e', 18.5, 9, 2, 3.8, '#4a6450'],
  ['e', 7.5, 4.4, 1.2, 2.8, '#7a9480'], ['e', 12, 3.5, 1.2, 2.8, '#869e88'], ['e', 15.5, 4.8, 1.1, 2.4, '#7a9480'],
  ...tip(3, 4, 3, '#6a8470'), ...tip(6, 1, 3, '#7a9480'), ...tip(10, 0, 3, '#869e88'), ...tip(13, 0, 2, '#7a9480'), ...tip(16, 1, 3, '#6a8470'), ...tip(19, 5, 3, '#6a8470'),
];
const DRAWING = (kind: FloraKind): Part[] => (kind === 'willow' ? WILLOW : FLORA_PARTS[kind]);
const BERRY = new Set(['#7a2a3a', '#8a3a4a']);
const made = new Map<string, Sprite>();

/** The crown stretched about its foot and its middle; trunks and everything square keep their shape and move with it. */
function reshape(parts: Part[], w: number, h: number, foot: number, kx: number, ky: number): { parts: Part[]; w: number; h: number } {
  const W = Math.ceil(w * Math.max(1, kx)), up = Math.max(0, Math.ceil(foot * (ky - 1))), mid = w / 2, dx = (W - w) / 2;
  const out = parts.map((p): Part => {
    if (p[0] === 'e') return ['e', W / 2 + (p[1] - mid) * kx, foot + up - (foot - p[2]) * ky, p[3] * kx, p[4] * ky, p[5]];
    if (p[0] === 'p') return ['p', Math.round(W / 2 + (p[1] + 0.5 - mid) * kx - 0.5), Math.round(foot + up - (foot - p[2] - 0.5) * ky - 0.5), p[3]];
    return [p[0], p[1] + dx, p[2] + up, p[3], p[4], p[5]] as Part;
  });
  return { parts: out, w: W, h: h + up };
}

export function floraSprite(kind: FloraKind, l: FloraLook): Sprite {
  const key = `${kind}:${l.shape}:${l.green}:${l.size}:${l.fruit}`;
  let s = made.get(key);
  if (s) return s;
  const b = BASE[kind], [kx, ky] = CROWN[l.shape];
  const shaped = reshape(DRAWING(kind), b.w, b.h, b.foot, kx, ky);
  // Its green; a bush's berries stay, go, or turn to blossom.
  const parts = shaped.parts.map((p): Part => {
    const col = p[p.length - 1] as string, next = BERRY.has(col) ? (l.fruit === 1 ? col : l.fruit === 2 ? '#d6d0b4' : tintCss('#2f4a28', l.green)) : tintCss(col, l.green);
    return [...p.slice(0, -1), next] as unknown as Part;
  });
  made.set(key, (s = grown(shaped.w, shaped.h, parts, b.k * SIZES[l.size], b.k * SIZES[l.size])));
  return s;
}
