/**
 * The statue in Lantern Square, drawn: the plinth's boxes (statuepieces.ts), the hero who paid for it in
 * stone on top (their own figure, drawn by drawHero and turned to the plinth's greys in a few stepped bands),
 * and their name cut in the plate. With nobody yet, a small board on top that says where to ask. The flat
 * view calls drawPlinth (blocks.ts); the 2.5D view builds the boxes itself and stands the figure and the
 * plate up on cards (three/statue3d.ts) with drawStatueTop and drawPlate. Only draws.
 */
import type { Round } from '../shared/arena';
import type { StatueHero } from '../shared/statue';
import { newHero } from '../sim/hero';
import { drawHero } from './actors';
import { BARE, type Ctx } from './draw';
import { paintBoxes } from './piecedraw';
import { glyph } from './pixfont';
import { PLATE, PLINTH_BOX, PLINTH_TOP, plateLines, plinthBoxes } from './statuepieces';
import { STATUE_WORDS } from './statuewords';
import { PX } from './world';

const FW = 40, FH = 48, FOOT = 4;
/** The statue stands this many times a hero's size (Kyle, 2026-11-06: "Should be much bigger"), each pixel doubled. */
export const STATUE_SCALE = 2;
/** How tall the figure stands above its feet on screen, drawn at STATUE_SCALE. */
export const STATUE_TALL = (FH - FOOT) * STATUE_SCALE;
/** Stone, darkest to palest: the hero's own shading kept, in the plinth's colours. */
const BANDS = [[46, 43, 54], [62, 58, 70], [87, 82, 94], [106, 100, 112], [138, 132, 148], [168, 162, 176]];
const figures = new Map<string, HTMLCanvasElement>();

/** The hero in stone (cached by who and how they look): FW by FH, feet at (FW / 2, FH - FOOT). */
export function stoneFigure(s: StatueHero): HTMLCanvasElement {
  const key = `${s.id}:${s.w}:${s.l}`;
  let c = figures.get(key);
  if (c) return c;
  const lit = document.createElement('canvas'), glow = document.createElement('canvas');
  for (const k of [lit, glow]) (k.width = FW), (k.height = FH);
  const h = Object.assign(newHero('statue', 0, 0), { weapon: s.w, look: s.l });
  const g: Ctx = { lit: lit.getContext('2d')!, glow: glow.getContext('2d')!, now: 0, t: 0 };
  BARE.on = true;
  try {
    drawHero(g, h, FW / 2, FH - FOOT, 'bare', 0);
  } finally {
    BARE.on = false;
  }
  const lx = g.lit, d = lx.getImageData(0, 0, FW, FH), px = d.data;
  let lo = 255, hi = 0;
  const lum = (i: number) => px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11;
  // (The outline alone takes the darkest stone: a dark brim or hood stretched onto it read as a hole through the
  // head, Kyle 2026-11-12. Everything else spreads over the five paler bands.)
  const LINE = 28;
  for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 40 && lum(i) >= LINE) (lo = Math.min(lo, lum(i))), (hi = Math.max(hi, lum(i)));
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] <= 40) {
      px[i + 3] = 0;
      continue;
    }
    // Stretched over the bands, so a dark hero and a pale one both read as carved stone.
    const k = lum(i) < LINE ? 0 : 1 + Math.min(BANDS.length - 2, Math.floor(((lum(i) - lo) / Math.max(1, hi - lo)) * (BANDS.length - 1)));
    [px[i], px[i + 1], px[i + 2], px[i + 3]] = [...BANDS[k], 255];
  }
  lx.putImageData(d, 0, 0);
  figures.set(key, lit);
  return (c = lit);
}

/** The stone figure as a picture (the commission panel's), cut to the figure with a pixel round it. */
export function statueArt(s: StatueHero): string {
  const f = stoneFigure(s), d = f.getContext('2d')!.getImageData(0, 0, FW, FH).data;
  let x0 = FW, y0 = FH, x1 = 0, y1 = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i]) {
    const x = ((i - 3) / 4) % FW, y = Math.floor((i - 3) / 4 / FW);
    (x0 = Math.min(x0, x)), (y0 = Math.min(y0, y)), (x1 = Math.max(x1, x)), (y1 = Math.max(y1, y));
  }
  if (x1 < x0) return f.toDataURL();
  const c = document.createElement('canvas');
  (c.width = x1 - x0 + 3), (c.height = y1 - y0 + 3);
  c.getContext('2d')!.drawImage(f, x0 - 1, y0 - 1, c.width, c.height, 0, 0, c.width, c.height);
  return c.toDataURL();
}

/** Letters cut into stone at (x, y): 3x5 capitals, dark, a pale lip under each stroke. */
function cut(g: CanvasRenderingContext2D, s: string, x: number, y: number, ink: string, lip: string): void {
  for (const [col, dy] of [[lip, 1], [ink, 0]] as const) {
    g.fillStyle = col;
    for (let i = 0; i < s.length; i++) {
      const p = glyph(s[i]);
      for (let k = 0; k < 15; k++) if (p[k] === '1') g.fillRect(x + i * 4 + (k % 3), y + dy + Math.floor(k / 3), 1, 1);
    }
  }
}

/** The plate on the plinth's front, with the face's foot at (x, y) on screen: the name, or nothing (empty). */
export function drawPlate(g: CanvasRenderingContext2D, name: string | undefined, x: number, y: number): void {
  if (!name) return;
  const lines = plateLines(name), w = Math.max(...lines.map((s) => s.length * 4 - 1)) + 4, h = lines.length * 6 + 3;
  const top = Math.round(y - (PLATE.y1 - PLATE.y0) * PX / 2 - h / 2), left = Math.round(x - w / 2);
  g.fillStyle = '#3a2e22', g.fillRect(left, top, w, h);
  g.fillStyle = '#6a5636', g.fillRect(left + 1, top + 1, w - 2, h - 2);
  lines.forEach((s, i) => cut(g, s, Math.round(x - (s.length * 4 - 1) / 2), top + 2 + i * 6, '#241c14', '#8a7448'));
}

/**
 * What stands on the cap, its feet at (x, y): the hero in stone, or the board that says where to ask. `from`,
 * `to`: only the figure's rows that far above its feet (screen pixels), for the 2.5D view, which stands it up
 * on two cards (three/statue3d.ts) since one card isn't tall enough.
 */
export function drawStatueTop(c: Ctx, s: StatueHero | undefined, x: number, y: number, from = 0, to = Infinity): void {
  if (s) {
    const f = stoneFigure(s), S = STATUE_SCALE, l = Math.round(x - (FW * S) / 2), feet = Math.round(y);
    // Source rows from the top of the figure: those between `to` and `from` above the feet.
    const top = Math.max(0, FH - FOOT - to / S), bot = from > 0 ? Math.min(FH, FH - FOOT - from / S) : FH;
    if (bot <= top) return;
    const dy = feet - (FH - FOOT - top) * S, dh = (bot - top) * S;
    c.glow.globalCompositeOperation = 'destination-out';
    c.glow.fillRect(l, dy, FW * S, dh);
    c.glow.globalCompositeOperation = 'source-over';
    const was = c.lit.imageSmoothingEnabled;
    c.lit.imageSmoothingEnabled = false;
    c.lit.drawImage(f, 0, top, FW, bot - top, l, dy, FW * S, dh);
    c.lit.imageSmoothingEnabled = was;
    return;
  }
  // A board on two legs: SEE / JUDD.
  const g = c.lit, words = STATUE_WORDS.sign, w = 19, h = words.length * 6 + 3, l = Math.round(x - w / 2), t = Math.round(y - 4 - h);
  g.fillStyle = '#2a1d12', g.fillRect(l + 3, t + h - 1, 2, 5), g.fillRect(l + w - 5, t + h - 1, 2, 5);
  g.fillStyle = '#3a2a1a', g.fillRect(l, t, w, h);
  g.fillStyle = '#6b4e34', g.fillRect(l + 1, t + 1, w - 2, h - 2);
  words.forEach((s, i) => cut(g, s, Math.round(x - (s.length * 4 - 1) / 2), t + 2 + i * 6, '#d8d0bc', '#2a1d12'));
}

/** The flat view: the whole plinth at its foot (x, y) on screen. */
export function drawPlinth(c: Ctx, r: Round, x: number, y: number): void {
  const tall = PLINTH_TOP * PX + STATUE_TALL + FOOT, half = Math.max(Math.round((PLINTH_BOX.slab[0] * PX) / 2) + 4, (FW * STATUE_SCALE) / 2);
  c.glow.globalCompositeOperation = 'destination-out';
  c.glow.fillRect(Math.round(x - half), Math.round(y - tall), half * 2, Math.round(tall + PX));
  c.glow.globalCompositeOperation = 'source-over';
  paintBoxes(c.lit, plinthBoxes(), x, y);
  // The front face's foot is half the body's depth forward of the foot, and its slab's height up.
  drawPlate(c.lit, r.hero?.name, x, Math.round(y + PLATE.z * PX - PLATE.y0 * PX));
  drawStatueTop(c, r.hero, x, Math.round(y - PLINTH_TOP * PX));
}
