/**
 * Every place on the board is laid out to a plan of its own sort, so a room reads as somewhere: a
 * village round its green with fields beyond the hedges, a farmyard, open fields cut by tracks and
 * hedgerows, a shanty of shacks along a muddy path, a better-off street of stone houses, a manor's
 * grounds, a village gone to ruin, a wood with a clearing, a mine's gallery, a riverbank with its sheep
 * pens, the peat cuttings, a willow carr. Each place always gets the same sort. On an old job every room
 * of it was the place's plan (seeded by its name and the room); on a routed one (shared/route.ts) only
 * the last room, its heart, is, and the rooms before it are approach rooms of their own kinds.
 */
import type { Area, Water } from './arena.js';
import { LANDMARK_KINDS, signatureOf, type ApproachNode } from './nodes.js';
import type { River } from './river.js';
import type { RoomSpec } from './route.js';
import { camp } from './sitecamp.js';
import { clearFor, fits, path, type Keep, type Site, type Spot } from './sitekit.js';
import { ford } from './siteford.js';
import { lane, strips, yard } from './sitelane.js';
import { clearing, crossroads, track, woodpath } from './siteroad.js';
import { pathMat } from './siteskin.js';
import { PLANS3, landmark3 } from './sites3.js';
import type { RouteNode } from './nodeports.js';
import { approachTo, laneAt, type Pt } from './spine.js';
import { fields, farmstead, green } from './sitevillage.js';
import { manor, ruinvillage, street } from './sitetown.js';
import { carr, mine, peat, peatWater, sheepwash, wood } from './sitewild.js';
import type { Job, Place, PlaceKind } from './jobs.js';
import { Rng } from './rng.js';

export type SiteKind = 'green' | 'farmstead' | 'fields' | 'camp' | 'street' | 'manor' | 'ruinvillage' | 'wood' | 'mine' | 'sheepwash' | 'peat' | 'carr';

/** What each place on the board is. */
const BY_NAME: Record<string, SiteKind> = {
  Barrowby: 'green', "Tollan's Farm": 'farmstead', 'Lowfurrow Fields': 'fields', 'Fennick Ford': 'street', 'The Charcoal Camps': 'camp',
  "Hangman's Wood": 'wood', 'The Copperdeep Shafts': 'mine', 'The Sheepwash': 'sheepwash', Brokenbridge: 'camp', 'The Peat Cuts': 'peat',
  'Sallow Carr': 'carr', Ketterby: 'ruinvillage', 'Hesketh Hall': 'manor',
};
/** Anywhere else, by its kind. */
const BY_KIND: Record<PlaceKind, SiteKind> = { village: 'green', farm: 'farmstead', field: 'fields', forest: 'wood', mine: 'mine', river: 'sheepwash', marsh: 'carr', ruins: 'ruinvillage' };
export const siteOf = (p: Place): SiteKind => BY_NAME[p.name] ?? BY_KIND[p.kind];

/**
 * What a plan is told about the room it's laid into. On a routed job also: the room's spec, its spine,
 * its river, and `dress`, the stream a heart's movable things come from (its sub-layout) while its
 * landmarks come from the place's own (an old job's plan uses one stream for both).
 */
export interface Ground {
  w: number; h: number; index: number; fork: boolean; kind: PlaceKind; name: string; water: Water[];
  spec?: RoomSpec; spine?: Pt[][]; river?: River; dress?: Rng;
}
const PLANS: Record<SiteKind, (rng: Rng, g: Ground) => Site> = { green, farmstead, fields, camp, street, manor, ruinvillage, wood, mine, sheepwash, peat, carr };
const APPROACH: Record<ApproachNode, (rng: Rng, g: Ground) => Site> = { track, crossroads, lane, clearing, ford, strips, yard, woodpath };

/** A place's own seed: its name, and which room of it this is. */
export function placeSeed(p: Place, index: number): number {
  let h = 7;
  for (const ch of p.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (h % 100000) * 13 + index * 977 + 5;
}

/** How a routed room is laid: its spec, spine and river, and the room's own seed (approach rooms). */
export interface Routed { spec: RoomSpec; spine: Pt[][]; river?: River; seed: number }

/** The plan a room gets, and the ground it's told about. */
function planFor(job: Job, index: number, ground: Ground, r?: Routed): Site {
  if (!r) return PLANS[siteOf(job.place)](new Rng(placeSeed(job.place, index)), ground);
  if (!r.spec.heart && r.spec.in) return PLANS3[r.spec.node as RouteNode](new Rng(r.seed), { ...ground, spec: r.spec, spine: r.spine, river: r.river });
  if (!r.spec.heart) return APPROACH[r.spec.node as ApproachNode](new Rng(r.seed), { ...ground, spec: r.spec, spine: r.spine, river: r.river });
  // A heart: its own stream for what stays put, the sub-layout's for what moves.
  const v = Number(r.spec.layout.split('-')[1] ?? 0);
  return PLANS[siteOf(job.place)](new Rng(placeSeed(job.place, 0)), { ...ground, spec: r.spec, spine: r.spine, river: r.river, dress: new Rng(placeSeed(job.place, 0) + 7919 * (v + 1)) });
}

/**
 * Lay a room's place out round what it already has to hold: the way in (`spawn`), the way out or the
 * forks' roads (`ways`), raised ground and water (`hard`), and the spots given to the job (`spots`).
 * A routed room also keeps its spine clear; an approach room keeps only its own landmark.
 */
export function layOut(job: Job, index: number, g: Omit<Ground, 'index' | 'kind' | 'name'>, ways: Area[], hard: Area[], spots: Spot[], spawn: { x: number; y: number }, r?: Routed): Site {
  const ground: Ground = { ...g, index, kind: job.place.kind, name: job.place.name };
  const plan = planFor(job, index, ground, r);
  const keep: Keep = { w: g.w, h: g.h, areas: [...ways, ...hard, ...g.water], spots: [...spots, { ...spawn, r: 2.2 }], spine: r?.spine };
  // A heart's way in, from wherever along the bottom you came in, over to its own lane.
  const aside = !!r?.spec.in && r.spec.in.side !== 'S';
  if (r?.spec.heart && (aside || Math.abs(spawn.x - g.w / 2) > 1)) path(plan, pathMat(r.spec.palette.soil), (aside ? r.spine[0] : approachTo(spawn.x, g.w / 2, g.h)).slice(0, 3), 1.05);
  // A fork's two roads, from where the track parts to each way out.
  if (r && !r.spec.heart) for (const l of r.spine.slice(1)) path(plan, pathMat(r.spec.palette.soil), l, 0.95);
  const site = clearFor(plan, keep, { ...keep, areas: [...hard, ...g.water] });
  if (r && !r.spec.heart) (r.spec.in ? landmark3 : landmark)(site, keep, r, new Rng(r.seed + 5));
  return site;
}

/** A heart's landmarks, where its plan puts them (they keep their ground: the job's spots go round them). */
export function heartMarks(job: Job, g: Omit<Ground, 'index' | 'kind' | 'name'>, r: Routed): Spot[] {
  const site = planFor(job, 0, { ...g, index: 0, kind: job.place.kind, name: job.place.name }, r), sign = signatureOf(job.place);
  return [
    ...site.rounds.filter((q) => LANDMARK_KINDS.includes(q.kind) || sign.includes(q.kind)).map((q) => ({ x: q.x, y: q.y, r: q.r })),
    ...site.blocks.filter((b) => sign.includes(b.kind)).map((b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2, r: Math.hypot(b.w, b.h) / 2 })),
  ];
}

/** An approach room's one landmark, near the track where you see it coming in (any other one goes). */
function landmark(site: Site, keep: Keep, r: Routed, rng: Rng): void {
  site.rounds = site.rounds.filter((q) => !LANDMARK_KINDS.includes(q.kind));
  const kind = r.spec.landmark;
  if (!kind) return;
  const rad = kind === 'well' ? 0.5 : kind === 'stone' || kind === 'statue' ? 0.45 : kind === 'deadtree' ? 0.45 : 0.3;
  for (let t = 0; t < 60; t++) {
    const y = rng.range(keep.h * 0.4, keep.h * 0.72), x = laneAt(r.spine[0], y) + (rng.next() < 0.5 ? -1 : 1) * rng.range(2.4, 3.6 + t / 12);
    if (!fits(keep, x, y, rad + 0.3) || site.rounds.some((q) => Math.hypot(q.x - x, q.y - y) < q.r + rad + 0.6) || site.blocks.some((b) => x > b.x - rad - 0.6 && x < b.x + b.w + rad + 0.6 && y > b.y - rad - 0.6 && y < b.y + b.h + rad + 0.6)) continue;
    site.rounds.push({ kind, x, y, r: rad });
    return;
  }
}

/** A place that brings its own water (the peat cuttings), or null for the kind's own (a river, the bog pools). */
export function siteWater(job: Job, index: number, w: number, h: number): Water[] | null {
  return siteOf(job.place) === 'peat' ? peatWater(new Rng(placeSeed(job.place, index) + 1), w, h) : null;
}
