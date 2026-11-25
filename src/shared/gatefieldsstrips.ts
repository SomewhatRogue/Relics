/**
 * The common strips' own life (Kyle, 2026-11-25: "more stories in the common strips potentially or more flowers or
 * something"): drifts of wildflowers' marks and thistle at the hedges, field stones, and six small stories without a
 * word, each in the open ground between the crop strips, seen from the paths. Laid after the strips and the detail, off
 * every path, patch and pack start; where the seed leaves no room a story is left out. The wildflower drifts on the
 * ground itself are the 'harvest' look's (client/looks.ts). Pure.
 *   THE DROPPED PLOUGH: furrows that stop half done, the plough tipped on its share, handles in the air, a crow on it.
 *   THE SCARECROWS: one standing in the crows, one fallen in a heap of straw.
 *   THE LEFT MEAL: a cloth, a loaf's sack, a tipped jug, a sheaf and a sickle's worth of straw; the harvesters gone.
 *   THE SNARED HARE: a broken fence, two snare posts, a hare hung in the wire, trodden grass.
 *   THE FIELD CAIRN: stones cleared off the strips piled up, wildflowers at its foot, a crow.
 *   THE DITCH: a cart's ruts that leave the way and end in a wet ditch, the cart stuck, a plank, the wheel lost.
 */
import type { Kit } from './expedkit.js';
import { block, claim, mark, offLine, patch, round } from './expedkit.js';
import { marks } from './lowfurrowfieldskit.js';

const X0 = 4.4, X1 = 79.6, Y0 = 88, Y1 = 115.4;
const grim = (k: Kit, kind: 'pot' | 'hung' | 'strewn', x: number, y: number) => k.grim.push({ kind, x, y, k: Math.round(x * 7 + y * 3) % 5 });

/** What the stories have taken so far (this layout's own: the kit's claims are too wide for the gaps between strips). */
let taken: { x: number; y: number; r: number }[] = [];

/** Open ground at a point of radius `r`: off the paths, any round, block, crop patch or pack start, the water and the zone's edge. */
export function clear(k: Kit, x: number, y: number, r: number): boolean {
  if (x < X0 + r || x > X1 - r || y < Y0 + r || y > Y1 - r || k.roads.some((l) => offLine(l, x, y) < r + 0.8)) return false;
  return !k.rounds.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + r + 0.15) && !k.blocks.some((b) => x > b.x - r && x < b.x + b.w + r && y > b.y - r && y < b.y + b.h + r)
    && !k.soil.some((s) => s.mat === 'crop' && x > s.x - r - 0.1 && x < s.x + s.w + r + 0.1 && y > s.y - r - 0.1 && y < s.y + s.h + r + 0.1)
    && !k.foes.some((f) => Math.hypot(f.x - x, f.y - y) < r + 2) && !taken.some((t) => Math.hypot(t.x - x, t.y - y) < t.r + r);
}
const clearBox = (k: Kit, x: number, y: number, w: number, h: number): boolean => {
  for (let i = 0; i <= Math.ceil(w / 1.6); i++) for (let j = 0; j <= Math.ceil(h / 1.6); j++) if (!clear(k, x + Math.min(w, i * 1.6), y + Math.min(h, j * 1.6), 0.35)) return false;
  return true;
};
/** Try a box `w` by `h` at every spot of each region (a step apart, in the seed's order); the first clear one is taken and `lay` told where. */
function story(k: Kit, w: number, h: number, regions: [number, number, number, number][], lay: (x: number, y: number) => void): boolean {
  for (const [a, b, c, d] of regions) {
    const at: [number, number][] = [];
    for (let x = a; x <= c - w; x += 1) for (let y = b; y <= d - h; y += 1) at.push([x, y]);
    for (let i = at.length - 1; i > 0; i--) { const j = k.rng.int(i + 1); [at[i], at[j]] = [at[j], at[i]]; }
    for (const [x, y] of at) {
      if (!clearBox(k, x, y, w, h)) continue;
      for (let cx = x + 1; cx < x + w; cx += 2) taken.push({ x: cx, y: y + h / 2, r: h / 2 + 0.6 }), claim(k, cx, y + h / 2, h / 2 + 0.6);
      return lay(x, y), true;
    }
  }
  return false;
}

/** The plough dropped at the end of a furrow: three rows cut, the last stopping where it stands. */
function plough(k: Kit, x: number, y: number): void {
  patch(k, 'furrow', x, y + 0.2, 7.2, 0.5, false), patch(k, 'furrow', x, y + 1.1, 7.2, 0.5, false), patch(k, 'furrow', x, y + 2, 3.8, 0.5, false);
  block(k, 'plough', x + 4, y + 1.6, 2.4, 1.1), round(k, 'crows', x + 4.6, y + 1.3, 0.15), round(k, 'crows', x + 6.8, y + 0.7, 0.15);
  mark(k, 'trample', x + 5.2, y + 2.5, 2, 0.5);
}
/** One scarecrow standing with the crows on it, another down in its straw. */
function scarecrows(k: Kit, x: number, y: number): void {
  round(k, 'scarecrow', x + 1, y + 1.6, 0.4), round(k, 'crows', x + 0.3, y + 0.7, 0.15), round(k, 'crows', x + 1.9, y + 1, 0.15), round(k, 'crows', x + 1.6, y + 2.6, 0.15);
  mark(k, 'fallenpost', x + 3, y + 2.1, 2, 0.7), round(k, 'hay', x + 4.7, y + 1.9, 0.4), round(k, 'crows', x + 4.3, y + 1.4, 0.15), mark(k, 'straw', x + 3.4, y + 2.5, 2.2, 0.6);
}
/** A cloth with the dinner on it and nobody there: the jug over, a sack of bread, a sheaf where they sat. */
function meal(k: Kit, x: number, y: number): void {
  mark(k, 'straw', x + 0.8, y + 0.8, 2.2, 1.3), grim(k, 'pot', x + 1.5, y + 1.5), grim(k, 'pot', x + 2.7, y + 2.3), grim(k, 'strewn', x + 2, y + 2.6);
  round(k, 'sacks', x + 0.4, y + 0.2, 0.34), round(k, 'hay', x + 3.6, y + 1, 0.4), mark(k, 'trample', x + 0.2, y + 2.2, 3.2, 0.6), round(k, 'crows', x + 3.2, y + 2.8, 0.15);
}
/** A snare set where the fence is down: two stakes, the wire, the hare hung in it. */
function snare(k: Kit, x: number, y: number): void {
  block(k, 'fence', x, y + 0.2, 2, 0.35), block(k, 'fence', x + 3.6, y + 0.2, 1.6, 0.35), mark(k, 'fallenpost', x + 2, y + 0.7, 1.6, 0.5);
  round(k, 'post', x + 2.2, y + 1.8, 0.2), round(k, 'post', x + 3.4, y + 1.7, 0.2), grim(k, 'hung', x + 2.8, y + 1.6), mark(k, 'trample', x + 1.6, y + 2.1, 2.6, 0.6);
}
/** Stones cleared off the strips and piled, a few flowers someone left at the foot. */
function fieldCairn(k: Kit, x: number, y: number): void {
  for (const [dx, dy] of [[1.6, 1.4], [2.3, 1.7], [1, 1.9], [1.9, 0.9], [1.6, 2.3]]) round(k, 'rock', x + dx, y + dy, 0.36);
  marks(k, 'flowers', x + 2, y + 3.1, 3, 0.9, 0.2, 1.4, 0.5), round(k, 'crows', x + 2.1, y + 0.5, 0.15);
}
/** A cart's ruts leaving the way for the verge, ending in a ditch: the handcart nosed in, a plank, one wheel gone. */
function ditch(k: Kit, x: number, y: number): void {
  mark(k, 'ruts', x, y + 0.6, 4, 0.9), mark(k, 'mud', x + 3, y + 1.1, 3, 1.7), mark(k, 'puddle', x + 3.4, y + 1.6, 2.2, 1);
  round(k, 'handcart', x + 4.4, y + 1.2, 0.5), mark(k, 'planks', x + 2.6, y + 2.5, 1.6, 0.5), mark(k, 'debris', x + 5.1, y + 2.3, 1.1, 0.5);
}

export function layStrips(k: Kit): void {
  taken = [];
  story(k, 7.4, 3, [[X0, Y0, X1, Y1]], (x, y) => plough(k, x, y));
  story(k, 6.4, 3.2, [[X0, Y0, X1, Y1]], (x, y) => ditch(k, x, y));
  story(k, 5.8, 3.2, [[X0, Y0, X1, Y1]], (x, y) => scarecrows(k, x, y));
  story(k, 5.2, 3.1, [[X0, Y0, X1, Y1]], (x, y) => snare(k, x, y));
  story(k, 4, 3.6, [[X0, Y0, X1, Y1]], (x, y) => fieldCairn(k, x, y));
  story(k, 4, 3.2, [[X0, Y0, X1, Y1]], (x, y) => meal(k, x, y));
  // Wildflowers where the grass is open (the ground's own drifts are the look's), thistle and tall grass along the hedges, field stones.
  for (let i = 0; i < 16; i++) {
    const x = k.rng.range(X0 + 1, X1 - 1), y = k.rng.range(Y0 + 1, Y1 - 1);
    if (clear(k, x, y, 1.1)) marks(k, 'flowers', x, y, 3, 1.1, 0.5, 1.5, 0.5);
  }
  for (const [y, a, b] of [[100.5, 4, 30], [100.5, 49, 80], [114, 4, 30], [114, 44, 80]]) for (let x = a + 1; x < b - 1; x += k.rng.range(2.4, 4.4))
    for (const s of [-1.3, 1.3]) if (k.rng.next() < 0.6 && clear(k, x, y + s, 0.4)) marks(k, 'weeds', x, y + s, 2, 0.8, 0.2, 1.4, 0.6);
  for (let i = 0; i < 12; i++) {
    const x = k.rng.range(X0 + 1, X1 - 1), y = k.rng.range(Y0 + 1, Y1 - 1);
    if (clear(k, x, y, 0.8)) for (let j = 0, n = 1 + k.rng.int(3); j < n; j++) round(k, 'rock', x + j * 0.7, y + (j % 2) * 0.4, k.rng.range(0.28, 0.4));
  }
}
