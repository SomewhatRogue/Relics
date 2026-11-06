/**
 * Every player-facing line of the town's pastimes (fishing at the millpond, the archery butts), in one
 * place for the lore keeper and then the line editor. None of it has been through either pass yet.
 */
import { weighs } from '../shared/fishtune';

export const FISHW = {
  who: 'OLD PENNOCK',
  /** At the millpond, offering a rod. */
  greet: "There's a spare rod leaning on the wall there, if you want a go, and I don't charge for the loan. The fish don't pay either, so nobody's out of pocket. Roach and perch keep in close by the reeds, and if you cast further out it's bream and tench, mostly, and there's a *pike* in the deep end I've been after since before the siege.",
  /** What you've had out of it so far. */
  best: (name: string, oz: number) => `The biggest you've had out of here is a ${name.toLowerCase()} of ${weighs(oz)}.`,
  none: "You haven't had anything out of here yet.",
  kinds: (n: number) => (n === 1 ? 'One kind of fish caught so far.' : `${n} kinds of fish caught so far.`),
  take: 'TAKE A ROD',
  /** At the water. */
  hintCast: { touch: 'HOLD TO SWING THE CAST, LET GO TO CAST', mouse: 'HOLD THE MOUSE OR SPACE TO SWING THE CAST, LET GO TO CAST' },
  hintWait: 'WATCH THE FLOAT. STRIKE WHEN IT GOES RIGHT UNDER',
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
  who: 'ABEL',
  /** At the butts. */
  greet: "Maeve has me mind the butts, and anyone can have a go, you needn't be one of hers. You get a minute a round. They come up near, in the middle and far back, and the far ones count three times over, so everybody aims at those and misses. As for the ones that slide and swing, you shoot where they'll be when the arrow gets there, not where they are. I watched a lad spend a whole round on where they'd been, very steady about it, and he hit the wall every time.",
  /** Said to a Ranger as well. */
  ranger: "You'll shoot straighter than most who come up here, being what you are. Maeve will still find something wrong with it, mind, so I wouldn't go telling her your score.",
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
  gold: 'BULL',
  /** The card when the round's over. */
  over: 'ROUND OVER',
  rows: { score: 'SCORE', arrows: 'ARROWS', hits: 'HITS', golds: 'BULLS', streak: 'MOST IN A ROW', best: 'YOUR BEST', newBest: 'NEW BEST' },
  posted: 'Abel chalks it up on the board.',
  again: 'ANOTHER ROUND',
  leave: 'BACK TO TOWN',
};

/** The names of the fish as said aloud (capitals, as on the card). Kept here so the lore keeper sees them. */
export const FISH_NAMES = ['ROACH', 'RUDD', 'PERCH', 'EEL', 'TENCH', 'BREAM', 'CARP', 'PIKE'];
