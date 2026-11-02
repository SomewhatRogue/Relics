/** The treasure at the end of a job won (TREASURE in loot.ts): rolled for one player alone. */
/** What the board says a job's treasure is. */
export const treasureWord = (job: Job) => (job.rooms >= 5 ? 'two pieces of treasure, a cut above' : job.rooms >= 3 ? 'a piece of treasure, maybe two' : 'a piece of treasure');
import { rollTier } from './gear';
import { rollAny } from './hungry';
import type { Job } from './jobs';
import { TREASURE } from './loot';
import { Rng } from './rng';
import type { HeroClass, Item } from './tuning';

export function treasure(job: Job, cls: HeroClass, who: string, runs: number): Item[] {
  let seed = job.seed * 31 + runs * 7;
  for (const c of who) seed = (seed * 33 + c.charCodeAt(0)) >>> 0;
  const rng = new Rng(seed || 1), long = job.rooms >= 5, worse = job.place.ruin >= 3 || !!job.deep || long;
  // A short job: one piece. Medium: maybe two. Long: two, a cut above.
  const n = long ? 2 : 1 + (job.rooms >= 3 && rng.next() < TREASURE.second ? 1 : 0), out: Item[] = [];
  for (let i = 0; i < n; i++) {
    let r = rng.next(), slot: 'weapon' | 'armor' | 'ring' = 'weapon';
    for (const [s, p] of TREASURE.slots) if ((r -= p) < 0) { slot = s; break; }
    out.push(rollAny(rng, cls, rollTier(rng, worse ? 'named' : 'butcher', worse ? 1 : 0), slot, undefined, job.boss));
  }
  return out;
}
