/**
 * An expedition's room: the map and everything on it from the job's seed (shared/expedmap.ts), far
 * goblins dozing (sim/sleep.ts), and the expedition's rules on it (sim/exped.ts). Its camps, set pieces
 * and patrols are packs (shared/expedpacks.ts), scaled for a bigger party as a job's are (sim/packs.ts)
 * a few more small ones a player past the first (EXPED_PACKS.party; a phone hosts this map, DECISIONS
 * 2026-11-03), every goblin tougher and harder hitting by the party's size and its level, and the
 * template's `more` from three players. The waves grow by one for every two friends, and the named
 * butcher toughens as ever.
 */
import { expedPlan } from '../shared/expedmap';
import type { Job } from '../shared/jobs';
import { EXPED_PACKS } from '../shared/tuning';
import { expedSky } from '../shared/expedsky';
import { newExped } from './exped';
import { scalePacks } from './packs';
import { scaleBosses } from './party';
import { ArenaRoom } from './room';
import { hempenOnto } from './hempenbook';

export function expedRoom(job: Job, party = 1, level = 1): ArenaRoom {
  const plan = expedPlan(job), foes = scalePacks(plan.foes, party, job.seed * 17 + 2, EXPED_PACKS.party);
  const room = new ArenaRoom(job.seed, { map: plan.map, foes, furniture: plan.props, chests: plan.chests, danger: 1, sleep: true, level });
  // The pacing rules as a job's later rooms (sim/pacing.ts): packs held back over the caps, waves at the holds too.
  room.pace = { index: 2 };
  scaleBosses(room.enemies, party);
  // Hangman's Wood: Hempen in the boss format, its hoard the sure chest (sim/hempenbook.ts).
  if (job.exped === 'hangmans') hempenOnto(room, party, job.seed);
  room.exped = newExped(plan, job.seed, party);
  room.exped.wx = expedSky(job);
  room.dread = { by: 'swarm' };
  return room;
}
