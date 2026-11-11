/**
 * A boss's arena as a job's last room (Job.arena): the Doorkeepers in the great barn (shared/barnarena.ts),
 * or the Haulier in its working in the Deep (shared/sumparena.ts). Its bosses take the party's size for
 * their health (PARTY.boss, as every named one) and POISE bar (POISE_KIT.party), their bodies from their
 * tuning; the room keeps its notes on them (sim/bosskit.ts), with each phase's one seeded swap in the
 * rotation rolled here on the room's seed. The chained chest is the sure chest, on its own seed. No pacing
 * rules: the arena has its own. In the Deep, the floor's levels and toughness go on too (shared/deepbands.ts).
 */
import { DOORKEEPERS, HAULIER } from '../shared/tuning';
import { barnArena } from '../shared/barnarena';
import { sumpArena } from '../shared/sumparena';
import { bandOf, deepGrow } from '../shared/deepbands';
import { Rng } from '../shared/rng';
import { ArenaRoom } from './room';
import { scaleBosses } from './party';
import { newBoss, newBook } from './bosskit';
import { dreadFor } from './dreadplace';
import type { Run } from './run';

export function arenaRoom(run: Run): ArenaRoom {
  const job = run.job, sump = job.arena === 'haulier', plan = sump ? sumpArena(job) : barnArena(job), n = Math.max(1, run.party ?? 1), seed = job.seed + run.index;
  const fl = job.floor ?? 0, level = (run.level ?? 1) + (fl ? bandOf(fl).level : 0);
  const chests = plan.chests.map((c) => ({ ...c, boss: (seed * 13 + 7) >>> 0 }));
  const room = new ArenaRoom(seed, { map: plan.map, foes: plan.foes, furniture: plan.props, chests, level });
  room.floor = fl;
  scaleBosses(room.enemies, n);
  const grow = fl ? deepGrow(fl) : null;
  for (const e of room.enemies) {
    if (!e.boss) continue;
    const body = e.boss.who === 'haulier' ? { radius: HAULIER.radius, weight: HAULIER.weight, fx: 0, fy: 1 } : { radius: DOORKEEPERS.radius, weight: DOORKEEPERS.weight, fx: 0, fy: -1 };
    Object.assign(e, { boss: newBoss(e.boss.who, n), ...body });
    // Past fifteen floors, tougher again a floor (shared/deepbands.ts DEEP_PAST).
    if (grow && grow.hp > 1) (e.hp = e.maxHp = Math.round(e.maxHp * grow.hp)), (e.harm = +((e.harm ?? 1) * grow.harm).toFixed(3));
  }
  const rng = new Rng(seed * 811 + 5);
  room.bosses = newBook(n, [rng.int(5), rng.int(5)], sump ? 'haulier' : undefined);
  room.board = {};
  room.dread = { by: dreadFor(job) };
  return room;
}
