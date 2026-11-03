/**
 * Every player-facing word for relics as things you own: what each kind does, the card's tags, the
 * church's relic panel, Ivo hearing one fade, the light you carry out of the church, the job result.
 * For the lore keeper, then the line editor. Never shard, sliver, crown or the Want on screen.
 */
import type { RelicId } from '../shared/tuning';

/** What each found relic does, one plain line (the card). */
export const RELIC_LINES: Partial<Record<RelicId, string>> = {
  javelin: 'Thrown hard. Small goblins ride it to the wall and stay pinned there; big ones take it in the body.',
  hook: 'Hooks the first thing it reaches. Small goblins and loose barrels come to you; anything heavier pulls you to it.',
  lodestone: 'Lobbed. Where it lands it drags goblins in, the light ones fastest, then bursts.',
  bomb: 'Lobbed. It bursts, throws goblins and barrels about and knocks the small ones silly.',
  sentry: 'Set it down and it shoots whatever goblin comes near for a while. Its arrows leave them limping.',
  bell: 'Blow it. Goblins near you stop to listen and lose their swing, and friends near you are quicker on their feet for a bit.',
  knuckle: 'A punch that carries. Everything in a line in front of you is knocked flying, and the next blow anyone lands on them hits harder.',
};

export const RELICW = {
  /** The card's tags. */
  spares: 'SPARES FRIENDS',
  charge: (n: number, max: number) => `CHARGE ${n} / ${max}`,
  dark: 'DARK',
  darkLine: 'Gone dark. It does nothing now until the church sees to it.',
  darkElLine: 'Gone dark, and the church can\'t bring this kind back. Leave it on the step, or leave it with another and take one back.',
  loud: 'LOUD',
  fades: 'Every use spends a little of it.',
  noRecharge: 'Born with an element. It holds more, but the church can\'t recharge it.',
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
  none: 'You have no relics. Named butchers sometimes carry one, and the butcher at the bottom of a deep job always does.',
  recharge: (n: number) => `RECHARGE (${n})`,
  full: 'FULL',
  leave: (n: number) => (n ? `LEAVE IT (LIGHT FOR ${n} ${n === 1 ? 'JOB' : 'JOBS'})` : 'LEAVE IT'),
  leaveDark: 'LEAVE IT (NO LIGHT)',
  odricLeave: "That's it, on the step with the rest. Go round the back after, and Isolde will ^light^ you something for the road.",
  odricLeaveDark: "Dark as a cellar, that one, but it can sit with the others all the same.",
  recharged: 'Isolde takes it round the back. When she brings it out again it\'s warm, and she doesn\'t say what she did.',
  litNow: (n: number) => `You carry the church's light for your next ${n} ${n === 1 ? 'job' : 'jobs'}: your blows land harder, and the goblins come for you first.`,
  litNone: 'The light is for whoever leaves a relic with some life still in it.',
  /** Two for one. */
  twoTitle: 'LEAVE TWO, TAKE ONE',
  twoLine: 'Leave two on the step and take back one that someone left before. You never know which.',
  pick: 'PICK TWO',
  picked: (n: number) => (n === 2 ? 'Two picked.' : n === 1 ? 'One picked. One more.' : 'Tap two of your relics.'),
  odds: (el: number) => `${Math.round(el * 100)} IN 100 IT HAS AN ELEMENT.`,
  give: 'LEAVE BOTH',
  got: (name: string) => `Odric brings the ${name} out to you. He doesn't say whose it was.`,
  carry: 'CARRY IT',
  carrying: 'CARRYING',
  back: 'BACK',
  tapSkip: 'TAP TO SKIP',
  /** The HUD while carrying the light, and the job result. */
  litBadge: 'LIT',
  litLeft: (n: number) => (n ? `The church's light goes with you for ${n} more ${n === 1 ? 'job' : 'jobs'}.` : 'The church\'s light has burned out.'),
  /** The job result: a relic cut out of the boss, or picked up. */
  cutOut: (boss: string, name: string) => `<b>You cut the ${name} out of ${boss}.</b>`,
  carryHint: 'It\'s on your RELIC button.',
  shelfHint: 'It\'s with your other relics, in your pack.',
  /** Ivo at his bench, of a fading relic (the lore keeper's draft). */
  ivoFading: "Hear that? No, you *don't*, and that's the trouble, it was going like a hive a week ago and now it's more like a cat that can't be bothered to purr.",
  ivoDark: "Not a peep out of it, poor thing. Take it to the church, they'll know what to do, or Isolde will anyway.",
  ivoBright: "Listen to that, it's fair singing. No? Ah, well, most people haven't got the ears for it.",
};
