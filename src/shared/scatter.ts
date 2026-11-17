/**
 * A lived-in world, slice 2 (docs/design/lived-in-world.md): a job's map crowded by its ground. Tufts, stones,
 * twigs, bones, dead leaves, moss, mushrooms and reeds scattered over the floor, by what the floor is; denser at
 * the room's edges, round its rocks, trees and walls and along water (a soft wet edge there); thin in the open
 * middle where the fights are. And a few bigger standing things (stumps, snags, reed beds) out at the edges.
 *
 * Seeded from the map alone, so every screen paints the same. The floor's things are painted into the floor both
 * views share (client/scatterpaint.ts); the standing things are paint only (client/scene.ts, three/view3d.ts),
 * never collided: the room never reads this file. Not the town (its own ground: shared/ground.ts) or indoors.
 */
import type { GameMap, Round } from './arena.js';
import { Rng } from './rng.js';
import { nearby } from './mapgrid.js';

export type ScatterKind = 'clump' | 'tuft' | 'stone' | 'twig' | 'bone' | 'leaf' | 'moss' | 'shroom' | 'reed' | 'wet' | 'flower' | 'gravel';
export interface Scatter { k: ScatterKind; x: number; y: number; s: number }

/** What each floor is strewn with, and how likely each is (relative). */
const STREWN: Partial<Record<GameMap['theme']['floor'], [ScatterKind, number][]>> = {
  grass: [['clump', 2.5], ['tuft', 6], ['stone', 2], ['twig', 2], ['leaf', 2], ['moss', 1.5], ['flower', 0.6], ['shroom', 0.4], ['bone', 0.08]],
  dirt: [['stone', 3], ['tuft', 3], ['clump', 0.8], ['twig', 2.5], ['leaf', 2], ['gravel', 2], ['bone', 0.2], ['moss', 0.6]],
  mud: [['clump', 2], ['tuft', 3], ['twig', 2], ['stone', 1.5], ['moss', 1.5], ['leaf', 1], ['bone', 0.2], ['shroom', 0.3]],
  wheat: [['stone', 2], ['twig', 1], ['tuft', 2], ['flower', 1]],
  rock: [['gravel', 4], ['stone', 3], ['bone', 0.4], ['moss', 0.6]],
  flagstone: [['gravel', 3], ['stone', 1], ['moss', 1], ['bone', 0.2], ['tuft', 0.6]],
};

/** Is this a job's ground to crowd (not the town, not a room indoors)? */
export const scattered = (m: GameMap) => !!STREWN[m.theme.floor] && m.name !== 'WICKHOLD' && m.theme.back !== 'plaster';

const inRect = (r: { x: number; y: number; w: number; h: number }, x: number, y: number, pad = 0) => x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;
const seedOf = (m: GameMap) => [...m.name].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) % 1000003, m.w * 977 + m.h * 131);

/** How crowded the ground is here, 0..1: the edges, round rocks and trees and walls, by water; the middle bare. */
function crowd(m: GameMap, x: number, y: number): number {
  const edge = Math.min(x, y, m.w - x, m.h - y), e = Math.max(0, 1 - edge / 3.5);
  // (A big map: only what's in this cell of its grid, shared/mapgrid.ts.)
  const g = nearby(m, x, y) ?? m;
  let near = 0;
  for (const r of g.rounds) {
    const d = Math.hypot(r.x - x, r.y - y) - r.r;
    if (d < 1.6) near = Math.max(near, 1 - d / 1.6);
  }
  for (const b of g.blocks) if (inRect(b, x, y, 1.2)) near = Math.max(near, 0.6);
  for (const w of g.water ?? []) if (inRect(w, x, y, 1.6)) near = Math.max(near, 0.9);
  const mid = Math.hypot((x - m.w / 2) / (m.w / 2), (y - m.h / 2) / (m.h / 2));
  // (Kyle, 2026-11-16, not too cluttered: the open middle all but bare, the crowding kept to edges and round things.)
  return Math.min(1, 0.06 + e * 0.7 + near * 0.55 + Math.max(0, mid - 0.55) * 0.35);
}

const cache = new WeakMap<GameMap, { floor: Scatter[]; stand: Round[] }>();

/** The map's scatter: what's painted in the floor, and the bigger things standing. Same map, same answer. */
export function scatterOf(m: GameMap): { floor: Scatter[]; stand: Round[] } {
  const hit = cache.get(m);
  if (hit) return hit;
  const out = { floor: [] as Scatter[], stand: [] as Round[] };
  cache.set(m, out);
  const kinds = STREWN[m.theme.floor];
  if (!kinds || !scattered(m)) return out;
  const rng = new Rng(seedOf(m)), total = kinds.reduce((s, [, w]) => s + w, 0);
  const pick = (): ScatterKind => {
    let u = rng.next() * total;
    for (const [k, w] of kinds) if ((u -= w) < 0) return k;
    return kinds[0][0];
  };
  const solid = (x: number, y: number) => m.blocks.some((b) => inRect(b, x, y)) || (m.water ?? []).some((w) => inRect(w, x, y));
  const wet = (x: number, y: number) => (m.water ?? []).some((w) => inRect(w, x, y, 0.9) && !inRect(w, x, y));
  // The floor: a few tries a tile, kept by how crowded it is there.
  for (let i = 0, n = Math.round(m.w * m.h * 3.4); i < n; i++) {
    const x = rng.next() * m.w, y = rng.next() * m.h, c = crowd(m, x, y);
    if (rng.next() > c || solid(x, y)) continue;
    if (wet(x, y)) {
      out.floor.push({ k: rng.next() < 0.55 ? 'wet' : 'reed', x, y, s: 0.6 + rng.next() * 0.8 });
      continue;
    }
    const k = pick();
    // Mushrooms keep to the roots of trees and stumps; elsewhere they're moss.
    const rooted = m.rounds.some((r) => (r.kind === 'tree' || r.kind === 'stump' || r.kind === 'pine' || r.kind === 'deadtree' || r.kind === 'apple' || r.kind === 'hangtree') && Math.hypot(r.x - x, r.y - y) < r.r + 1);
    out.floor.push({ k: k === 'shroom' && !rooted ? 'moss' : k, x, y, s: 0.6 + rng.next() * 0.8 });
  }
  // Standing things: out at the edges only, off the ways in and out, a few a room.
  const outdoors = m.theme.floor === 'grass' || m.theme.floor === 'dirt' || m.theme.floor === 'mud';
  const clear = (x: number, y: number) => !solid(x, y) && !m.rounds.some((r) => Math.hypot(r.x - x, r.y - y) < r.r + 0.8) && Math.hypot(m.hero.x - x, m.hero.y - y) > 3 && (!m.exit || Math.hypot(m.exit.x - x, m.exit.y - y) > 3);
  if (outdoors) for (let i = 0, n = Math.round((m.w + m.h) / 7); i < n; i++) {
    const side = rng.int(4), u = rng.next(), d = 0.5 + rng.next() * 0.9;
    const x = side === 0 ? d : side === 1 ? m.w - d : u * m.w, y = side === 2 ? d + 0.4 : side === 3 ? m.h - d : u * m.h;
    if (!clear(x, y)) continue;
    out.stand.push({ kind: rng.next() < 0.6 ? 'stump' : 'deadtree', x, y, r: 0.3 });
  }
  // Reed beds standing in the wet edge.
  for (const w of m.water ?? []) for (let i = 0, n = Math.round((w.w + w.h) / 2.5); i < n; i++) {
    const side = rng.int(4), u = rng.next(), x = side < 2 ? w.x + u * w.w : side === 2 ? w.x - 0.3 : w.x + w.w + 0.3, y = side >= 2 ? w.y + u * w.h : side === 0 ? w.y - 0.25 : w.y + w.h + 0.35;
    if (!m.blocks.some((b) => inRect(b, x, y))) out.stand.push({ kind: 'reed', x, y, r: 0.2 });
  }
  return out;
}
