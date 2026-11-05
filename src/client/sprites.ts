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

const warriorBase: Part[] = [
  ['r', 3, 11, 2, 5, '#3a3f4a'], ['r', 7, 11, 2, 5, '#3a3f4a'], ['r', 3, 15, 2, 1, '#2a2420'], ['r', 7, 15, 2, 1, '#2a2420'],
  ['r', 2, 6, 8, 6, '#2f5d9b'], ['r', 5, 6, 2, 6, '#d4a537'], ['r', 2, 10, 8, 1, '#5a3d22'],
  ['r', 1, 6, 2, 3, '#9aa3ad'], ['r', 9, 6, 2, 3, '#9aa3ad'],
];
/** One hero sprite per class, facing you (`down`) and walking away (`up`). Eyes glow in the dark. */
type Pair = { down: Part[]; up: Part[]; tall?: number };
const shift = (parts: Part[], dy: number): Part[] => parts.map((p) => (p[0] === 'p' ? ['p', p[1], p[2] + dy, p[3]] : [p[0], p[1], p[2] + dy, p[3], p[4], p[5]]) as Part);
const legs = (col = '#3a3f4a', boot = '#2a2420'): Part[] => [['r', 3, 11, 2, 5, col], ['r', 7, 11, 2, 5, col], ['r', 3, 15, 2, 1, boot], ['r', 7, 15, 2, 1, boot]];

/** The Warrior's looks (Kyle to choose; the first is the one in play). */
export const WARRIOR_LOOKS: Record<'knight' | 'sellsword' | 'blackiron', Pair> = {
  knight: {
    down: [...legs(), ['r', 2, 6, 8, 6, '#2f5d9b'], ['r', 5, 6, 2, 6, '#d4a537'], ['r', 2, 10, 8, 1, '#5a3d22'], ['r', 1, 6, 2, 3, '#9aa3ad'], ['r', 9, 6, 2, 3, '#9aa3ad'],
      ['e', 6, 3.5, 3.6, 3.6, '#9aa3ad'], ['r', 4, 3, 5, 1, '#141218'], ['p', 5, 3, '#bfe0ff'], ['p', 7, 3, '#bfe0ff'], ['r', 5, 0, 2, 1, '#c0392b']],
    up: [...legs(), ['r', 2, 6, 8, 6, '#2f5d9b'], ['r', 1, 6, 2, 3, '#9aa3ad'], ['r', 9, 6, 2, 3, '#9aa3ad'], ['r', 3, 6, 6, 7, '#7a1d1d'], ['e', 6, 3.5, 3.6, 3.6, '#9aa3ad'], ['r', 5, 0, 2, 1, '#c0392b']],
  },
  // Dented steel, old leather, a rag of red: someone who's been paid to stand there a long time.
  sellsword: {
    down: [...legs('#4a3a2e', '#241c16'), ['r', 2, 6, 8, 6, '#5a4030'], ['r', 2, 6, 8, 2, '#6a6e74'], ['r', 2, 10, 8, 1, '#2a1e16'], ['p', 3, 8, '#7a1d1d'], ['p', 4, 9, '#5a1414'], ['r', 1, 6, 2, 4, '#6a6e74'], ['r', 9, 6, 2, 4, '#6a6e74'],
      ['e', 6, 3.5, 3.6, 3.6, '#7a7f86'], ['r', 3, 3, 6, 2, '#141218'], ['p', 5, 3, '#bfe0ff'], ['p', 7, 3, '#bfe0ff'], ['p', 8, 1, '#5a5e64'], ['r', 9, 9, 2, 1, '#7a1d1d']],
    up: [...legs('#4a3a2e', '#241c16'), ['r', 2, 6, 8, 6, '#5a4030'], ['r', 1, 6, 2, 4, '#6a6e74'], ['r', 9, 6, 2, 4, '#6a6e74'], ['r', 3, 6, 6, 6, '#3a2a22'], ['p', 4, 12, '#3a2a22'], ['p', 7, 12, '#3a2a22'], ['e', 6, 3.5, 3.6, 3.6, '#7a7f86'], ['p', 4, 1, '#5a5e64']],
  },
  // Blackened plate, the brass gone dull, a red-hot stare through the slit, and somebody else's blood.
  blackiron: {
    down: [...legs('#2a2a30', '#1a1a1e'), ['r', 2, 6, 8, 6, '#2a2a30'], ['r', 5, 6, 2, 6, '#8a6a3a'], ['r', 2, 10, 8, 1, '#3a2a1a'], ['r', 1, 5, 3, 3, '#3a3a42'], ['r', 8, 5, 3, 3, '#3a3a42'],
      ['e', 6, 3.5, 3.6, 3.6, '#3a3a42'], ['r', 4, 3, 5, 1, '#0d0b10'], ['p', 5, 3, '#ff8a3a'], ['p', 7, 3, '#ff8a3a'], ['p', 3, 8, '#6b1a1a'], ['p', 8, 9, '#6b1a1a'], ['p', 7, 7, '#7a1d1d'], ['r', 6, 0, 1, 1, '#3a3a42']],
    up: [...legs('#2a2a30', '#1a1a1e'), ['r', 2, 6, 8, 6, '#2a2a30'], ['r', 1, 5, 3, 3, '#3a3a42'], ['r', 8, 5, 3, 3, '#3a3a42'], ['r', 3, 6, 6, 7, '#4a1414'], ['e', 6, 3.5, 3.6, 3.6, '#3a3a42'], ['p', 5, 10, '#2a0a0a']],
  },
};

export function heroPair(l: Pair): { down: Sprite; up: Sprite } {
  const t = l.tall ?? 0;
  return { down: makeSprite(12, 16 + t, shift(l.down, t)), up: makeSprite(12, 16 + t, shift(l.up, t)) };
}

/** Three looks for each class, chosen on the pick screen (the first is the default). */
export const LOOKS: Record<'WARRIOR' | 'RANGER' | 'ROGUE' | 'MAGE' | 'HEALER', Pair[]> = {
  WARRIOR: [WARRIOR_LOOKS.knight, WARRIOR_LOOKS.sellsword, WARRIOR_LOOKS.blackiron],
  RANGER: [
    // Hooded, a scarf over the mouth, a quiver strap; a hunter's eyes in the shadow of the hood.
    {
      down: [...legs('#3a3a2a'), ['r', 2, 6, 8, 6, '#3f6b3a'], ['p', 8, 6, '#5a3d22'], ['p', 7, 7, '#5a3d22'], ['p', 6, 8, '#5a3d22'], ['p', 5, 9, '#5a3d22'], ['p', 4, 10, '#5a3d22'], ['r', 2, 10, 8, 1, '#5a3d22'], ['r', 1, 6, 2, 3, '#5a4a32'], ['r', 9, 6, 2, 3, '#5a4a32'],
        ['e', 6, 3.5, 3.6, 3.6, '#3f5a32'], ['p', 6, 0, '#3f5a32'], ['r', 4, 3, 5, 2, '#141218'], ['p', 5, 3, '#ffd27a'], ['p', 7, 3, '#ffd27a'], ['r', 4, 5, 5, 1, '#5a4a32']],
      up: [...legs('#3a3a2a'), ['r', 2, 6, 8, 6, '#3f6b3a'], ['r', 1, 6, 2, 3, '#5a4a32'], ['r', 9, 6, 2, 3, '#5a4a32'], ['r', 3, 6, 6, 7, '#2f4a28'], ['r', 8, 4, 2, 5, '#6b4a2b'], ['p', 8, 3, '#d8c48a'], ['p', 9, 3, '#d8c48a'], ['e', 6, 3.5, 3.6, 3.6, '#3f5a32'], ['p', 6, 0, '#3f5a32']],
    },
    // A trapper: a wide brimmed hat, a fur collar, brown leather.
    {
      down: [...legs('#3a2e24'), ['r', 2, 6, 8, 6, '#6b4a2b'], ['r', 2, 6, 8, 1, '#8a7a66'], ['r', 1, 5, 10, 2, '#8a7a66'], ['r', 2, 10, 8, 1, '#3a2a1a'], ['r', 1, 7, 2, 3, '#5a3d22'], ['r', 9, 7, 2, 3, '#5a3d22'],
        ['e', 6, 3.6, 3.2, 3, '#141218'], ['p', 5, 3, '#ffd27a'], ['p', 7, 3, '#ffd27a'], ['r', 0, 1, 12, 1, '#4a3420'], ['r', 3, 0, 6, 1, '#5a3d22']],
      up: [...legs('#3a2e24'), ['r', 2, 6, 8, 6, '#6b4a2b'], ['r', 1, 5, 10, 2, '#8a7a66'], ['r', 8, 3, 2, 6, '#6b4a2b'], ['p', 8, 2, '#d8c48a'], ['e', 6, 3.6, 3.2, 3, '#4a3420'], ['r', 0, 1, 12, 1, '#4a3420'], ['r', 3, 0, 6, 1, '#5a3d22']],
    },
    // A warden of the hills: grey-blue hood and cloak, pale eyes.
    {
      down: [...legs('#3a3e46'), ['r', 2, 6, 8, 6, '#4a5a6a'], ['r', 1, 6, 2, 4, '#3a4652'], ['r', 9, 6, 2, 4, '#3a4652'], ['r', 2, 10, 8, 1, '#2a2420'], ['p', 6, 7, '#9aa3ad'],
        ['e', 6, 3.5, 3.6, 3.6, '#5a6a7a'], ['p', 6, 0, '#5a6a7a'], ['r', 4, 3, 5, 2, '#141218'], ['p', 5, 3, '#bfe0ff'], ['p', 7, 3, '#bfe0ff']],
      up: [...legs('#3a3e46'), ['r', 2, 6, 8, 6, '#4a5a6a'], ['r', 2, 6, 8, 8, '#3a4652'], ['r', 8, 4, 2, 5, '#6b4a2b'], ['e', 6, 3.5, 3.6, 3.6, '#5a6a7a'], ['p', 6, 0, '#5a6a7a']],
    },
  ],
  ROGUE: [
    {
      down: [...legs(), ['r', 2, 6, 8, 6, '#3a3346'], ['r', 5, 6, 2, 6, '#5a3d22'], ['r', 2, 10, 8, 1, '#5a3d22'], ['r', 1, 6, 2, 3, '#2a2630'], ['r', 9, 6, 2, 3, '#2a2630'],
        ['e', 6, 3.5, 3.6, 3.6, '#2a2630'], ['r', 4, 3, 5, 2, '#141218'], ['p', 5, 3, '#c9a8ff'], ['p', 7, 3, '#c9a8ff']],
      up: [...legs(), ['r', 2, 6, 8, 6, '#3a3346'], ['r', 1, 6, 2, 3, '#2a2630'], ['r', 9, 6, 2, 3, '#2a2630'], ['r', 3, 6, 6, 7, '#24202c'], ['e', 6, 3.5, 3.6, 3.6, '#2a2630']],
    },
    // A cutpurse: a red scarf up over the nose, brown leather, yellow eyes.
    {
      down: [...legs('#3a3028'), ['r', 2, 6, 8, 6, '#5a4030'], ['r', 2, 10, 8, 1, '#2a1e16'], ['r', 1, 6, 2, 3, '#4a3428'], ['r', 9, 6, 2, 3, '#4a3428'], ['p', 3, 9, '#9aa3ad'],
        ['e', 6, 3.5, 3.6, 3.6, '#3a2a22'], ['r', 4, 3, 5, 1, '#141218'], ['p', 5, 3, '#ffd27a'], ['p', 7, 3, '#ffd27a'], ['r', 3, 4, 6, 2, '#8a2a1a'], ['p', 9, 6, '#8a2a1a']],
      up: [...legs('#3a3028'), ['r', 2, 6, 8, 6, '#5a4030'], ['r', 1, 6, 2, 3, '#4a3428'], ['r', 9, 6, 2, 3, '#4a3428'], ['e', 6, 3.5, 3.6, 3.6, '#3a2a22'], ['r', 5, 5, 2, 3, '#8a2a1a']],
    },
    // Night: black from hood to boot, a pale bone mask, white eyes.
    {
      down: [...legs('#1a1a20', '#0d0b10'), ['r', 2, 6, 8, 6, '#1e1c24'], ['r', 2, 10, 8, 1, '#2a2630'], ['r', 1, 6, 2, 3, '#18161c'], ['r', 9, 6, 2, 3, '#18161c'],
        ['e', 6, 3.5, 3.6, 3.6, '#1e1c24'], ['r', 4, 3, 5, 2, '#c8c0b0'], ['p', 5, 3, '#141218'], ['p', 7, 3, '#141218'], ['p', 5, 4, '#bfe0ff'], ['p', 7, 4, '#bfe0ff']],
      up: [...legs('#1a1a20', '#0d0b10'), ['r', 2, 6, 8, 6, '#1e1c24'], ['r', 3, 6, 6, 7, '#141218'], ['e', 6, 3.5, 3.6, 3.6, '#1e1c24']],
    },
  ],
  MAGE: [
    // A tall pointed hat with a star stitched on, a long robe and wide sleeves, a grey beard, eyes lit violet.
    robe('#3e2760', '#4a2f6e', '#2e1c48', '#b89a4a', '#c9a8ff', '#a8a2b4'),
    // The ember: red robe and hat, fire in the eyes, a black beard.
    robe('#6a1e1a', '#7a2a1e', '#3a1210', '#d4a537', '#ff8a3a', '#3a3036'),
    // Frost: pale blue, a hood instead of a hat, a white beard and ice in the eyes.
    {
      tall: 2,
      down: [['r', 3, 14, 2, 2, '#2a2420'], ['r', 7, 14, 2, 2, '#2a2420'], ['r', 2, 6, 8, 9, '#5a7a9a'], ['r', 1, 13, 10, 2, '#5a7a9a'], ['r', 5, 6, 2, 9, '#cfe0ec'], ['r', 2, 10, 8, 1, '#3a4a5a'],
        ['r', 0, 6, 3, 4, '#6a8aaa'], ['r', 9, 6, 3, 4, '#6a8aaa'], ['e', 6, 3, 4, 4.2, '#6a8aaa'], ['p', 6, -2, '#6a8aaa'], ['e', 6, 3.6, 3, 2.8, '#141218'], ['p', 5, 3, '#bfe0ff'], ['p', 7, 3, '#bfe0ff'], ['t', 6, 5, 4, 4, '#e8eef2']],
      up: [['r', 3, 14, 2, 2, '#2a2420'], ['r', 7, 14, 2, 2, '#2a2420'], ['r', 2, 6, 8, 9, '#5a7a9a'], ['r', 1, 13, 10, 2, '#4a6a8a'], ['r', 0, 6, 3, 4, '#6a8aaa'], ['r', 9, 6, 3, 4, '#6a8aaa'], ['e', 6, 3, 4, 4.2, '#6a8aaa'], ['p', 6, -2, '#6a8aaa']],
    },
  ],
  HEALER: [
    // The Cleric: a mail coif and mail sleeves, a white tabard to the knee with the Lantern on it in gold.
    {
      down: [...legs('#4a4e56'), ['r', 2, 6, 8, 6, '#6a7078'], ['r', 1, 6, 2, 4, '#7a8088'], ['r', 9, 6, 2, 4, '#7a8088'], ['r', 2, 10, 8, 1, '#5a3d22'],
        ['r', 3, 6, 6, 8, '#e0d8c4'], ['r', 3, 10, 6, 1, '#8a6a3a'], ['p', 5, 7, '#ffd27a'], ['p', 6, 7, '#ffd27a'], ['r', 5, 8, 2, 1, '#d4a537'],
        ['e', 6, 3.5, 3.6, 3.6, '#8a9098'], ['r', 4, 3, 5, 2, '#141218'], ['p', 5, 3, '#ffe9a8'], ['p', 7, 3, '#ffe9a8'], ['r', 4, 1, 4, 1, '#d4a537']],
      up: [...legs('#4a4e56'), ['r', 2, 6, 8, 6, '#6a7078'], ['r', 1, 6, 2, 4, '#7a8088'], ['r', 9, 6, 2, 4, '#7a8088'], ['r', 3, 6, 6, 8, '#cfc6b0'], ['e', 6, 3.5, 3.6, 3.6, '#8a9098'], ['r', 4, 1, 4, 1, '#d4a537']],
    },
    // The friar: a brown habit and hood, a rope belt, a lantern-light under the hood.
    {
      down: [['r', 3, 14, 2, 2, '#2a2420'], ['r', 7, 14, 2, 2, '#2a2420'], ['r', 2, 6, 8, 9, '#5a4232'], ['r', 1, 13, 10, 2, '#5a4232'], ['r', 2, 10, 8, 1, '#c8b88a'], ['p', 4, 11, '#c8b88a'], ['p', 4, 12, '#c8b88a'],
        ['r', 1, 6, 2, 4, '#4a3428'], ['r', 9, 6, 2, 4, '#4a3428'], ['e', 6, 3.5, 3.8, 3.8, '#5a4232'], ['p', 6, 0, '#5a4232'], ['r', 4, 3, 5, 2, '#141218'], ['p', 5, 3, '#ffe9a8'], ['p', 7, 3, '#ffe9a8'], ['p', 6, 8, '#d4a537']],
      up: [['r', 3, 14, 2, 2, '#2a2420'], ['r', 7, 14, 2, 2, '#2a2420'], ['r', 2, 6, 8, 9, '#5a4232'], ['r', 1, 13, 10, 2, '#4a3428'], ['r', 2, 10, 8, 1, '#c8b88a'], ['e', 6, 3.5, 3.8, 3.8, '#5a4232'], ['p', 6, 0, '#5a4232']],
    },
    // The templar: a closed white helm, a red cloak, the Lantern on the breast.
    {
      down: [...legs('#4a4e56'), ['r', 2, 6, 8, 6, '#c8c0b0'], ['r', 1, 6, 2, 4, '#8a9098'], ['r', 9, 6, 2, 4, '#8a9098'], ['r', 2, 10, 8, 1, '#5a3d22'], ['p', 5, 7, '#ffd27a'], ['p', 6, 7, '#ffd27a'], ['r', 5, 8, 2, 1, '#d4a537'], ['p', 1, 10, '#8a1e1e'], ['p', 10, 10, '#8a1e1e'],
        ['r', 3, 0, 6, 6, '#d8d4cc'], ['r', 4, 3, 4, 1, '#141218'], ['p', 5, 3, '#ffe9a8'], ['p', 6, 3, '#ffe9a8'], ['r', 6, 1, 1, 4, '#d4a537']],
      up: [...legs('#4a4e56'), ['r', 2, 6, 8, 6, '#c8c0b0'], ['r', 2, 6, 8, 8, '#8a1e1e'], ['r', 3, 0, 6, 6, '#d8d4cc']],
    },
  ],
};

/** A robed Mage with a pointed hat: robe, sleeves, hat brim, band and star, eyes, beard. */
function robe(body: string, sleeve: string, brim: string, band: string, eyes: string, beard: string): Pair {
  const feet: Part[] = [['r', 3, 14, 2, 2, '#2a2420'], ['r', 7, 14, 2, 2, '#2a2420']];
  const hat: Part[] = [['r', 1, 1, 10, 1, brim], ['t', 6, -5, 7, 6, body], ['p', 7, -5, body], ['p', 8, -5, body], ['r', 3, 0, 6, 1, band]];
  return {
    tall: 5,
    down: [...feet, ['r', 2, 6, 8, 9, body], ['r', 1, 13, 10, 2, body], ['r', 5, 6, 2, 9, band], ['r', 2, 10, 8, 1, brim], ['r', 0, 6, 3, 4, sleeve], ['r', 9, 6, 3, 4, sleeve], ['p', 0, 9, '#c79c78'], ['p', 11, 9, '#c79c78'],
      ['e', 6, 3.5, 3.4, 3.2, '#141218'], ['p', 5, 3, eyes], ['p', 7, 3, eyes], ['t', 6, 4, 4, 4, beard], ...hat, ['p', 5, -2, '#ffd27a']],
    up: [...feet, ['r', 2, 6, 8, 9, body], ['r', 1, 13, 10, 2, brim], ['r', 0, 6, 3, 4, sleeve], ['r', 9, 6, 3, 4, sleeve], ['e', 6, 3.5, 3.4, 3.2, beard], ...hat],
  };
}

const LOOK_SPRITES = Object.fromEntries(Object.entries(LOOKS).map(([k, ls]) => [k, ls.map((l) => heroPair(l))])) as Record<keyof typeof LOOKS, { down: Sprite; up: Sprite }[]>;
/** A class's look `i` (0 to 2; anything else is the first). */
export const heroLook = (cls: keyof typeof LOOKS, i = 0) => LOOK_SPRITES[cls][i] ?? LOOK_SPRITES[cls][0];


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

export const HEROES = Object.fromEntries(Object.keys(LOOKS).map((k) => [k, heroLook(k as keyof typeof LOOKS)])) as Record<keyof typeof LOOKS, { down: Sprite; up: Sprite }>;

export const SPRITES = {
  warriorDown: makeSprite(12, 16, [...warriorBase, ['e', 6, 3.5, 3.6, 3.6, '#9aa3ad'], ['r', 4, 3, 5, 1, '#141218'], ['r', 5, 0, 2, 1, '#c0392b']]),
  warriorUp: makeSprite(12, 16, [...warriorBase, ['r', 3, 6, 6, 7, '#7a1d1d'], ['e', 6, 3.5, 3.6, 3.6, '#9aa3ad'], ['r', 5, 0, 2, 2, '#c0392b']]),
  butcherDown: makeSprite(18, 22, [...butcherBase, ['p', 7, 5, '#ff4a3a'], ['p', 11, 5, '#ff4a3a'], ['p', 7, 8, '#e8e0c8'], ['p', 11, 8, '#e8e0c8'], ['r', 8, 7, 3, 1, '#2a1a14']]),
  butcherUp: makeSprite(18, 22, [...butcherBase, ['r', 6, 8, 6, 2, '#4a5a22']]),
  scrapper: makeSprite(11, 13, [['r', 3, 9, 2, 4, '#3a4a1f'], ['r', 6, 9, 2, 4, '#3a4a1f'], ['r', 2, 6, 7, 4, '#4a3a2a'], ['r', 2, 9, 7, 1, '#2a2018'], ['e', 5.5, 4, 3.4, 3, '#5b6b2a'], ['p', 0, 3, '#5b6b2a'], ['p', 1, 3, '#5b6b2a'], ['p', 10, 3, '#5b6b2a'], ['p', 9, 3, '#5b6b2a'], ['p', 4, 4, '#ff4a3a'], ['p', 6, 4, '#ff4a3a'], ['r', 4, 6, 3, 1, '#e8e0c8']]),
  /** The blind hunters of the deep workings: bone-pale, long-eared, empty sockets where the eyes should glow. */
  pale: makeSprite(11, 13, [['r', 3, 9, 2, 4, '#8a8478'], ['r', 6, 9, 2, 4, '#8a8478'], ['r', 2, 6, 7, 4, '#4a4440'], ['r', 2, 9, 7, 1, '#2a2420'], ['e', 5.5, 4, 3.4, 3, '#c8c2b0'], ['p', 0, 2, '#c8c2b0'], ['p', 1, 3, '#c8c2b0'], ['p', 10, 2, '#c8c2b0'], ['p', 9, 3, '#c8c2b0'], ['p', 4, 4, '#1a1614'], ['p', 6, 4, '#1a1614'], ['r', 4, 6, 3, 1, '#e8e0c8']]),
  paleUp: makeSprite(11, 13, [['r', 3, 9, 2, 4, '#8a8478'], ['r', 6, 9, 2, 4, '#8a8478'], ['r', 2, 6, 7, 4, '#4a4440'], ['e', 5.5, 4, 3.4, 3, '#c8c2b0'], ['p', 0, 2, '#c8c2b0'], ['p', 10, 2, '#c8c2b0'], ['r', 3, 5, 5, 1, '#a8a290']]),
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
  target: makeSprite(12, 16, [['r', 5, 9, 2, 7, '#4a3420'], ['e', 6, 5.5, 5.5, 5.5, '#d8c48a'], ['e', 6, 5.5, 3.8, 3.8, '#a33a2a'], ['e', 6, 5.5, 2, 2, '#d8c48a'], ['p', 6, 5, '#7a1d1d']]),
  stone: makeSprite(8, 10, [['r', 1, 3, 6, 7, '#5a5664'], ['e', 4, 3, 3, 2.5, '#5a5664'], ['r', 3, 4, 2, 1, '#45414c'], ['r', 2, 9, 4, 1, '#34313a']]),
  post: makeSprite(6, 28, [['r', 2, 6, 2, 22, '#2a2630'], ['r', 1, 26, 4, 2, '#2a2630'], ['r', 0, 1, 6, 6, '#3a3640'], ['r', 1, 2, 4, 4, '#5a4a2a'], ['r', 1, 0, 4, 1, '#2a2630']]),
  grate: makeSprite(16, 8, [['r', 0, 0, 16, 8, '#1a181e'], ['r', 1, 1, 14, 6, '#0d0b10'], ['r', 3, 0, 1, 8, '#4a4652'], ['r', 7, 0, 1, 8, '#4a4652'], ['r', 11, 0, 1, 8, '#4a4652'], ['r', 0, 3, 16, 1, '#4a4652']]),
  statue: makeSprite(14, 30, [['r', 2, 24, 10, 6, '#5a5664'], ['r', 3, 23, 8, 1, '#6a6470'], ['r', 4, 10, 6, 13, '#6a6470'], ['e', 7, 7, 2.6, 2.6, '#6a6470'], ['r', 10, 6, 1, 12, '#57525e'], ['r', 9, 5, 3, 1, '#57525e'], ['r', 5, 12, 1, 8, '#57525e']]),
  // Reeds at a bank or in a bog: thin stalks, brown heads.
  reed: makeSprite(11, 15, [['r', 1, 5, 1, 10, '#4a5a2a'], ['r', 3, 2, 1, 13, '#56682e'], ['r', 5, 4, 1, 11, '#4a5a2a'], ['r', 7, 1, 1, 14, '#5e7034'], ['r', 9, 5, 1, 10, '#4a5a2a'], ['r', 3, 1, 1, 3, '#6b4a2b'], ['r', 7, 0, 1, 3, '#6b4a2b'], ['r', 9, 4, 1, 2, '#6b4a2b']]),
  // A drowned tree in the marsh: grey, bare, a broken limb.
  deadtree: makeSprite(19, 27, [['r', 8, 9, 3, 18, '#4a4650'], ['r', 9, 9, 1, 18, '#5a5660'], ['r', 4, 6, 1, 5, '#4a4650'], ['r', 4, 10, 5, 1, '#4a4650'], ['r', 13, 3, 1, 7, '#4a4650'], ['r', 10, 12, 4, 1, '#4a4650'], ['r', 7, 2, 1, 8, '#4a4650'], ['r', 15, 2, 1, 3, '#3e3a44'], ['r', 2, 4, 3, 1, '#3e3a44'], ['r', 7, 25, 6, 2, '#2e2c34']]),
  bush: makeSprite(14, 10, [['e', 7, 6, 6.5, 4, '#26361f'], ['e', 5, 4.5, 3.5, 2.5, '#2f4a28'], ['e', 9.5, 5, 3, 2.5, '#2a4024'], ['p', 4, 7, '#7a2a3a'], ['p', 10, 6, '#7a2a3a']]),
  survivor: makeSprite(7, 10, [['r', 1, 4, 5, 6, '#7a6a58'], ['e', 3.5, 2.5, 2.2, 2.2, '#c79c78'], ['p', 2, 2, '#141218'], ['p', 4, 2, '#141218']]),
};
