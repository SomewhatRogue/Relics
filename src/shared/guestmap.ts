/**
 * The map a guest builds for a big room (one whose far goblins doze, so the map's never sent: client/bigsend.ts,
 * coop.ts `ms`): from the run, the same the leader built. An Instance's area (shared/instances.ts `areaOf`, its fork
 * way included) or an expedition's (shared/expedmap.ts). (Kyle, 2026-11-12: a guest stood off the map in an
 * Instance; it had built an expedition's map from the job's seed. The Deep chat found where.)
 */
import type { GameMap } from './arena.js';
import { expedPlan } from './expedmap.js';
import { areaOf } from './instances.js';
import type { Job } from './jobs.js';

export function guestMap(run: { job: Job; index: number; way?: number }): GameMap {
  const area = run.job.instance ? areaOf(run.job, run.index, run.way) : undefined;
  return area?.plan ? area.plan(run.job).map : expedPlan(run.job).map;
}
