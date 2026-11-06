/**
 * Fenmere as a curated zone (docs/plans/atlas.md sections 2 and 7, the Fen; docs/terrain-nodes.md 2.5;
 * Kyle, 2026-11-05: "more raid biomes, fewer but bigger and lovingly curated", "better and more dynamic
 * enemies that bleed in slowly", "scripted scenes"). On the expedition kit as one map of 76 by 60, by hand:
 *
 *   in from the fields, through the wood's edge at the stile and the coppice, the carr where the wood goes
 *   to bog, the causeway east over deep bog (a dog-leg north to the ford), the ford where the river spreads
 *   into the fen (the island and its cages up the river), the reed beds with goblins lying in them and boards
 *   over their channels, the fire on the rise (the mid-point), a causeway on to the Peat Cuts (the larder, then
 *   the named butcher among the cuts), and out by the causeway to the north. A chained chest out on the bog
 *   down a long boardwalk is the side job.
 *
 * The ground and every scene's place never change (shared/fenland.ts). The seed places the trees and the
 * reeds, which goblins are where, the mist's banks and the sky. Built from the job's seed alone on every
 * screen (the map is never sent).
 */
import type { Block, GameMap } from './arena.js';
import { claim, free, newKit, offLine, path, round, patch, unclaimed, type Kit, type Line, type P } from './expedkit.js';
import type { ExpedPlan } from './expedmap.js';
import type { Land } from './expedland.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import { FEN } from './fentune.js';
import { THEMES, type Foe } from './terrain.js';
import { lightFor, timeOf } from './timeofday.js';
import { themeUnder, expedSky } from './expedsky.js';
import { fenGround, groundAt, LAND, REEDS } from './fenland.js';
import { layScenes, layKnots } from './fenscenes.js';
import { layBanks, type Bank } from './fenmist.js';

/** Each scene's place (fixed), in the order you come to them; the island and the chest are off the way. */
export const SPINE = {
  in: { x: 34, y: 57 }, edge: { x: 24.6, y: 54.6 }, coppice: { x: 15, y: 51.4 }, carr: { x: 14, y: 44.4 }, causeway: { x: 36, y: 42.9 },
  ford: { x: 47.2, y: 35 }, island: { x: 20.6, y: 34.6 }, reeds: { x: 39, y: 27 }, check: { x: 34, y: 18 }, cuts: { x: 55.5, y: 17.6 },
  butcher: { x: 61, y: 2.3 }, chest: { x: 59.2, y: 42.9 }, out: { x: 73.5, y: 1 },
};
export const ON_THE_WAY = ['edge', 'coppice', 'carr', 'causeway', 'ford', 'reeds', 'cuts', 'butcher'] as const;
export type FenBeat = (typeof ON_THE_WAY)[number] | 'island' | 'chest';

/** The trails through it, to keep the trees off and lay the knots along (the main way; to the island; to the chest; over the reeds' boards). */
export const MAIN: Line = [
  SPINE.in, { x: 29, y: 55.5 }, SPINE.edge, { x: 19, y: 53 }, SPINE.coppice, { x: 13, y: 48.4 }, SPINE.carr, { x: 21, y: 43 }, { x: 26, y: 42.9 }, SPINE.causeway,
  { x: 46.1, y: 42.9 }, { x: 46.1, y: 38 }, SPINE.ford, { x: 46, y: 31 }, { x: 44.4, y: 27.4 }, { x: 43.8, y: 23.4 }, { x: 39, y: 22.6 }, SPINE.check,
  { x: 40, y: 17.4 }, { x: 48, y: 17.4 }, SPINE.cuts, { x: 55, y: 10 }, { x: 55, y: 2.2 }, SPINE.butcher, { x: 73.5, y: 2.2 }, SPINE.out,
];
export const SIDES: Line[] = [
  [{ x: 17, y: 43.4 }, { x: 21.2, y: 38.6 }, { x: 21.2, y: 36.6 }, SPINE.island],
  [{ x: 46.1, y: 43.1 }, SPINE.chest],
  [{ x: 46, y: 31 }, { x: 42, y: 31 }, { x: 36, y: 31 }, { x: 35, y: 27.2 }, { x: 33.7, y: 25.8 }, { x: 33.7, y: 24.8 }, { x: 33.7, y: 21 }],
  [{ x: 37.7, y: 42 }, { x: 37.7, y: 39.5 }],
];

/** What a friend's screen draws from the map alone (and what the room reads: the fire, the beats, the mist). */
export interface FenMap {
  check: P; out: P;
  beats: { kind: FenBeat; x: number; y: number; r: number }[];
  /** The mist's banks (shared/fenmist.ts): where each drifts at any moment is worked out from the room's clock. */
  mist: Bank[];
}

/** Reeds standing in the reed beds' shallows, clumps you walk through (soft), lanes left along the ways. */
function reeds(k: Kit, lines: Line[]): void {
  for (const [x0, y0, x1, y1] of REEDS) for (let y = y0 + 0.7; y < y1 - 0.6; y += 1.4) for (let x = x0 + 0.6; x < x1 - 0.8; x += 1.6) {
    const cx = x + k.rng.range(-0.5, 0.5), cy = y + k.rng.range(-0.4, 0.4), w = k.rng.range(1.2, 2), h = k.rng.range(0.8, 1.3);
    if (k.rng.next() < 0.15 || lines.some((l) => near(l, cx, cy) < 1.3)) continue;
    if ([[0, 0], [w, 0], [0, h], [w, h]].some(([dx, dy]) => groundAt(cx - w / 2 + dx, cy - h / 2 + dy) !== 1)) continue;
    k.blocks.push({ kind: 'reeds', soft: true, x: cx - w / 2, y: cy - h / 2, w, h, look: k.rng.int(1000) } as Block);
  }
}
/** Room for a tree or a stool at (x, y): nothing laid there, off the trails, its foot on dry ground (willows stand at the water's edge). */
function stand(k: Kit, x: number, y: number, r: number, road: number): boolean {
  if (x < r + 1.4 || y < r + 1.4 || x > FEN.w - r - 1.4 || y > FEN.h - r - 1.4 || !unclaimed(k, x, y, r) || k.roads.some((l) => offLine(l, x, y) < r + road)) return false;
  const e = r + 0.1;
  return [[0, 0], [e, 0], [-e, 0], [0, e], [0, -e]].every(([dx, dy]) => groundAt(x + dx, y + dy) === 0);
}
function near(l: Line, x: number, y: number): number {
  let best = Infinity;
  for (let i = 1; i < l.length; i++) {
    const a = l[i - 1], b = l[i], dx = b.x - a.x, dy = b.y - a.y, q = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / q));
    best = Math.min(best, Math.hypot(a.x + dx * t - x, a.y + dy * t - y));
  }
  return best;
}

export function fenPlan(job: Job): ExpedPlan {
  const rng = new Rng(job.seed * 7919 + 97), k = newKit(rng), S = SPINE, ground = fenGround();
  Object.assign(k, { mw: FEN.w, mh: FEN.h });
  k.water = ground.water;
  // The ground: the fields' furrows, mud on the Peat Cuts and the rises, the trails trodden, the edges wet.
  patch(k, 'furrow', 26, 49, 17, 10, false), patch(k, 'grass', 0, 46.5, 26, 14, false), patch(k, 'mud', 48, 0, 28, 21, false), patch(k, 'mud', 30.4, 15.4, 7.2, 5.2);
  patch(k, 'grass', 56, 40.6, 6.4, 4.6), patch(k, 'grass', 17, 33, 7.2, 3, false);
  k.marks.push(...ground.wet);
  for (const l of [MAIN, ...SIDES]) path(k, 'earth', l, 0.7);
  k.roads.push(MAIN, ...SIDES);
  for (const [name, at] of Object.entries(S)) claim(k, at.x, at.y, name === 'in' ? 4 : 2.6);
  const laid = layScenes(k, S, job);
  // The wood's edge: a hedge down the fields' west side, its stile where the track goes through.
  for (let y = 47.4; y < 59.4; y += 0.75) if (Math.abs(y - S.edge.y) > 1.2 && free(k, 24.2, y, 0.36, 0.6)) round(k, 'bush', 24.2, y, 0.36);
  for (let x = 25.5; x < 43; x += 0.75) if (free(k, x, 48.6, 0.36, 1.2)) round(k, 'bush', x, 48.6, 0.36);
  // The carr's willows and the wood's thick west edge, off the trails; then the coppice's rows of cut stools
  // between, a standard tree left here and there.
  for (let t = 0; t < FEN.trees; t++) {
    const carr = t % 3 !== 0, x = carr ? rng.range(0.8, 27) : rng.range(0.8, 7), y = carr ? rng.range(37.8, 47) : rng.range(47, FEN.h - 0.6), r = rng.range(0.42, 0.72);
    if (stand(k, x, y, r, FEN.trail)) round(k, carr ? rng.pick(['tree', 'tree', 'deadtree', 'bush']) : rng.pick(['tree', 'pine', 'tree', 'bush']), x, y, r);
  }
  for (let y = 48.4; y < 58.6; y += 1.8) for (let x = 7.6; x < 22.6; x += 1.8) {
    if (rng.next() < 0.3 || !stand(k, x, y, 0.3, 1.4)) continue;
    const q = rng.next();
    round(k, q < 0.12 ? 'tree' : q < 0.8 ? 'stump' : 'bush', x + rng.range(-0.2, 0.2), y + rng.range(-0.2, 0.2), q < 0.12 ? 0.5 : 0.3);
  }
  // Willows and reeds on the islands and rises; reeds in the deep water at the causeway's edges.
  for (const [x, y] of [[57, 44.6], [61.6, 41.2], [36.6, 15.9], [74.5, 19.6], [48.8, 20.2]]) round(k, 'tree', x, y, 0.45);
  for (let x = 26.6; x < 44; x += rng.range(0.9, 1.6)) for (const y of [40.6, 45.2]) if (groundAt(x, y) === 2 && rng.next() < 0.6) round(k, 'reed', x, y + rng.range(-0.15, 0.15), 0.3);
  reeds(k, [MAIN, ...SIDES]);
  k.blocks.push(...ground.boards);
  layKnots(k, MAIN, S);
  const foes: Foe[] = k.foes;
  const r = (kind: FenBeat) => (kind === 'butcher' || kind === 'causeway' ? 7 : kind === 'reeds' ? 6 : 5);
  const beats = ([...ON_THE_WAY, 'island', 'chest'] as FenBeat[]).map((kind) => ({ kind, x: S[kind].x, y: S[kind].y, r: r(kind) }));
  const fen: FenMap = { check: S.check, out: S.out, beats, mist: layBanks(job.seed) };
  const theme = themeUnder({ ...lightFor(THEMES.marsh, 'marsh', timeOf(job)), floor: 'grass' as const, back: 'trees' as const }, { from: expedSky(job).from }, 0);
  const map: GameMap = {
    name: 'FENMERE', w: FEN.w, h: FEN.h, wallFace: 3, rounds: k.rounds, blocks: k.blocks, braziers: k.braziers, torches: [],
    hero: { ...S.in }, exit: { x: S.out.x - 1.5, y: 0, w: 3, h: 0.9 }, theme, water: k.water, soil: k.soil, marks: k.marks,
    npcs: k.dead.length ? k.dead : undefined, grim: k.grim.length ? k.grim : undefined, sleepers: k.sleepers.length ? k.sleepers : undefined,
    flocks: [{ x: S.chest.x + 1.1, y: S.chest.y + 0.8 }], fen,
  };
  // Open dry ground for whatever comes later (the waves): every fourth tile that's ground and clear.
  const open: P[] = [];
  for (let y = 2; y < FEN.h - 1; y += 3) for (let x = 2; x < FEN.w - 1; x += 3) if (groundAt(x, y) === 0 && free(k, x, y, 0.6, 0) && !inLand(x, y)) open.push({ x, y });
  const land = { ins: { x: S.in.x, y: S.in.y, c: 0, r: 1, how: 'road' }, ext: { x: S.out.x, c: 3 } } as unknown as Land;
  return {
    map, foes, props: k.props, chests: k.chests, nodes: [], land, camps: [], patrols: [], open, zone: { ...S.out, y: 3 },
    goals: [{ kind: 'prisoners', x: S.island.x, y: S.island.y, cages: laid.cages }, { kind: 'larder', x: laid.pot.x, y: laid.pot.y + 0.9 }, { kind: 'butcher', x: S.butcher.x, y: S.butcher.y, foe: laid.butcher }],
    sides: [{ kind: 'cache', x: S.chest.x, y: S.chest.y, chest: laid.chest }],
  };
}

/** The islands nobody can walk to but by their boards don't take waves (a wave there would wait on the bog). */
const inLand = (x: number, y: number) => [LAND.islet, LAND.chest].some((r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]);
