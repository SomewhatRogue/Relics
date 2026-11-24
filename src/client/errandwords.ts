/**
 * The town errands' words (shared/errands.ts): the runner each class gets and what they say, the goal
 * line's rows, the church's free first recharge, and each trainer's line the first time you come in on
 * the errand. Lore keeper and line editor, 2026-11-12 (docs/decisions/town-quests.md).
 */
import type { ErrandId } from '../shared/errands';
import { TRAINERS } from '../shared/town';
import type { HeroClass } from '../shared/weapons';
import { WANTQW } from './wanterrandwords';

/** Who runs up to a new hero (by class, Kyle 2026-11-12), how they're drawn, and their one line. A Ranger's is Maeve's hound with a note. */
export const RUNNERS: Record<HeroClass, { who: string; look: string; hound?: boolean; text: string }> = {
  WARRIOR: { who: 'WAT', look: 'guard', text: "Master Cole wants you at the barracks, only get that javelin filled at the church first, Mother Isolde does it round the back, and it's near enough empty by the look of it." },
  HEALER: { who: 'VERGER OSWIN', look: 'priest', text: "Mother Isolde's asking after you, she's at the church, round the back, and bring that javelin, she'll fill it while you're there." },
  ROGUE: { who: 'TAM', look: 'child', text: 'Whisper says come by the Rat, the back booth, and the church fills them javelins for nothing the first time, if you ask nice.' },
  RANGER: { who: "MAEVE'S NOTE", look: 'hound', hound: true, text: 'Come up to the lodge, but church first, and get that javelin filled, Isolde does it round the back. M.' },
  MAGE: { who: 'LIS', look: 'mage', text: "Magister Vell wants a word, up at the tower, only church first, he says, so the javelin's filled. Then straight up, please. He'll have counted how long you've taken." },
};

/** Each trainer's place, as the tracker says it. */
const PLACE: Record<HeroClass, string> = { WARRIOR: 'at the barracks', RANGER: 'at the lodge', ROGUE: 'at the Drowned Rat', MAGE: 'at the tower', HEALER: 'at the church' };
const title = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const trainer = (cls: HeroClass) => title(TRAINERS[cls].name);

export const ERRANDW = {
  /** The tracker's rows: a label and what to do. */
  pin: { relic: 'YOUR JAVELIN', trainer: 'YOUR TRAINER', skill: 'A NEW SKILL', nettle: 'HUNGRY GEAR', yard: 'THE YARD', ...WANTQW.pin } as Record<ErrandId, string>,
  todo: (id: ErrandId, cls: HeroClass) =>
    id === 'church' || id === 'under' ? WANTQW.todo[id] : id === 'yard' ? 'Ask Squire Pell for a straw man in the yard behind the barracks' : id === 'nettle' ? 'Sell it to Nettle, at the back of the Drowned Rat' : id === 'relic' ? 'Recharge it at the church' : id === 'trainer' ? `${trainer(cls)}, ${PLACE[cls]}` : cls === 'ROGUE' ? 'Whisper has one to show you' : `${trainer(cls)} has one to teach you`,
  /** Folded, one line. */
  small: (id: ErrandId, cls: HeroClass) =>
    id === 'church' || id === 'under' ? WANTQW.small[id] : id === 'yard' ? 'TRY YOUR KIT IN THE YARD' : id === 'nettle' ? 'SEE NETTLE AT THE DROWNED RAT' : id === 'relic' ? 'RECHARGE YOUR JAVELIN AT THE CHURCH' : id === 'trainer' ? `SEE ${TRAINERS[cls].name} ${PLACE[cls].toUpperCase()}` : `A NEW SKILL: SEE ${TRAINERS[cls].name}`,
  /** The church's free first recharge. */
  free: 'RECHARGE: FREE',
  freeDone: "Isolde takes it round the back and brings it out full, and says there's nothing to pay, this once.",
  /** Each trainer's first meeting (a talk, not the training screen), in two beats: there's plenty they'll teach you,
   *  in time; then nobody here knows you yet, so work the board in the square, where a job's up for you (Kyle's
   *  playtests, 2026-11-13, 2026-11-17 and 2026-11-24: "say you need to do work and build up reputation"; the town
   *  knowing your name, never said as a word). Lore keeper and line editor, 2026-11-24. */
  firstVisit: {
    WARRIOR: "So you're the new one. I'll teach you plenty, once you've some fight in you.",
    RANGER: "Found my note, then. I'll show you plenty, in time, only I don't teach anyone I haven't seen work, so don't take it personal. And mind the dog bowls on your way out.",
    ROGUE: "There you are. Sit, sit. I've things to sell you that'll keep you alive, or near enough, only not to a stranger, you understand, not yet.",
    MAGE: "Ah. Yes. You. Mind the circle, it's chalk. There's a great deal I can teach you, only not yet, not really.",
    HEALER: "Stand there where I can see you. Hm. You'll do, you great calf. There's plenty I can teach you, in time, mind, not today.",
  } as Record<HeroClass, string>,
  firstWork: {
    WARRIOR: "Nobody here knows your name yet. Board's in the square. Take a job and do it right.",
    RANGER: "Town doesn't know you from a hole in a hedge. Work the board in the square till it does, there's one up there that ought to suit you.",
    ROGUE: "Nobody pays a face they've never seen, so go and let them have a look at yours. There's a job on the board in the square, it'll do for a start, I'd think.",
    MAGE: "Nobody here knows who you are, which is, well, the trouble. Work mends that, mostly. There's a job on the board in the square, it's yours, and do come back after.",
    HEALER: "Folk here don't know you from the next face, and they'll not hand a stranger their dying. There's a job on the board in the square. Go and do it, and mind you come back with the same number of arms.",
  } as Record<HeroClass, string>,
  /** The first meeting's second beat (Kyle, 2026-11-24): a plain weapon of a kind you've none of, and off to the yard to
   *  try it and the javelin, which won't dim there (never why). The board's word (firstWork) waits for your return.
   *  Lore keeper and line editor, 2026-11-24. */
  firstGift: {
    WARRIOR: "Plain, but it's yours. Yard's round the back, and take the javelin, it won't dim out there.",
    RANGER: "Here, you'll want something else to hand. Try it in the yard behind the barracks, the javelin too, it doesn't fade out there, and don't ask me why.",
    ROGUE: 'A little something, on the ~house~, the only thing that will be. Take it round the back of the barracks, the javelin too, it doesn\'t go dark there.',
    MAGE: 'This is for you, plain, I know, but do try it in the yard behind the barracks, and the javelin as well, because it won\'t dim there, I checked, *twice*.',
    HEALER: 'Take this, and the javelin too, it won\'t dim in the yard behind the barracks, so go and swing it about there before you hurt anyone that matters.',
  } as Record<HeroClass, string>,
  /** Under the gift, the game's plain word, and the gift's own label. */
  giftNote: 'Your new weapon is in your pack. Equip it from there, then try it in the yard.',
  gift: 'NEW WEAPON',
  /** The quest they've just handed over, shown under the second beat and in a toast. */
  fresh: 'NEW QUEST',
  /** Under that first talk, the game's own plain word (Kyle, 2026-11-17: make it clear there are things to learn,
   *  and to start at the board). */
  firstNote: 'Your trainer teaches a new skill as you level up, the first at level 3. Start with a job from the board in the square.',
  /** Tobin, frightened of your hungry gear, the first time (said under his panic while the errand's open), and
   *  Nettle when you come from him (Kyle, 2026-11-14; lore keeper and line editor). */
  tobinSends: "If you want rid of it there's a man at the back of the Rat, Nettle he's called, and he'll take it off you, only I never said so, mind, and if anyone asks it's the church you want.",
  nettleMet: "Tobin sent you, I'd guess, he always does and then swears he never did, so keep your voice down and let's see what you've brought.",
  /** Back after that first job: your first skill, and when (level 3: drills.ts SKILL_STEPS). */
  back: {
    WARRIOR: "Good, you came back. At level 3 I'll teach you Shield Charge. Till then, more of the same.",
    RANGER: "You're still in one piece. Get to level 3 and you'll have the Hunter's Net off me. Till then, the board.",
    ROGUE: "Back already. Get to level 3 and I'll sell you Vanish, and we'll call it a friend's price. Keep at it.",
    MAGE: "Good, good. At level 3 I can show you Round Up, I think, I'm almost sure. Keep at the board till then.",
    HEALER: "Back on your feet, good. Level 3 and you'll have Sanctuary off me. Till then, keep working and keep your back to a wall.",
  } as Record<HeroClass, string>,
};
