/**
 * The pieces a hound is painted from (houndbody.ts lays them out per pose): a letter grid the size of
 * HOUND_BOX, and its head, legs and tail, each placed by a breed's Shape. Letters are coat parts
 * (houndcoats.ts): B coat, D dark (far side), L light, P points, R rough hair, N nose, E eye, W white.
 */
import type { HoundLook } from '../shared/houndlook';
import { hasBlaze, hasSocks } from './houndcoats';
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
}

/** Where the drawing hangs things on a head: the jaw's underside start, the muzzle's tip, the eye, the top. */
export interface HeadAt { jaw: [number, number]; tip: number; eye: [number, number]; top: number }

/** Feet coloured: white socks, else a hill hound's tan or a collie's white toes. */
function feet(gr: Grid, s: Shape, look: HoundLook, px: [number, number][], fy: number, far: boolean): void {
  const socks = hasSocks(look.mark), tan = look.breed === 'hillhound', toes = look.breed === 'collie';
  for (const [x, y] of px) {
    if (socks && y >= fy - 1) gr.set(x, y, far ? 'w' : 'W');
    else if (tan && y >= fy - 1 && !far) gr.set(x, y, 'P');
    else if (toes && y === fy) gr.set(x, y, far ? 'w' : 'P');
  }
}

/**
 * One leg from its joint (jx, jy: the body's underside) to a foot shifted `dx` (toward the head) and
 * lifted `up`, `lift` off the ground for the whole hound. A hind leg bends: stifle forward, hock back.
 */
export function leg(gr: Grid, s: Shape, look: HoundLook, hind: boolean, jx: number, jy: number, dx: number, up: number, lift: number, far: boolean): void {
  const G = BOX.ground, ch = far ? 'D' : 'B', fy = G - lift - up, w = s.legW;
  const fx = jx + dx - (hind ? 1 : 0), px: [number, number][] = [];
  if (hind) {
    const kx = jx + 1 + Math.round(dx / 2), ky = Math.round((jy + fy) / 2) - 1;
    px.push(...gr.line(jx - 1, jy, kx, ky, ch, 2), ...gr.line(kx, ky, fx, fy - 1, ch, w), ...gr.line(fx, fy - 1, fx, fy, ch, w));
  } else px.push(...gr.line(jx, jy, fx, fy, ch, w));
  gr.set(fx + w, fy, ch), px.push([fx + w, fy]);
  feet(gr, s, look, px, fy, far);
}

/** The tail from (bx, by): carried as the breed carries it, raised, streaming, tucked or along the floor; `wag` in degrees. */
export function tail(gr: Grid, s: Shape, bx: number, by: number, mode: 'up' | 'run' | 'tuck' | 'ground' | undefined, wag: number): void {
  let { base, curl, len } = s.tail;
  if (mode === 'up') base = Math.max(base, 10) + 28;
  else if (mode === 'run') (base = base > 0 ? 24 : -12), (curl *= 0.4), (len -= 1);
  else if (mode === 'tuck') (base = -100), (curl = -6), (len -= 2);
  else if (mode === 'ground') (base = 4), (curl = Math.max(4, curl / 2)), (len = Math.min(len, 5));
  let x = bx, y = by;
  for (let i = 0; i < len; i++) {
    const a = ((base + wag + curl * i) * Math.PI) / 180;
    (x -= Math.cos(a)), (y = Math.min(BOX.ground, y - Math.sin(a)));
    const last = i === len - 1;
    gr.set(x, y, last && s.ruff ? 'P' : 'B');
    if (s.tail.thick === 2 && !last && i > 0 && Math.round(y) < BOX.ground) gr.set(x, y + 1, 'L');
  }
}

/**
 * The neck from `from` and the head with its skull's top left at (hx, hy): ears (pricked up, laid back
 * running, or as the breed wears them), the muzzle (open, or closed), nose, eye, brows, beard, a blaze.
 */
export function head(gr: Grid, s: Shape, look: HoundLook, from: [number, number], hx: number, hy: number, ears?: 'back' | 'up', open = false): HeadAt {
  const [sw, sh] = s.skull, mtop = hy + sh - s.snout, tip = hx + sw + s.muzzle - 1, tan = look.breed === 'hillhound';
  // Rose ears sit back on the neck, behind the skull: drawn first.
  if (s.ear === 'rose' && ears !== 'up') ears === 'back' ? (gr.set(hx - 1, hy + 1, 'D'), gr.set(hx - 2, hy + 1, 'D')) : (gr.set(hx, hy - 1, 'D'), gr.set(hx - 1, hy, 'D'));
  gr.line(from[0], from[1], hx + 1, hy + sh - 1, s.ruff ? 'P' : 'B', s.ruff ? 3 : 2);
  if (s.ruff) gr.line(from[0] - 1, from[1] - 1, hx, hy + 1, 'B', 2);
  gr.rect(hx, hy, sw, sh, 'B');
  for (let i = 0; i < s.muzzle; i++) for (let r = 0; r < s.snout; r++) {
    // A long muzzle narrows to its nose.
    if (i === s.muzzle - 1 && s.muzzle >= 3 && r === s.snout - 1 && !s.rough) continue;
    gr.set(hx + sw + i, mtop + r, tan ? 'P' : 'B');
  }
  gr.set(tip, mtop, 'N');
  if (open) for (let i = 1; i < s.muzzle; i++) gr.set(hx + sw + i, hy + sh - 1, 'N'), gr.set(hx + sw + i - 1, hy + sh, tan ? 'P' : 'B');
  const eye: [number, number] = [hx + sw - 1, hy + (sh >= 3 ? 1 : 0)];
  if (hasBlaze(look.mark)) for (let i = -1; i < s.muzzle - 1; i++) gr.set(hx + sw + i, i < 0 ? hy : mtop, 'W');
  gr.set(eye[0], eye[1], 'E');
  if (tan) gr.set(eye[0], eye[1] - 1, 'P');
  if (s.rough) gr.set(eye[0] + 1, eye[1] - 1, 'R'), gr.set(tip - 1, hy + sh + (open ? 1 : 0), 'R'), gr.set(tip, hy + sh + (open ? 1 : 0), 'R');
  // Drop ears hang over the side of the head; a collie's stand with the tips tipped over.
  if (s.ear === 'drop') {
    if (ears === 'back') gr.line(hx, hy + 1, hx - 2, hy + 2, 'D', 1), gr.set(hx - 1, hy + 2, 'D');
    else gr.rect(hx, hy + (ears === 'up' ? 0 : 1), 2, Math.min(sh + (ears === 'up' ? 0 : 1), BOX.ground - hy - (ears === 'up' ? 0 : 1) + 1), 'D');
  } else if (s.ear === 'semi') {
    if (ears === 'back') gr.set(hx, hy - 1, 'D'), gr.set(hx - 1, hy - 1, 'D');
    else gr.set(hx + 1, hy - 1, 'D'), gr.set(hx + 1, hy - 2, 'D'), gr.set(hx + (ears === 'up' ? 1 : 2), hy - (ears === 'up' ? 3 : 2), 'D');
  } else if (ears === 'up') gr.set(hx + 1, hy - 1, 'D'), gr.set(hx + 1, hy - 2, 'D');
  return { jaw: [hx + sw, hy + sh], tip, eye, top: hy - 3 };
}
