/**
 * How fast a hero grows in a party. A bigger party fights more goblins (PARTY.foes), and every kill
 * used to pay every player in full, so three friends levelled at twice a solo hero's pace. Now the
 * kills are shared out so a party earns a little more than alone, not a multiple (Kyle, 2026-11-02).
 */
import { BOUNTY } from './progress.js';
import { PARTY } from './tuning.js';

/** Each player past the first adds this share to a job's experience. */
export const PACE = { partyXp: 0.15 };

/** One player's experience for a job: what the room earned, shared for the party's size, and the objective if won. */
export function jobXp(earned: number, won: boolean, party: number): number {
  const n = Math.max(1, party), more = 1 + PACE.partyXp * (n - 1), foes = 1 + PARTY.foes * (n - 1);
  return Math.round((earned * more) / foes) + (won ? Math.round(BOUNTY.objective * more) : 0);
}
