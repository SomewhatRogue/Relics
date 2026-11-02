/**
 * Bodies at twice the detail, drawn from character grids and split into parts that can be posed.
 *
 * A body is a grid of characters, one per pixel at 2x, and a palette. Rows of half the width are
 * mirrored (most bodies are symmetric); `over` rows lay asymmetric details on top ('.' keeps what's
 * there). The back view is the front with characters swapped (`remap`) and rows laid over it.
 * Shading and the outline are worked out on the whole body, the way `makeSprite` does, then every
 * pixel goes to a part (by character first, then by region), so a body at rest is exactly its whole
 * sprite and its parts can move apart a pixel or two without seams.
 */
import type { Sprite } from '../sprites';

export type PartKind = 'cape' | 'back' | 'legL' | 'legR' | 'torso' | 'head' | 'arm' | 'gear';
/** Pixels of a part (canvas pixels): its bounding box, its own sprite (canvas the size of the whole). */
export interface BodyPart { kind: PartKind; s: Sprite; x0: number; y0: number; x1: number; y1: number }
export interface Figure {
  whole: Sprite;
  parts: BodyPart[];
  /** The weapon hand (canvas pixels, unflipped), and where the eyes are. */
  hand: [number, number];
  eyes: [number, number][];
  /** The row where the legs start (canvas pixels). */
  hip: number;
}

export type Pal = Record<string, string>;
export interface Grid {
  rows: string[];
  /** Full-width rows laid over the mirrored ones ('.' keeps what's under). */
  over?: Record<number, string>;
}
/** Regions (grid pixels, half-open): the weapon arm, the off arm, the head; legs are split at the middle. */
export interface Regions { arm: [number, number, number, number]; back: [number, number, number, number]; headTo: number; hip: number; byChar?: Record<string, PartKind> }

export const K = 2;
/** Characters that glow in the dark wherever they are; a palette can add its own. */
const GLOWS = new Set(['e']);

/** The grid as full-width rows: half rows mirrored, overlays laid on. */
export function expand(g: Grid, width: number): string[] {
  const rows = g.rows.map((r) => (r.length * 2 === width ? r + [...r].reverse().join('') : r.padEnd(width, '.')));
  for (const [i, o] of Object.entries(g.over ?? {})) {
    const at = Number(i), r = [...(rows[at] ?? '.'.repeat(width))];
    [...o].forEach((ch, x) => ch !== '.' && ch !== ' ' && (r[x] = ch === '_' ? '.' : ch));
    rows[at] = r.join('');
  }
  return rows;
}

/** Characters swapped (a back view from a front one, a burned body from a whole one). */
export const remap = (rows: string[], m: Record<string, string>) => rows.map((r) => [...r].map((ch) => m[ch] ?? ch).join(''));

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  (c.width = w), (c.height = h);
  return [c, c.getContext('2d')!];
}

/** One part's pixels (RGBA, the size of the whole), its silhouette and box, and its glowing pixels. */
export interface PartPixels { kind: PartKind; rgba: Uint8ClampedArray; white: Uint8ClampedArray; box: number[]; glow: Sprite['glow'] }
export interface BodyPixels { W: number; H: number; whole: PartPixels; parts: PartPixels[]; eyes: [number, number][]; hip: number }

const ORDER: PartKind[] = ['cape', 'back', 'legL', 'legR', 'torso', 'head', 'arm', 'gear'];

/** The body's pixels, shaded and outlined as a whole, split into parts. Pure (no canvas), so tests and tools can run it. */
export function pixels(rows: string[], pal: Pal, reg: Regions, glow = ''): BodyPixels {
  const h = rows.length, w = Math.max(...rows.map((r) => r.length)), W = w + 2, H = h + 2;
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && y < h && x < w && pal[rows[y][x]] ? rows[y][x] : '');
  const owner = (x: number, y: number): PartKind => {
    const by = reg.byChar?.[at(x, y)];
    if (by) return by;
    const inR = (r: number[]) => x >= r[0] && y >= r[1] && x < r[2] && y < r[3];
    if (inR(reg.arm)) return 'arm';
    if (inR(reg.back)) return 'back';
    if (y < reg.headTo) return 'head';
    if (y >= reg.hip) return x < w / 2 ? 'legL' : 'legR';
    return 'torso';
  };
  const blank = (kind: PartKind): PartPixels => ({ kind, rgba: new Uint8ClampedArray(W * H * 4), white: new Uint8ClampedArray(W * H * 4), box: [W, H, 0, 0], glow: [] });
  const whole = blank('torso'), parts = new Map<PartKind, PartPixels>(), eyes: [number, number][] = [];
  const put = (im: Uint8ClampedArray, x: number, y: number, rgb: number[]) => {
    const i = (y * W + x) * 4;
    (im[i] = rgb[0]), (im[i + 1] = rgb[1]), (im[i + 2] = rgb[2]), (im[i + 3] = 255);
  };
  const part = (k: PartKind) => {
    let p = parts.get(k);
    if (!p) parts.set(k, (p = blank(k)));
    return p;
  };
  const paint = (k: PartKind, x: number, y: number, rgb: number[]) => {
    const p = part(k);
    for (const q of [p, whole]) put(q.rgba, x, y, rgb), put(q.white, x, y, [255, 255, 255]);
    (p.box[0] = Math.min(p.box[0], x)), (p.box[1] = Math.min(p.box[1], y)), (p.box[2] = Math.max(p.box[2], x + 1)), (p.box[3] = Math.max(p.box[3], y + 1));
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = at(x, y);
    if (!ch) continue;
    // Lit from the top left: darker on the lower right edges, brighter on the upper left.
    let f = 1;
    if (!at(x + 1, y) || !at(x, y + 1)) f = 0.72;
    else if (!at(x - 1, y) || !at(x, y - 1)) f = 1.2;
    const col = pal[ch], k = owner(x, y);
    paint(k, x + 1, y + 1, hex(col).map((v) => Math.min(255, v * f)));
    if (GLOWS.has(ch) || glow.includes(ch)) {
      part(k).glow.push([x + 1, y + 1, col]), whole.glow.push([x + 1, y + 1, col]);
      if (ch === 'e') eyes.push([x + 1, y + 1]);
    }
  }
  // The outline: every empty pixel touching the body, given to the part it touches.
  const ol = hex('#0d0b10');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (at(x - 1, y - 1)) continue;
    const n = [[x, y - 1], [x - 2, y - 1], [x - 1, y], [x - 1, y - 2]].find(([a, b]) => at(a, b));
    if (n) paint(owner(n[0] + 0, n[1] + 0), x, y, ol);
  }
  return { W, H, whole, parts: ORDER.filter((k) => parts.has(k)).map((k) => parts.get(k)!), eyes, hip: reg.hip + 1 };
}

/** Build a body's sprites from its pixels: the whole, and one per part (posable). */
export function figure(rows: string[], pal: Pal, reg: Regions, glow = ''): Figure {
  const px = pixels(rows, pal, reg, glow), { W, H } = px;
  const sprite = (p: PartPixels): Sprite => {
    const [c, cg] = canvas(W, H), [white, wg] = canvas(W, H);
    cg.putImageData(new ImageData(p.rgba as Uint8ClampedArray<ArrayBuffer>, W, H), 0, 0);
    wg.putImageData(new ImageData(p.white as Uint8ClampedArray<ArrayBuffer>, W, H), 0, 0);
    return { c, white, w: W, h: H, glow: p.glow, k: K };
  };
  const parts = px.parts.map((p) => ({ kind: p.kind, s: sprite(p), x0: p.box[0], y0: p.box[1], x1: p.box[2], y1: p.box[3] }));
  const arm = parts.find((p) => p.kind === 'arm');
  const hand: [number, number] = arm ? [Math.round((arm.x0 + arm.x1) / 2), arm.y1 - 2] : [W - 4, Math.round(H * 0.55)];
  return { whole: sprite(px.whole), parts, hand, eyes: px.eyes, hip: px.hip };
}
