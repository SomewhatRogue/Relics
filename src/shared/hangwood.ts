/**
 * Hangman's Wood as a curated zone (docs/plans/atlas.md sections 2 and 5; Kyle, 2026-11-05: "each place has
 * a story, and it should have smaller paths and scenes as you approach all the bigger areas"). Built on
 * the expedition kit (shared/expedkit.ts) as one map of 72 by 48, by hand round a fixed spine:
 *
 *   the way in, then the approach on narrow trails (the snare line, the body by the waymark), the gibbet
 *   crossroads (a landmark: wind the cage down), a goblin pair dragging a sack, the Gospel Oak up its own
 *   side path (a pocket you can skip), the mid-point's fire (the checkpoint), Hew's blaze marks, and
 *   Hempen's ground (the climax), then out by the north path.
 *
 * The spine (every scene's place, the trails' line through them, the set pieces) never changes. The seed
 * only bends the trails between the scenes a little and shuffles the trees, which goblins are where, the
 * chests, the captive and the sky. Built from the job's seed alone on every screen (the map is never sent).
 */
import type { GameMap } from './arena.js';
import { claim, free, newKit, offLine, path, round, type Kit, type Line, type P } from './expedkit.js';
import type { ExpedPlan } from './expedmap.js';
import type { Land } from './expedland.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import { HANGWOOD } from './tuning.js';
import { THEMES, type Foe } from './terrain.js';
import { lightFor, timeOf } from './timeofday.js';
import { themeUnder, expedSky } from './expedsky.js';
import { layScenes, layKnots } from './hangscenes.js';

/** The spine: each scene's place on the map (fixed), in the order you come to them. */
export const SPINE = {
  in: { x: 5, y: 44 }, snares: { x: 13, y: 39 }, crows: { x: 21, y: 33 }, gibbet: { x: 31, y: 26 }, sack: { x: 40, y: 31 },
  fork: { x: 45, y: 28 }, oak: { x: 43, y: 12 }, check: { x: 50, y: 23 }, blaze: { x: 56, y: 16 }, hempen: { x: 62, y: 9 }, out: { x: 66, y: 1 },
};
/** The scenes on the way, in order (the oak is up its own path, off it). */
export const ON_THE_WAY = ['snares', 'crows', 'gibbet', 'sack', 'blaze', 'hempen'] as const;
export type Beat = (typeof ON_THE_WAY)[number] | 'oak';
/** How far round each scene the trees stand back (its clearing). */
const CLEAR: Record<string, number> = { in: 4.5, snares: 3.2, crows: 3.4, gibbet: 7, sack: 3, fork: 2, oak: 5.5, check: 3.6, blaze: 2.4, hempen: 7.5, out: 3 };

/** What a friend's screen draws from the map alone (client/wooddraw.ts): all fixed but the blazed trees. */
export interface HangMap {
  winch: P; cage: P; check: P; oak: number; out: P;
  /** The beats: where each scene is said, and how near you come before it's said. */
  beats: { kind: Beat; x: number; y: number; r: number }[];
  /** Hew's axe marks: the trees cut (their foot and size). */
  blazes: (P & { r: number })[];
  /** Snares laid before you came (the snare line). */
  snares: P[];
}

/** A trail through `pts`, bent a little between each pair by the seed. */
function trail(k: Kit, pts: P[], bend: number): Line {
  const out: Line = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, o = k.rng.range(-bend, bend);
    out.push({ x: (a.x + b.x) / 2 - (dy / l) * o, y: (a.y + b.y) / 2 + (dx / l) * o }, b);
  }
  k.roads.push(out);
  path(k, 'earth', out, 0.75);
  return out;
}

export function woodPlan(job: Job): ExpedPlan {
  const rng = new Rng(job.seed * 7919 + 71), k = newKit(rng), S = SPINE;
  Object.assign(k, { mw: HANGWOOD.w, mh: HANGWOOD.h });
  const main = trail(k, [S.in, S.snares, S.crows, S.gibbet, S.sack, S.fork, S.check, S.blaze, S.hempen, S.out], 1.6);
  // The crossroads: the old roads west and south out of the gibbet, going nowhere now; the oak's own path.
  trail(k, [S.gibbet, { x: 23, y: 20 }], 0.8), trail(k, [S.gibbet, { x: 33, y: 38 }], 0.8);
  const side = trail(k, [S.fork, { x: 45.5, y: 20 }, S.oak], 1.2);
  for (const [name, at] of Object.entries(S)) claim(k, at.x, at.y, CLEAR[name] ?? 3);
  const laid = layScenes(k, S, job);
  // The wood: thick everywhere off the trails and out of the clearings, trunks close enough to wall them in.
  for (let t = 0; t < HANGWOOD.trees; t++) {
    const x = rng.range(1, HANGWOOD.w - 1), y = rng.range(1, HANGWOOD.h - 1), r = rng.range(0.42, 0.78);
    if (free(k, x, y, r, HANGWOOD.trail)) round(k, rng.pick(['tree', 'tree', 'pine', 'pine', 'deadtree', 'bush', 'tree']), x, y, r);
  }
  // Hew's blaze marks: the trunks nearest the path between the fire and Hempen's ground.
  const blazes = k.rounds.filter((o) => (o.kind === 'tree' || o.kind === 'pine') && Math.hypot(o.x - S.blaze.x, o.y - S.blaze.y) < 9 && offLine(main, o.x, o.y) < o.r + 2.6)
    .sort((a, b) => Math.hypot(a.x - S.blaze.x, a.y - S.blaze.y) - Math.hypot(b.x - S.blaze.x, b.y - S.blaze.y)).slice(0, 4).map((o) => ({ x: o.x, y: o.y, r: o.r }));
  layKnots(k, main, side, S);
  const foes: Foe[] = k.foes;
  const beats = ([...ON_THE_WAY, 'oak'] as Beat[]).map((kind) => ({ kind, x: S[kind].x, y: S[kind].y, r: kind === 'gibbet' || kind === 'hempen' ? 9 : kind === 'oak' ? 7 : 5 }));
  const hang: HangMap = { winch: laid.winch, cage: laid.cage, check: S.check, oak: laid.oak, out: S.out, beats, blazes, snares: laid.snares };
  const theme = themeUnder({ ...lightFor(THEMES.forest, 'forest', timeOf(job)), floor: 'grass' as const, back: 'trees' as const }, { from: expedSky(job).from }, 0);
  const map: GameMap = {
    name: "HANGMAN'S WOOD", w: HANGWOOD.w, h: HANGWOOD.h, wallFace: 3, rounds: k.rounds, blocks: k.blocks, braziers: k.braziers, torches: [],
    hero: { ...S.in }, exit: { x: S.out.x - 1.5, y: 0, w: 3, h: 0.9 }, theme, water: k.water, soil: k.soil, marks: k.marks,
    npcs: k.dead.length ? k.dead : undefined, grim: k.grim.length ? k.grim : undefined, sleepers: k.sleepers.length ? k.sleepers : undefined,
    flocks: laid.flocks, hang,
  };
  const open: P[] = [];
  for (let y = 3; y < HANGWOOD.h - 2; y += 4) for (let x = 3; x < HANGWOOD.w - 2; x += 4) if (free(k, x, y, 0.8, 0)) open.push({ x, y });
  const land = { ins: { x: S.in.x, y: S.in.y, c: 0, r: 1, how: 'road' }, ext: { x: S.out.x, c: 2 } } as unknown as Land;
  return {
    map, foes, props: k.props, chests: k.chests, nodes: [], land, camps: [], patrols: [], open, zone: { ...S.out, y: 3 },
    goals: [{ kind: 'winch', x: laid.winch.x, y: laid.winch.y }, { kind: 'butcher', x: S.hempen.x, y: S.hempen.y, foe: laid.hempen }],
    sides: [{ kind: 'oak', x: S.oak.x, y: S.oak.y + 1.6, foe: laid.brood }],
  };
}
