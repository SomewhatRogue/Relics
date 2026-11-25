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
import { ringSpot } from './travel';

export function landRoom(run: Run): ArenaRoom {
  const job = run.job, plan = territoryPlan(job, run.index), n = Math.max(1, run.party ?? 1);
  const room = new ArenaRoom(job.seed + run.index, {
    map: plan.map, foes: plan.foes, furniture: plan.props, chests: plan.chests,
    danger: job.place.ruin >= 3 ? 1 : 0, level: run.level ?? 1, sleep: true,
  });
  room.sleepAt = { wake: TERR.wake, doze: TERR.doze };
  room.pace = { index: 2 };
  if (job.roam) room.roam = true;
  // Out from the gate to a found shelter: the party starts in its ring, and a fall wakes them there (sim/travel.ts).
  const start = job.roam ? room.map.stations?.find((s) => s.name === job.at) : undefined;
  if (start) (room.map.hero = ringSpot(room, start)), (run.rest = { ...room.map.hero });
  const past = n - 1;
  // (Kept on the room: goblins a mini quest wakes later are as tough: sim/minis.ts.)
  if (past > 0) room.tough = { hp: 1 + TERR.more.hp * past, harm: 1 + TERR.more.harm * past };
  if (room.tough) for (const e of room.allEnemies) {
    if (e.name || e.boss) continue;
    e.hp = e.maxHp = Math.round(e.maxHp * room.tough.hp);
    e.harm = +((e.harm ?? 1) * room.tough.harm).toFixed(3);
  }
  scaleBosses(room.enemies, n);
  room.board = {};
  room.dread = { by: dreadFor(job) };
  // Out in the open, a cage can hold a false prisoner (sim/falsecage.ts), as on a job.
  room.falseCages = true;
  return room;
}
