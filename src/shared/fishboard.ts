/**
 * The millpond's best catch on the town's board (Kyle, 2026-11-06, Best in Wickhold: client/bestui.ts), kept
 * in the shared world like the butts' and the forge's (shared/rangeboard.ts). A landed fish goes up as which
 * cast it was and how far out it went: the world rolls the fish again from the hero's own seed for that cast
 * (shared/fishing.ts `cast`), so a weight typed in by hand doesn't get on. The fight on the line isn't played
 * again, only what took the hook. Pure and isomorphic.
 */
import { Rng } from './rng.js';
import { rollFish, seedOf } from './fishing.js';
import type { FishId } from './fishtune.js';
import type { RangeLine } from './rangeboard.js';

/** A landed fish as sent: which of the hero's casts it was, and how far out (0 by the bank, 1 far out). */
export interface FishClaim { n: number; reach: number }
/** One line on the board: the hero, and their biggest fish (`n`, in ounces) and what it was. */
export interface FishLine extends RangeLine { sp: FishId }

/** A claim as it came off the wire, or null if it isn't one. */
export function cleanFishClaim(raw: unknown): FishClaim | null {
  const c = raw as Partial<FishClaim> | null;
  if (!c || typeof c.n !== 'number' || !Number.isInteger(c.n) || c.n < 0 || c.n > 1e7) return null;
  if (typeof c.reach !== 'number' || !Number.isFinite(c.reach) || c.reach < 0 || c.reach > 1) return null;
  return { n: c.n, reach: c.reach };
}

/** The fish a cast took, rolled again as the cast rolled it: its seed's first two draws and its reach. */
export function fishClaimCatch(heroId: string, c: FishClaim): { sp: FishId; oz: number } {
  const r = new Rng(seedOf(heroId, c.n)), f = rollFish(c.reach, r.next(), r.next());
  return { sp: f.sp, oz: f.oz };
}
