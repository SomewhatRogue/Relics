/**
 * THE RISE's own small helpers (shared/lowfurrowrise.ts): things laid in clumps, never evenly, and marks sprinkled
 * over a box, all on the kit's seeded stream and its claims (shared/expedkit.ts). Pure.
 */
import type { MarkKind, RoundKind } from './arena.js';
import { claim, free, mark, type Kit, type P } from './expedkit.js';

/** Up to `n` round things of `kinds` in a clump round (cx, cy), `spread` tiles out, each clear of what's laid and the road. */
export function clump(k: Kit, kinds: RoundKind[], cx: number, cy: number, n: number, spread: number, r: [number, number], road = 1.4): P[] {
  const out: P[] = [];
  for (let i = 0; i < n; i++) for (let t = 0; t < 14; t++) {
    const a = k.rng.range(0, Math.PI * 2), d = spread * Math.sqrt(k.rng.next()), rr = k.rng.range(r[0], r[1]);
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.8;
    if (!free(k, x, y, rr, road)) continue;
    k.rounds.push({ kind: k.rng.pick(kinds), x, y, r: rr }), claim(k, x, y, rr), out.push({ x, y });
    break;
  }
  return out;
}

/** `n` marks of `kind` (about w by h) somewhere in the box, sized a little by the seed. Paint only, so nothing is claimed. */
export function sprinkle(k: Kit, kind: MarkKind, n: number, x0: number, y0: number, x1: number, y1: number, w: number, h: number): void {
  for (let i = 0; i < n; i++) {
    const s = k.rng.range(0.7, 1.3), mw = w * s, mh = h * s;
    mark(k, kind, k.rng.range(x0, x1 - mw), k.rng.range(y0, y1 - mh), mw, mh);
  }
}

/** A mark centred on (x, y). */
export const markAt = (k: Kit, kind: MarkKind, x: number, y: number, w: number, h: number) => mark(k, kind, x - w / 2, y - h / 2, w, h);
