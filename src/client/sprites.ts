/**
 * Placeholder sprites drawn in code, in the approved style: flat colours, auto shading (lit from
 * the top left), a one-pixel dark outline. The Blender-rendered sprites replace these later.
 */
type Part = ['r', number, number, number, number, string] | ['e', number, number, number, number, string] | ['p', number, number, string] | ['t', number, number, number, number, string];

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
const GLOW = new Set(['#ff4a3a', '#7dff8a', '#ffd27a', '#c9a8ff']);
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

const warriorBase: Part[] = [
  ['r', 3, 11, 2, 5, '#3a3f4a'], ['r', 7, 11, 2, 5, '#3a3f4a'], ['r', 3, 15, 2, 1, '#2a2420'], ['r', 7, 15, 2, 1, '#2a2420'],
  ['r', 2, 6, 8, 6, '#2f5d9b'], ['r', 5, 6, 2, 6, '#d4a537'], ['r', 2, 10, 8, 1, '#5a3d22'],
  ['r', 1, 6, 2, 3, '#9aa3ad'], ['r', 9, 6, 2, 3, '#9aa3ad'],
];
/** One hero sprite per class: the same body, its own colours, hood and crest. */
interface Look { body: string; trim: string; arms: string; head: string; face: Part[]; top: Part[]; cape: string }
const LOOKS: Record<'WARRIOR' | 'RANGER' | 'ROGUE' | 'MAGE' | 'HEALER', Look> = {
  WARRIOR: { body: '#2f5d9b', trim: '#d4a537', arms: '#9aa3ad', head: '#9aa3ad', face: [['r', 4, 3, 5, 1, '#141218']], top: [['r', 5, 0, 2, 1, '#c0392b']], cape: '#7a1d1d' },
  RANGER: { body: '#3f6b3a', trim: '#8b6a3a', arms: '#5a4a32', head: '#3f5a32', face: [['r', 5, 3, 3, 2, '#c79c78']], top: [['p', 7, 0, '#9ab85a']], cape: '#2f4a28' },
  ROGUE: { body: '#3a3346', trim: '#5a3d22', arms: '#2a2630', head: '#2a2630', face: [['r', 4, 3, 5, 2, '#141218'], ['p', 5, 3, '#c9a8ff'], ['p', 7, 3, '#c9a8ff']], top: [], cape: '#24202c' },
  MAGE: { body: '#4a2f6e', trim: '#8a6ac8', arms: '#4a2f6e', head: '#4a2f6e', face: [['r', 4, 3, 5, 2, '#141218'], ['p', 5, 4, '#c9a8ff'], ['p', 7, 4, '#c9a8ff']], top: [['r', 6, 0, 1, 1, '#4a2f6e'], ['p', 7, 0, '#4a2f6e']], cape: '#3a2458' },
  HEALER: { body: '#d8d0bc', trim: '#d4a537', arms: '#b8ae98', head: '#d8d0bc', face: [['r', 5, 3, 3, 2, '#c79c78']], top: [['r', 5, 0, 2, 1, '#d4a537']], cape: '#b8ae98' },
};

function heroPair(l: Look): { down: Sprite; up: Sprite } {
  const base: Part[] = [
    ['r', 3, 11, 2, 5, '#3a3f4a'], ['r', 7, 11, 2, 5, '#3a3f4a'], ['r', 3, 15, 2, 1, '#2a2420'], ['r', 7, 15, 2, 1, '#2a2420'],
    ['r', 2, 6, 8, 6, l.body], ['r', 5, 6, 2, 6, l.trim], ['r', 2, 10, 8, 1, '#5a3d22'], ['r', 1, 6, 2, 3, l.arms], ['r', 9, 6, 2, 3, l.arms],
  ];
  return {
    down: makeSprite(12, 16, [...base, ['e', 6, 3.5, 3.6, 3.6, l.head], ...l.face, ...l.top]),
    up: makeSprite(12, 16, [...base, ['r', 3, 6, 6, 7, l.cape], ['e', 6, 3.5, 3.6, 3.6, l.head], ...l.top]),
  };
}

const butcherBase: Part[] = [
  ['r', 5, 17, 3, 5, '#3a4a1f'], ['r', 10, 17, 3, 5, '#3a4a1f'], ['e', 9, 13, 7.5, 6.5, '#5b6b2a'],
  ['r', 5, 10, 8, 9, '#8a7a66'], ['p', 7, 13, '#6b1a1a'], ['p', 8, 14, '#6b1a1a'], ['p', 10, 12, '#6b1a1a'], ['p', 9, 16, '#7a1d1d'], ['p', 6, 17, '#6b1a1a'],
  ['e', 9, 5, 4, 4, '#5b6b2a'], ['p', 4, 3, '#5b6b2a'], ['p', 14, 3, '#5b6b2a'],
];
const dummyBase: Part[] = [
  ['r', 5, 9, 2, 8, '#6b4a2b'], ['r', 3, 16, 6, 1, '#4a3420'], ['e', 6, 7, 4, 4.5, '#b89a5a'], ['r', 2, 7, 8, 1, '#8a6a3a'],
  ['p', 4, 6, '#d8c08a'], ['p', 7, 9, '#d8c08a'], ['p', 5, 11, '#8a6a3a'], ['e', 6, 2.2, 2.4, 2.2, '#c8aa6a'], ['r', 0, 5, 12, 1, '#6b4a2b'],
];

const scrapperBody: Part[] = [['r', 3, 9, 2, 4, '#3a4a1f'], ['r', 6, 9, 2, 4, '#3a4a1f'], ['r', 2, 6, 7, 4, '#4a3a2a'], ['r', 2, 9, 7, 1, '#2a2018']];
const scrapperHead: Part[] = [['e', 5.5, 4, 3.4, 3, '#5b6b2a'], ['p', 0, 3, '#5b6b2a'], ['p', 1, 3, '#5b6b2a'], ['p', 10, 3, '#5b6b2a'], ['p', 9, 3, '#5b6b2a'], ['p', 4, 4, '#ff4a3a'], ['p', 6, 4, '#ff4a3a'], ['r', 4, 6, 3, 1, '#e8e0c8']];
/** Everything burned to the same black, a few embers left. */
const char = (parts: Part[]): Part[] => parts.map((p, i) => [...p.slice(0, -1), i % 5 ? '#1a1614' : '#2a2420'] as Part);

export const HEROES = Object.fromEntries(Object.entries(LOOKS).map(([k, l]) => [k, heroPair(l)])) as Record<keyof typeof LOOKS, { down: Sprite; up: Sprite }>;

export const SPRITES = {
  warriorDown: makeSprite(12, 16, [...warriorBase, ['e', 6, 3.5, 3.6, 3.6, '#9aa3ad'], ['r', 4, 3, 5, 1, '#141218'], ['r', 5, 0, 2, 1, '#c0392b']]),
  warriorUp: makeSprite(12, 16, [...warriorBase, ['r', 3, 6, 6, 7, '#7a1d1d'], ['e', 6, 3.5, 3.6, 3.6, '#9aa3ad'], ['r', 5, 0, 2, 2, '#c0392b']]),
  butcherDown: makeSprite(18, 22, [...butcherBase, ['p', 7, 5, '#ff4a3a'], ['p', 11, 5, '#ff4a3a'], ['p', 7, 8, '#e8e0c8'], ['p', 11, 8, '#e8e0c8'], ['r', 8, 7, 3, 1, '#2a1a14']]),
  butcherUp: makeSprite(18, 22, [...butcherBase, ['r', 6, 8, 6, 2, '#4a5a22']]),
  scrapper: makeSprite(11, 13, [['r', 3, 9, 2, 4, '#3a4a1f'], ['r', 6, 9, 2, 4, '#3a4a1f'], ['r', 2, 6, 7, 4, '#4a3a2a'], ['r', 2, 9, 7, 1, '#2a2018'], ['e', 5.5, 4, 3.4, 3, '#5b6b2a'], ['p', 0, 3, '#5b6b2a'], ['p', 1, 3, '#5b6b2a'], ['p', 10, 3, '#5b6b2a'], ['p', 9, 3, '#5b6b2a'], ['p', 4, 4, '#ff4a3a'], ['p', 6, 4, '#ff4a3a'], ['r', 4, 6, 3, 1, '#e8e0c8']]),
  scrapperUp: makeSprite(11, 13, [['r', 3, 9, 2, 4, '#3a4a1f'], ['r', 6, 9, 2, 4, '#3a4a1f'], ['r', 2, 6, 7, 4, '#4a3a2a'], ['e', 5.5, 4, 3.4, 3, '#5b6b2a'], ['p', 0, 3, '#5b6b2a'], ['p', 10, 3, '#5b6b2a'], ['r', 3, 5, 5, 1, '#4a5a22']]),
  // Bodies left behind: without a head (a red stump), or burned black.
  scrapperHeadless: makeSprite(11, 13, [...scrapperBody, ['r', 4, 5, 3, 1, '#7a1d1d'], ['p', 5, 4, '#9a2a2a']]),
  butcherHeadless: makeSprite(18, 22, [...butcherBase.slice(0, 9), ['r', 7, 8, 4, 2, '#7a1d1d'], ['p', 8, 7, '#9a2a2a']]),
  scrapperBurnt: makeSprite(11, 13, char([...scrapperBody, ...scrapperHead.slice(0, 5)])),
  butcherBurnt: makeSprite(18, 22, char(butcherBase)),
  barrel: makeSprite(10, 12, [['r', 1, 1, 8, 11, '#7a5230'], ['r', 0, 3, 10, 6, '#7a5230'], ['r', 0, 3, 10, 1, '#4a4652'], ['r', 0, 8, 10, 1, '#4a4652'], ['r', 2, 0, 6, 2, '#9a7a4a'], ['r', 4, 2, 1, 9, '#5a3d22']]),
  oil: makeSprite(10, 12, [['r', 1, 1, 8, 11, '#3a2a20'], ['r', 0, 3, 10, 6, '#3a2a20'], ['r', 0, 5, 10, 2, '#8a2a1a'], ['r', 2, 0, 6, 2, '#4a3a2a'], ['p', 5, 1, '#ffd27a'], ['p', 3, 9, '#1a1410']]),
  crate: makeSprite(12, 11, [['r', 0, 0, 12, 11, '#8a6a3a'], ['r', 0, 0, 12, 1, '#5a3d22'], ['r', 0, 10, 12, 1, '#5a3d22'], ['r', 0, 0, 1, 11, '#5a3d22'], ['r', 11, 0, 1, 11, '#5a3d22'], ['p', 3, 3, '#5a3d22'], ['p', 4, 4, '#5a3d22'], ['p', 5, 5, '#5a3d22'], ['p', 6, 5, '#5a3d22'], ['p', 7, 6, '#5a3d22'], ['p', 8, 7, '#5a3d22'], ['p', 8, 3, '#5a3d22'], ['p', 7, 4, '#5a3d22'], ['p', 4, 6, '#5a3d22'], ['p', 3, 7, '#5a3d22']]),
  table: makeSprite(20, 10, [['r', 0, 0, 20, 4, '#8b6a3a'], ['r', 0, 1, 20, 1, '#6b4a2b'], ['r', 7, 0, 1, 4, '#6b4a2b'], ['r', 13, 0, 1, 4, '#6b4a2b'], ['r', 1, 4, 2, 6, '#5a3d22'], ['r', 17, 4, 2, 6, '#5a3d22'], ['r', 2, 4, 16, 1, '#4a3420']]),
  plank: makeSprite(9, 2, [['r', 0, 0, 9, 2, '#8b6a3a'], ['p', 8, 0, '#5a3d22']]),
  stave: makeSprite(3, 8, [['r', 0, 0, 3, 8, '#7a5230'], ['r', 0, 2, 3, 1, '#4a4652']]),
  cage: makeSprite(14, 18, [['r', 0, 17, 14, 1, '#3a3640'], ['r', 0, 0, 14, 1, '#57525e'], ['r', 0, 0, 1, 18, '#6a6470'], ['r', 13, 0, 1, 18, '#6a6470'], ['r', 4, 0, 1, 18, '#6a6470'], ['r', 9, 0, 1, 18, '#6a6470'], ['r', 5, 8, 3, 9, '#7a6a58'], ['e', 6.5, 6.5, 2.2, 2.2, '#c79c78'], ['p', 6, 6, '#141218'], ['p', 7, 6, '#141218']]),
  larder: makeSprite(12, 16, [['r', 1, 0, 1, 16, '#4a3420'], ['r', 10, 0, 1, 16, '#4a3420'], ['r', 0, 1, 12, 1, '#5a3d22'], ['r', 3, 2, 2, 6, '#7a1d1d'], ['r', 7, 2, 2, 5, '#9a2a2a'], ['r', 0, 9, 12, 1, '#5a3d22'], ['r', 2, 10, 3, 4, '#8a6a3a'], ['r', 6, 10, 4, 5, '#5a1414'], ['p', 4, 7, '#e8e0c8']]),
  tree: makeSprite(20, 26, [['r', 9, 16, 3, 10, '#4a3420'], ['e', 10, 9, 9, 8, '#2f4a28'], ['e', 8, 7, 5, 4, '#3a5a30'], ['p', 13, 10, '#24391f'], ['p', 6, 11, '#24391f']]),
  pine: makeSprite(16, 28, [['r', 7, 22, 2, 6, '#4a3420'], ['t', 8, 0, 8, 10, '#1f3a26'], ['t', 8, 6, 12, 10, '#24412a'], ['t', 8, 12, 15, 11, '#1c3522']]),
  rock: makeSprite(14, 9, [['e', 7, 5, 6.5, 4, '#4a4652'], ['e', 5, 4, 3, 2, '#5a5664'], ['p', 9, 6, '#34313a']]),
  hay: makeSprite(16, 11, [['e', 8, 6.5, 7.5, 5, '#a08c44'], ['e', 7, 5, 4, 3, '#b8a050'], ['r', 2, 7, 12, 1, '#8a7a3a']]),
  well: makeSprite(16, 18, [['r', 1, 10, 14, 7, '#5a5664'], ['r', 1, 10, 14, 1, '#6a6470'], ['r', 3, 11, 10, 2, '#14121a'], ['r', 2, 0, 1, 11, '#4a3420'], ['r', 13, 0, 1, 11, '#4a3420'], ['r', 1, 0, 14, 2, '#6a2a1a'], ['r', 7, 2, 1, 5, '#8a8494']]),
  lantern: makeSprite(8, 36, [['r', 3, 8, 2, 28, '#3a3036'], ['r', 1, 34, 6, 2, '#2a2630'], ['r', 1, 2, 6, 7, '#5a4a2a'], ['r', 2, 3, 4, 5, '#2a2018'], ['r', 0, 1, 8, 1, '#7a6a3a']]),
  support: makeSprite(8, 26, [['r', 2, 0, 4, 26, '#5a3d22'], ['r', 0, 0, 8, 3, '#4a3420'], ['p', 3, 10, '#3a2a1a']]),
  stump: makeSprite(9, 6, [['r', 1, 1, 7, 5, '#4a3420'], ['r', 1, 0, 7, 2, '#8a6a3a'], ['p', 4, 1, '#6b4a2b']]),
  dummy: makeSprite(12, 17, dummyBase),
  swingDummy: makeSprite(12, 17, [...dummyBase, ['r', 2, 9, 8, 1, '#a33a2a'], ['p', 5, 2, '#141218'], ['p', 7, 2, '#141218']]),
  shield: makeSprite(5, 7, [['r', 0, 0, 5, 7, '#7a5230'], ['r', 0, 0, 5, 1, '#9aa3ad'], ['r', 0, 6, 5, 1, '#9aa3ad'], ['p', 2, 3, '#cfd6dc']]),
  pillar: makeSprite(14, 36, [['r', 2, 4, 10, 28, '#4f4a5c'], ['r', 2, 12, 10, 1, '#3b3746'], ['r', 2, 21, 10, 1, '#3b3746'], ['r', 6, 4, 1, 8, '#3b3746'], ['r', 4, 13, 1, 8, '#3b3746'], ['r', 8, 22, 1, 10, '#3b3746'], ['r', 0, 0, 14, 4, '#5d576b'], ['r', 0, 32, 14, 4, '#3b3746']]),
  brazier: makeSprite(10, 9, [['r', 4, 4, 2, 5, '#2a2630'], ['r', 1, 8, 8, 1, '#2a2630'], ['r', 0, 1, 10, 4, '#3a3640'], ['r', 1, 0, 8, 1, '#57525e'], ['r', 2, 1, 6, 1, '#7a2a10']]),
  survivor: makeSprite(7, 10, [['r', 1, 4, 5, 6, '#7a6a58'], ['e', 3.5, 2.5, 2.2, 2.2, '#c79c78'], ['p', 2, 2, '#141218'], ['p', 4, 2, '#141218']]),
};
