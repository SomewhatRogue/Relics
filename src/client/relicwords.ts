/**
 * Every player-facing word for relics as things you own: what each kind does, the card's tags, the
 * church's relic panel, Ivo hearing one fade, the light you carry out of the church, the job result.
 * For the lore keeper, then the line editor. Never shard, sliver, crown or the Want on screen.
 */
import { SENTRY, type RelicId } from '../shared/tuning';
import { LIT } from '../shared/church';

const jobs = (n: number) => `${n} ${n === 1 ? 'job' : 'jobs'}`;
/** What the church's light does, plainly (the same line on the step, the LIT badge and after). */
const LIGHT = `+${Math.round((LIT.dmg - 1) * 100)}% damage, and goblins come for you first`;

/** What each found relic does: the card's USE row, a few words. (2026-11-05: each one sure, big ones too.) */
export const RELIC_LINES: Partial<Record<RelicId, string>> = {
  javelin: 'Throw. Skewers every goblin in its line, big ones too, and pins them all to the first wall, or the ground.',
  hook: 'Hooks the first goblin it reaches, any size, and drags it to your feet, knocked down. Hook a wall and it pulls you there.',
  lodestone: 'Throw. Every goblin near where it lands is caught and dragged in, then it bursts and knocks them down.',
  bomb: 'Throw. Every goblin where it bursts is knocked down and thrown clear, big ones too.',
  sentry: `Set it down. For ${SENTRY.time} s it shoots every goblin that comes near, never misses, and slows them right down.`,
  bell: 'Every goblin near you drops its attack, even a striped one, and reels. Friends near you move 25% faster for 4 s.',
  knuckle: 'Knocks every goblin in a line in front of you off its feet and sends it flying, butchers too. The next hit on them does extra damage.',
};

export const RELICW = {
  /** The card's tags. */
  spares: 'SPARES FRIENDS',
  /** Uses left, on the card beside its pips (the RELIC button shows the pips alone). */
  uses: (n: number) => (n === 1 ? '1 USE LEFT' : `${n} USES LEFT`),
  /** The card's row label for how it fades. */
  usesRow: 'USES',
  /** How faded it is, as a tag: used some, then down to its last. */
  fading: 'FADING',
  lastUse: 'LAST USE',
  dark: 'DARK',
  darkLine: 'Nothing left in it. The church can recharge it.',
  darkElLine: 'Nothing left in it, and the church won\'t recharge it. Odric will still take it on the step.',
  loud: 'LOUD',
  fades: (max: number) => `${max} uses, and it dims a little with each one. The church can recharge it.`,
  noRecharge: (max: number) => `${max} uses, and it dims a little with each one. It holds more than a plain one, but the church won't recharge it.`,
  /** The recap's RELICS row: what came home, and how many uses it holds. */
  withUses: (name: string, n: number) => `${name} (${n === 1 ? '1 USE' : `${n} USES`})`,
  /** The RELIC button pressed with a dark one in hand. */
  pressedDark: 'DARK',
  /** Over the hero as the last use goes: its short name, then DARK ("JAVELIN DARK"). */
  wentDark: (short: string) => `${short} DARK`,
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
  none: 'No relics. The big jobs give them: a story job, the beacon on the Barrowfields, the bottom of a DEEP job. Now and then a named butcher has one in it.',
  recharge: (n: number) => `RECHARGE (${n})`,
  full: 'FULL',
  /** Above the cards: what giving one up means, before anything is tapped. */
  stepHow: `Give a relic up and it's gone for good. If it has uses left, you carry the church's light for a few jobs: ${LIGHT}.`,
  leave: (n: number) => (n ? `GIVE IT UP (LIGHT FOR ${n} ${n === 1 ? 'JOB' : 'JOBS'})` : 'GIVE IT UP'),
  leaveDark: 'GIVE IT UP (NO LIGHT)',
  /** The second tap: what you lose and what you get. */
  leaveWarn: (n: number) => (n ? `Gone for good. You carry the church's light for ${jobs(n)}: ${LIGHT}.` : "Gone for good. It's dark, so there's no light for this one."),
  leaveSure: 'YES, GIVE IT UP',
  keep: 'KEEP IT',
  odricLeave: "That's it, on the step with the rest. Go round the back after, and Isolde will ^light^ you something for the road.",
  odricLeaveDark: "Dark as a cellar, that one, but it can sit with the others all the same.",
  recharged: 'Isolde takes it round the back and brings it out warm and full. She doesn\'t say what she did.',
  litNow: (n: number) => `You carry the church's light for your next ${jobs(n)}: ${LIGHT}.`,
  litNone: 'Only a relic with uses left gives the light.',
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
  /** A relic from a job with no butcher to cut it out of (a story job, the beacon). */
  broughtHome: (name: string) => `<b>You bring the ${name} home.</b>`,
  carryHint: 'It\'s on your RELIC button.',
  shelfHint: 'It\'s with your other relics, in your pack.',
  /** Ivo at his bench, of a fading relic (the lore keeper's draft). */
  ivoFading: "Hear that? No, you *don't*, and that's the trouble. It hummed like a hive a week ago. It's running down.",
  ivoDark: "Not a peep out of it, poor thing. Take it to the church, they'll know what to do, or Isolde will anyway.",
  ivoBright: "Listen to that, it's fair singing. No? Ah, well, most people haven't got the ears for it.",
};
