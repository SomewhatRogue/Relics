/**
 * A job's route (docs/terrain-nodes.md, slice 1): which room comes where. The last room is the heart,
 * the place's own, its landmarks the same every visit but its sub-layout, set piece and way in moving
 * job to job; the rooms before it are the approach, rolled from the job's own stream so the next day's
 * job to the same place crosses different country. The rules each room keeps:
 *
 * 1. no node twice in a row, and no sub-layout twice in a job;
 * 2. one landmark a room, never the same one twice in a job, and never the place's signature;
 * 3. a palette step every room: two of floor, back wall, main ground and light differ from the last;
 * 4. one set piece a room, never the same one twice in a job;
 * 5. the way on moves along the top (left, middle or right), never the same as the room before.
 */
import type { Job } from './jobs.js';
import type { Cache, Country, DeadEnd, RouteNode } from './nodeports.js';
import type { Port } from './ports.js';
import { HEART_SOIL, HEART_VARIANTS, LANDMARKS, LAYOUTS, PALETTES, PIECES, PIECES_IN, POOL, signatureOf, skinsFor, type ApproachNode, type Landmark, type NodeId, type Palette, type Piece, type Skin } from './nodes.js';
import { Rng } from './rng.js';
import { siteOf, type SiteKind } from './sites.js';
import { route3 } from './routeports.js';

/** A side way (layout 3): a gap at the room's edge to a dead-end room (shared/sideroom.ts). */
export interface SideWay { port: Port; node: DeadEnd; layout: string; cache: Cache }

export interface RoomSpec {
  index: number;
  heart: boolean;
  node: NodeId | RouteNode;
  layout: string;
  /** The approach's country (a heart is its place's own). */
  skin: Skin | null;
  /** Where you come in along the bottom and leave along the top (tiles across). */
  inX: number;
  outX: number;
  landmark: Landmark | null;
  piece: Piece;
  palette: Palette;
  /**
   * Layout 3 (docs/terrain-nodes.md slices 2 to 4): the room's size, its way in and ways on by side
   * (two at a fork, each with its road), the country it's in, the one a transition comes from, and a
   * side way if it has one.
   */
  w?: number;
  h?: number;
  in?: Port;
  outs?: (Port & { road?: 'high' | 'low' })[];
  country?: Country;
  from?: Skin;
  fromCountry?: Country;
  side?: SideWay;
}

/** The ways on along the top edge. */
export const OUTS = [7, 14, 21];

/** A heart's own floor and back wall, as its plan paints them (shared/sites.ts). */
export const HEART_LOOK: Record<SiteKind, [Palette['floor'], Palette['back']]> = {
  green: ['grass', 'palisade'], farmstead: ['grass', 'palisade'], fields: ['wheat', 'trees'], camp: ['mud', 'trees'], street: ['cobble', 'stone'],
  manor: ['grass', 'stone'], ruinvillage: ['grass', 'stone'], wood: ['grass', 'trees'], mine: ['rock', 'rockface'], sheepwash: ['grass', 'trees'],
  peat: ['mud', 'trees'], carr: ['mud', 'trees'],
};

const steps = (a: Palette, b: Palette) => (['floor', 'back', 'soil', 'light'] as const).filter((k) => a[k] !== b[k]).length;

/** A palette for this skin that's a step from the room before (and from the heart, for the last approach). */
function paletteFor(rng: Rng, skin: Skin, after: Palette[]): Palette {
  const o = PALETTES[skin], all: Palette[] = [];
  for (const floor of o.floor) for (const back of o.back) for (const soil of o.soil) for (const light of o.light) all.push({ floor, back, soil, light });
  const score = (p: Palette) => Math.min(4, ...after.map((a) => steps(a, p)));
  const best = Math.min(2, Math.max(...all.map(score)));
  return rng.pick(all.filter((p) => score(p) >= best));
}

const memo = new Map<string, RoomSpec[]>();

/**
 * The whole route, rolled once from the job (the same on every screen). Layout 3's is a small tree
 * (shared/routeports.ts): `took` picks the road at its fork ("h" or "l"; before it, either).
 */
export function routeOf(job: Job, took = ''): RoomSpec[] {
  if (job.layout === 3) return route3(job, took);
  const key = `${job.seed}|${job.place.name}|${job.rooms}|${job.objective}`;
  const had = memo.get(key);
  if (had) return had;
  const rng = new Rng(job.seed * 7919 + 101), site = siteOf(job.place), sign = signatureOf(job.place), skins = skinsFor(job.place);
  const [hf, hb] = HEART_LOOK[site];
  const heartPal: Palette = { floor: hf, back: hb, soil: HEART_SOIL[site] ?? 'earth', light: job.place.kind };
  const variant = rng.int(HEART_VARIANTS);
  const usedLayouts = new Set<string>(), usedMarks = new Set<string>(sign), usedPieces = new Set<Piece>(), out: RoomSpec[] = [];
  let prevNode: NodeId | null = null, prevOut = 14, prevPal: Palette | null = null;
  for (let i = 0; i < job.rooms - 1; i++) {
    const skin = rng.pick(skins);
    const fork = job.rooms >= 3 && i === job.rooms - 2;
    const free = (n: ApproachNode) => LAYOUTS[n].filter((l) => !usedLayouts.has(`${n}/${l}`) && !(n === 'ford' && l === 'broken' && sign.includes('bridge')));
    const nodes = POOL[skin].filter((n) => n !== prevNode && free(n).length);
    const node: ApproachNode = nodes.length ? rng.pick(nodes) : 'clearing';
    const layout = free(node).length ? rng.pick(free(node)) : LAYOUTS[node][0];
    usedLayouts.add(`${node}/${layout}`);
    const outX = fork ? 14 : rng.pick(OUTS.filter((x) => x !== prevOut));
    const bridge = node === 'ford' && layout === 'broken';
    const pieces = PIECES_IN[skin].filter((p) => !usedPieces.has(p));
    const piece: Piece = bridge ? 'bridge' : pieces.length ? rng.pick(pieces) : 'fire';
    usedPieces.add(piece);
    const marks = LANDMARKS[skin].filter((m) => !usedMarks.has(m));
    const landmark = marks.length ? rng.pick(marks) : null;
    if (landmark) usedMarks.add(landmark);
    const palette = paletteFor(rng, skin, [...(prevPal ? [prevPal] : []), ...(i === job.rooms - 2 ? [heartPal] : [])]);
    out.push({ index: i, heart: false, node, layout, skin, inX: prevOut, outX, landmark, piece, palette });
    (prevNode = node), (prevOut = outX), (prevPal = palette);
  }
  const left = PIECES.filter((p) => !usedPieces.has(p) && !(job.place.kind === 'mine' && p === 'wreck'));
  out.push({ index: job.rooms - 1, heart: true, node: site, layout: `heart-${variant}`, skin: null, inX: prevOut, outX: 14, landmark: null, piece: left.length ? rng.pick(left) : 'fire', palette: heartPal });
  if (memo.size > 64) memo.clear();
  memo.set(key, out);
  return out;
}

/** A room's own seed: the job, which room, and the roads taken to get there ("", "h", "l"). */
export function roomSeed(job: Job, index: number, took: string): number {
  let h = (job.seed * 2654435761) >>> 0;
  for (const c of `${index}:${took}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h % 2147483647 || 1;
}

/** A heart's sub-layout number (0 to HEART_VARIANTS - 1). */
export const heartVariant = (spec: RoomSpec) => Number(spec.layout.split('-')[1] ?? 0);
