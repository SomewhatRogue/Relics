/**
 * A run: a job's rooms one after another. Each room's goal (clear the goblins; in the last room, the
 * job's objective) opens the way out; walking out starts the next room or ends the run. Kills pay
 * gold and experience, freed survivors come home with you, three downs and the run fails.
 */
import { BOUNTY } from '../shared/progress';
import type { Job } from '../shared/jobs';
import { runInterior } from '../shared/interiors';
import { planRoom } from '../shared/terrain';
import { isDead } from './damage';
import { ArenaRoom } from './room';
import type { FightEvent } from './types';

export interface Run {
  job: Job;
  /** Which room (0-based). */
  index: number;
  gold: number;
  xp: number;
  rescued: number;
  downs: number;
  failed: boolean;
}

export const MAX_DOWNS = 3;
export const newRun = (job: Job): Run => ({ job, index: 0, gold: 0, xp: 0, rescued: 0, downs: 0, failed: false });

/** Build the room for the run's current index. */
export function runRoom(run: Run): ArenaRoom {
  const plan = planRoom(run.job, run.index);
  return new ArenaRoom(run.job.seed + run.index, { map: plan.map, foes: plan.foes, furniture: plan.props });
}

/** Inside a cottage or barn in the current room (you can always walk back out). */
export function interiorRoom(run: Run, blockIndex: number, door: string): ArenaRoom {
  const plan = runInterior(run.job, run.index, blockIndex, door);
  const room = new ArenaRoom(run.job.seed * 3 + run.index * 11 + blockIndex + 7, { map: plan.map, foes: plan.foes, furniture: plan.props });
  room.exitOpen = true;
  return room;
}

export const isFinal = (run: Run) => run.index === run.job.rooms - 1;

/** Count what a tick's events earned. `me` is the player whose downs count. */
export function tally(run: Run, room: ArenaRoom, events: FightEvent[], me: string): void {
  for (const ev of events) {
    if (ev.k === 'death') {
      const e = room.enemies.find((x) => Math.abs(x.x - ev.x) < 0.01 && Math.abs(x.y - ev.y) < 0.01);
      const b = e?.name ? BOUNTY.boss : ev.kind === 'butcher' ? BOUNTY.butcher : ev.kind === 'scrapper' ? BOUNTY.scrapper : null;
      if (b) (run.gold += b.gold), (run.xp += b.xp);
    } else if (ev.k === 'freed') {
      run.rescued++;
      run.xp += BOUNTY.rescue;
    } else if (ev.k === 'down') {
      const h = room.heroes.find((x) => x.id === me);
      if (h && Math.abs(h.x - ev.x) < 0.01 && Math.abs(h.y - ev.y) < 0.01) run.downs++;
    }
  }
  if (run.downs >= MAX_DOWNS) run.failed = true;
}

/** The room's goal, in words, and whether it's met. */
export function goal(run: Run, room: ArenaRoom): { text: string; done: boolean } {
  const goblins = room.enemies.filter((e) => !isDead(e)).length;
  if (!isFinal(run)) return { text: goblins ? `Clear the goblins (${goblins} left)` : 'The way ahead is open', done: goblins === 0 };
  const o = run.job.objective;
  const cages = room.props.filter((p) => p.kind === 'cage' && !p.broken).length;
  if (o === 'rescue') return { text: cages ? `Break the cages (${cages} left)` : 'Everyone is free. Get them out', done: cages === 0 };
  if (o === 'larder') {
    const racks = room.props.filter((p) => p.kind === 'larder' && !p.broken).length;
    return { text: racks ? `Smash the larder (${racks} racks left)` : 'The larder is ruined. Get out', done: racks === 0 };
  }
  if (o === 'burn') {
    const dens = room.map.blocks.filter((b) => b.kind === 'den' && !b.ruined).length;
    return { text: dens ? `Burn out the dens (${dens} left)` : 'The dens are ash. Get out', done: dens === 0 };
  }
  const boss = room.enemies.find((e) => e.name);
  const bossDead = !boss || isDead(boss);
  if (o === 'hunt') return { text: bossDead ? `${run.job.boss} is dead. Get out` : `Kill ${run.job.boss}`, done: bossDead };
  // The story mission: the boss and every cage.
  if (!bossDead) return { text: `Kill ${run.job.boss}${cages ? `, free the caged (${cages})` : ''}`, done: false };
  return { text: cages ? `Free the caged (${cages} left)` : 'Ring the bell: get out', done: cages === 0 };
}
