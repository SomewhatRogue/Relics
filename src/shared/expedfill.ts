/**
 * The rest of an expedition's map, node by node (shared/expedmap.ts): the ruined hamlet on its road
 * (cottages you can go into, a well, a wayside shrine), the wood's edge along the top, strip fields and
 * hedges below the river, willows and reeds on its banks. Each filler node also gets one of the job
 * rooms' set pieces (shared/vignettes.ts) so no two stretches look alike.
 */
import type { Block, Circle, Grim, Mark, Npc, Round } from './arena.js';
import { block, claim, free, hedge, NODE, patch, prop, round, scatter, spotIn, type Kit, type Line, type P } from './expedkit.js';
import { yOn } from './expedland.js';
import type { Piece } from './nodes.js';
import type { PropKind } from './props.js';
import type { Foe } from './terrain.js';
import { setPiece, type Lay } from './vignettes.js';

/** The hamlet: cottages either side of the road through node (c, r), the well and a wayside shrine. */
export function hamlet(k: Kit, c: number, r: number, road: Line): P {
  const x0 = c * NODE, rng = k.rng;
  let well: P = { x: x0 + 12, y: yOn(road, x0 + 12) };
  for (let x = x0 + 2.2; x < x0 + NODE - 4; x += rng.range(4.6, 5.6)) {
    const ry = yOn(road, x + 1.8), north = rng.next() < 0.7;
    const y = north ? ry - 2.2 - 2.4 : ry + 2.4;
    if (!free(k, x + 1.8, y + 1.2, 2.2, 0.9)) continue;
    block(k, 'house', x, y, 3.6, 2.4);
    patch(k, 'earth', x - 0.3, y + 2.2, 4.2, 1.6, false);
    if (rng.next() < 0.5) block(k, 'fence', x - 0.5, y + (north ? -0.8 : 3.4), 4.6, 0.3);
    if (rng.next() < 0.6) prop(k, rng.next() < 0.6 ? 'barrel' : 'crate', x + (rng.next() < 0.5 ? -0.8 : 4.4), y + 1.6);
  }
  const w = spotIn(k, x0 + 6, yOn(road, x0 + 12) - 7, x0 + 18, yOn(road, x0 + 12) + 7, 0.9, 1.5);
  if (w) round(k, 'well', w.x, w.y, 0.5), (well = w);
  const s = spotIn(k, x0 + 2, yOn(road, x0 + 6) - 4, x0 + 22, yOn(road, x0 + 6) + 4, 0.6, 1.3);
  if (s) round(k, 'shrine', s.x, s.y, 0.35);
  scatter(k, 4, ['tree', 'bush'], x0 + 1, r * NODE + 1, x0 + NODE - 1, r * NODE + NODE - 1, [0.35, 0.5]);
  return well;
}

/** The wood's edge: trees thick against the top of the map, thinning down into the fields. */
export function woodedge(k: Kit, c: number, n = 70, deep = 18): void {
  const x0 = c * NODE;
  for (let i = 0; i < n; i++) {
    const y = 1.6 + Math.pow(k.rng.next(), 1.8) * deep, x = x0 + k.rng.range(0.8, NODE - 0.8), r = k.rng.range(0.4, 0.6);
    if (free(k, x, y, r, 1.5)) round(k, k.rng.pick(['tree', 'pine', 'pine', 'tree', 'deadtree', 'bush']), x, y, r);
  }
  scatter(k, 3, ['stump', 'rock'], x0 + 1, 12, x0 + NODE - 1, 22, [0.3, 0.4]);
}

/** A copse: trees close together round a point, a bush or two at its edge. */
export function grove(k: Kit, at: P): void {
  for (let i = 0; i < 9; i++) {
    const a = k.rng.range(0, Math.PI * 2), d = k.rng.range(0, 2.6), x = at.x + Math.cos(a) * d, y = at.y + Math.sin(a) * d * 0.8, r = k.rng.range(0.4, 0.55);
    if (free(k, x, y, r, 1.4)) round(k, k.rng.pick(['tree', 'tree', 'pine', 'bush']), x, y, r);
  }
}

/** Strip fields with hedges between, hay and a scarecrow (below the river). */
export function fields(k: Kit, c: number, r: number): void {
  const x0 = c * NODE, y0 = r * NODE, rng = k.rng;
  for (let x = x0 + 1; x < x0 + NODE - 2; x += 1.9) if (free(k, x + 0.7, y0 + 4, 0.5, 1)) patch(k, rng.next() < 0.5 ? 'furrow' : 'crop', x, y0 + 1.5, 1.5, 5.5, false);
  const hx = x0 + rng.range(6, 18), gap = rng.range(0.3, 0.7);
  hedge(k, { x: hx, y: y0 + 1 }, { x: hx, y: y0 + NODE - 1 }, (t) => Math.abs(t - gap) < 0.08);
  scatter(k, 3, ['hay', 'hay', 'scarecrow'], x0 + 1, y0 + 1, x0 + NODE - 1, y0 + NODE - 1, [0.3, 0.55]);
  scatter(k, 3, ['tree', 'bush', 'rock'], x0 + 1, y0 + 1, x0 + NODE - 1, y0 + NODE - 1, [0.35, 0.5]);
}

/** The river's banks: willows, reeds and rocks. */
export function bank(k: Kit, c: number, riverAt: (x: number) => number): void {
  const x0 = c * NODE;
  for (let x = x0 + 0.6; x < x0 + NODE; x += 0.9) for (const side of [-1, 1]) {
    if (k.rng.next() < 0.45) continue;
    const y = riverAt(x) + side * (2.4 + k.rng.range(0, 0.8));
    if (free(k, x, y, 0.22, 1.4)) round(k, 'reed', x, y, 0.22);
  }
  scatter(k, 5, ['tree', 'tree', 'rock', 'bush'], x0 + 1, NODE - 4, x0 + NODE - 1, 2 * NODE + 4, [0.4, 0.55]);
}

/**
 * One of the job rooms' set pieces in node (c, r): laid in the node's own tiles by vignettes.ts, then
 * moved onto the map. `n`: how many goblins it gets. Returns their foe indexes.
 */
export function scene(k: Kit, c: number, r: number, piece: Piece, n: number): number[] {
  const X = c * NODE, Y = r * NODE, foes: Foe[] = [], dead: Npc[] = [], braziers: (Circle & { wild?: boolean })[] = [], props: { kind: PropKind; x: number; y: number }[] = [];
  const blocks: Block[] = [], rounds: Round[] = [], marks: Mark[] = [], grim: Grim[] = [], sleepers: P[] = [];
  const lay: Lay = {
    rng: k.rng, W: NODE, H: NODE, kind: 'field', n, foes, dead, braziers, props, blocks, rounds, marks, grim, sleepers,
    spot: (rr, y0 = 2.2, y1 = NODE - 3) => {
      const s = spotIn(k, X + 1.4, Y + y0, X + NODE - 1.4, Y + y1, rr, 1.4);
      return s && { x: s.x - X, y: s.y - Y };
    },
    free: (x, y, rr) => free(k, X + x, Y + y, rr, 1.2),
    claim: (x, y, rr) => claim(k, X + x, Y + y, rr),
  };
  setPiece(lay, piece);
  const mv = <T extends { x: number; y: number }>(l: T[]) => l.map((q) => ({ ...q, x: q.x + X, y: q.y + Y }));
  const at = k.foes.length;
  k.foes.push(...mv(foes)), k.dead.push(...mv(dead)), k.braziers.push(...mv(braziers)), k.props.push(...mv(props));
  k.blocks.push(...mv(blocks)), k.rounds.push(...mv(rounds)), k.marks.push(...mv(marks)), k.sleepers.push(...mv(sleepers));
  k.grim.push(...grim.map((g) => ({ ...g, x: g.x + X, y: g.y + Y, ...(g.x2 !== undefined ? { x2: g.x2 + X, y2: (g.y2 ?? 0) + Y } : {}) })));
  return foes.map((_, i) => at + i);
}
