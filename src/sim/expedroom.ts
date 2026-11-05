/**
 * An expedition's room: the map and everything on it from the job's seed (shared/expedmap.ts), far
 * goblins dozing (sim/sleep.ts), and the expedition's rules on it (sim/exped.ts). Its camps, set pieces
 * and patrols are packs (shared/expedpacks.ts), scaled for a bigger party as a job's are (sim/packs.ts)
 * but lighter (EXPED_PACKS.party small ones a player past the first, not a job's half again: a phone
 * hosts this map, DECISIONS 2026-11-03): a tougher centrepiece, and the template's `more` from three
 * players. The waves grow by one a friend, and the named butcher toughens as ever.
 */
import { expedPlan } from '../shared/expedmap';
import type { Job } from '../shared/jobs';
import { EXPED_PACKS } from '../shared/tuning';
import { newExped } from './exped';
import { scalePacks } from './packs';
import { scaleBosses } from './party';
import { ArenaRoom } from './room';

export function expedRoom(job: Job, party = 1): ArenaRoom {
  const plan = expedPlan(job), foes = scalePacks(plan.foes, party, job.seed * 17 + 2, EXPED_PACKS.party);
  const room = new ArenaRoom(job.seed, { map: plan.map, foes, furniture: plan.props, chests: plan.chests, danger: 1, sleep: true });
  scaleBosses(room.enemies, party);
  room.exped = newExped(plan, job.seed, party);
  room.dread = { by: 'swarm' };
  return room;
}
