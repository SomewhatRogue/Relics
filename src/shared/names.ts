/**
 * Hero names: one name, one hero, across every player (Kyle, 2026-11-13: "names check against server and
 * only allow unique ones"; api/names.ts keeps who has which). A name is held in capitals, spaces closed up, at
 * most 12 letters; a new hero's page suggests free ones from the pool (client/names.ts asks the server).
 */
import { NAME_POOL } from './namepool';

export const NAME_MAX = 12;
/** As a name is kept and compared: capitals, one space at most between words. */
export const normName = (n: string): string => n.trim().replace(/\s+/g, ' ').toUpperCase().slice(0, NAME_MAX).trim();
/** Two to twelve: letters, and a space, apostrophe or hyphen between them. */
export const NAME_OK = /^[A-Z](?:[A-Z]|[ '-](?=[A-Z])){1,11}$/;
/** At most this many names asked about in one go. */
export const NAMES_ASK = 12;

/** `n` names from the pool not in `not`, shuffled (a cosmetic draw: Math.random is fine here). */
export function drawNames(n: number, not: Iterable<string> = [], rand: () => number = Math.random): string[] {
  const skip = new Set(not), left = NAME_POOL.filter((x) => !skip.has(x));
  for (let i = left.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [left[i], left[j]] = [left[j], left[i]];
  }
  return left.slice(0, n);
}
