/**
 * A run: a job's rooms one after another. Each room's goal (clear the goblins; in the last room, the
 * job's objective) opens the way out; walking out starts the next room or ends the run. Kills pay
 * gold and experience, the freed count once they're brought out (and not if the party kills them first),
 * three downs and the run fails.
 */
import { BOUNTY } from '../shared/progress';
import type { Job } from '../shared/jobs';
import { runInterior } from '../shared/interiors';
import { planRoom, type RoadId } from '../shared/terrain';
import { isDead } from './damage';
import { ArenaRoom } from './room';
import { allOut, players, scaleBosses, scaleFoes } from './party';
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
  /** Goblins killed and dens burned (for the Roll of the Brave and the town works). */
  kills: number;
  dens: number;
  /** For the Roll: butchers felled, and this player's own falls, rescues, friends raised and friends felled. */
  butchers?: number;
  falls?: number;
  carried?: number;
  raised?: number;
  teamkills?: number;
  /** Blows landed on the freed, and freed people killed, by hero id (each player's own, so a friend's game reads theirs). */
  rescueHits?: Record<string, number>;
  rescueKills?: Record<string, number>;
  /** The road the party took into each room after a fork (by room index). */
  roads: Record<number, RoadId>;
  /** Players in the party when each room is built (it scales the goblins; the ones left, if some went home). */
  party?: number;
}

export const MAX_DOWNS = 3;
export const newRun = (job: Job): Run => ({ job, index: 0, gold: 0, xp: 0, rescued: 0, downs: 0, failed: false, roads: {}, kills: 0, dens: 0 });

/** Build the room for the run's current index. */
export function runRoom(run: Run): ArenaRoom {
  const plan = planRoom(run.job, run.index, run.roads[run.index]), n = run.party ?? 1;
  // Worse places and deep jobs shift every chest roll a tier up.
  const danger = (run.job.place.ruin >= 3 ? 1 : 0) + (run.job.deep ? 1 : 0);
  const room = new ArenaRoom(run.job.seed + run.index, { map: plan.map, foes: scaleFoes(plan.foes, n), furniture: plan.props, chests: plan.chests, danger });
  scaleBosses(room.enemies, n);
  return room;
}

/** Inside a cottage or barn in the current room (you can always walk back out). */
export function interiorRoom(run: Run, blockIndex: number, door: string): ArenaRoom {
  const plan = runInterior(run.job, run.index, blockIndex, door);
  const room = new ArenaRoom(run.job.seed * 3 + run.index * 11 + blockIndex + 7, { map: plan.map, foes: plan.foes, furniture: plan.props });
  room.exitOpen = true;
  room.indoors = true;
  return room;
}

export const isFinal = (run: Run) => run.index === run.job.rooms - 1;

/** Count what a tick's events earned. `me` is the player whose downs count. */
export function tally(run: Run, room: ArenaRoom, events: FightEvent[], me: string): void {
  for (const ev of events) {
    if (ev.k === 'death') {
      const e = room.enemies.find((x) => Math.abs(x.x - ev.x) < 0.01 && Math.abs(x.y - ev.y) < 0.01);
      const b = e?.name ? BOUNTY.boss : ev.kind === 'butcher' ? BOUNTY.butcher : ev.kind === 'scrapper' ? BOUNTY.scrapper : null;
      if (b) (run.xp += b.xp), run.kills++;
      if (b && b !== BOUNTY.scrapper) run.butchers = (run.butchers ?? 0) + 1;
    } else if (ev.k === 'gold') {
      // One pot for the party: whoever picks it up, everyone is paid the lot at the end.
      if (ev.id === me || players(room.heroes).some((h) => h.id === ev.id)) run.gold += ev.n;
    } else if (ev.k === 'collapse') {
      if (room.map.blocks.some((x) => x.kind === 'den' && x.x === ev.x && x.y === ev.y)) run.dens++;
    } else if (ev.k === 'survivorhome') {
      // Freed is not saved: they count once they're brought out (sim/survivors.ts).
      run.rescued++;
      run.xp += BOUNTY.rescue;
    } else if (ev.k === 'survivorhit') {
      if (ev.by && !ev.tick) (run.rescueHits ??= {})[ev.by] = (run.rescueHits[ev.by] ?? 0) + 1;
    } else if (ev.k === 'survivordeath') {
      if (ev.by) (run.rescueKills ??= {})[ev.by] = (run.rescueKills[ev.by] ?? 0) + 1;
    } else if (ev.k === 'pickedup') {
      if (ev.id === me) run.carried = (run.carried ?? 0) + 1;
      if (ev.by === me) run.raised = (run.raised ?? 0) + 1;
    }
    if (ev.k === 'down' && ev.id === me) run.falls = (run.falls ?? 0) + 1;
    if (ev.k === 'down' && ev.by === me) run.teamkills = (run.teamkills ?? 0) + 1;
    if (ev.k === 'down' && players(room.heroes).length < 2) {
      // Alone, three downs and it's lost; in a party, it's lost when everyone is out.
      const h = room.heroes.find((x) => x.id === me);
      if (h && Math.abs(h.x - ev.x) < 0.01 && Math.abs(h.y - ev.y) < 0.01) run.downs++;
    }
  }
  if (run.downs >= MAX_DOWNS || allOut(room.heroes)) run.failed = true;
}

/** The room's goal, in words, and whether it's met. */
export function goal(run: Run, room: ArenaRoom): { text: string; done: boolean } {
  const goblins = room.enemies.filter((e) => !isDead(e)).length;
  if (!isFinal(run)) {
    const fork = !!room.map.roads;
    return { text: goblins ? `Clear the goblins (${goblins} left)` : fork ? 'Pick a road, together. HIGH: archers up top, fewer below. LOW: more goblins, someone caged' : 'The way ahead is open', done: goblins === 0 };
  }
  const o = run.job.objective;
  const cages = room.props.filter((p) => p.kind === 'cage' && !p.broken).length;
  // The freed still to be walked back to the way in.
  const waiting = room.survivors.filter((s) => !s.dead && s.home < 0).length;
  if (o === 'rescue') return { text: cages ? `Break the cages (${cages} left)` : 'Everyone is free. Get them out', done: cages === 0 && !waiting };
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
  return { text: cages ? `Free the caged (${cages} left)` : waiting ? 'Everyone is free. Get them out' : 'Ring the bell: get out', done: cages === 0 && !waiting };
}
