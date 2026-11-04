/**
 * The tools for laying out a job's room as a place with a plan (shared/sites.ts): houses that face a
 * lane, fence and hedge and wall runs with gaps in them, the ground's shapes (soil) and marks. Whatever
 * a plan puts down is dropped again where it would land on what must stay clear: the way in and out,
 * the middle line from one to the other, the forks' roads, raised ground, water, and the spots the
 * room has already given to the job's objective.
 */
import type { Area, Block, BlockKind, Mark, Round, RoundKind, Soil, Theme } from './arena.js';
import { WOOD, type PropKind } from './props.js';
import { boxOff, type Pt } from './spine.js';

export type Spot = { x: number; y: number; r: number };
export interface Site {
  floor: Theme['floor'];
  /** The back wall, where the place wants its own (a town's stone, a wood's trees). */
  back?: Theme['back'];
  /** Built round the way out (a gatehouse): kept clear of the job's spots, not of the way itself. */
  gates: Block[];
  blocks: Block[];
  rounds: Round[];
  props: { kind: PropKind; x: number; y: number }[];
  soil: Soil[];
  marks: Mark[];
}

export const newSite = (floor: Theme['floor'], back?: Theme['back']): Site => ({ floor, back, gates: [], blocks: [], rounds: [], props: [], soil: [], marks: [] });

/** Wooden blocks get health (and a door if they have one); stone stays as it is. */
export function wooden(b: Block): Block {
  const w = WOOD[b.kind];
  return w ? { ...b, hp: w.hp, maxHp: w.hp, burning: -1, door: w.door } : b;
}

export const block = (s: Site, kind: BlockKind, x: number, y: number, w: number, h: number, more: Partial<Block> = {}) => s.blocks.push(wooden({ kind, x, y, w, h, ...more }));
export const round = (s: Site, kind: RoundKind, x: number, y: number, r: number) => s.rounds.push({ kind, x, y, r });
export const prop = (s: Site, kind: PropKind, x: number, y: number) => s.props.push({ kind, x, y });
/** A soil shape: an ellipse (or a box), or a line `half` either side from (x1, y1) to (x2, y2). */
export const patch = (s: Site, mat: Soil['mat'], x: number, y: number, w: number, h: number, round = true) => s.soil.push({ mat, x, y, w, h, round });
export const line = (s: Site, mat: Soil['mat'], x1: number, y1: number, x2: number, y2: number, half: number) => s.soil.push({ mat, x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: half });
/** A path through points, as soil lines. */
export const path = (s: Site, mat: Soil['mat'], pts: [number, number][], half: number) => pts.slice(1).forEach(([x, y], i) => line(s, mat, pts[i][0], pts[i][1], x, y, half));
export const mark = (s: Site, kind: Mark['kind'], x: number, y: number, w: number, h: number) => s.marks.push({ kind, x, y, w, h });

/** A fence from (x, y) along x for `len` tiles, in panels, leaving a gap at each `gaps` (tiles from the start). */
export function fence(s: Site, x: number, y: number, len: number, gaps: number[] = [], kind: BlockKind = 'fence', thick = 0.35): void {
  let a = 0;
  for (const g of [...gaps.sort((p, q) => p - q), len]) {
    if (g - a > 0.4) block(s, kind, x + a, y, Math.min(g, len) - a, thick);
    a = g + 1.6;
  }
}
/** The same, down along y. */
export function fenceDown(s: Site, x: number, y: number, len: number, gaps: number[] = [], kind: BlockKind = 'fence', thick = 0.35): void {
  let a = 0;
  for (const g of [...gaps.sort((p, q) => p - q), len]) {
    if (g - a > 0.4) block(s, kind, x, y + a, thick, Math.min(g, len) - a);
    a = g + 1.6;
  }
}
/** A hedge: bushes shoulder to shoulder from (x1, y1) to (x2, y2), with a gap wherever `gap` says. */
export function hedge(s: Site, x1: number, y1: number, x2: number, y2: number, gap: (t: number) => boolean = () => false, kind: RoundKind = 'bush', r = 0.36): void {
  const len = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.round(len / (r * 1.7)));
  for (let i = 0; i <= n; i++) if (!gap(i / n)) round(s, kind, x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n, r);
}

/**
 * What must stay clear in every room: the way in, the way out, the forks' roads, the line between (the
 * middle column on an old job, the spine on a routed one).
 */
export interface Keep { w: number; h: number; areas: Area[]; spots: Spot[]; spine?: Pt[][] }

const boxDist = (a: Area, x: number, y: number) => Math.hypot(x - Math.max(a.x, Math.min(a.x + a.w, x)), y - Math.max(a.y, Math.min(a.y + a.h, y)));
const boxGap = (a: Area, b: Area) => Math.max(0, Math.max(a.x - b.x - b.w, b.x - a.x - a.w), Math.max(a.y - b.y - b.h, b.y - a.y - a.h));

/** Does a thing of this box (solid or not) sit where it mustn't? */
function blocked(k: Keep, a: Area, solid: boolean, middle = true): boolean {
  if (a.x < 0.3 || a.y < 0 || a.x + a.w > k.w - 0.3 || a.y + a.h > k.h - 0.3) return true;
  if (solid && middle && !k.spine && a.x < k.w / 2 + 1.4 && a.x + a.w > k.w / 2 - 1.4 && a.y < k.h - 0.5) return true;
  if (solid && middle && k.spine && boxOff(k.spine, a) < 1.4) return true;
  if (k.areas.some((q) => boxGap(q, a) < (solid ? 0.6 : 0))) return true;
  return k.spots.some((p) => boxDist(a, p.x, p.y) < p.r + (solid ? 0.6 : 0.2));
}

/** Could a solid round thing of radius `r` stand at (x, y)? */
export const fits = (k: Keep, x: number, y: number, r: number) => !blocked(k, { x: x - r, y: y - r, w: r * 2, h: r * 2 }, true);

/** Drop whatever lands where it mustn't (a gatehouse by `gate`'s rules). Ground shapes and marks are paint: they stay. */
export function clearFor(s: Site, k: Keep, gate: Keep): Site {
  const asBox = (x: number, y: number, r: number): Area => ({ x: x - r, y: y - r, w: r * 2, h: r * 2 });
  return {
    ...s,
    gates: [],
    blocks: [...s.blocks.filter((b) => !blocked(k, b, true)), ...s.gates.filter((b) => !blocked(gate, b, true, false))],
    rounds: s.rounds.filter((r) => !blocked(k, asBox(r.x, r.y, r.r), r.r > 0.2)),
    props: s.props.filter((p) => !blocked(k, asBox(p.x, p.y, 0.45), true)),
  };
}

/** Is a circle clear of everything the site put down (with room to walk round it)? */
export function siteClear(s: Site, x: number, y: number, r: number): boolean {
  return s.blocks.every((b) => boxDist(b, x, y) > r + 0.8) && s.rounds.every((q) => Math.hypot(q.x - x, q.y - y) > q.r + r + 0.8) &&
    s.props.every((p) => Math.hypot(p.x - x, p.y - y) > r + 0.9);
}
