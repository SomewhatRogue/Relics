/**
 * A territory's room (shared/territory.ts; docs/design/territories.md): one of its hand-laid maps of zones, scapes
 * and gates (the run's index: a territory is its maps stitched end to end), built from the job's seed alone. Its goblins doze till a hero comes near (TERR.wake: sim/sleep.ts),
 * so only the ground the party is on runs and is sent, and the pacing rules hold what fights at once to the
 * party's caps (sim/pacing.ts). Its gates and checkpoints are the Open Cut's (sim/stretches.ts,
 * sim/checkpoint.ts): the run steps them for a territory as for an instance (sim/run.ts).
 *
 * Tuned for one hero. Each hero past the first makes every goblin tougher and harder hitting, never more of
 * them (TERR.more; Kyle, 2026-11-17); the named ones toughen as any named one does (PARTY.boss).
 */
import { TERR, territoryPlan } from '../shared/territory';
import { dreadFor } from './dreadplace';
import { scaleBosses } from './party';
import { ArenaRoom } from './room';
import type { Run } from './run';

export function landRoom(run: Run): ArenaRoom {
  const job = run.job, plan = territoryPlan(job, run.index), n = Math.max(1, run.party ?? 1);
  const room = new ArenaRoom(job.seed + run.index, {
    map: plan.map, foes: plan.foes, furniture: plan.props, chests: plan.chests,
    danger: job.place.ruin >= 3 ? 1 : 0, level: run.level ?? 1, sleep: true,
  });
  room.sleepAt = { wake: TERR.wake, doze: TERR.doze };
  room.pace = { index: 2 };
  const past = n - 1;
  if (past > 0) for (const e of room.allEnemies) {
    if (e.name || e.boss) continue;
    e.hp = e.maxHp = Math.round(e.maxHp * (1 + TERR.more.hp * past));
    e.harm = +((e.harm ?? 1) * (1 + TERR.more.harm * past)).toFixed(3);
  }
  scaleBosses(room.enemies, n);
  room.board = {};
  room.dread = { by: dreadFor(job) };
  // Out in the open, a cage can hold a false prisoner (sim/falsecage.ts), as on a job.
  room.falseCages = true;
  return room;
}
