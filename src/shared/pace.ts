/**
 * How fast a hero grows in a party. A bigger party fights more goblins (PARTY.foes), and every kill
 * used to pay every player in full, so three friends levelled at twice a solo hero's pace. Now the
 * kills are shared out so a party earns a little more than alone, not a multiple (Kyle, 2026-11-02).
 */
import { BOUNTY, levelFor, type Profile } from './progress.js';
import { PARTY } from './tuning.js';

/** Each player past the first adds this share to a job's experience. */
export const PACE = { partyXp: 0.15 };

/** One player's experience for a job: what the room earned, shared for the party's size, and the objective if won. */
export function jobXp(earned: number, won: boolean, party: number): number {
  const n = Math.max(1, party), more = 1 + PACE.partyXp * (n - 1), foes = 1 + PARTY.foes * (n - 1);
  return Math.round((earned * more) / foes) + (won ? Math.round(BOUNTY.objective * more) : 0);
}

/**
 * Levels a hero has surely grown on a job so far (before it's paid): what a lost job would still give
 * them now. Each one is lit up in the room as it comes (sim/grow.ts); any the job's own pay adds are lit
 * at home.
 */
export const dueLevels = (p: Profile, earned: number, party: number) => levelFor(p.xp + jobXp(earned, false, party)) - p.level;
