/**
 * A boss's arena as a job's last room (Job.arena): the Doorkeepers in the great barn (shared/barnarena.ts).
 * Its bosses take the party's size for their health (PARTY.boss, as every named one) and POISE bar
 * (POISE_KIT.party), their bodies from DOORKEEPERS; the room keeps its notes on them (sim/bosskit.ts), with
 * each phase's one seeded swap in the rotation rolled here on the room's seed. The chained chest is the
 * sure chest, on its own seed. No pacing rules: the arena has its own.
 */
import { DOORKEEPERS } from '../shared/tuning';
import { barnArena } from '../shared/barnarena';
import { Rng } from '../shared/rng';
import { ArenaRoom } from './room';
import { scaleBosses } from './party';
import { newBoss, newBook } from './bosskit';
import { dreadFor } from './dreadplace';
import type { Run } from './run';

export function arenaRoom(run: Run): ArenaRoom {
  const job = run.job, plan = barnArena(job), n = Math.max(1, run.party ?? 1), seed = job.seed + run.index;
  const chests = plan.chests.map((c) => ({ ...c, boss: (seed * 13 + 7) >>> 0 }));
  const room = new ArenaRoom(seed, { map: plan.map, foes: plan.foes, furniture: plan.props, chests, level: run.level ?? 1 });
  scaleBosses(room.enemies, n);
  for (const e of room.enemies) {
    if (!e.boss) continue;
    Object.assign(e, { boss: newBoss(e.boss.who, n), radius: DOORKEEPERS.radius, weight: DOORKEEPERS.weight, fx: 0, fy: -1 });
  }
  const rng = new Rng(seed * 811 + 5);
  room.bosses = newBook(n, [rng.int(5), rng.int(5)]);
  room.board = {};
  room.dread = { by: dreadFor(job) };
  return room;
}
