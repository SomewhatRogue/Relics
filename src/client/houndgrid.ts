/**
 * The pieces a hound is painted from (houndbody.ts lays them out per pose): a letter grid the size of
 * HOUND_BOX, and its head, legs and tail, each placed by a breed's Shape. Letters are coat parts
 * (houndcoats.ts): B coat, D dark (far side), L light, P points, R rough hair, N nose, E eye, W white.
 */
import type { HoundLook } from '../shared/houndlook';
import { hasBlaze, hasSocks } from './houndcoats';
import { HEADS, headRows } from './houndheads';
import { HOUND_BOX as BOX, type Shape } from './houndshapes';

export class Grid {
  readonly g: string[][] = Array.from({ length: BOX.h }, () => Array<string>(BOX.w).fill(''));
  /** Pixels that fell outside the box (none ever should: tests/hound.test.ts). */
  clipped = 0;
  set(x: number, y: number, ch: string): void {
    (x = Math.round(x)), (y = Math.round(y));
    if (x < 0 || y < 0 || x >= BOX.w || y >= BOX.h) return void this.clipped++;
    this.g[y][x] = ch;
  }
  has(x: number, y: number): boolean {
    return y >= 0 && y < BOX.h && x >= 0 && x < BOX.w && this.g[y][x] !== '';
  }
  rect(x: number, y: number, w: number, h: number, ch: string): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, ch);
  }
  /** A line `w` pixels thick (sideways), and the pixels it set. */
  line(x0: number, y0: number, x1: number, y1: number, ch: string, w = 1): [number, number][] {
    const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))), out: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
      for (let k = 0; k < w; k++) this.set(x + k, y, ch), out.push([x + k, y]);
    }
    return out;
  }
  /** Fill a polygon (the pixels whose middles fall inside it). */
  poly(pts: [number, number][], ch: string): void {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) this.set(x, y, ch);
    }
  }
}

/** Where the drawing hangs things on a head: the jaw's underside start, the muzzle's tip, the eye, the top. */
export interface HeadAt { jaw: [number, number]; tip: number; eye: [number, number]; top: number }

/** Feet coloured: white socks, else a hill hound's tan or a collie's white toes. */
function feet(gr: Grid, look: HoundLook, px: [number, number][], fy: number, far: boolean): void {
  const socks = hasSocks(look.mark), tan = look.breed === 'hillhound', toes = look.breed === 'collie';
  for (const [x, y] of px) {
    if (socks && y >= fy - 1) gr.set(x, y, far ? 'w' : 'W');
    else if (tan && y >= fy - 1 && !far) gr.set(x, y, 'P');
    else if (toes && y === fy) gr.set(x, y, far ? 'w' : 'P');
  }
}

/**
 * One leg from its joint (jx, jy: the body's underside) to a foot shifted `dx` (toward the head) and
 * lifted `up`, `lift` off the ground for the whole hound, a paw at the bottom pointing forward. A hind
 * leg goes back from the thigh to the hock, then down to the foot, the way a dog's does.
 */
export function leg(gr: Grid, s: Shape, look: HoundLook, hind: boolean, jx: number, jy: number, dx: number, up: number, lift: number, far: boolean): void {
  const G = BOX.ground, ch = far ? 'D' : 'B', fy = G - lift - up, w = s.legW;
  const fx = jx + dx - (hind ? 1 : 0), px: [number, number][] = [];
  if (hind) {
    const hy = Math.max(jy + 1, fy - Math.max(2, Math.round((fy - jy) * 0.4))), hx = jx - 2 + Math.round(dx / 2);
    px.push(...gr.line(jx - 1, jy - 1, hx, hy, ch, w), ...gr.line(hx, hy, fx, fy - 1, ch, Math.max(2, w - 1)));
  } else px.push(...gr.line(jx, jy, fx, fy - 1, ch, w));
  px.push(...gr.line(fx, fy, fx + w, fy, ch));
  feet(gr, look, px, fy, far);
}

/** The tail from (bx, by): carried as the breed carries it, raised, streaming, tucked or along the floor; `wag` in degrees. Thick at the root. */
export function tail(gr: Grid, s: Shape, bx: number, by: number, mode: 'up' | 'run' | 'tuck' | 'ground' | undefined, wag: number): void {
  let { base, curl, len } = s.tail;
  if (mode === 'up') base = Math.max(base, 10) + 28;
  else if (mode === 'run') (base = base > 0 ? 24 : -12), (curl *= 0.4), (len -= 1);
  else if (mode === 'tuck') (base = -100), (curl = -6), (len -= 2);
  else if (mode === 'ground') (base = 4), (curl = Math.max(4, curl / 2)), (len = Math.min(len, 5));
  let x = bx, y = by;
  for (let i = 0; i < len; i++) {
    const a = ((base + wag + curl * i) * Math.PI) / 180;
    (x -= Math.cos(a)), (y = Math.max(0, Math.min(BOX.ground, y - Math.sin(a))));
    const last = i === len - 1;
    gr.set(x, y, last && s.ruff ? 'P' : 'B');
    if (i < len / 3 && Math.round(y) < BOX.ground) gr.set(x, y + 1, 'B');
    else if (s.tail.thick === 2 && !last && Math.round(y) < BOX.ground) gr.set(x, y + 1, 'L');
  }
}

/** A breed's head drawing's size (closed), for placing it. */
export const headSize = (look: HoundLook, open = false): [number, number] => {
  const rows = headRows(look.breed, open);
  return [Math.max(...rows.map((r) => r.length)), rows.length];
};

/**
 * The neck from `from` (the withers' front) and the head with its drawing's top left at (hx, hy): ears
 * (pricked up, laid back running, or as the breed wears them), the jaws open or shut, a blaze.
 */
export function head(gr: Grid, s: Shape, look: HoundLook, from: [number, number], hx: number, hy: number, ears?: 'back' | 'up', open = false): HeadAt {
  const art = HEADS[look.breed], rows = headRows(look.breed, open), [, th] = headSize(look), tan = look.breed === 'hillhound', blaze = hasBlaze(look.mark);
  // The neck: from the withers and the chest's front up into the back of the skull and the throat.
  const fx = from[0], fy = Math.min(from[1], BOX.ground - 4);
  gr.poly([[fx - 3, fy - 1], [hx + 0.5, hy + 0.5], [hx + 3.5, hy + th - 1.5], [fx + 2.5, fy + 3.5]], 'B');
  if (s.ruff) gr.poly([[fx + 1, fy + 1], [hx + 1.5, hy + th - 2], [hx + 3.5, hy + th - 0.5], [fx + 3.5, fy + 3.5]], 'P');
  const at: Record<string, string> = { B: 'B', Z: blaze ? 'W' : 'B', M: tan ? 'P' : 'B', P: 'P', R: 'R', L: 'L', N: 'N', E: 'E' };
  rows.forEach((r, y) => [...r].forEach((ch, x) => ch !== '.' && gr.set(hx + x, hy + y, at[ch] ?? 'B')));
  for (const [x, y] of art.ears[ears ?? 'rest']) gr.set(hx + x, hy + y, 'D');
  const w = Math.max(...rows.map((r) => r.length));
  return { jaw: [hx + 4, hy + th], tip: hx + w - 1, eye: [hx + art.eye[0], hy + art.eye[1]], top: hy - 3 };
}
