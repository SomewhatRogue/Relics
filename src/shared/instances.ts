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
import { cutMap, type CutPlace } from './cutmap.js';
import { workingsPlan } from './cutworkings.js';
import { washingPlan } from './cutwashing.js';
import { CUT_AREAS, CUT_NAMES, CUT_POST } from './opencutwords.js';
import { stressPlan } from './stressmap.js';

export type InstanceId = 'opencut' | 'stress';

export interface InstanceArea {
  name: string;
  /** The area, by hand. None: the job's boss arena (the last area). */
  plan?: (job: Job) => RoomPlan;
}

export interface Instance { id: InstanceId; place: Place; areas: InstanceArea[] }

export const INSTANCES: Record<InstanceId, Instance> = {} as Record<InstanceId, Instance>;
Object.assign(INSTANCES, {
  opencut: {
    id: 'opencut',
    place: { name: 'Rakehead', kind: 'mine', region: 'Copperdeep', ruin: 2 },
    // One map down through Rakehead (shared/cutmap.ts), then the Haulier's working (the job's arena).
    areas: [{ name: 'THE OPEN CUT', plan: openCutMap }, { name: CUT_AREAS[3] }],
  },
});

INSTANCES.stress = { id: 'stress', place: { name: 'Rakehead', kind: 'mine', region: 'Copperdeep', ruin: 2 }, areas: [{ name: 'STRESS', plan: stressPlan }] };

/** The stress map's job (docs/design/open-cut-map.md step 0; dev only, `?stress=1`). */
export const stressJob = (day = 1): Job => ({ ...openCut(day), id: `d${day}-stress`, instance: 'stress', rooms: 1, arena: undefined });

/** The Open Cut's places, from the bottom (docs/design/open-cut-map.md). */
export const CUT_PLACES: CutPlace[] = [
  { plan: rowsPlan, keep: [CUT_NAMES.drover] },
  { plan: workingsPlan, keep: [CUT_NAMES.brakesman] },
  { plan: washingPlan, keep: [CUT_NAMES.sluicer, CUT_NAMES.raker] },
];

/** The Open Cut's one map. */
export function openCutMap(job: Job): RoomPlan {
  return cutMap(job, CUT_PLACES).plan;
}

/** Area `i` of an instance job. */
export const areaOf = (job: Job, i: number): InstanceArea => INSTANCES[job.instance!].areas[i];

/** The day's posting of the Open Cut: Rakehead's rows into the Open Cut, the Haulier at the end. */
export function openCut(day: number): Job {
  const def = INSTANCES.opencut, rng = new Rng(day * 3301 + 53), seed = day * 509 + 181, night = rng.next() < 0.4;
  return {
    id: `d${day}-cut`, place: def.place, objective: 'hunt', twist: night ? 'night' : 'none', time: rollTime(seed, night), rooms: def.areas.length, size: 'long',
    boss: HAUL_NAME, arena: 'haulier', instance: 'opencut', seed,
    reward: payFor(def.areas.length, 2, night, 'long') + 80, title: CUT_POST.title, text: CUT_POST.text,
  };
}
