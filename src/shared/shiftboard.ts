/**
 * The forge's board of best shifts, kept in the shared world the way the knife board's is
 * (shared/knifeboard.ts): one write per finished shift, the read riding the world's usual look. A shift
 * goes up only as the world plays it again from the hero's own seed and the frames they struck
 * (shared/forgeshift.ts `replayShift`), so a typed-in score, or a shift rolled again by refreshing,
 * doesn't get on.
 */
import { seedOf } from './fishing.js';
import { replayShift } from './forgeshift.js';
import { SHIFT } from './shifttune.js';
import type { HeroClass } from './weapons.js';

/** A finished shift as sent: which of the hero's shifts it was, and the frame of each strike. */
export interface ShiftClaim { n: number; hits: number[] }

/** The seed of a hero's `n`th shift at the forge (its own, apart from the anvil's and the Rat's). */
export const shiftSeed = (heroId: string, n: number) => seedOf(heroId + ':shift', n);

/** A claim as it came off the wire, or null if it isn't one. */
export function cleanShiftClaim(raw: unknown): ShiftClaim | null {
  const c = raw as Partial<ShiftClaim> | null;
  if (!c || typeof c.n !== 'number' || !Number.isInteger(c.n) || c.n < 0 || c.n > 1e7 || !Array.isArray(c.hits) || !c.hits.length || c.hits.length > SHIFT.most) return null;
  const last = SHIFT.length * SHIFT.fps;
  return c.hits.every((f, i) => Number.isInteger(f) && f >= 0 && f < last && (i === 0 || f > c.hits![i - 1])) ? { n: c.n, hits: [...c.hits] } : null;
}

/** What a claim scores, played again from the hero's own seed, a Warrior's with their wider windows (0 if the strikes don't add up). */
export const shiftClaimScore = (heroId: string, cls: HeroClass, c: ShiftClaim): number => replayShift(shiftSeed(heroId, c.n), c.hits, cls === 'WARRIOR')?.score ?? 0;
