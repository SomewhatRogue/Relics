/** The words for an element on a weapon (shared/edges.ts): the card's line and the toast when one is spent. */
import type { EdgeEl } from '../shared/edges';

const NAME: Record<EdgeEl, string> = { fire: 'FIRE', frost: 'FROST', storm: 'STORM' };

export const EDGEW = {
  name: (el: EdgeEl) => NAME[el],
  /** The card: FIRE: 3 JOBS LEFT. */
  card: (el: EdgeEl, jobs: number) => `${NAME[el]}: ${jobs} ${jobs === 1 ? 'JOB' : 'JOBS'} LEFT`,
  /** After the job that used the last of it. */
  gone: (el: EdgeEl) => `${NAME[el]} HAS WORN OFF YOUR WEAPON`,
};
