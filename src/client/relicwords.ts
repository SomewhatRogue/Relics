/**
 * Every player-facing word for relics as things you own: what each kind does, the card's tags, the
 * church's relic panel, Ivo hearing one fade, the light you carry out of the church, the job result.
 * For the lore keeper, then the line editor. Never shard, sliver, crown or the Want on screen.
 */
import { SENTRY, type RelicId } from '../shared/tuning';
import { LIT } from '../shared/church';
import { coinsHtml } from '../shared/coins';

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
  churchTitle: 'THE RELIQUARY',
  churchIntro: "Fading, is it? Mother Isolde sees to those round the back, and she'll want paying. Not the ones with fire or frost or storm in them, mind, she *won't* have those in the house.",
  none: "No relics. Each one is won once: from a great boss the first time it falls, or from Mother Isolde when she has word of one.",
  /** The reliquary (churchrelics.ts): carry one, and the ones still to win. Draft until the lore pass. */
  carryThis: 'CARRY THIS ONE',
  carryNow: "It's on your RELIC button for the next job. You keep it the whole way.",
  stillTitle: 'STILL TO WIN',
  saidToBe: {
    hook: "Said to hang on the Haulier's chain, at the Open Cut.",
    knuckle: "Said to be in Hempen's fist, out in Hangman's Wood.",
    lodestone: 'Said to sit behind the Doorkeepers, in the great barn at Lowfurrow.',
    net: 'Said to be somewhere out on Fenmere.',
  } as Partial<Record<string, string>>,
  saidChurch: 'Nobody knows where. Mother Isolde might, when she has word.',
  /** Mother Isolde's relic quests (churchrelics.ts, shared/relicquests.ts). Draft until the lore pass. */
  questNudge: "Isolde's been asking after you. She's had word of something, she says, and she'd rather tell you herself.",
  questHear: 'HEAR ISOLDE OUT',
  questTitle: 'MOTHER ISOLDE SENT YOU',
  questOpen: (name: string, where: string) => `For the ${name}. ${where}`,
  questWord: {
    hook: "There's a hook on a chain at the Open Cut, a relic, and the thing that hauls the carts up out of the pit wears it like a charm. It was ours once. I'd like it back with someone who'll use it.",
    knuckle: "Hempen has a relic in its fist, out in Hangman's Wood. It's had it so long the hand's grown round it, and I'm told it doesn't let go of anything. Kill it and it's yours.",
    lodestone: "Two of them keep the doors of the great barn at Lowfurrow, and behind the doors there's a lodestone, a real one, from before. Get past the pair and bring it out.",
  } as Partial<Record<string, string>>,
  questHow: "Beat it and the relic is yours. Hangman's Wood and the Open Cut are Corporal Brisk's, at the barracks; the barn's job goes up on the board.",
  questGo: "I'LL GO",
  questLater: 'NOT NOW',
  recharge: (n: number) => `RECHARGE (${coinsHtml(n)})`,
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
  /** The moment a relic is gained (relicmoment.ts), its pop's small heading and how to use it. */
  newRelic: 'NEW RELIC',
  momentShelf: "It's in your pack. Carry it from the church's reliquary.",
  /** The first relic a hero ever gets: how the button works. */
  firstTip: (el: boolean) => `Press RELIC to use it, or R on a laptop. Each press spends a use${el ? ", and the church won't recharge this one." : ', and the church can recharge it.'}`,
  tapClose: 'TAP TO CLOSE',
  /** The pack's row of relics: its heading, the NEW mark, the empty RELIC slot's word, and what to do. */
  shelf: 'RELICS',
  newMark: 'NEW',
  tapSlot: 'TAP',
  emptySlot: "Nothing carried. Choose a relic to carry at the church's reliquary.",
  shelfHow: 'Tap a relic to see it, or drag it onto RELIC to carry it.',
  /** The full-screen moment a relic is won (relicfanfare.ts): draft until the lore pass. */
  wonKicker: 'A RELIC',
  wonFrom: { hempen: "From Hempen, in Hangman's Wood", doorkeepers: 'From the Doorkeepers, in the great barn at Lowfurrow', haulier: 'From the Haulier, at the Open Cut' } as Record<string, string>,
  wonUses: (n: number) => `${n} USES. RECHARGE AT THE CHURCH.`,
  rollLabel: 'ON THE ROLL',
  rollFirst: (name: string) => `First in Wickhold to win it: <b>${name}</b>`,
  rollMine: "You're the first in Wickhold to win it. Your name goes on the Roll.",
  /** A line from the place it was won (no one stands near a dead boss but you, so the place speaks). */
  wonSay: {
    hempen: "It was in Hempen's fist the whole time, the knuckle, grown into the hand like a stone in a tree.",
    doorkeepers: "It sat in the barn's crossbeam, behind the doors they kept. Nobody knows who put it there.",
    haulier: 'The hook was on the Haulier\'s chain, worn bright where the rope ran.',
  } as Record<string, string>,
  seePack: 'SEE IT IN THE PACK',
  /** The Roll's relics (relicrollui.ts). */
  rollTitle: 'RELICS WON, AND WHO WON THEM FIRST',
  rollNobody: 'Nobody yet',
  /** The one-time card when relics became earned (relicgone.ts): draft until the lore pass. */
  goneTitle: 'YOUR RELICS',
  goneLine: (jav: boolean) => (jav ? 'Every relic you carried is gone but the Relic Javelin.' : 'Every relic you carried is gone.') + ' Relics are won now, each one once: from a great boss the first time it falls, or from Mother Isolde at the church.',
  goneIsolde: "They came back to us, the lot of them, the way they do when they've been passed round too freely. Earn one and it'll stay with you, I should think.",
  /** On a job (docs/design/relics.md): the relic carried is chosen in town and kept the whole way. */
  keptOnJob: "You keep the relic you set out with until the job is done. Choose another at the church's reliquary.",
  chooseAtChurch: "Choose which relic to carry at the church's reliquary, from Father Odric.",
  shelfHint: 'It\'s with your other relics, in your pack.',
  /** Ivo at his bench, of a fading relic (the lore keeper's draft). */
  ivoFading: "Hear that? No, you *don't*, and that's the trouble. It hummed like a hive a week ago. It's running down.",
  ivoDark: "Not a peep out of it, poor thing. Take it to the church, they'll know what to do, or Isolde will anyway.",
  ivoBright: "Listen to that, it's fair singing. No? Ah, well, most people haven't got the ears for it.",
};
