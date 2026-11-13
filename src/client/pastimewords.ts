/**
 * Every player-facing line of the town's pastimes (fishing at the millpond, the archery butts), in one
 * place for the lore keeper and then the line editor. None of it has been through either pass yet.
 */
import { weighs } from '../shared/fishtune';
import { coinsHtml } from '../shared/coins';

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

/**
 * The Drowned Rat's arm-wrestling table and knife board, and striking at Halvard's anvil (armmode.ts,
 * knifemode.ts, anvilmode.ts, ratui.ts). New with them; none through the lore keeper or the line editor
 * yet. The regulars are people already in the Rat (the drunk, the card sharp, Gannet) and one of the
 * watch, who drink there; no new names.
 */
export const ARMW = {
  who: 'A WATCHMAN OFF DUTY',
  /** At the table, offering a bout. */
  greet: "Sit down, then, if you're sitting. You put your elbow on the wood and your hand in his, and you push when it feels right and ease off when it doesn't, which sounds like nothing, I know, until you've done it. As for the money, Gannet holds the stakes and I've never seen him lose any, so the only man running off with yours is the one who beats you.",
  /** Their record so far. */
  record: (bouts: number, wins: number) => `You've sat down here ${bouts === 1 ? 'once' : `${bouts} times`} and won ${wins === 1 ? 'once' : wins === 0 ? 'none of them' : `${wins} of them`}.`,
  never: "You haven't sat down at the table yet.",
  pick: 'Who will you take on?',
  /** One line on each regular, as the watchman sees them. */
  about: {
    drunk: "He'll take anybody on, and he's had enough tonight that he might even lose. He bets ten and not a coin more, because that's all he's got.",
    sharp: "He's got a thin arm and quick hands, that one, and he shifts about on you so you never quite know where he is. He won't go past twenty-five, he says, but I'd watch him anyway, mind.",
    watch: "That's one of ours. He hauls the gate bar every morning, so his arm's about as thick as your leg, and now and then he'll go for it all at once, so be ready, or he'll have your knuckles on the wood before you've put your cup down.",
    gannet: "Gannet comes round the bar for this, and he doesn't do it often. He hasn't lost at this table since the siege, he says, and he'd know, being the one who holds the stakes.",
  } as Record<string, string>,
  bet: (n: number) => `BET ${coinsHtml(n)}`,
  free: 'FOR NOTHING',
  gold: (n: number) => `You have ${coinsHtml(n)}.`,
  back: 'BACK',
  /** At the table. */
  hintTouch: 'HOLD TO BEAR DOWN, LET GO TO EASE OFF. KEEP YOUR GRIP IN THE BAND',
  hintMouse: 'HOLD THE MOUSE OR SPACE TO BEAR DOWN, LET GO TO EASE OFF. KEEP YOUR GRIP IN THE BAND',
  stake: 'BET',
  none: '-',
  time: 'TIME',
  tell: "HE'S GOING FOR IT",
  leave: 'LET GO',
  /** The card. */
  won: (name: string) => `You put ${name.toLowerCase()} down.`,
  lost: (name: string) => `${name.charAt(0)}${name.slice(1).toLowerCase()} put you down.`,
  gaveUp: 'You let go, and that counts as losing.',
  paid: (n: number) => `Gannet pays out ${coinsHtml(n)}.`,
  kept: (n: number) => `Your ${coinsHtml(n)} goes across the table.`,
  first: "That's the first time you've beaten them.",
  beaten: "You've beaten them before.",
  rows: { held: 'IN THE BAND', time: 'TIME', bouts: 'BOUTS', wins: 'WINS' },
  again: 'AGAIN',
  other: 'SOMEONE ELSE',
  up: 'GET UP',
};

export const KNIFEW = {
  who: 'A CARD SHARP',
  /** At the board. */
  greet: "You get nine knives and you throw from the chalk there. Everybody's hand wanders, mine too, so you wait for the point to come over the middle and let go, only don't wait on it too long, because it gets worse, not better. I watched a fellow stand there till his arm shook like a wet dog, and he put his last one in the ceiling. Anyway, if you want something on it, I throw a round first and you beat it, and a tie's mine, same as at Moll's table.",
  /** Said to a Rogue as well. */
  rogue: "You've got the steady hand, I can see it from here, and I'd guess Whisper's had a look at you already. I'm still taking your money if you miss.",
  yourBest: (n: number) => `Your best round: ${n}.`,
  board: 'BEST AT THE BOARD',
  empty: "Nobody's on the board yet.",
  offline: 'Only your own rounds show until you play online.',
  bet: (n: number) => `BET ${coinsHtml(n)}`,
  free: 'JUST THROW',
  gold: (n: number) => `You have ${coinsHtml(n)}.`,
  /** At the chalk. */
  hintTouch: 'TAP TO THROW WHEN THE POINT IS OVER THE MIDDLE',
  hintMouse: 'CLICK OR PRESS SPACE TO THROW WHEN THE POINT IS OVER THE MIDDLE',
  knives: 'KNIVES',
  score: 'SCORE',
  beat: (n: number) => `BEAT ${n}`,
  bull: 'BULL',
  wide: 'WIDE',
  stop: 'STOP',
  /** The card. */
  over: 'ROUND OVER',
  rows: { score: 'SCORE', board: 'ON THE BOARD', bulls: 'BULLS', house: 'HIS ROUND', best: 'YOUR BEST', newBest: 'NEW BEST' },
  won: (n: number) => `You beat his ${n}, and he pays you with a face on him.`,
  tie: "You matched his score, and a tie goes to him.",
  lost: (n: number) => `His ${n} stands, and he takes your money.`,
  paid: (n: number) => `He pays out ${coinsHtml(n)}.`,
  early: 'You stopped before your nine were thrown, so the bet is his.',
  posted: 'He chalks it up on the board.',
  again: 'ANOTHER ROUND',
  leave: 'BACK TO THE BAR',
};

export const ANVILW = {
  /** Halvard, handing you the hammer. */
  greet: "Mind your thumb.",
  /** At the anvil. */
  hintTouch: 'TAP TO STRIKE WHEN THE STEEL GLOWS BRIGHTEST',
  hintMouse: 'CLICK OR PRESS SPACE TO STRIKE WHEN THE STEEL GLOWS BRIGHTEST',
  strikes: 'STRIKES',
  piece: 'PIECE',
  clean: 'CLEAN',
  fair: 'NEAR ENOUGH',
  cold: 'TOO COLD',
  stop: 'HAND IT BACK',
  /** The card. */
  title: 'OFF THE ANVIL',
  well: (pct: number) => `Struck well, this plus counts for ${pct}% more.`,
  plain: "It took the plus, a plain one, no better and no worse.",
  halvard: { good: 'Good.', fair: 'Not bad.', none: "It'll hold." },
  done: 'BACK TO THE FORGE',
  /** On a piece's card, once it's been struck well. */
  cardRow: 'WELL STRUCK',
  cardText: (pct: number) => `its pluses count for ${pct}% more`,
};
