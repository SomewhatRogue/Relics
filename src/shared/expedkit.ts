/**
 * What an expedition's map is laid with (shared/expedmap.ts): the lists it fills, and a quick check that
 * a spot is clear (of what's been put down, the roads, the river and the way in). Everything is in
 * whole-map tiles. Pure: the same seed lays the same things on every screen.
 */
import type { Block, BlockKind, Circle, Grim, Mark, Npc, Round, RoundKind, Soil, Water } from './arena.js';
import { WOOD, type PropKind } from './props.js';
import type { Rng } from './rng.js';
import type { Foe } from './terrain.js';

export type P = { x: number; y: number };
export type Line = P[];
/** The map is 4 by 3 nodes of 24 tiles (each 2 by 2 of the load test's 12-tile chunks). */
export const NODE = 24, COLS = 4, ROWS = 3, MW = NODE * COLS, MH = NODE * ROWS;

export interface Kit {
  rng: Rng;
  blocks: Block[]; rounds: Round[]; braziers: (Circle & { wild?: boolean })[]; soil: Soil[]; marks: Mark[];
  water: Water[]; props: { kind: PropKind; x: number; y: number }[]; chests: { x: number; y: number; chained?: boolean }[];
  foes: Foe[]; dead: Npc[]; grim: Grim[]; sleepers: P[];
  /** Roads (kept clear), and what's been claimed (cells of 4 tiles, so a check looks only near). */
  roads: Line[]; claims: Map<number, (P & { r: number })[]>;
}

export function newKit(rng: Rng): Kit {
  return { rng, blocks: [], rounds: [], braziers: [], soil: [], marks: [], water: [], props: [], chests: [], foes: [], dead: [], grim: [], sleepers: [], roads: [], claims: new Map() };
}

const cellOf = (x: number, y: number) => Math.floor(y / 4) * 64 + Math.floor(x / 4);

/** How far (x, y) is from a polyline. */
export function offLine(l: Line, x: number, y: number): number {
  let best = Infinity;
  for (let i = 1; i < l.length; i++) {
    const a = l[i - 1], b = l[i], dx = b.x - a.x, dy = b.y - a.y, q = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / q));
    best = Math.min(best, Math.hypot(a.x + dx * t - x, a.y + dy * t - y));
  }
  return best;
}

export function claim(k: Kit, x: number, y: number, r: number): void {
  for (let j = Math.floor((y - r) / 4); j <= Math.floor((y + r) / 4); j++) for (let i = Math.floor((x - r) / 4); i <= Math.floor((x + r) / 4); i++) {
    const c = j * 64 + i, l = k.claims.get(c) ?? [];
    l.push({ x, y, r });
    k.claims.set(c, l);
  }
}

/** Clear of everything laid so far, the roads (`road` tiles off), the water and the map's edge. */
export function free(k: Kit, x: number, y: number, r: number, road = 1.6): boolean {
  if (x < r + 1.2 || y < r + 1.4 || x > MW - r - 1.2 || y > MH - r - 1.2) return false;
  for (const c of k.claims.get(cellOf(x, y)) ?? []) if (Math.hypot(c.x - x, c.y - y) < c.r + r + 0.5) return false;
  // (A claim bigger than a cell is in every cell it touches, so looking in this one is enough.)
  if (k.roads.some((l) => offLine(l, x, y) < r + road)) return false;
  return k.water.every((w) => x < w.x - r - 1 || x > w.x + w.w + r + 1 || y < w.y - r - 1 || y > w.y + w.h + r + 1);
}

/** A free spot of radius `r` inside the box, or null (claimed when found, unless `keep` is false). */
export function spotIn(k: Kit, x0: number, y0: number, x1: number, y1: number, r: number, road = 1.6, keep = true): P | null {
  for (let t = 0; t < 60; t++) {
    const x = k.rng.range(x0 + r, x1 - r), y = k.rng.range(y0 + r, y1 - r);
    if (free(k, x, y, r, road)) return keep && claim(k, x, y, r), { x, y };
  }
  return null;
}

/** Wooden blocks get health and a door if they have one (as a job's do: shared/props.ts WOOD). */
export const block = (k: Kit, kind: BlockKind, x: number, y: number, w: number, h: number, more: Partial<Block> = {}) => {
  const wd = WOOD[kind];
  k.blocks.push({ kind, x, y, w, h, ...(wd ? { hp: wd.hp, maxHp: wd.hp, burning: -1, door: wd.door } : {}), ...more });
  claim(k, x + w / 2, y + h / 2, Math.hypot(w, h) / 2 + 0.3);
};
export const round = (k: Kit, kind: RoundKind, x: number, y: number, r: number) => (k.rounds.push({ kind, x, y, r }), claim(k, x, y, r));
export const prop = (k: Kit, kind: PropKind, x: number, y: number) => (k.props.push({ kind, x, y }), claim(k, x, y, 0.5));
export const patch = (k: Kit, mat: Soil['mat'], x: number, y: number, w: number, h: number, round = true) => k.soil.push({ mat, x, y, w, h, round });
export const mark = (k: Kit, kind: Mark['kind'], x: number, y: number, w: number, h: number) => k.marks.push({ kind, x, y, w, h });

/** A path of soil along a polyline (`half` its half-width). */
export function path(k: Kit, mat: Soil['mat'], l: Line, half: number): void {
  for (let i = 1; i < l.length; i++) k.soil.push({ mat, x: l[i - 1].x, y: l[i - 1].y, w: l[i].x - l[i - 1].x, h: l[i].y - l[i - 1].y, line: half });
}

/** Points every `step` along a polyline. */
export function along(l: Line, step: number): (P & { dx: number; dy: number })[] {
  const out: (P & { dx: number; dy: number })[] = [];
  let carry = 0;
  for (let i = 1; i < l.length; i++) {
    const a = l[i - 1], b = l[i], len = Math.hypot(b.x - a.x, b.y - a.y) || 1, dx = (b.x - a.x) / len, dy = (b.y - a.y) / len;
    for (let d = carry; d < len; d += step) out.push({ x: a.x + dx * d, y: a.y + dy * d, dx, dy });
    carry = (carry - len) % step;
    if (carry < 0) carry += step;
  }
  return out;
}

/** A hedge of bushes along a line, gaps where `gap(t)` says. */
export function hedge(k: Kit, a: P, b: P, gap: (t: number) => boolean = () => false): void {
  const len = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.round(len / 0.75));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
    if (!gap(t) && free(k, x, y, 0.36, 1.2)) round(k, 'bush', x, y, 0.36);
  }
}

/** `n` round things of `kinds` scattered in a box. */
export function scatter(k: Kit, n: number, kinds: RoundKind[], x0: number, y0: number, x1: number, y1: number, r: [number, number]): void {
  for (let i = 0; i < n; i++) {
    const rr = k.rng.range(r[0], r[1]), s = spotIn(k, x0, y0, x1, y1, rr, 1.4);
    if (s) k.rounds.push({ kind: k.rng.pick(kinds), x: s.x, y: s.y, r: rr });
  }
}
