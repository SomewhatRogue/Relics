/**
 * The town errands' words (shared/errands.ts): the runner each class gets and what they say, the goal
 * line's rows, the church's free first recharge, and each trainer's line the first time you come in on
 * the errand. Lore keeper and line editor, 2026-11-12 (docs/decisions/town-quests.md).
 */
import type { ErrandId } from '../shared/errands';
import { TRAINERS } from '../shared/town';
import type { HeroClass } from '../shared/weapons';

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
  pin: { relic: 'YOUR JAVELIN', trainer: 'YOUR TRAINER', skill: 'A NEW SKILL' } as Record<ErrandId, string>,
  todo: (id: ErrandId, cls: HeroClass) =>
    id === 'relic' ? 'Recharge it at the church' : id === 'trainer' ? `${trainer(cls)}, ${PLACE[cls]}` : cls === 'ROGUE' ? 'Whisper has one to show you' : `${trainer(cls)} has one to teach you`,
  /** Folded, one line. */
  small: (id: ErrandId, cls: HeroClass) =>
    id === 'relic' ? 'RECHARGE YOUR JAVELIN AT THE CHURCH' : id === 'trainer' ? `SEE ${TRAINERS[cls].name} ${PLACE[cls].toUpperCase()}` : `A NEW SKILL: SEE ${TRAINERS[cls].name}`,
  /** The church's free first recharge. */
  free: 'RECHARGE: FREE',
  freeDone: "Isolde takes it round the back and brings it out full, and says there's nothing to pay, this once.",
  /** Each trainer's first meeting (a talk, not the training screen): they send you to the board in the square
   *  (Kyle's playtest, 2026-11-13; lore keeper and line editor). */
  firstVisit: {
    WARRIOR: "So you're the new one. Nothing to teach you till you've some fight in you. Board's in the square, and you can earn your keep there.",
    RANGER: "Found my note, then. I don't teach anyone I haven't seen work, so there's a board in the square, and mind the dog bowls on your way out.",
    ROGUE: "There you are. Sit, sit. I don't sell lessons to strangers, so get yourself some work off the board in the square, and then we'll talk.",
    MAGE: "Ah. Yes. You. Mind the circle, it's chalk. I can't teach you anything yet, not really, so there's the board in the square, and come back after, and I'll have something worked out.",
    HEALER: "Stand there where I can see you. Hm. You'll do, you great calf. Go and do an honest job off the board in the square, and come back to me after.",
  } as Record<HeroClass, string>,
  /** Back after that first job: your first skill, and when (level 3: drills.ts SKILL_STEPS). */
  back: {
    WARRIOR: "Good, you came back. At level 3 I'll teach you Shield Charge. Till then, more of the same.",
    RANGER: "You're still in one piece. Get to level 3 and you'll have the Hunter's Net off me. Till then, the board.",
    ROGUE: "Back already. Get to level 3 and I'll sell you Vanish, and we'll call it a friend's price. Keep at it.",
    MAGE: "Good, good. At level 3 I can show you Round Up, I think, I'm almost sure. Keep at the board till then.",
    HEALER: "Back on your feet, good. Level 3 and you'll have Sanctuary off me. Till then, keep working and keep your back to a wall.",
  } as Record<HeroClass, string>,
};
