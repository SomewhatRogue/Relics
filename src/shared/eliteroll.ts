/**
 * Which meaty goblins of a room come as elites, and with what (numbers: shared/elites.ts). Rolled once the
 * room's templates are chosen and before its small ones are shared out, so an elite's extra threat comes
 * off the room's chaff. On a stream of its own: with elites off nothing else in the room moves.
 */
import { ELITE, affixPool, eliteThreat, type Affix } from './elites.js';
import type { Role, Template } from './encounters.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import { SCREEN, THREAT, THREAT_TIER, threatOf } from './threat.js';
import { weighOf } from './roombudget.js';
import { roomAt } from './deepbands.js';

/** Band `band`'s `nth` goblin of role `role` is an elite with `affixes`. */
export interface EliteRoll { band: number; role: Role; nth: number; affixes: Affix[] }

/** A sort that can be an elite: meaty, not the log-carriers (two bodies), not a BIG ONE. */
const can = (r: Role) => THREAT_TIER[r] === 'meaty' && r !== 'log';

/** The chance a meaty goblin in room `index` of `job` is an elite (0 before ELITE.from). */
export const eliteChance = (job: Job, index: number) => (ELITE.on && roomAt(job, index) >= ELITE.from ? ELITE.chance + ELITE.perRuin * job.place.ruin : 0);

/**
 * The roller for room `index` of `job`: called with each band's template as the composer picks it, in order
 * from the way in, it says which of its meaty goblins come as elites; each only if `afford` (what the room
 * can still spend on it, leaving a small one for every band) pays for its extra, and its pack stays within
 * a lone hero's screen. On its own stream, so with elites off (or none rolled) nothing else moves.
 */
export function eliteRoller(job: Job, index: number): (t: Template, band: number, afford: number) => EliteRoll[] {
  const p = eliteChance(job, index);
  if (p <= 0) return () => [];
  const rng = new Rng(job.seed * 151 + index * 43 + 17), most = job.deep ? ELITE.deep : ELITE.most;
  let made = 0;
  return (t, band, afford) => {
    const roles = [...(t.centre ?? []), ...(t.support ?? [])], seen: Partial<Record<Role, number>> = {}, out: EliteRoll[] = [];
    let room = Math.min(afford, SCREEN.threat[0] - THREAT.chaff - weighOf(t).threat);
    roles.forEach((role, k) => {
      const nth = seen[role] ?? 0;
      seen[role] = nth + 1;
      if (!can(role) || (t.big && k === 0) || made >= most || rng.next() >= p) return;
      let n = rng.next() < ELITE.two + ELITE.twoRuin * job.place.ruin ? 2 : 1;
      if (n === 2 && job.deep && rng.next() < ELITE.three) n = 3;
      // (An ironhide is plated already; a Kegman has its keg, a Gorger eats already: shared/elites.ts affixPool.)
      const affixes = rng.shuffle(affixPool(role)).slice(0, n);
      const extra = eliteThreat(threatOf(role), affixes) - threatOf(role);
      if (extra > room) return;
      room -= extra;
      made++;
      out.push({ band, role, nth, affixes });
    });
    return out;
  };
}

/** What the room's elites cost on top of their sorts: taken off the budget for the small ones. */
export const eliteExtra = (rolls: EliteRoll[]) => rolls.reduce((s, r) => s + eliteThreat(threatOf(r.role), r.affixes) - threatOf(r.role), 0);
