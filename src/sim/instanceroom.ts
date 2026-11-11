/**
 * An instance's area as the run's room (shared/instances.ts; docs/design/instances.md "Big without lag").
 * Only this area runs and is sent; the ones behind are done with. Its goblins doze till a hero comes near
 * (INSTANCE.wake, an area's distance, not a big map's: sim/sleep.ts), and with that a friend is sent only
 * what's near them (client/interest.ts). The pacing rules hold what's fighting at once to the party's
 * caps (sim/pacing.ts): a pack past them waits its turn. More goblins for more players, as a job's room,
 * and the named ones tougher (PARTY.boss).
 */
import { INSTANCE } from '../shared/tuning';
import { areaOf } from '../shared/instances';
import { ArenaRoom } from './room';
import { scaleBosses, scaleFoes } from './party';
import { dreadFor } from './dreadplace';
import type { Run } from './run';

export function instanceRoom(run: Run): ArenaRoom {
  const job = run.job, area = areaOf(job, run.index), n = Math.max(1, run.party ?? 1);
  if (!area?.plan) throw new Error(`instance area ${run.index} has no plan`);
  const plan = area.plan(job), seed = job.seed + run.index;
  const room = new ArenaRoom(seed, {
    map: plan.map, foes: scaleFoes(plan.foes, n, job.seed * 17 + run.index * 5 + 2), furniture: plan.props, chests: plan.chests,
    danger: job.place.ruin >= 3 ? 1 : 0, level: run.level ?? 1, sleep: true,
  });
  room.sleepAt = { wake: INSTANCE.wake, doze: INSTANCE.doze };
  room.pace = { index: run.index };
  scaleBosses(room.enemies, n);
  room.board = {};
  room.dread = { by: dreadFor(job) };
  return room;
}
