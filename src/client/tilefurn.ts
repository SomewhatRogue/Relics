/**
 * The tile redraw's furniture (docs/design/tile-redraw.md, R3): benches, tables, counters, pews, beds, altars, anvils,
 * casks, tubs, sacks and carts drawn in the kit's pixels (tilekit.ts) and stood up as cards (three/propcards.ts). A card
 * fills its footprint: the width is the footprint's width x 20, the top is seen from above as footprint depth x 12 rows,
 * and the front face below it stands `LOOK[kind].tall` rows. Anchored at the front edge's middle, at the foot.
 * (The flat view paints most of these as plain slabs, which stood up read as crates.) Cosmetic only.
 */
import type { Block } from '../shared/arena';
import { LOOK } from './blocklook';
import { KX, KZ, type Rect } from './tilekit';
import { caskTall, casks, cart, sacks, tub } from './tilefurn2';
import { CLOTH, IRON, paint, planks, ROCK, slab, TIM, toCut } from './tilefurnkit';
import type { Cut } from './three/propcards';

type Draw = (r: Rect, W: number, D: number, T: number) => void;

/** Legs under a top: each x (a 3 or 4 wide post) from `y` down to the foot, with a lit left side. */
function legs(r: Rect, xs: number[], y: number, H: number, w = 3): void {
  for (const x of xs) slab(r, x, y, w, H - y, TIM);
}

/** A plank seat or top on an apron and legs, the floor showing between. */
function bench(r: Rect, W: number, D: number, T: number, fat = 0): void {
  const H = D + T, w = 3 + fat, ap = 3 + fat;
  // A bench's seat is a narrow plank at the front of its footprint, the floor showing behind it (a broad top read as
  // a table); a table's top fills its footprint.
  if (fat) planks(r, 0, 0, W, D);
  else planks(r, 0, Math.max(0, D - 4), W, Math.min(D, 4));
  slab(r, fat ? 1 : 0, D, W - (fat ? 2 : 0), ap, TIM);
  const xs = [fat ? 2 : 1, W - w - (fat ? 2 : 1)];
  if (W >= 56) xs.splice(1, 0, Math.round(W / 2 - w / 2));
  legs(r, xs, D + ap, H, w);
  if (W >= 40) r(xs[0] + w, D + ap + 1, xs[xs.length - 1] - xs[0] - w, 1, TIM[1]);
}

/** A table: a deeper apron and four posts, with what lies on it. */
function table(kind: string): Draw {
  return (r, W, D, T) => {
    bench(r, W, D, T, 1);
    if (kind === 'maptable') (r(3, 2, W - 6, D - 4, CLOTH[3]), r(3, 2, W - 6, 1, CLOTH[4]), r(3, D - 3, W - 6, 1, CLOTH[2]), r(6, 4, Math.max(2, W / 3), 1, TIM[2]), r(W - 9, 4, 3, 2, TIM[2]));
    if (kind === 'dicetable') (r(3, 2, W - 6, D - 4, '#2c3a2c'), r(3, 2, W - 6, 1, '#3a4a38'), r(W / 2 - 3, 3, 2, 2, '#c8c0a8'), r(W / 2 + 1, D - 5, 2, 2, '#c8c0a8'));
    if (kind === 'armtable') (r(4, 3, W - 8, 2, IRON[3]), r(4, 4, W - 8, 1, IRON[1]), r(4, 3, 4, 3, IRON[4]));
    if (kind === 'skinbench') (r(W / 2, 1, W / 2 - 2, D - 1, CLOTH[2]), r(W / 2, 1, W / 2 - 2, 1, CLOTH[3]), r(W - 6, D - 3, 3, 3, CLOTH[1]));
  };
}

/** A desk: two solid pedestals under the top with a gap between. */
const desk: Draw = (r, W, D, T) => {
  const H = D + T, pw = Math.max(5, Math.round(W * 0.3));
  planks(r, 0, 0, W, D);
  slab(r, 0, D, W, 3, TIM);
  for (const x of [1, W - pw - 1]) (slab(r, x, D + 3, pw, H - D - 3, TIM), r(x + 2, D + 6, pw - 4, 1, TIM[1]), r(x + Math.floor(pw / 2) - 1, D + 8, 2, 1, IRON[4]));
};

/** Solid timber: a lit top edge, boards upright on the face; a pew (feet and a seat) or a counter (a plinth). */
const solid = (feet: boolean): Draw => (r, W, D, T) => {
  const H = D + T, base = feet ? 3 : 2;
  planks(r, 0, 0, W, D);
  r(0, D - 1, W, 1, TIM[4]);
  r(0, D, W, T - base, TIM[2]);
  for (let x = 0; x < W; x += 9) r(x, D + 1, 1, T - base - 1, x ? TIM[1] : TIM[3]);
  r(0, D, W, 1, TIM[3]), r(W - 1, D, 1, T - base, TIM[1]);
  r(0, H - base - 1, W, 1, TIM[1]);
  if (feet) for (const x of [0, W - 4, ...(W > 50 ? [Math.round(W / 2) - 2] : [])]) slab(r, x, H - base, 4, base, TIM);
  else r(0, H - base, W, base, TIM[1]), r(0, H - base, W, 1, TIM[3]);
};

const bed: Draw = (r, W, D, T) => {
  const H = D + T;
  slab(r, 0, 0, W, D, TIM, 2);
  r(2, 2, W - 4, D - 3, CLOTH[2]), r(2, 2, W - 4, 1, CLOTH[3]), r(W - 3, 2, 1, D - 3, CLOTH[1]);
  r(2, 2, Math.min(7, W / 3), D - 3, CLOTH[4]), r(2, 2, Math.min(7, W / 3), 1, '#b8a468');
  r(W / 2, 4, 1, D - 6, CLOTH[1]);
  slab(r, 0, D, W, 4, TIM);
  legs(r, [1, W - 4], D + 4, H);
};

const altar: Draw = (r, W, D, T) => {
  slab(r, 0, 0, W, D, ROCK, 3);
  r(0, 0, W, 1, ROCK[4]);
  slab(r, 0, D, W, T, ROCK, 2);
  for (let y = D + 4; y < D + T - 2; y += 5) r(1, y, W - 2, 1, ROCK[1]);
  const cw = Math.round(W / 3), cx = Math.round((W - cw) / 2);
  r(cx, D, cw, T - 5, '#8a806a'), r(cx, D, 1, T - 5, '#a09878'), r(cx + cw - 1, D, 1, T - 5, '#6a6250'), r(cx, D + T - 5, cw, 1, '#4a4234');
  r(cx, 0, cw, D, '#8a806a'), r(cx, 0, cw, 1, '#a09878');
  r(0, D + T - 3, W, 3, ROCK[1]), r(0, D + T - 3, W, 1, ROCK[3]);
};

/** Dark iron on a block: the top plate with its horn, a narrow waist, a broad foot. */
const anvil: Draw = (r, W, D, T) => {
  const H = D + T, bw = Math.max(8, Math.round(W * 0.6)), bx = Math.round((W - bw) / 2), wy = D + 3;
  slab(r, bx + 1, H - 8, bw - 2, 8, TIM);
  slab(r, 0, 0, W, D, IRON, 3);
  r(0, 0, W, 1, IRON[4]);
  slab(r, 0, D, W, 3, IRON, 2);
  r(0, D + 2, 3, 1, IRON[1]);
  const ww = Math.round(W * 0.5), wx = Math.round((W - ww) / 2);
  slab(r, wx, wy, ww, H - 8 - wy - 2, IRON, 2);
  slab(r, wx - 2, H - 10, ww + 4, 3, IRON, 2);
};

const DRAW: Record<string, Draw> = {
  bench: (r, W, D, T) => bench(r, W, D, T), table: table('table'), maptable: table('maptable'), dicetable: table('dicetable'),
  armtable: table('armtable'), skinbench: table('skinbench'), desk, counter: solid(false), pew: solid(true), bed, altar, anvil,
  sacks, cart, casks, tub,
};

/** The kinds drawn here. */
export const FURN = new Set(Object.keys(DRAW));

/** A block's card, or null for a kind not drawn here. */
export function furnCut(b: Block): Cut | null {
  const draw = DRAW[b.kind];
  if (!draw) return null;
  const W = Math.max(8, Math.round(b.w * KX)), D = Math.max(4, Math.round(b.h * KZ));
  const T = b.kind === 'casks' ? caskTall(W, D, LOOK[b.kind].tall) : LOOK[b.kind].tall;
  return toCut(paint(W, D + T, (r) => draw(r, W, D, T)));
}
