/**
 * Every player-facing word for relics as things you own: what each kind does, the card's tags, the
 * church's relic panel, Ivo hearing one fade, the light you carry out of the church, the job result.
 * For the lore keeper, then the line editor. Never shard, sliver, crown or the Want on screen.
 */
import type { RelicId } from '../shared/tuning';
import { LIT } from '../shared/church';

const jobs = (n: number) => `${n} ${n === 1 ? 'job' : 'jobs'}`;
/** What the church's light does, plainly (the same line on the step, the LIT badge and after). */
const LIGHT = `+${Math.round((LIT.dmg - 1) * 100)}% damage, and goblins come for you first`;

/** What each found relic does: the card's USE row, a few words. */
export const RELIC_LINES: Partial<Record<RelicId, string>> = {
  javelin: 'Throw. Pins small goblins to a wall, sticks in big ones.',
  hook: 'Hooks the first thing hit. Pulls small goblins and barrels to you, or you to anything heavier.',
  lodestone: 'Throw. Pulls goblins to where it lands, then bursts.',
  bomb: 'Throw. Bursts, knocks goblins and barrels away, stuns small ones.',
  sentry: 'Set it down. Shoots goblins that come near for 7 s and slows them.',
  bell: 'Goblins near you stop their attacks. Friends near you move 25% faster for 4 s.',
  knuckle: 'Knocks everything in a line in front of you flying. The next hit on them does extra damage.',
};

export const RELICW = {
  /** The card's tags. */
  spares: 'SPARES FRIENDS',
  charge: (n: number, max: number) => `CHARGE ${n} / ${max}`,
  dark: 'DARK',
  darkLine: 'None left. The church can recharge it.',
  darkElLine: 'None left, and it can\'t be recharged. Give it up at the church.',
  loud: 'LOUD',
  fades: '1 per use. The church recharges it.',
  noRecharge: '1 per use. Holds more, but can\'t be recharged.',
  /** The RELIC button pressed with a dark one in hand. */
  pressedDark: 'DARK',
  /** Spared by a friend's relic. */
  spared: 'SPARED',
  quick: 'QUICK',
  marked: 'MARKED',
  hobbled: 'SLOWED',
  found: 'RELIC',
  /** The church (Father Odric) and its relic panel. */
  churchButton: 'RELICS',
  churchTitle: 'THE STEP',
  churchIntro: "Fading, is it? Mother Isolde sees to those round the back, and she'll want paying. Not the ones with fire or frost or storm in them, mind, she *won't* have those in the house.",
  none: 'No relics. Named butchers sometimes carry one; the last butcher on a DEEP job always does.',
  recharge: (n: number) => `RECHARGE (${n})`,
  full: 'FULL',
  /** Above the cards: what giving one up means, before anything is tapped. */
  stepHow: `Give a relic up and it's gone for good. If it has charge left, you carry the church's light for a few jobs: ${LIGHT}.`,
  leave: (n: number) => (n ? `GIVE IT UP (LIGHT FOR ${n} ${n === 1 ? 'JOB' : 'JOBS'})` : 'GIVE IT UP'),
  leaveDark: 'GIVE IT UP (NO LIGHT)',
  /** The second tap: what you lose and what you get. */
  leaveWarn: (n: number) => (n ? `Gone for good. You carry the church's light for ${jobs(n)}: ${LIGHT}.` : "Gone for good. It's dark, so there's no light for this one."),
  leaveSure: 'YES, GIVE IT UP',
  keep: 'KEEP IT',
  odricLeave: "That's it, on the step with the rest. Go round the back after, and Isolde will ^light^ you something for the road.",
  odricLeaveDark: "Dark as a cellar, that one, but it can sit with the others all the same.",
  recharged: 'Isolde takes it round the back and brings it out warm, fully charged. She doesn\'t say what she did.',
  litNow: (n: number) => `You carry the church's light for your next ${jobs(n)}: ${LIGHT}.`,
  litNone: 'Only a relic with charge left gives the light.',
  /** Two for one. */
  twoTitle: 'LEAVE TWO, TAKE ONE',
  twoLine: "Give up two relics for one someone else left. You don't choose which. No light.",
  pick: 'PICK TWO',
  picked: (n: number) => (n === 2 ? 'Two picked.' : n === 1 ? 'One picked. One more.' : 'Tap two of your relics.'),
  odds: (el: number) => `${Math.round(el * 100)} IN 100 IT HAS AN ELEMENT.`,
  give: 'GIVE BOTH UP',
  giveWarn: 'Both gone for good. You get one back, and no light.',
  giveSure: 'YES, GIVE BOTH UP',
  got: (name: string) => `Odric brings the ${name} out to you. He doesn't say whose it was.`,
  carry: 'CARRY IT',
  carrying: 'CARRYING',
  back: 'BACK',
  tapSkip: 'TAP TO SKIP',
  /** The HUD while carrying the light, and the job result. */
  litBadge: 'LIT',
  litLeft: (n: number) => (n ? `The church's light goes with you for ${n} more ${n === 1 ? 'job' : 'jobs'}: ${LIGHT}.` : 'The church\'s light has burned out.'),
  /** The job result: a relic cut out of the boss, or picked up. */
  cutOut: (boss: string, name: string) => `<b>You cut the ${name} out of ${boss}.</b>`,
  carryHint: 'It\'s on your RELIC button.',
  shelfHint: 'It\'s with your other relics, in your pack.',
  /** Ivo at his bench, of a fading relic (the lore keeper's draft). */
  ivoFading: "Hear that? No, you *don't*, and that's the trouble. It hummed like a hive a week ago. It's running down.",
  ivoDark: "Not a peep out of it, poor thing. Take it to the church, they'll know what to do, or Isolde will anyway.",
  ivoBright: "Listen to that, it's fair singing. No? Ah, well, most people haven't got the ears for it.",
};
