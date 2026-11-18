/**
 * Territories (docs/design/territories.md, "The format"): bigger hand-laid maps of zones (places with a
 * fight), scapes (the quiet country between) and gates that open when a zone's packs are dead and the whole
 * party stands at them (sim/stretches.ts). This file is the frame: the tuning, the plan from a job's seed
 * (kept for the last few jobs), and the job itself. What every territory is laid with: shared/terrkit.ts.
 * Each territory's own map: its own file (shared/lowfurrow.ts). Pure.
 */
import { PLACES, payFor, type Job } from './jobs.js';
import type { RoomPlan } from './terrain.js';
import { lowfurrowPlan } from './lowfurrow.js';

export type LandId = 'lowfurrow';
/** Tuning for every territory. */
export const TERR = { wake: 15, doze: 19, more: { hp: 0.3, harm: 0.15 }, gate: 3.2 };
/** A zone or a scape: its box on the map and the stretch it belongs to. */
export interface TerrZone { name: string; kind: 'zone' | 'scape'; x: number; y: number; w: number; h: number; stretch: number }
export interface TerrPlan extends RoomPlan { zones: TerrZone[] }

const PLANS: Record<LandId, (job: Job) => TerrPlan> = { lowfurrow: lowfurrowPlan };
const NAMES: Record<LandId, string> = { lowfurrow: 'Lowfurrow Fields' };

const kept = new Map<string, TerrPlan>();
/** The plan for a territory job, from its seed alone (kept for the last few jobs, as shared/expedmap.ts expedPlan keeps its). Throws if the job has no `land`. */
export function territoryPlan(job: Job): TerrPlan {
  if (!job.land) throw new Error(`not a territory job: ${job.id}`);
  const key = `${job.land}:${job.seed}`;
  let p = kept.get(key);
  if (!p) (kept.size > 4 && kept.clear()), kept.set(key, (p = PLANS[job.land](job)));
  // (A fresh copy each time: a room changes its map as it's played.)
  return JSON.parse(JSON.stringify(p)) as TerrPlan;
}

/** A job on a territory, for the test switch and later the quest posting. */
export function landJob(land: LandId, day: number): Job {
  const place = PLACES.find((p) => p.name === NAMES[land])!;
  return {
    id: `d${day}-land-${land}`, place, objective: 'rescue', twist: 'none', time: 'day', rooms: 1, size: 'short',
    seed: day * 6131 + 29, reward: payFor(3, place.ruin, false, 'short'), land, title: NAMES[land], text: '',
  };
}
