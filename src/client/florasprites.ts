/**
 * The flat view's trees, pines and bushes in all their looks (flora.ts; docs/design/flora.md, slice 2): the one
 * drawing of each (sprites.ts `FLORA_PARTS`) reshaped, recoloured and sized, made the first time it is wanted
 * and kept. The mirror is done when it is drawn (blocks.ts).
 */
import { CROWN, SIZES, tintCss, type FloraKind, type FloraLook } from './flora';
import { FLORA_PARTS, grown, type Part, type Sprite } from './sprites';

/** Each drawing's box, where its crown's foot is (it is stretched from there), and how big the middling one is drawn. */
const BASE: Record<FloraKind, { w: number; h: number; foot: number; k: number }> = {
  tree: { w: 20, h: 26, foot: 15, k: 2 }, pine: { w: 16, h: 28, foot: 28, k: 2 }, bush: { w: 14, h: 10, foot: 10, k: 1.5 },
};
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
  const shaped = reshape(FLORA_PARTS[kind], b.w, b.h, b.foot, kx, ky);
  // Its green; a bush's berries stay, go, or turn to blossom.
  const parts = shaped.parts.map((p): Part => {
    const col = p[p.length - 1] as string, next = BERRY.has(col) ? (l.fruit === 1 ? col : l.fruit === 2 ? '#d6d0b4' : tintCss('#2f4a28', l.green)) : tintCss(col, l.green);
    return [...p.slice(0, -1), next] as unknown as Part;
  });
  made.set(key, (s = grown(shaped.w, shaped.h, parts, b.k * SIZES[l.size], b.k * SIZES[l.size])));
  return s;
}
