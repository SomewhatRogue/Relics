/**
 * Jobs by size (docs/design/holy-and-hungry.md, "Jobs by size"; Kyle, 2026-11-19: "some jobs are bigger than
 * others"). A piece's count goes up by the job's size, not by one, so a hero on big jobs sours a hungry piece (and
 * later grows a holy one) about as fast in minutes as one on short jobs. A medium job (about ten minutes) is one.
 * To tune with the job board's sizes and the balance bench (docs/design/balance.md).
 */
import type { Job } from './jobs.js';

export const UNITS = {
  short: 0.5, medium: 1, long: 2,
  /** An instance, an expedition or a Deep dive, whatever its floors. */
  big: 2,
  /** A great boss's end: Hempen in Hangman's Wood, the Doorkeepers in the great barn, an instance's end boss. */
  great: 3,
  /** Driven back: a share of what it would have counted. Gone early counts nothing, so leaving can't grow a piece. */
  beaten: 0.5,
};

/** Whether winning this job means a great boss beaten at its end. */
export const greatEnd = (j: Job) => !!j.instance || j.exped === 'hangmans' || (j.arena === 'doorkeepers' && !j.floor && !j.deep);

/** What a job finished counts for, by how it ended. */
export function jobUnits(j: Job, how: 'won' | 'beaten' | 'left' | 'dropped'): number {
  if (how === 'left' || how === 'dropped') return 0;
  const big = j.instance || j.exped || j.deep;
  const size = big ? UNITS.big : UNITS[j.size ?? 'medium'];
  if (how === 'won') return greatEnd(j) ? UNITS.great : size;
  return size * UNITS.beaten;
}
