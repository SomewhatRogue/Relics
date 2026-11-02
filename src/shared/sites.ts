/**
 * Every place on the board is laid out to a plan of its own sort, so a room reads as somewhere: a
 * village round its green with fields beyond the hedges, a farmyard, open fields cut by tracks and
 * hedgerows, a shanty of shacks along a muddy path, a better-off street of stone houses, a manor's
 * grounds, a village gone to ruin, a wood with a clearing, a mine's gallery, a riverbank with its sheep
 * pens, the peat cuttings, a willow carr. Each place always gets the same sort, and the same place
 * the same plan (seeded by its name and the room), whatever job takes you there.
 */
import type { Area, Water } from './arena.js';
import { camp } from './sitecamp.js';
import { clearFor, type Keep, type Site, type Spot } from './sitekit.js';
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

/** What a plan is told about the room it's laid into. */
export interface Ground { w: number; h: number; index: number; fork: boolean; kind: PlaceKind; name: string; water: Water[] }
const PLANS: Record<SiteKind, (rng: Rng, g: Ground) => Site> = { green, farmstead, fields, camp, street, manor, ruinvillage, wood, mine, sheepwash, peat, carr };

/** A place's own seed: its name, and which room of it this is. */
export function placeSeed(p: Place, index: number): number {
  let h = 7;
  for (const ch of p.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (h % 100000) * 13 + index * 977 + 5;
}

/**
 * Lay a room's place out round what it already has to hold: the way in (`spawn`), the way out or the
 * forks' roads (`ways`), raised ground and water (`hard`), and the spots given to the job (`spots`).
 */
export function layOut(job: Job, index: number, g: Omit<Ground, 'index' | 'kind' | 'name'>, ways: Area[], hard: Area[], spots: Spot[], spawn: { x: number; y: number }): Site {
  const ground: Ground = { ...g, index, kind: job.place.kind, name: job.place.name };
  const plan = PLANS[siteOf(job.place)](new Rng(placeSeed(job.place, index)), ground);
  const keep: Keep = { w: g.w, h: g.h, areas: [...ways, ...hard, ...g.water], spots: [...spots, { ...spawn, r: 2.2 }] };
  return clearFor(plan, keep, { ...keep, areas: [...hard, ...g.water] });
}

/** A place that brings its own water (the peat cuttings), or null for the kind's own (a river, the bog pools). */
export function siteWater(job: Job, index: number, w: number, h: number): Water[] | null {
  return siteOf(job.place) === 'peat' ? peatWater(new Rng(placeSeed(job.place, index) + 1), w, h) : null;
}
