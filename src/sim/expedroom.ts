/**
 * An expedition's room: the map and everything on it from the job's seed (shared/expedmap.ts), far
 * goblins dozing (sim/sleep.ts), and the expedition's rules on it (sim/exped.ts). The goblins aren't
 * copied for a bigger party, as a job's are (a phone host's limits: DECISIONS 2026-11-03); the waves
 * grow by one a friend instead, and the named butcher toughens as ever.
 */
import { expedPlan } from '../shared/expedmap';
import type { Job } from '../shared/jobs';
import { newExped } from './exped';
import { scaleBosses } from './party';
import { ArenaRoom } from './room';

export function expedRoom(job: Job, party = 1): ArenaRoom {
  const plan = expedPlan(job);
  const room = new ArenaRoom(job.seed, { map: plan.map, foes: plan.foes, furniture: plan.props, chests: plan.chests, danger: 1, sleep: true });
  scaleBosses(room.enemies, party);
  room.exped = newExped(plan, job.seed, party);
  room.dread = { by: 'swarm' };
  return room;
}
