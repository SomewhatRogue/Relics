/**
 * A boss's arena as a job's last room (Job.arena): the Doorkeepers in the great barn (shared/barnarena.ts),
 * or in the Deep at a sealed door (shared/sealarena.ts); the Haulier in its haulage in the Deep (shared/sumparena.ts), or THE LISTENER in its cave (shared/cavearena.ts). Its bosses take the party's size for
 * their health (PARTY.boss, as every named one) and POISE bar (POISE_KIT.party), their bodies from their
 * tuning; the room keeps its notes on them (sim/bosskit.ts), with each phase's one seeded swap in the
 * rotation rolled here on the room's seed. The chained chest is the sure chest, on its own seed. No pacing
 * rules: the arena has its own. In the Deep, the floor's levels and toughness go on too (shared/deepbands.ts).
 */
import { DOORKEEPERS, HAULIER, LEECHMAN, LISTENER } from '../shared/tuning';
import { barnArena } from '../shared/barnarena';
import { sumpArena } from '../shared/sumparena';
import { caveArena } from '../shared/cavearena';
import { fenArena } from '../shared/fenarena';
import { sealArena } from '../shared/sealarena';
import { bandOf } from '../shared/deepbands';
import { deepEdge } from './deepedge';
import { Rng } from '../shared/rng';
import { ArenaRoom } from './room';
import { scaleBosses } from './party';
import { newBoss, newBook } from './bosskit';
import { dreadFor } from './dreadplace';
import type { Run } from './run';

export function arenaRoom(run: Run): ArenaRoom {
  const job = run.job, sump = job.arena === 'haulier', cave = job.arena === 'listener', fen = job.arena === 'leechman', plan = fen ? fenArena(job) : cave ? caveArena(job) : sump ? sumpArena(job) : job.floor ? sealArena(job) : barnArena(job), n = Math.max(1, run.party ?? 1), seed = job.seed + run.index;
  const fl = job.floor ?? 0, level = (run.level ?? 1) + (fl ? bandOf(fl).level : 0);
  const chests = plan.chests.map((c) => ({ ...c, boss: (seed * 13 + 7) >>> 0 }));
  const room = new ArenaRoom(seed, { map: plan.map, foes: plan.foes, furniture: plan.props, chests, level });
  room.floor = fl;
  scaleBosses(room.enemies, n);
  for (const e of room.enemies) {
    if (!e.boss) continue;
    const body = e.boss.who === 'leechman' ? { radius: LEECHMAN.radius, weight: LEECHMAN.weight, fx: 0, fy: 1 } : e.boss.who === 'listener' ? { radius: LISTENER.radius, weight: LISTENER.weight, fx: 0, fy: 1 } : e.boss.who === 'haulier' ? { radius: HAULIER.radius, weight: HAULIER.weight, fx: 0, fy: 1 } : { radius: DOORKEEPERS.radius, weight: DOORKEEPERS.weight, fx: 0, fy: -1 };
    Object.assign(e, { boss: newBoss(e.boss.who, n), ...body });
  }
  // A Deep floor's edge: bosses quicker to kill, everything harder hitting (sim/deepedge.ts).
  deepEdge(room.enemies, fl);
  const rng = new Rng(seed * 811 + 5);
  room.bosses = newBook(n, [rng.int(5), rng.int(5)], fen ? 'leechman' : cave ? 'listener' : sump ? 'haulier' : undefined);
  room.board = {};
  room.dread = { by: dreadFor(job) };
  return room;
}
