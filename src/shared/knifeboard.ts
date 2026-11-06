/**
 * The town's board at the Drowned Rat's knife board, kept in the shared world the way the butts' is
 * (shared/rangeboard.ts: one write per finished round, the read riding the world's usual look). A round
 * goes up only as the world plays it again from the hero's own seed and the moments they threw
 * (shared/knives.ts `replayKnives`), so a typed-in score or a round rolled again by refreshing doesn't get on.
 */
import { seedOf } from './fishing.js';
import { replayKnives } from './knives.js';
import { KNIVES } from './knifetune.js';
import type { HeroClass } from './weapons.js';

/** A finished round as sent: which of the hero's rounds it was, and the frame of each throw. */
export interface KnifeClaim { n: number; throws: number[] }

/** The seed of a hero's `n`th round at the board (its own, apart from the butts' and the table's). */
export const knifeSeed = (heroId: string, n: number) => seedOf(heroId + ':knives', n);

/** A claim as it came off the wire, or null if it isn't one. */
export function cleanKnifeClaim(raw: unknown): KnifeClaim | null {
  const c = raw as Partial<KnifeClaim> | null;
  if (!c || typeof c.n !== 'number' || !Number.isInteger(c.n) || c.n < 0 || c.n > 1e7 || !Array.isArray(c.throws) || c.throws.length !== KNIVES.knives) return null;
  return c.throws.every((f) => Number.isInteger(f) && f >= 0) ? { n: c.n, throws: [...c.throws] } : null;
}

/** What a claim scores, played again from the hero's own seed (0 if the throws don't add up). */
export function knifeClaimScore(heroId: string, cls: HeroClass, c: KnifeClaim): number {
  return replayKnives(knifeSeed(heroId, c.n), cls === 'ROGUE', c.throws)?.score ?? 0;
}
