/**
 * A run room's frame, before anything is put in it: its seeded stream, the way in, the way out, the
 * spine between (shared/spine.ts) and its water. An old saved job (no `layout`) gets today's frame
 * (in at the bottom middle, out at the top middle, the place's own water, the same stream as ever); a
 * new one gets its route's (shared/route.ts): ways in and out that move along the edges, a bent spine,
 * and the water its node brings (a river with its fords or broken bridge, a stream, the fen's pools).
 */
import type { Water } from './arena.js';
import type { Job, PlaceKind } from './jobs.js';
import { river, type River } from './river.js';
import { roomSeed, routeOf, type RoomSpec } from './route.js';
import { Rng } from './rng.js';
import type { Spot } from './sitekit.js';
import { placeSeed, siteOf, siteWater } from './sites.js';
import { peatWater } from './sitewild.js';
import { approachTo, offAll, spineFor, type Pt } from './spine.js';

export interface Frame {
  spec: RoomSpec | null;
  rng: Rng;
  /** The room's own seed (new jobs), for its plan. */
  seed: number;
  spawn: { x: number; y: number };
  exit: { x: number; y: number; w: number; h: number };
  spine?: Pt[][];
  water: Water[];
  /** Kept clear of the job's spots (the river's length, each pool). */
  wet: Spot[];
  river?: River;
}

/** The old water: a river across the middle with two fords, or a marsh's bog pools, a couple deep. */
function waters(kind: PlaceKind, rng: Rng, W: number, H: number, reserve: (x: number, y: number, r: number) => void): Water[] {
  const out: Water[] = [], MID = W / 2;
  if (kind === 'river') {
    const y = rng.range(H * 0.38, H * 0.52), h = 2.6, a = rng.range(3, MID - 4), b = rng.range(MID + 1, W - 6), fw = 3.2;
    out.push({ x: 0, y, w: a, h, deep: true }, { x: a, y, w: fw, h }, { x: a + fw, y, w: b - a - fw, h, deep: true }, { x: b, y, w: fw, h }, { x: b + fw, y, w: W - b - fw, h, deep: true });
    for (let x = 0.8; x < W; x += 1.6) reserve(x, y + h / 2, 1.5);
  } else if (kind === 'marsh') {
    for (let i = 0; i < 6; i++) {
      const w = rng.range(2.2, 4), h = rng.range(1.4, 2.4), x = rng.range(1, W - 1 - w), y = rng.range(5, H - 5 - h), deep = i < 2 && w < 3.2;
      if (Math.abs(x + w / 2 - MID) < w / 2 + 1.6 && deep) continue;
      out.push({ x, y, w, h, deep }), reserve(x + w / 2, y + h / 2, Math.max(w, h) / 2 + 0.2);
    }
  }
  return out;
}

const areaSpot = (w: Water): Spot => ({ x: w.x + w.w / 2, y: w.y + w.h / 2, r: Math.max(w.w, w.h) / 2 + 0.2 });
const riverSpots = (r: River, W: number): Spot[] => Array.from({ length: Math.ceil(W / 1.6) }, (_, i) => ({ x: 0.8 + i * 1.6, y: r.y + r.h / 2, r: 1.5 }));

/** Today's frame, exactly as it always was (old saved jobs keep their rooms). */
function oldFrame(job: Job, index: number, W: number, H: number): Frame {
  const wet: Spot[] = [], own = siteWater(job, index, W, H);
  for (const w of own ?? []) wet.push(areaSpot(w));
  const water = own ?? waters(job.place.kind, new Rng(placeSeed(job.place, index) + 2), W, H, (x, y, r) => wet.push({ x, y, r }));
  return { spec: null, rng: new Rng(job.seed * 31 + index * 7 + 1), seed: 0, spawn: { x: W / 2, y: H - 2 }, exit: { x: W / 2 - 1, y: 0, w: 2, h: 0.9 }, water, wet };
}

/** How far each kind of approach room's spine wanders. */
const BEND: Record<string, number> = { 'track/sbend': 4.5, 'track/bend': 2.6, 'track/hedged': 1.6, woodpath: 4, lane: 1, yard: 1.2, strips: 1.4, crossroads: 1.4, clearing: 2.2, ford: 2 };

export function frameFor(job: Job, index: number, road: string | undefined, fork: boolean, W: number, H: number): Frame {
  if (job.layout !== 2) return oldFrame(job, index, W, H);
  const spec = routeOf(job)[index], took = road === 'high' ? 'h' : road === 'low' ? 'l' : '', seed = roomSeed(job, index, took), geo = new Rng(seed + 11), M = W / 2;
  const inX = spec.heart && road ? (road === 'high' ? 6 : 22) : spec.inX, outX = spec.outX;
  const f: Frame = { spec, rng: new Rng(seed), seed, spawn: { x: inX, y: H - 2 }, exit: { x: outX - 1, y: 0, w: 2, h: 0.9 }, water: [], wet: [] };
  if (spec.heart) {
    // The place's own water, the same every visit: its river, its cuttings, its bog pools.
    const home = new Rng(placeSeed(job.place, 0) + 2), site = siteOf(job.place);
    f.spine = [approachTo(inX, M, H)];
    if (site === 'peat') f.water = peatWater(new Rng(placeSeed(job.place, 0) + 1), W, H), (f.wet = f.water.map(areaSpot));
    else if (site === 'camp' && job.place.kind === 'river') {
      // Brokenbridge: the bridge in the middle, broken; one ford, off to the side, the only way over.
      const y = home.range(H * 0.38, H * 0.48), left = home.next() < 0.5, fx = left ? home.range(3, 6) : home.range(W - 9.4, W - 6.4);
      f.river = river(W, y, 2.6, [{ x: fx, w: 3.4 }], M), f.water = f.river.water, f.wet = riverSpots(f.river, W);
      const c = fx + 1.7;
      f.spine.push([[M, y + 2.6 + 3], [c, y + 2.6 + 1.2], [c, y - 1.2], [M, y - 3.2]]);
    } else f.water = waters(job.place.kind, home, W, H, (x, y, r) => f.wet.push({ x, y, r }));
    return f;
  }
  // A fork's stem comes up to the middle (above the river, if there is one) and parts for the two roads.
  const fork3 = (stem: Pt[], mid: Pt): Pt[][] => [[...stem, mid], [mid, [6, 3], [4, 0]], [mid, [W - 6, 3], [W - 4, 0]]];
  if (spec.node === 'ford') {
    // The river first, then the track down to a ford, over, and on up to the way out.
    const y = geo.range(H * 0.36, H * 0.48), h = 2.6, l = spec.layout;
    const fords = l === 'wide' ? [{ x: geo.range(5, W - 10), w: 5 }] : l === 'twofords' ? [{ x: geo.range(3, M - 5), w: 3.2 }, { x: geo.range(M + 2, W - 6.4), w: 3.2 }] : [geo.next() < 0.5 ? { x: geo.range(3, 6), w: 3.4 } : { x: geo.range(W - 9.4, W - 6.4), w: 3.4 }];
    f.river = river(W, y, h, fords, l === 'broken' ? M + geo.range(-1.5, 1.5) : undefined), f.water = f.river.water, f.wet = riverSpots(f.river, W);
    const mid = (inX + outX) / 2, near = [...fords].sort((a, b) => Math.abs(a.x + a.w / 2 - mid) - Math.abs(b.x + b.w / 2 - mid))[0], c = near.x + near.w / 2;
    const stem: Pt[] = [[inX, H], [inX, H - 2.5], [c, y + h + 2.2], [c, y + h / 2], [c, y - 2.2]];
    f.spine = fork ? fork3(stem, [M, Math.max(4, y - 3.4)]) : [[...stem, [outX, 2.6], [outX, 0]]];
    return f;
  }
  f.spine = fork ? fork3([[inX, H], [inX, H - 2.5]], [M + geo.range(-1.5, 1.5), H * 0.5]) : [spineFor(geo, W, H, inX, outX, BEND[`${spec.node}/${spec.layout}`] ?? BEND[spec.node] ?? 2)];
  if (spec.node === 'clearing' && spec.layout === 'stream') {
    // A stream across below the clearing, shallow from bank to bank.
    const y = geo.range(15, 16.5);
    f.water = [{ x: 0, y, w: W, h: 1.3 }], f.wet = [];
  } else if (spec.skin === 'fen') {
    // The fen's pools about the place, off the track; a small one now and then too deep to wade.
    for (let i = 0; i < 5; i++) {
      const w = geo.range(2.2, 3.8), h = geo.range(1.3, 2.2), x = geo.range(1, W - 1 - w), y = geo.range(4, H - 5 - h);
      if (offAll(f.spine!, x + w / 2, y + h / 2) < Math.max(w, h) / 2 + 2.4) continue;
      const p = { x, y, w, h, deep: i === 0 && w < 3 };
      f.water.push(p), f.wet.push(areaSpot(p));
    }
  }
  return f;
}
