/**
 * Every player-facing line of the town's pastimes (fishing at the millpond, the archery butts), in one
 * place for the lore keeper and then the line editor. None of it has been through either pass yet.
 */
import { weighs } from '../shared/fishtune';

export const FISHW = {
  who: 'OLD PENNOCK',
  /** At the millpond, offering a rod. */
  greet: "There's a spare rod leaning on the wall there, if you want a go. I don't charge for the loan and the fish don't pay either, so nobody's out of pocket. Roach and perch stay in close by the reeds. Cast further out and you'll get bream and tench, and there's a pike in the deep end I've been after since before the siege.",
  /** What you've had out of it so far. */
  best: (name: string, oz: number) => `The biggest you've had out of here is a ${name.toLowerCase()} of ${weighs(oz)}.`,
  none: "You haven't had anything out of here yet.",
  kinds: (n: number) => (n === 1 ? 'One kind of fish caught so far.' : `${n} kinds of fish caught so far.`),
  take: 'TAKE A ROD',
  /** At the water. */
  hintCast: { touch: 'HOLD TO SWING THE CAST, LET GO TO CAST', mouse: 'HOLD THE MOUSE OR SPACE TO SWING THE CAST, LET GO TO CAST' },
  hintWait: 'WATCH THE FLOAT. TAP WHEN IT GOES RIGHT UNDER',
  hintReel: 'HOLD TO REEL IN. LET GO WHEN IT RUNS',
  strike: 'STRIKE NOW',
  willRun: "IT'S ABOUT TO RUN",
  running: "IT'S RUNNING",
  slack: 'SLACK',
  snap: 'SNAP',
  near: 'NEAR',
  far: 'FAR',
  caught: 'CAUGHT',
  biggest: 'BIGGEST',
  leave: 'PUT THE ROD BACK',
  /** The card when it's over. */
  landed: (name: string, oz: number) => `A ${name.toLowerCase()}, ${weighs(oz)}.`,
  first: (name: string) => `Your first ${name.toLowerCase()}.`,
  kindBest: (name: string) => `The biggest ${name.toLowerCase()} you've caught.`,
  everBest: "The biggest fish you've had out of the pond.",
  back: 'You slip it back into the pond.',
  lost: {
    early: "Too soon. You pulled the bait away before anything had hold of it.",
    missed: "It had the bait and you were too slow. It's gone.",
    snapped: "The line went. Whatever it was, it's still down there.",
    thrown: "You let the line go slack and it threw the hook.",
  },
  again: 'CAST AGAIN',
};

export const RANGEW = {
  who: 'CORIN',
  /** At the butts. */
  greet: "Maeve has me keep the butts. Anyone can have a go, you don't have to be one of hers. A round's a minute. The targets come up near, in the middle and far back, and the far ones count three times over. Some slide and some swing, so aim for where they'll be when the arrow gets there.",
  /** Said to a Ranger as well. */
  ranger: "Your hands will be steadier than most. That's Maeve's shouting doing some good for once.",
  yourBest: (n: number) => `Your best round: ${n}.`,
  board: 'BEST AT THE BUTTS',
  empty: "Nobody's on the board yet.",
  offline: 'Only your own rounds show until you play online.',
  shoot: 'SHOOT A ROUND',
  /** On the line. */
  hintTouch: 'DRAG TO AIM. LIFT TO LOOSE',
  hintMouse: 'AIM WITH THE MOUSE. CLICK TO LOOSE',
  time: 'TIME',
  score: 'SCORE',
  stop: 'STOP',
  gold: 'GOLD',
  /** The card when the round's over. */
  over: 'ROUND OVER',
  rows: { score: 'SCORE', arrows: 'ARROWS', hits: 'HITS', golds: 'GOLDS', streak: 'MOST IN A ROW', best: 'YOUR BEST', newBest: 'NEW BEST' },
  posted: 'Corin chalks it up on the board.',
  again: 'ANOTHER ROUND',
  leave: 'BACK TO TOWN',
};

/** The names of the fish as said aloud (capitals, as on the card). Kept here so the lore keeper sees them. */
export const FISH_NAMES = ['ROACH', 'RUDD', 'PERCH', 'EEL', 'TENCH', 'BREAM', 'CARP', 'PIKE'];
