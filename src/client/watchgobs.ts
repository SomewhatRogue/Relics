/**
 * The Night Watch's goblins in side view, painted from their hit zones (sim/watchzones.ts) so the
 * pixels you aim at are the pixels judged: legs, a ragged body, a green head with a glowing eye, and
 * whatever they carry (a helmet, a shield that splinters, a torch, a bow). The fallen lie on their
 * backs with the arrows still in them; the burning run.
 */
import { FOES, SHAPES, WATCH, groundY, type Disc } from '../shared/watchtune';
import { feet } from '../sim/watchzones';
import type { Gob, Stuck, WatchState } from '../sim/watchtypes';
import { fogAt } from '../sim/watchnight';

const SKIN = '#6b7b32', SKIN_DARK = '#4e5c24', LEG = '#3a4a1f', RAG = '#4a3a2a', RAG_DARK = '#3a2c20', TOOTH = '#e8e0c8';
const IRON = '#7a7884', IRON_LIT = '#a4a2ae', WOOD = '#7a5230', WOOD_DARK = '#4a3420', SHAFT = '#d8c48a', FLETCH = '#e8e0d0';
export const EYE = '#ff4a3a', FLAME = ['#ffe9a8', '#ffd27a', '#ff8a3a'];

type G2 = CanvasRenderingContext2D;
const px = (g: G2, x: number, y: number, col: string) => ((g.fillStyle = col), g.fillRect(Math.round(x), Math.round(y), 1, 1));
const rect = (g: G2, x0: number, y0: number, x1: number, y1: number, col: string) => ((g.fillStyle = col), g.fillRect(Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0)));
/** A disc in whole pixels: every pixel whose middle is inside it (the same test the arrow's is). */
function disc(g: G2, c: Disc, col: string, top = Infinity): void {
  g.fillStyle = col;
  for (let y = Math.floor(c.y - c.r); y <= Math.ceil(c.y + c.r); y++)
    for (let x = Math.floor(c.x - c.r); x <= Math.ceil(c.x + c.r); x++) if ((x + 0.5 - c.x) ** 2 + (y + 0.5 - c.y) ** 2 <= c.r * c.r && y < top) g.fillRect(x, y, 1, 1);
}
/** An arrow stuck in something: the shaft trailing back the way it came, white fletching at the end. */
export function stuckArrow(g: G2, x: number, y: number, ang: number, len = 5): void {
  for (let i = 0; i <= len; i++) px(g, x - Math.cos(ang) * i, y - Math.sin(ang) * i, i >= len - 1 ? FLETCH : SHAFT);
}

/** One goblin on the lit layer; its eye (and any fire) on the glow layer, dimmed in fog. */
export function drawGob(lit: G2, glow: G2, s: WatchState, g: Gob, now: number): void {
  if (g.state === 'dead') return drawFallen(lit, s, g);
  const [fx, fy0] = feet(g), sink = g.state === 'gone' ? Math.min(16, (s.t - g.at) * 40) : 0, fy = fy0 + sink;
  const sh = SHAPES[g.kind], off = (b: { x0: number; y0: number; x1: number; y1: number }) => [fx + b.x0, fy + b.y0, fx + b.x1, fy + b.y1] as const;
  // Legs, stepping: the back leg and the front leg trade places every 4 pixels walked.
  const [lx0, ly0, lx1, ly1] = off(sh.legs), step = Math.floor(g.walked / 4) % 2 === 0 || g.state !== 'walk';
  rect(lit, step ? lx0 : lx0 + 1, ly0, (step ? lx0 : lx0 + 1) + 2, ly1, LEG);
  rect(lit, step ? lx1 - 2 : lx1 - 3, ly0, (step ? lx1 : lx1 - 1), ly1, SKIN_DARK);
  // The body: rags, a belt, an arm reaching forward.
  const [bx0, by0, bx1, by1] = off(sh.body);
  rect(lit, bx0, by0, bx1, by1, RAG);
  rect(lit, bx0, by1 - 2, bx1, by1 - 1, RAG_DARK);
  rect(lit, bx1 - 1, by0 + 2, bx1 + 1, by0 + 4, SKIN);
  // The head, a long ear swept back, teeth at the front; the helmet over the top half.
  const hd: Disc = { x: fx + sh.head.x, y: fy + sh.head.y, r: sh.head.r };
  disc(lit, hd, SKIN);
  px(lit, hd.x - hd.r - 0.5, hd.y - 1.5, SKIN), px(lit, hd.x - hd.r - 1.5, hd.y - 2.5, SKIN);
  px(lit, hd.x + hd.r - 0.5, hd.y + 1.5, TOOTH);
  if (g.helmet) disc(lit, hd, IRON, hd.y), rect(lit, hd.x - hd.r - 1, hd.y - 1, hd.x + hd.r + 1, hd.y, IRON_LIT), px(lit, hd.x - 0.5, hd.y - hd.r - 1, IRON_LIT);
  // What it carries.
  if (g.kind === 'archer') {
    const ax = bx1 + 2, top = by0 - 3;
    for (let i = 0; i < 12; i++) px(lit, ax + (i > 2 && i < 9 ? 1 : 0), top + i, WOOD);
    if (g.state === 'aim') rect(lit, bx1, by0 + 1, ax, by0 + 2, SKIN);
  }
  if (sh.shield && g.shieldHp > 0) {
    const [x0, y0, x1, y1] = off(sh.shield);
    rect(lit, x0, y0, x1, y1, WOOD);
    rect(lit, x0, y0, x1, y0 + 1, IRON);
    for (let y = y0 + 3; y < y1; y += 4) rect(lit, x0, y, x1, y + 1, WOOD_DARK);
    // Cracks for each arrow it's taken.
    for (let i = 0; i < FOES.shieldHits - g.shieldHp; i++) px(lit, x0 + 1 + (i % 2), y0 + 3 + i * 3, '#2a1c10');
  }
  if (sh.torch && g.torch) {
    const [x0, y0, x1, y1] = off(sh.torch), mx = Math.round((x0 + x1) / 2 - 0.5);
    rect(lit, mx, y0 + 4, mx + 1, y1, WOOD);
    flame(glow, mx - 1, y0 + 3, now, 2);
  }
  for (const k of g.stuck) stuckArrow(lit, fx + k.dx, fy + k.dy, k.ang);
  if (g.burning >= 0) for (let i = 0; i < 3; i++) flame(glow, bx0 + 1 + i * 2, by0 + 2 - (i % 2) * 3, now + i * 0.3, 1);
  // The eye, glowing; fog swallows it the way it swallows the rest.
  const fog = fogAt(s.fogs, s.t, fx, groundY(fx, g.f) - (fy - 15));
  glow.globalAlpha = 1 - fog * 0.85;
  px(glow, hd.x + 1, hd.y - 1, EYE);
  if (g.kind === 'runner' || g.burning >= 0) px(glow, hd.x + 2, hd.y - 1, EYE);
  glow.globalAlpha = 1;
}

/** A small fire: three pixels high and flickering (the glow layer). */
export function flame(glow: G2, x: number, y: number, now: number, w: number): void {
  const f = Math.floor(now * 12 + x * 0.7) % 3;
  for (let i = 0; i < 3; i++) for (let j = 0; j <= w; j++) px(glow, x + j - (i === 0 && f === 1 ? 1 : 0), y - i, FLAME[Math.min(2, i + (f === 2 ? 1 : 0))]);
}

/** On its back where it fell, head to the field, the arrows still in it; it fades in its last second. */
function drawFallen(lit: G2, s: WatchState, g: Gob): void {
  const x = Math.round(g.x), y = Math.round(groundY(g.x, g.f) - g.lane), sh = SHAPES[g.kind], fade = Math.max(0, Math.min(1, 6 - (s.t - g.at)));
  lit.globalAlpha = fade;
  // Turned a quarter: (dx, dy) standing becomes (dy, -dx) lying, so a head at -16 lies 16 to the left.
  const turn = (dx: number, dy: number): [number, number] => [x + dy, y - 1 - dx * 0.3];
  rect(lit, x + sh.legs.y0, y - 3, x, y, LEG);
  rect(lit, x + sh.body.y0, y - 4, x + sh.body.y1, y, RAG);
  const [hx, hy] = turn(sh.head.x, sh.head.y);
  disc(lit, { x: hx, y: hy - 1.5, r: sh.head.r - 0.5 }, g.how === 'fire' ? '#2a2420' : SKIN_DARK);
  for (const k of g.stuck.filter((q: Stuck) => q.on === 'gob')) {
    const [sx, sy] = turn(k.dx, k.dy);
    stuckArrow(lit, sx, sy - 1, k.ang - Math.PI / 2, 4);
  }
  lit.globalAlpha = 1;
}

/** The field's x past which nothing is drawn standing (they're in the ditch, under the lip). */
export const LIP = WATCH.reachX;
