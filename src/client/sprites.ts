/**
 * Placeholder sprites drawn in code, in the approved style: flat colours, auto shading (lit from
 * the top left), a one-pixel dark outline. The Blender-rendered sprites replace these later.
 */
import { LOOK_DEFS, type Cls, type LookDef } from './herolooks';
import { HERO_W } from './heroscale';
import { PLAIN_BUTCHER, butcherParts, headlessParts } from './butcherparts';

export type Part = ['r', number, number, number, number, string] | ['e', number, number, number, number, string] | ['p', number, number, string] | ['t', number, number, number, number, string];

export interface Sprite {
  c: HTMLCanvasElement;
  /** A white silhouette, for hit flashes. */
  white: HTMLCanvasElement;
  w: number;
  h: number;
  /** Pixels that glow (eyes, embers): drawn unlit. */
  glow: [number, number, string][];
}

export const OUTLINE = '#0d0b10';
const GLOW = new Set(['#ff4a3a', '#7dff8a', '#ffd27a', '#c9a8ff', '#ffe9a8', '#bfe0ff', '#ff8a3a']);
const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

export function makeSprite(w: number, h: number, parts: Part[]): Sprite {
  const g: (string | null)[][] = Array.from({ length: h }, () => Array(w).fill(null));
  for (const p of parts) {
    const col = p[p.length - 1] as string;
    if (p[0] === 'r') {
      const [, a, b, c, d] = p;
      for (let y = b; y < b + d; y++) for (let x = a; x < a + c; x++) if (y >= 0 && y < h && x >= 0 && x < w) g[y][x] = col;
    } else if (p[0] === 'e') {
      const [, a, b, c, d] = p;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = (x + 0.5 - a) / c, dy = (y + 0.5 - b) / d;
        if (dx * dx + dy * dy <= 1) g[y][x] = col;
      }
    } else if (p[0] === 'p') {
      const [, a, b] = p;
      if (b >= 0 && b < h && a >= 0 && a < w) g[b][a] = col;
    } else {
      const [, a, b, c, d] = p;
      for (let y = 0; y < d; y++) {
        const hw = Math.round((y / Math.max(1, d - 1)) * (c / 2));
        for (let x = a - hw; x <= a + hw; x++) if (b + y < h && x >= 0 && x < w) g[b + y][x] = col;
      }
    }
  }
  const W = w + 2, H = h + 2;
  const c = document.createElement('canvas'), white = document.createElement('canvas');
  c.width = white.width = W;
  c.height = white.height = H;
  const cx = c.getContext('2d')!, wx = white.getContext('2d')!;
  const img = cx.createImageData(W, H), wimg = wx.createImageData(W, H);
  const glow: Sprite['glow'] = [];
  const set = (im: ImageData, x: number, y: number, r: number, gg: number, b: number) => {
    const i = (y * W + x) * 4;
    im.data[i] = r;
    im.data[i + 1] = gg;
    im.data[i + 2] = b;
    im.data[i + 3] = 255;
  };
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && g[y][x] !== null;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = g[y][x];
    if (!v) continue;
    let f = 1;
    if (!filled(x + 1, y) || !filled(x, y + 1)) f = 0.72;
    else if (!filled(x - 1, y) || !filled(x, y - 1)) f = 1.2;
    const [r, gg, b] = hex(v);
    set(img, x + 1, y + 1, Math.min(255, r * f), Math.min(255, gg * f), Math.min(255, b * f));
    set(wimg, x + 1, y + 1, 255, 255, 255);
    if (GLOW.has(v)) glow.push([x + 1, y + 1, v]);
  }
  const [or, og, ob] = hex(OUTLINE);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (filled(x - 1, y - 1)) continue;
    if (filled(x, y - 1) || filled(x - 2, y - 1) || filled(x - 1, y) || filled(x - 1, y - 2)) {
      set(img, x, y, or, og, ob);
      set(wimg, x, y, 255, 255, 255);
    }
  }
  cx.putImageData(img, 0, 0);
  wx.putImageData(wimg, 0, 0);
  return { c, white, w: W, h: H, glow };
}

/**
 * A sprite drawn again from its own shapes at a bigger size (the art pass, 1.5x): each rect's edges land
 * where the old ones fall on the new grid, ellipses and wedges are drawn whole at the new size, and a lone
 * pixel (a nail, an eye) stays one pixel at its new place. Nothing is stretched: every pixel is whole. `kx`
 * 1 keeps the width (a pillar or a brazier grows taller on the same footprint).
 */
export function grow(parts: Part[], kx = 1.5, ky = kx): Part[] {
  const X = (v: number) => Math.round(v * kx), Y = (v: number) => Math.round(v * ky);
  return parts.map((q): Part => {
    const col = q[q.length - 1] as string;
    if (q[0] === 'p') return ['p', Math.floor((q[1] + 0.5) * kx), Math.floor((q[2] + 0.5) * ky), col];
    const [k, a, b, c, d] = q as unknown as [string, number, number, number, number];
    if (k === 'r') return ['r', X(a), Y(b), Math.max(1, X(a + c) - X(a)), Math.max(1, Y(b + d) - Y(b)), col];
    return [k as 'e' | 't', a * kx, b * ky, c * kx, d * ky, col] as Part;
  });
}
/** `makeSprite` for a prop drawn again at 1.5x (or taller only: `kx` 1). */
const grown = (w: number, h: number, parts: Part[], kx = 1.5, ky = 1.5) => makeSprite(Math.round(w * kx), Math.round(h * ky), grow(parts, kx, ky));

/** The heroes: five classes, three looks each, drawn in herolooks.ts (the first look is the default). */
export const LOOKS = LOOK_DEFS;
export type HeroSprites = { down: Sprite; up: Sprite };
const LOOK_SPRITES = Object.fromEntries(Object.entries(LOOKS).map(([k, ls]) => [k, ls.map((l) => ({ down: makeSprite(HERO_W, l.h, l.down), up: makeSprite(HERO_W, l.h, l.up) }))])) as Record<Cls, HeroSprites[]>;
/** A class's look `i` (0 to 2; anything else is the first). */
export const heroLook = (cls: Cls, i = 0): HeroSprites => LOOK_SPRITES[cls][i] ?? LOOK_SPRITES[cls][0];
/** A look's definition (its height, where the eyes are, what moves). */
export const lookDef = (cls: Cls, i = 0): LookDef => LOOKS[cls][i] ?? LOOKS[cls][0];

const portraits = new Map<string, HTMLCanvasElement>();
/** The look standing on a 27 by 36 card, feet on the bottom (so every class shows at the same scale). */
export function heroPortrait(cls: Cls, i = 0): HTMLCanvasElement {
  const key = cls + i;
  let c = portraits.get(key);
  if (!c) {
    const s = heroLook(cls, i).down.c;
    c = document.createElement('canvas');
    (c.width = 27), (c.height = 36);
    c.getContext('2d')!.drawImage(s, Math.round((27 - s.width) / 2), 36 - s.height);
    portraits.set(key, c);
  }
  return c;
}

const dummyBase: Part[] = [
  ['r', 5, 9, 2, 8, '#6b4a2b'], ['r', 3, 16, 6, 1, '#4a3420'], ['e', 6, 7, 4, 4.5, '#b89a5a'], ['r', 2, 7, 8, 1, '#8a6a3a'],
  ['p', 4, 6, '#d8c08a'], ['p', 7, 9, '#d8c08a'], ['p', 5, 11, '#8a6a3a'], ['e', 6, 2.2, 2.4, 2.2, '#c8aa6a'], ['r', 0, 5, 12, 1, '#6b4a2b'],
];

/**
 * The small goblin at 1.5x (art pass, 2026-11-11): 17 by 20, redrawn. Bandy legs, a ragged jerkin and belt,
 * thin arms at its sides, a big head with long ears out to the sides, a brow over the glowing eyes and a
 * jagged grin. `GOB` is its colours (skin, its shade, legs, feet, jerkin, its patch, belt, mouth, teeth,
 * eyes); the pale blind hunters are the same body in bone and ash with empty sockets.
 */
type GobCols = { S: string; s: string; L: string; F: string; B: string; b: string; K: string; m: string; T: string; E: string };
const GOB: GobCols = { S: '#5b6b2a', s: '#4a5a22', L: '#3a4a1f', F: '#2a3418', B: '#4a3a2a', b: '#5a4836', K: '#2a2018', m: '#2a1a14', T: '#e8e0c8', E: '#ff4a3a' };
const PALE: GobCols = { S: '#c8c2b0', s: '#a8a290', L: '#8a8478', F: '#5a5650', B: '#4a4440', b: '#5a5450', K: '#2a2420', m: '#2a2420', T: '#e8e0c8', E: '#1a1614' };
const gobBody = (k: GobCols): Part[] => [
  ['r', 4, 14, 3, 5, k.L], ['r', 10, 14, 3, 5, k.L], ['r', 3, 19, 4, 1, k.F], ['r', 10, 19, 4, 1, k.F],
  ['r', 3, 9, 11, 5, k.B], ['p', 5, 10, k.b], ['p', 6, 11, k.b], ['p', 11, 10, k.b], ['p', 10, 12, k.b], ['r', 3, 14, 11, 1, k.K], ['p', 8, 14, '#6a5a3a'],
  ['r', 2, 10, 1, 4, k.S], ['r', 14, 10, 1, 4, k.S], ['p', 2, 13, k.s], ['p', 14, 13, k.s],
];
/** Its head; `pale` ears stand up instead of out. */
const gobHead = (k: GobCols, pale = false): Part[] => [
  ['e', 8.5, 5.5, 5.1, 4.4, k.S], ['r', 5, 9, 7, 1, k.s],
  ...(pale ? ([['p', 1, 2, k.S], ['p', 2, 3, k.S], ['r', 2, 4, 2, 2, k.S], ['p', 15, 2, k.S], ['p', 14, 3, k.S], ['r', 13, 4, 2, 2, k.S]] as Part[])
    : ([['p', 0, 4, k.S], ['r', 0, 5, 4, 1, k.S], ['r', 2, 6, 2, 1, k.s], ['p', 16, 4, k.S], ['r', 13, 5, 4, 1, k.S], ['r', 13, 6, 2, 1, k.s]] as Part[])),
];
const gobFace = (k: GobCols): Part[] => [
  ['r', 5, 4, 3, 1, k.s], ['r', 9, 4, 3, 1, k.s], ['p', 6, 5, k.E], ['p', 10, 5, k.E], ['p', 8, 6, k.s],
  ['r', 6, 7, 5, 1, k.T], ['p', 7, 7, k.m], ['p', 9, 7, k.m], ['r', 6, 8, 5, 1, k.m],
];
const gobBack = (k: GobCols): Part[] => [['r', 5, 7, 7, 1, k.s], ['r', 6, 3, 5, 1, k.s]];
const scrapperBody = gobBody(GOB);
const scrapperHead = [...gobHead(GOB), ...gobFace(GOB)];
/** Everything burned to the same black, a few embers left. */
const char = (parts: Part[]): Part[] => parts.map((p, i) => [...p.slice(0, -1), i % 5 ? '#1a1614' : '#2a2420'] as Part);

export const HEROES = Object.fromEntries(Object.keys(LOOKS).map((k) => [k, heroLook(k as Cls)])) as Record<Cls, HeroSprites>;

export const SPRITES = {
  // The plain butcher at 1.5x (butcherparts.ts; a named one's own look is made in foes.ts).
  butcherDown: makeSprite(27, 33, butcherParts(PLAIN_BUTCHER, false)),
  butcherUp: makeSprite(27, 33, butcherParts(PLAIN_BUTCHER, true)),
  scrapper: makeSprite(17, 20, [...scrapperBody, ...scrapperHead]),
  /** The blind hunters of the deep workings: bone-pale, long-eared, empty sockets where the eyes should glow. */
  pale: makeSprite(17, 20, [...gobBody(PALE), ...gobHead(PALE, true), ...gobFace(PALE)]),
  paleUp: makeSprite(17, 20, [...gobBody(PALE), ...gobHead(PALE, true), ...gobBack(PALE)]),
  scrapperUp: makeSprite(17, 20, [...scrapperBody, ...gobHead(GOB), ...gobBack(GOB)]),
  // Bodies left behind: without a head (a red stump), or burned black.
  scrapperHeadless: makeSprite(17, 20, [...scrapperBody, ['r', 6, 8, 5, 1, '#7a1d1d'], ['r', 7, 7, 3, 1, '#9a2a2a']]),
  butcherHeadless: makeSprite(27, 33, headlessParts()),
  scrapperBurnt: makeSprite(17, 20, char([...scrapperBody, ...gobHead(GOB)])),
  butcherBurnt: makeSprite(27, 33, char(butcherParts(PLAIN_BUTCHER, true))),
  barrel: grown(10, 12, [['r', 1, 1, 8, 11, '#7a5230'], ['r', 0, 3, 10, 6, '#7a5230'], ['r', 0, 3, 10, 1, '#4a4652'], ['r', 0, 8, 10, 1, '#4a4652'], ['r', 2, 0, 6, 2, '#9a7a4a'], ['r', 4, 2, 1, 9, '#5a3d22']]),
  // The Staithe's: a punt drawn up on the bank (pointed ends, a pole laid in it), a lamp on its post.
  punt: grown(22, 9, [['r', 2, 3, 18, 5, '#4a3420'], ['r', 0, 4, 22, 3, '#4a3420'], ['r', 3, 2, 16, 1, '#6a4a2c'], ['r', 3, 4, 16, 2, '#2a1e14'], ['r', 1, 7, 20, 1, '#2e2016'], ['r', 4, 3, 15, 1, '#8a7a5a'], ['p', 9, 5, '#3a2a1a'], ['p', 14, 5, '#3a2a1a']]),
  // The Haulier's working: an iron-bound ore cart, heaped with ore (wheels drawn by client/hauldraw.ts as it rolls).
  cart: makeSprite(20, 13, [['r', 1, 3, 18, 7, '#4a3a2c'], ['r', 1, 5, 18, 1, '#5c4634'], ['r', 1, 7, 18, 1, '#5c4634'], ['r', 0, 2, 20, 2, '#5a5664'], ['r', 0, 2, 20, 1, '#8a8696'], ['r', 0, 9, 20, 1, '#3a3640'], ['r', 3, 3, 1, 7, '#3a3640'], ['r', 9, 3, 2, 7, '#3a3640'], ['r', 16, 3, 1, 7, '#3a3640'], ['e', 10, 2, 8, 2.6, '#5c5866'], ['p', 6, 0, '#7a7484'], ['p', 12, 0, '#8a8494'], ['p', 9, 1, '#c8a84a'], ['p', 14, 1, '#c8a84a'], ['p', 5, 1, '#5aa078'], ['p', 4, 4, '#b8b4ac'], ['p', 15, 4, '#b8b4ac'], ['p', 4, 8, '#b8b4ac'], ['p', 15, 8, '#b8b4ac'], ['r', 6, 6, 3, 2, '#6a4632'], ['r', 12, 4, 2, 3, '#6a4632'], ['r', 2, 10, 16, 1, '#2a2630']]),
  lamp: grown(6, 16, [['r', 2, 5, 2, 11, '#3a2a1a'], ['r', 1, 1, 4, 4, '#2a2228'], ['r', 2, 2, 2, 2, '#ffd27a'], ['r', 1, 0, 4, 1, '#5a5060'], ['r', 0, 15, 6, 1, '#2a1e14']], 1, 1.5),
  oil: grown(10, 12, [['r', 1, 1, 8, 11, '#3a2a20'], ['r', 0, 3, 10, 6, '#3a2a20'], ['r', 0, 5, 10, 2, '#8a2a1a'], ['r', 2, 0, 6, 2, '#4a3a2a'], ['p', 5, 1, '#ffd27a'], ['p', 3, 9, '#1a1410']]),
  // The crate at 1.5x, drawn again: a two-pixel frame, a seam, and the cross brace as two clean diagonals.
  crate: makeSprite(18, 16, [['r', 0, 0, 18, 16, '#8a6a3a'], ['r', 2, 8, 14, 1, '#7a5a32'], ...Array.from({ length: 12 }, (_, i): Part[] => [['p', 3 + i, 2 + Math.round((i * 11) / 11), '#5a3d22'], ['p', 14 - i, 2 + Math.round((i * 11) / 11), '#5a3d22']]).flat(), ['r', 0, 0, 18, 2, '#5a3d22'], ['r', 0, 14, 18, 2, '#5a3d22'], ['r', 0, 0, 2, 16, '#5a3d22'], ['r', 16, 0, 2, 16, '#5a3d22']]),
  table: grown(20, 10, [['r', 0, 0, 20, 4, '#8b6a3a'], ['r', 0, 1, 20, 1, '#6b4a2b'], ['r', 7, 0, 1, 4, '#6b4a2b'], ['r', 13, 0, 1, 4, '#6b4a2b'], ['r', 1, 4, 2, 6, '#5a3d22'], ['r', 17, 4, 2, 6, '#5a3d22'], ['r', 2, 4, 16, 1, '#4a3420']]),
  plank: grown(9, 2, [['r', 0, 0, 9, 2, '#8b6a3a'], ['p', 8, 0, '#5a3d22']]),
  stave: grown(3, 8, [['r', 0, 0, 3, 8, '#7a5230'], ['r', 0, 2, 3, 1, '#4a4652']]),
  cage: grown(14, 18, [['r', 0, 17, 14, 1, '#3a3640'], ['r', 0, 0, 14, 1, '#57525e'], ['r', 0, 0, 1, 18, '#6a6470'], ['r', 13, 0, 1, 18, '#6a6470'], ['r', 4, 0, 1, 18, '#6a6470'], ['r', 9, 0, 1, 18, '#6a6470'], ['r', 5, 8, 3, 9, '#7a6a58'], ['e', 6.5, 6.5, 2.2, 2.2, '#c79c78'], ['p', 6, 6, '#141218'], ['p', 7, 6, '#141218']]),
  larder: grown(12, 16, [['r', 1, 0, 1, 16, '#4a3420'], ['r', 10, 0, 1, 16, '#4a3420'], ['r', 0, 1, 12, 1, '#5a3d22'], ['r', 3, 2, 2, 6, '#7a1d1d'], ['r', 7, 2, 2, 5, '#9a2a2a'], ['r', 0, 9, 12, 1, '#5a3d22'], ['r', 2, 10, 3, 4, '#8a6a3a'], ['r', 6, 10, 4, 5, '#5a1414'], ['p', 4, 7, '#e8e0c8']]),
  tree: grown(20, 26, [['r', 9, 16, 3, 10, '#4a3420'], ['e', 10, 9, 9, 8, '#2f4a28'], ['e', 8, 7, 5, 4, '#3a5a30'], ['p', 13, 10, '#24391f'], ['p', 6, 11, '#24391f']]),
  pine: grown(16, 28, [['r', 7, 22, 2, 6, '#4a3420'], ['t', 8, 0, 8, 10, '#1f3a26'], ['t', 8, 6, 12, 10, '#24412a'], ['t', 8, 12, 15, 11, '#1c3522']]),
  rock: grown(14, 9, [['e', 7, 5, 6.5, 4, '#4a4652'], ['e', 5, 4, 3, 2, '#5a5664'], ['p', 9, 6, '#34313a']]),
  hay: grown(16, 11, [['e', 8, 6.5, 7.5, 5, '#a08c44'], ['e', 7, 5, 4, 3, '#b8a050'], ['r', 2, 7, 12, 1, '#8a7a3a']]),
  well: grown(16, 18, [['r', 1, 10, 14, 7, '#5a5664'], ['r', 1, 10, 14, 1, '#6a6470'], ['r', 3, 11, 10, 2, '#14121a'], ['r', 2, 0, 1, 11, '#4a3420'], ['r', 13, 0, 1, 11, '#4a3420'], ['r', 1, 0, 14, 2, '#6a2a1a'], ['r', 7, 2, 1, 5, '#8a8494']]),
  lantern: grown(8, 36, [['r', 3, 8, 2, 28, '#3a3036'], ['r', 1, 34, 6, 2, '#2a2630'], ['r', 1, 2, 6, 7, '#5a4a2a'], ['r', 2, 3, 4, 5, '#2a2018'], ['r', 0, 1, 8, 1, '#7a6a3a']], 1, 1.5),
  support: grown(8, 26, [['r', 2, 0, 4, 26, '#5a3d22'], ['r', 0, 0, 8, 3, '#4a3420'], ['p', 3, 10, '#3a2a1a']], 1, 1.5),
  stump: grown(9, 6, [['r', 1, 1, 7, 5, '#4a3420'], ['r', 1, 0, 7, 2, '#8a6a3a'], ['p', 4, 1, '#6b4a2b']]),
  dummy: grown(12, 17, dummyBase),
  swingDummy: grown(12, 17, [...dummyBase, ['r', 2, 9, 8, 1, '#a33a2a'], ['p', 5, 2, '#141218'], ['p', 7, 2, '#141218']]),
  // The Warrior's shield, at the hero's 1.5x: planks, an iron rim top and bottom, a boss.
  shield: makeSprite(8, 10, [['r', 0, 0, 8, 10, '#7a5230'], ['r', 2, 1, 1, 8, '#66442a'], ['r', 5, 1, 1, 8, '#66442a'], ['r', 0, 0, 8, 1, '#9aa3ad'], ['r', 0, 9, 8, 1, '#9aa3ad'], ['r', 3, 4, 2, 2, '#cfd6dc'], ['p', 3, 4, '#eef2f5']]),
  pillar: grown(14, 36, [['r', 2, 4, 10, 28, '#4f4a5c'], ['r', 2, 12, 10, 1, '#3b3746'], ['r', 2, 21, 10, 1, '#3b3746'], ['r', 6, 4, 1, 8, '#3b3746'], ['r', 4, 13, 1, 8, '#3b3746'], ['r', 8, 22, 1, 10, '#3b3746'], ['r', 0, 0, 14, 4, '#5d576b'], ['r', 0, 32, 14, 4, '#3b3746']], 1, 1.5),
  brazier: grown(10, 9, [['r', 4, 4, 2, 5, '#2a2630'], ['r', 1, 8, 8, 1, '#2a2630'], ['r', 0, 1, 10, 4, '#3a3640'], ['r', 1, 0, 8, 1, '#57525e'], ['r', 2, 1, 6, 1, '#7a2a10']], 1, 1.5),
  target: grown(12, 16, [['r', 5, 9, 2, 7, '#4a3420'], ['e', 6, 5.5, 5.5, 5.5, '#d8c48a'], ['e', 6, 5.5, 3.8, 3.8, '#a33a2a'], ['e', 6, 5.5, 2, 2, '#d8c48a'], ['p', 6, 5, '#7a1d1d']]),
  stone: grown(8, 10, [['r', 1, 3, 6, 7, '#5a5664'], ['e', 4, 3, 3, 2.5, '#5a5664'], ['r', 3, 4, 2, 1, '#45414c'], ['r', 2, 9, 4, 1, '#34313a']]),
  post: grown(6, 28, [['r', 2, 6, 2, 22, '#2a2630'], ['r', 1, 26, 4, 2, '#2a2630'], ['r', 0, 1, 6, 6, '#3a3640'], ['r', 1, 2, 4, 4, '#5a4a2a'], ['r', 1, 0, 4, 1, '#2a2630']], 1, 1.5),
  grate: makeSprite(16, 8, [['r', 0, 0, 16, 8, '#1a181e'], ['r', 1, 1, 14, 6, '#0d0b10'], ['r', 3, 0, 1, 8, '#4a4652'], ['r', 7, 0, 1, 8, '#4a4652'], ['r', 11, 0, 1, 8, '#4a4652'], ['r', 0, 3, 16, 1, '#4a4652']]),
  statue: grown(14, 30, [['r', 2, 24, 10, 6, '#5a5664'], ['r', 3, 23, 8, 1, '#6a6470'], ['r', 4, 10, 6, 13, '#6a6470'], ['e', 7, 7, 2.6, 2.6, '#6a6470'], ['r', 10, 6, 1, 12, '#57525e'], ['r', 9, 5, 3, 1, '#57525e'], ['r', 5, 12, 1, 8, '#57525e']], 1, 1.5),
  // Reeds at a bank or in a bog: thin stalks, brown heads.
  reed: grown(11, 15, [['r', 1, 5, 1, 10, '#4a5a2a'], ['r', 3, 2, 1, 13, '#56682e'], ['r', 5, 4, 1, 11, '#4a5a2a'], ['r', 7, 1, 1, 14, '#5e7034'], ['r', 9, 5, 1, 10, '#4a5a2a'], ['r', 3, 1, 1, 3, '#6b4a2b'], ['r', 7, 0, 1, 3, '#6b4a2b'], ['r', 9, 4, 1, 2, '#6b4a2b']]),
  // A drowned tree in the marsh: grey, bare, a broken limb.
  deadtree: grown(19, 27, [['r', 8, 9, 3, 18, '#4a4650'], ['r', 9, 9, 1, 18, '#5a5660'], ['r', 4, 6, 1, 5, '#4a4650'], ['r', 4, 10, 5, 1, '#4a4650'], ['r', 13, 3, 1, 7, '#4a4650'], ['r', 10, 12, 4, 1, '#4a4650'], ['r', 7, 2, 1, 8, '#4a4650'], ['r', 15, 2, 1, 3, '#3e3a44'], ['r', 2, 4, 3, 1, '#3e3a44'], ['r', 7, 25, 6, 2, '#2e2c34']]),
  bush: grown(14, 10, [['e', 7, 6, 6.5, 4, '#26361f'], ['e', 5, 4.5, 3.5, 2.5, '#2f4a28'], ['e', 9.5, 5, 3, 2.5, '#2a4024'], ['p', 4, 7, '#7a2a3a'], ['p', 10, 6, '#7a2a3a']]),
  survivor: grown(7, 10, [['r', 1, 4, 5, 6, '#7a6a58'], ['e', 3.5, 2.5, 2.2, 2.2, '#c79c78'], ['p', 2, 2, '#141218'], ['p', 4, 2, '#141218']]),
};
