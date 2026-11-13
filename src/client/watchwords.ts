/**
 * Every player-facing line of the Night Watch, in one place for the lore keeper and the line editor.
 * (Gone, 2026-11-12: nothing reaches it now. Corporal Brisk gives out the long trips instead: client/boardwords.ts.)
 * (Brisk's lines and the lost line through the lore keeper 2026-11-05; the rest not yet, nor the line editor.)
 */
import { coinsHtml } from '../shared/coins';
export const WATCHW = {
  who: 'CORPORAL BRISK',
  /** At night, at the stair up to the wall (out the back of the barracks). */
  night: "Dunn wants a bow on the wall every night, and tonight it can be yours. The stair's out the back. Shoot all you like till I call you down, and you're paid by the head. Anything that gets to the foot of the wall, leave to the watch.",
  /** In the day. */
  day: "Nothing comes over the fields in daylight, and Dunn won't pay anybody to watch them not coming. Come back after dark and I'll put you on the wall.",
  best: (n: number) => `Your best on the wall: ${n}.`,
  take: 'TAKE A SHIFT ON THE WALL',
  /** On the wall. */
  hintTouch: 'DRAG TO AIM. LIFT TO LOOSE.',
  hintMouse: 'AIM WITH THE MOUSE. HOLD TO DRAW, LET GO TO LOOSE.',
  endShift: 'END SHIFT',
  time: 'TIME',
  score: 'SCORE',
  streak: 'STREAK',
  /** Over the field. */
  atWall: 'THE WATCH HAVE IT',
  headshot: 'HEADSHOT',
  /** The card at the end. */
  over: 'SHIFT OVER',
  rows: { kills: 'KILLS', heads: 'HEADSHOTS', streak: 'BEST STREAK', accuracy: 'ACCURACY', bonus: 'ACCURACY BONUS', score: 'SCORE', best: 'YOUR BEST', newBest: 'NEW BEST' },
  lost: (n: number) => (n === 1 ? 'One reached the foot of the wall. The watch below had it.' : `${n} reached the foot of the wall. The watch below had them.`),
  pay: (n: number) => `Brisk counts it out: ${coinsHtml(n)}.`,
  capped: "That's all the watch pays anyone in one night.",
  paidOut: "You've had tonight's pay already. You can still shoot for your best.",
  again: 'ANOTHER SHIFT',
  down: 'DOWN THE STAIR',
};
