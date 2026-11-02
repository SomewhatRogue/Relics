/**
 * Pixel art for knucklebones at the Drowned Rat: a bone die (a top face and its front edge, so it
 * sits in the three-quarter view), Moll's yellowed set, a leather cup, and the tavern table lit by
 * one candle in stepped bands with a little ordered dither. All made once, in code, and cached.
 */
export const DIE_W = 12, DIE_H = 15;

type Who = 'you' | 'moll';
interface Bone { body: string; lit: string; side: string; edge: string; pip: string }
const BONES: Record<Who, Bone> = {
  you: { body: '#e6dac0', lit: '#fff6e0', side: '#b3a07a', edge: '#4a3c2a', pip: '#2a1610' },
  // Moll's are older, yellower, and inked in red. Nobody has ever got close enough to weigh them.
  moll: { body: '#d6bf84', lit: '#efdca6', side: '#a08650', edge: '#3e2e18', pip: '#6a1410' },
};
const PIPS: number[][][] = [[], [[5, 5]], [[2, 2], [8, 8]], [[2, 2], [5, 5], [8, 8]], [[2, 2], [8, 2], [2, 8], [8, 8]],
  [[2, 2], [8, 2], [5, 5], [2, 8], [8, 8]], [[2, 2], [2, 5], [2, 8], [8, 2], [8, 5], [8, 8]]];

const cache = new Map<string, HTMLCanvasElement>();
function make(key: string, w: number, h: number, paint: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  let c = cache.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(c.getContext('2d')!);
  cache.set(key, c);
  return c;
}

/** One die showing `face` (1 to 6) on top. */
export const die = (face: number, who: Who) => make(`${who}${face}`, DIE_W, DIE_H, (g) => {
  const b = BONES[who], r = (x: number, y: number, w: number, h: number, c: string) => ((g.fillStyle = c), g.fillRect(x, y, w, h));
  r(0, 0, 12, 15, b.edge);
  r(1, 1, 10, 10, b.body);
  r(1, 1, 10, 1, b.lit);
  r(1, 1, 1, 10, b.lit);
  r(1, 12, 10, 2, b.side);
  for (const [x, y] of [[0, 0], [11, 0], [0, 14], [11, 14]]) g.clearRect(x, y, 1, 1);
  for (const [x, y] of PIPS[face]) r(x, y, 2, 2, b.pip);
});

/** The dicing cup: stitched leather, wider at the mouth. Its base sits at (6, 14). */
export const cup = () => make('cup', 12, 14, (g) => {
  const r = (x: number, y: number, w: number, h: number, c: string) => ((g.fillStyle = c), g.fillRect(x, y, w, h));
  for (let y = 0; y < 14; y++) {
    const half = Math.round(6 - (y / 13) * 1.5), x0 = 6 - half, w = half * 2;
    r(x0, y, w, 1, '#1a0f08');
    r(x0 + 1, y, w - 2, 1, '#6a3e1e');
    r(x0 + 1, y, 2, 1, '#8a5a2e');
    r(x0 + w - 3, y, 2, 1, '#4a2a14');
  }
  r(1, 0, 10, 1, '#a8743e');
  r(2, 1, 8, 1, '#120a06');
  r(1, 5, 10, 2, '#3a2210');
  for (let x = 2; x < 10; x += 2) r(x, 5, 1, 1, '#c8a060');
  r(2, 13, 8, 1, '#120a06');
});

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const PLANKS = [[96, 60, 36], [86, 54, 32], [100, 64, 38], [82, 50, 30], [94, 58, 34], [88, 56, 34], [98, 62, 36]];

/** The table top, planks running across, one candle's light pooled in the middle. */
export const table = (w: number, h: number) => make(`table${w}x${h}`, w, h, (g) => {
  const img = g.createImageData(w, h), d = img.data, cx = w / 2, cy = h / 2 - 6;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const pi = Math.floor(y / 10), base = PLANKS[pi % PLANKS.length];
    let k = 1;
    if (y % 10 === 9) k = 0.45;
    else if ((x + pi * 41) % 67 === 0) k = 0.55;
    else if (Math.sin(x * 0.21 + pi * 2.7 + Math.sin(x * 0.045 + pi) * 3 + (y % 10) * 0.9) > 0.86) k = 0.8;
    const dist = Math.hypot((x - cx) / 1.25, y - cy), light = Math.max(0, 1 - dist / 62);
    const band = Math.floor(light * 5 + (BAYER[(y % 4) * 4 + (x % 4)] / 16 - 0.5) * 0.7);
    const l = 0.28 + Math.max(0, Math.min(5, band)) * 0.16, o = (y * w + x) * 4;
    d[o] = base[0] * k * l * 1.1;
    d[o + 1] = base[1] * k * l;
    d[o + 2] = base[2] * k * l * 0.8;
    d[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
});
