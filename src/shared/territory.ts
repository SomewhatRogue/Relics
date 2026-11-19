/**
 * Territories (docs/design/territories.md, "The format" and "Bigger, stitched"): big hand-laid maps of zones
 * (places with a fight), scapes (the quiet country between) and gates that open when a zone's packs are dead and
 * the whole party stands at them (sim/stretches.ts). A territory is one or more such maps stitched end to end:
 * the run's rooms are its maps, taken in turn, the way out of one the way into the next. This file is the frame:
 * the tuning, each map's plan from a job's seed (kept for the last few), and the job itself. What every
 * territory is laid with: shared/terrkit.ts. Each territory's own maps: their own files. Pure.
 */
import { PLACES, payFor, type Job } from './jobs.js';
import type { RoomPlan } from './terrain.js';
import { hillPlan } from './hillmap.js';
import { knollPlan } from './knollmap.js';
import { fieldsPlan } from './lowfurrowfields.js';
import { risePlan } from './lowfurrowrise.js';
import { barnPlan } from './tollanbarn.js';
import { bedsPlan } from './sallowbeds.js';
import { holtPlan } from './sallowholt.js';
import { orchardPlan } from './tollanorchard.js';
import { yardPlan } from './tollanyard.js';

/**
 * `lowfurrow`, `tollan`: the quest territories laid so far (docs/design/territories.md). `hill`: the proving hill, a
 * small test map (shared/hillmap.ts). `knoll`: the raised-area test map (shared/knollmap.ts).
 */
export type LandId = 'lowfurrow' | 'tollan' | 'sallow' | 'hill' | 'knoll';
/** (`sallow`, Sallow Carr, joins `LANDS` when both its maps are laid: until then its plans throw.) */
export const LANDS: LandId[] = ['lowfurrow', 'tollan', 'hill', 'knoll'];
/** Tuning for every territory. */
export const TERR = { wake: 15, doze: 19, more: { hp: 0.3, harm: 0.15 }, gate: 3.2 };
/** A zone or a scape: its box on the map and the stretch it belongs to. */
export interface TerrZone { name: string; kind: 'zone' | 'scape'; x: number; y: number; w: number; h: number; stretch: number }
export interface TerrPlan extends RoomPlan { zones: TerrZone[] }

/** Each territory's maps, in the order they're walked. */
const PLANS: Record<LandId, ((job: Job) => TerrPlan)[]> = { lowfurrow: [fieldsPlan, risePlan], tollan: [orchardPlan, yardPlan, barnPlan], sallow: [bedsPlan, holtPlan], hill: [hillPlan], knoll: [knollPlan] };
const NAMES: Record<LandId, string> = { lowfurrow: 'Lowfurrow Fields', tollan: "Tollan's Farm", sallow: 'Sallow Carr', hill: 'Lowfurrow Fields', knoll: 'Lowfurrow Fields' };
/** What each territory's job is, where it is not bringing people out: Tollan's Farm is the hunt for MAWL, which is in its last map's plan. */
const WORK: Partial<Record<LandId, Partial<Job>>> = { tollan: { objective: 'hunt', boss: 'MAWL' }, sallow: { objective: 'burn' } };

/** Whether `s` names a territory with maps (laid or still being laid: the test link opens either). */
export const knownLand = (s: string): s is LandId => s in PLANS;

/** How many maps a territory is. */
export const mapsOf = (land: LandId) => PLANS[land].length;

const kept = new Map<string, TerrPlan>();
/**
 * The plan for map `index` of a territory job, from its seed alone (kept for the last few, as shared/expedmap.ts
 * expedPlan keeps its). Throws if the job has no `land`.
 */
export function territoryPlan(job: Job, index = 0): TerrPlan {
  if (!job.land) throw new Error(`not a territory job: ${job.id}`);
  const maps = PLANS[job.land], i = Math.max(0, Math.min(maps.length - 1, index)), key = `${job.land}:${i}:${job.seed}`;
  let p = kept.get(key);
  if (!p) (kept.size > 5 && kept.clear()), kept.set(key, (p = maps[i](job)));
  // (A fresh copy each time: a room changes its map as it's played.)
  return JSON.parse(JSON.stringify(p)) as TerrPlan;
}

/** A job on a territory, for the test switch and later the quest posting: a room a map. */
export function landJob(land: LandId, day: number): Job {
  const place = PLACES.find((p) => p.name === NAMES[land])!;
  return {
    id: `d${day}-land-${land}`, place, objective: 'rescue', twist: 'none', time: 'day', rooms: mapsOf(land), size: 'short',
    seed: day * 6131 + 29, reward: payFor(3, place.ruin, false, 'short'), land, title: NAMES[land], text: '',
    ...WORK[land],
  };
}
