/**
 * An instance's area as the run's room (shared/instances.ts; docs/design/instances.md "Big without lag").
 * Only this area runs and is sent; the ones behind are done with. Its goblins doze till a hero comes near
 * (INSTANCE.wake, an area's distance, not a big map's: sim/sleep.ts), and with that a friend is sent only
 * what's near them (client/interest.ts). The pacing rules hold what's fighting at once to the party's
 * caps (sim/pacing.ts): a pack past them waits its turn. Built for three heroes and never easier below that;
 * each past three, every goblin tougher and harder hitting, never more of them (INSTANCE.party, .more); the
 * named ones as any named one, from three up (PARTY.boss).
 */
import { HAULIER, INSTANCE } from '../shared/tuning';
import { Rng } from '../shared/rng';
import { newBoss, newBook } from './bosskit';
import { areaOf } from '../shared/instances';
import { ArenaRoom } from './room';
import { scaleBosses } from './party';
import { dreadFor } from './dreadplace';
import type { Run } from './run';

/** The party an instance is built for: the heroes in it, three at the least. */
export const instanceParty = (run: Run) => Math.max(INSTANCE.party, run.party ?? 1);

export function instanceRoom(run: Run): ArenaRoom {
  const job = run.job, area = areaOf(job, run.index, run.way), n = instanceParty(run);
  if (!area?.plan) throw new Error(`instance area ${run.index} has no plan`);
  const plan = area.plan(job), seed = job.seed + run.index;
  const room = new ArenaRoom(seed, {
    map: plan.map, foes: plan.foes, furniture: plan.props, chests: plan.chests,
    danger: job.place.ruin >= 3 ? 1 : 0, level: run.level ?? 1, sleep: true,
  });
  room.sleepAt = { wake: INSTANCE.wake, doze: INSTANCE.doze };
  room.pace = { index: run.index };
  // Tougher than a job's goblins, whoever comes (INSTANCE.tough). (A boss of the kit, the Haulier at the loading
  // stage, is tuned as in its own arena: below.)
  const T = INSTANCE.tough;
  for (const e of room.enemies) {
    if (e.boss) continue;
    e.fierce = true;
    const k = e.name ? T.named : T.hp;
    e.hp = e.maxHp = Math.round(e.maxHp * k);
    if (!e.name) e.harm = +((e.harm ?? 1) * T.harm).toFixed(3);
  }
  scaleBosses(room.enemies, n);
  kitBosses(room, n, seed);
  const past = n - INSTANCE.party;
  if (past > 0) for (const e of room.enemies) if (!e.name && !e.boss) (e.hp = e.maxHp = Math.round(e.maxHp * (1 + INSTANCE.more.hp * past))), (e.harm = +((e.harm ?? 1) * (1 + INSTANCE.more.harm * past)).toFixed(3));
  room.board = {};
  room.dread = { by: dreadFor(job) };
  return room;
}

/**
 * A boss of the kit laid in an area (the Haulier at the loading stage: shared/cutloading.ts): its body, its notes and
 * its book, as its own arena sets them (sim/arenaroom.ts), and the chained chest behind it the sure one.
 */
function kitBosses(room: ArenaRoom, n: number, seed: number): void {
  const kit = room.enemies.filter((e) => e.boss);
  if (!kit.length) return;
  for (const e of kit) Object.assign(e, { boss: newBoss(e.boss!.who, n), radius: HAULIER.radius, weight: HAULIER.weight, fx: 0, fy: 1 });
  for (const c of room.chests) if (c.chained) c.boss = (seed * 13 + 7) >>> 0;
  const rng = new Rng(seed * 811 + 5);
  room.bosses = newBook(n, [rng.int(5), rng.int(5)], 'haulier');
}
