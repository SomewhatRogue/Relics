/**
 * A bundled pixel font made into the canvas's own face (fontchoice.ts picks it): each letter drawn once
 * at the font's native size, read back pixel by pixel, and kept as a bitmap, so the words over heads,
 * the damage numbers and the boards stay crisp at the scene's whole-number zoom, as the 3x5 face does.
 * A word in a colour is painted once (outline and all) and reused. Drawing only.
 */
export interface PixFace {
  /** Pixels from the top of a capital to the baseline. */
  capH: number;
  /** Each letter: how far the next one starts, and its lit pixels from the cap top. */
  glyphs: Map<string, { adv: number; px: [number, number][] }>;
  /** Letters an average capital is across (with its gap), for breaking long lines. */
  avg: number;
  /** Down to the lowest pixel any letter reaches, from the cap top. */
  depth: number;
}

let face: PixFace | null = null;
const cache = new Map<string, HTMLCanvasElement>();

export const pixFace = (): PixFace | null => face;
/** Wear `f` on the canvas from now on. */
export function useFace(f: PixFace): void {
  face = f;
  cache.clear();
}

const CHARS = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
/** The heart (not in the fonts): the 3x5 face's own, set on the baseline. */
const HEART = '101111111010000';

/** Read `family` at `size` pixels into a face and wear it. Resolves false if the font never loads. */
export async function loadPixFace(family: string, size: number): Promise<boolean> {
  const font = `${size}px "${family}"`;
  try { await document.fonts.load(font, CHARS); } catch { return false; }
  if (!document.fonts.check(font, 'A')) return false;
  const pad = size, W = size * 3, H = size * 3, base = size * 2;
  const c = document.createElement('canvas');
  c.width = W, c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.font = font;
  g.textBaseline = 'alphabetic';
  const ink = (ch: string): [number, number][] => {
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#fff';
    g.fillText(ch, pad, base);
    const d = g.getImageData(0, 0, W, H).data, out: [number, number][] = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] >= 128) out.push([x - pad, y]);
    return out;
  };
  const capTop = Math.min(...ink('H').map((p) => p[1]));
  const glyphs = new Map<string, { adv: number; px: [number, number][] }>();
  let depth = 0;
  for (const ch of CHARS) {
    const px = ink(ch).map(([x, y]) => [x, y - capTop] as [number, number]);
    for (const p of px) depth = Math.max(depth, p[1]);
    glyphs.set(ch, { adv: Math.round(g.measureText(ch).width), px });
  }
  const capH = base - capTop;
  const heart: [number, number][] = [];
  for (let k = 0; k < 15; k++) if (HEART[k] === '1') heart.push([k % 3, capH - 5 + Math.floor(k / 3)]);
  glyphs.set('♥', { adv: 4, px: heart });
  let sum = 0;
  for (let i = 65; i <= 90; i++) sum += glyphs.get(String.fromCharCode(i))!.adv;
  useFace({ capH, glyphs, avg: Math.ceil(sum / 26), depth });
  return true;
}

const glyphOf = (f: PixFace, ch: string) => f.glyphs.get(ch) ?? f.glyphs.get(ch.toUpperCase()) ?? f.glyphs.get(' ')!;

/** How many pixels across `s` is in the face (without the last letter's gap). */
export function faceWidth(f: PixFace, s: string): number {
  let w = 0;
  for (const ch of s) w += glyphOf(f, ch).adv;
  return Math.max(0, w - 1);
}

/** `s` in `col` with a one-pixel dark outline, painted once and kept. Its top-left is one pixel up and left of the cap top. */
export function faceSprite(f: PixFace, s: string, col: string): HTMLCanvasElement {
  const key = col + '|' + s;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = Math.max(1, faceWidth(f, s) + 4);
  c.height = f.depth + 3;
  const g = c.getContext('2d')!;
  const paint = (ox: number, oy: number, fill: string) => {
    g.fillStyle = fill;
    let x = 1;
    for (const ch of s) {
      const gl = glyphOf(f, ch);
      for (const [px, py] of gl.px) g.fillRect(x + px + ox, 1 + py + oy, 1, 1);
      x += gl.adv;
    }
  };
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) paint(dx, dy, '#0d0b10');
  paint(0, 0, col);
  cache.set(key, c);
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return c;
}
