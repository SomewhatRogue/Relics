/**
 * Instances (docs/design/instances.md): dungeons with a story, a route of areas and a boss at the end of
 * each. A job whose rooms are the instance's areas, taken in turn (sim/run.ts). Each area is built by hand
 * from the job alone, so every screen builds the same one; the last can be a boss's arena (Job.arena,
 * sim/arenaroom.ts). Each area's gate is a checkpoint (sim/checkpoint.ts), and it opens when the area's
 * named ones are dead (sim/goal.ts).
 */
import type { Job } from './jobs.js';
import { payFor, type Place } from './jobs.js';
import type { RoomPlan } from './terrain.js';
import { Rng } from './rng.js';
import { rollTime } from './timeofday.js';
import { HAUL_NAME } from './bosswords.js';
import { rowsPlan } from './cutrows.js';
import { reckonPlan, RECKON_GUARDS } from './cutreckon.js';
import { cutMap, type CutPlace } from './cutmap.js';
import { windingPlan, WINDING_GUARDS } from './cutwinding.js';
import { inclinePlan } from './cutincline.js';
import { loadingPlan } from './cutloading.js';
import { sortingPlan } from './cutsorting.js';
import { lampRoomPlan } from './cutlamproom.js';
import { washingPlan } from './cutwashing.js';
import { CUT_NAMES, CUT_POST, FORK_WORDS } from './opencutwords.js';
import { stressPlan } from './stressmap.js';

export type InstanceId = 'opencut' | 'stress';

export interface InstanceArea {
  name: string;
  /** The area, by hand. None: the job's boss arena (the last area). */
  plan?: (job: Job) => RoomPlan;
  /** A fork: the ways on, one of which the party chose at the map before (`run.way`: sim/fork.ts). */
  ways?: InstanceArea[];
}

export interface Instance { id: InstanceId; place: Place; areas: InstanceArea[] }

export const INSTANCES: Record<InstanceId, Instance> = {} as Record<InstanceId, Instance>;
Object.assign(INSTANCES, {
  opencut: {
    id: 'opencut',
    place: { name: 'Rakehead', kind: 'mine', region: 'Copperdeep', ruin: 2 },
    // The acts (docs/design/open-cut-arc.md), each one map in places (shared/cutmap.ts): Rakehead to the fork yard;
    // over the top (the Haulier at the end) or under the hill (the Sluicer and the Raker). Each way's boss ends the
    // run till the pit floor and the Overman are built (the arc's step 5).
    areas: [
      { name: 'RAKEHEAD', plan: openCutMap },
      { name: '', ways: [{ name: FORK_WORDS.over, plan: overTheTop }, { name: FORK_WORDS.under, plan: underTheHill }] },
    ],
  },
});

INSTANCES.stress = { id: 'stress', place: { name: 'Rakehead', kind: 'mine', region: 'Copperdeep', ruin: 2 }, areas: [{ name: 'STRESS', plan: stressPlan }] };

/** The stress map's job (docs/design/open-cut-map.md step 0; dev only, `?stress=1`). */
export const stressJob = (day = 1): Job => ({ ...openCut(day), id: `d${day}-stress`, instance: 'stress', rooms: 1 });

/** The Open Cut's places, from the bottom (docs/design/open-cut-map.md): Rakehead's, then each way's. */
export const CUT_PLACES: CutPlace[] = [
  { plan: rowsPlan, keep: [CUT_NAMES.drover] },
  { plan: reckonPlan, keep: [], packs: [RECKON_GUARDS] },
];
export const OVER_PLACES: CutPlace[] = [
  { plan: windingPlan, keep: [], packs: [WINDING_GUARDS] },
  { plan: inclinePlan, keep: [CUT_NAMES.brakesman] },
  { plan: loadingPlan, keep: [HAUL_NAME] },
];
export const UNDER_PLACES: CutPlace[] = [
  { plan: sortingPlan, keep: [] },
  { plan: lampRoomPlan, keep: [CUT_NAMES.lampman] },
  { plan: washingPlan, keep: [CUT_NAMES.sluicer, CUT_NAMES.raker] },
];

/** Act 1, Rakehead, up to the fork yard. */
export function openCutMap(job: Job): RoomPlan {
  return cutMap(job, CUT_PLACES, { name: FORK_WORDS.yard, ways: [FORK_WORDS.over, FORK_WORDS.under] }).plan;
}
/** Act 2, over the top. */
export function overTheTop(job: Job): RoomPlan {
  return cutMap(job, OVER_PLACES).plan;
}
/** Act 2, under the hill. */
export function underTheHill(job: Job): RoomPlan {
  return cutMap(job, UNDER_PLACES).plan;
}

/** Area `i` of an instance job. */
export function areaOf(job: Job, i: number, way?: number): InstanceArea {
  const a = INSTANCES[job.instance!].areas[i];
  return a?.ways ? a.ways[way ?? 0] : a;
}

/** The day's posting of the Open Cut: Rakehead's rows into the Open Cut, and over the top or under the hill. */
export function openCut(day: number): Job {
  const def = INSTANCES.opencut, rng = new Rng(day * 3301 + 53), seed = day * 509 + 181, night = rng.next() < 0.4;
  return {
    id: `d${day}-cut`, place: def.place, objective: 'hunt', twist: night ? 'night' : 'none', time: rollTime(seed, night), rooms: def.areas.length, size: 'long',
    instance: 'opencut', seed,
    reward: payFor(def.areas.length, 2, night, 'long') + 80, title: CUT_POST.title, text: CUT_POST.text,
  };
}
