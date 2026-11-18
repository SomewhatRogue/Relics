/**
 * The map a guest builds for a big room (one whose far goblins doze, so the map's never sent: client/bigsend.ts,
 * coop.ts `ms`): from the run, the same the leader built. An Instance's area (shared/instances.ts `areaOf`, its fork
 * way included), a territory's map (shared/territory.ts) or an expedition's (shared/expedmap.ts). (Kyle, 2026-11-12: a guest stood off the map in an
 * Instance; it had built an expedition's map from the job's seed. The Deep chat found where.)
 */
import type { GameMap } from './arena.js';
import { expedPlan } from './expedmap.js';
import { areaOf } from './instances.js';
import type { Job } from './jobs.js';
import { territoryPlan } from './territory.js';

/**
 * In the order sim/run.ts runRoom picks a room's kind, for every kind whose far goblins doze (`sleep: true`):
 * a new such kind must be taught here too, or a friend builds another kind's map and stands on that
 * (tests/guestmap.test.ts lists the kinds and fails on a new one).
 */
export function guestMap(run: { job: Job; index: number; way?: number }): GameMap {
  if (run.job.exped) return expedPlan(run.job).map;
  // (Kyle, 2026-11-18: "the other person is in a different spot on their screen". A territory's room came
  // here as an expedition's: the friend stood on the Barrowfields where the leader had them on Lowfurrow.)
  if (run.job.land) return territoryPlan(run.job, run.index).map;
  const area = run.job.instance ? areaOf(run.job, run.index, run.way) : undefined;
  return area?.plan ? area.plan(run.job).map : expedPlan(run.job).map;
}
