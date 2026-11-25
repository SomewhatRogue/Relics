/** The words for an element on a weapon (shared/edges.ts): the card's line and the toast when one is spent. */
import type { EdgeEl, Grade } from '../shared/edges';

/** The grade's word before the element: '' plain, STRONG, FIERCE. */
const PRE: Record<Grade, string> = { 1: '', 2: 'STRONG ', 3: 'FIERCE ' };
const NAME: Record<EdgeEl, string> = { fire: 'FIRE', frost: 'FROST', storm: 'STORM' };

export const EDGEW = {
  name: (el: EdgeEl) => NAME[el],
  /** The card: FIRE: 3 JOBS LEFT (STRONG FIRE, FIERCE FIRE for the higher grades). */
  card: (el: EdgeEl, jobs: number, grade: Grade = 1) => `${PRE[grade]}${NAME[el]}: ${jobs} ${jobs === 1 ? 'JOB' : 'JOBS'} LEFT`,
  /** After the job that used the last of it. */
  gone: (el: EdgeEl, grade: Grade = 1) => `${PRE[grade]}${NAME[el]} HAS WORN OFF YOUR WEAPON`,
};
