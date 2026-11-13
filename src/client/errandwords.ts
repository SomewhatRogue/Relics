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
  /** Each trainer's line the first time you come in on the errand. */
  firstVisit: {
    WARRIOR: "So you're the new one. Come in. Let's see what's left of you.",
    RANGER: 'Found my note, then. Come in and mind the bowls.',
    ROGUE: "There you are. Sit. Don't touch anything you can't afford.",
    MAGE: "Ah. Yes. You. Come in, mind the circle, it's chalk and it smudges.",
    HEALER: "Stand there where I can see you. Hm. You'll do, you great calf. Now listen.",
  } as Record<HeroClass, string>,
};
