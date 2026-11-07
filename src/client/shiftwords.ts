/**
 * The words for a shift at Halvard's forge (shiftmode.ts, shiftui.ts, shiftview.ts). New with it; not yet
 * through the lore keeper or the line editor. Halvard is a man of few words; the rest is plain.
 */
import type { PieceKind } from '../shared/shifttune';

const mins = (secs: number) => Math.max(1, Math.ceil(secs / 60));

export const SHIFTW = {
  /** On the forge's panel. */
  work: 'WORK A SHIFT',
  /** Halvard, offering the work. */
  offer: "There's town work waiting. Nails, horseshoes, hinges, a blade blank now and then. I heat them and hold them, you hit them when they glow brightest. I pay for what comes out right.",
  /** Halvard, in the rest after a paid shift. */
  resting: (secs: number) => `Nothing more to pay for yet. Come back in ${mins(secs)} minute${mins(secs) === 1 ? '' : 's'}.`,
  unpaid: "You can still work a shift for the board. It just won't pay.",
  pays: (cap: number) => `A good shift pays up to ${cap} gold.`,
  yourBest: (n: number) => `Your best shift: ${n}.`,
  board: 'BEST SHIFTS AT THE FORGE',
  empty: "Nobody's on the board yet.",
  offline: 'Only your own shifts show until you play online.',
  back: 'BACK',
  /** At the anvil. */
  greet: 'Here.',
  hintTouch: 'TAP TO STRIKE WHEN THE PIECE GLOWS BRIGHTEST',
  hintMouse: 'CLICK OR PRESS SPACE TO STRIKE WHEN THE PIECE GLOWS BRIGHTEST',
  score: 'SCORE',
  time: 'TIME',
  stop: 'STOP',
  names: { nail: 'NAIL', shoe: 'HORSESHOE', hinge: 'HINGE', blank: 'BLADE BLANK' } as Record<PieceKind, string>,
  streak: (n: number) => `${n} IN A ROW`,
  made: (pts: number) => `DONE +${pts}`,
  spoiled: 'SPOILED',
  last: 'LAST TEN SECONDS',
  /** The card. */
  over: 'SHIFT DONE',
  cut: 'SHIFT CUT SHORT',
  halvard: { good: 'Good work.', fair: "That'll do.", poor: 'Half of that goes back in the fire.' },
  rows: { score: 'SCORE', made: 'PIECES DONE', spoiled: 'SPOILED', clean: 'CLEAN STRIKES', streak: 'BEST RUN', best: 'YOUR BEST', newBest: 'NEW BEST' },
  paid: (n: number) => `Halvard pays you ${n} gold.`,
  nothing: "That wasn't enough to pay for.",
  forBoard: "This one was for the board, so there's no pay.",
  early: "You stopped before the shift was out, so there's no pay.",
  next: (secs: number) => `The next paid shift is in ${mins(secs)} minute${mins(secs) === 1 ? '' : 's'}.`,
  posted: 'He chalks it on the board.',
  gold: (n: number) => `You have ${n} gold.`,
  again: 'ANOTHER SHIFT',
  done: 'BACK TO THE FORGE',
};
