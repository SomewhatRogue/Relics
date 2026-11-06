/**
 * One gentle callout for each hero in a party who led it at something (MOST GOBLINS, MOST HEALING), and
 * only a real lead: more than anyone else, not tied, and more than nothing. A party of one leads nobody,
 * so it gets none. A hero leading at several things gets the first of them in CALL_ORDER. Words in
 * recapwords.ts (RECAPW.call).
 */
import type { Count, Score } from '../sim/score';

/** What a callout can be for: a count to lead, or `standing` (the only one never downed when the rest were). */
// (RAISE's counts, `rose` and `cut`, are rows, not callouts.)
export type CallId = Exclude<Count, 'taken' | 'downs' | 'rose' | 'cut'> | 'standing';
export const CALL_ORDER: readonly CallId[] = ['kills', 'dealt', 'healed', 'raised', 'dodges', 'blocks', 'best', 'standing'];

/** Does `s` lead everyone in `all` at `c`? */
export function leads(s: Score, all: Score[], c: CallId): boolean {
  const others = all.filter((o) => o !== s);
  if (!others.length) return false;
  if (c === 'standing') return s.downs === 0 && others.every((o) => o.downs > 0);
  return s[c] > 0 && others.every((o) => o[c] < s[c]);
}

/** Each hero's callout, by their index in `all` (none where they led at nothing). */
export function callouts(all: Score[]): (CallId | undefined)[] {
  return all.map((s) => CALL_ORDER.find((c) => leads(s, all, c)));
}
