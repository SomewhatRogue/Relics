/**
 * Hero quests' words (shared/heroquests.ts; docs/design/hero-quests.md "Writing: as little as can be"):
 * the goal in the game's plain voice, one line a trainer says each time they hand a quest over, a
 * sentence or two for each posting, and what a quest opens, said once. Lore keeper and line editor,
 * 2026-11-13 (docs/decisions/town-quests.md).
 */
import type { Gate, QuestDef } from '../shared/heroquests';
import type { Place } from '../shared/jobs';
import type { HeroClass } from '../shared/weapons';

export const QUESTW = {
  /** The tracker's pins. */
  due: 'A JOB FOR YOU',
  held: 'QUEST',
  /** The board's tag on your own job. */
  tag: 'QUEST',
  /** The goal, plain, with the count where there is one. */
  goal: (q: QuestDef, n: number) => {
    const g = { q3: "Kill MAWL at Tollan's Farm", q4: 'Burn 3 dens in Greyhollow', q5: 'Bring out 4 people from Fennick Ford', q7: 'Kill the butcher at the bottom of a deep job', q9: 'Kill THE HAULIER in the Deep' }[q.id];
    return q.need > 1 ? `${g} (${n} of ${q.need})` : g;
  },
  /** Folded, one line. */
  small: (q: QuestDef, n: number) => QUESTW.goal(q, n).toUpperCase(),
  /** What each trainer says handing a quest over, the same every time. */
  hand: {
    WARRIOR: "Board. There's one for you. Do it properly.",
    RANGER: "There's a job on the board that's yours, go on, before someone else's dog has it.",
    ROGUE: "Someone's put your name on the board, and I'd go now if I were you, before they change their mind.",
    MAGE: "There's a job on the board, it's yours I think, you did seem ready, or near enough, anyway go, before I think better of it.",
    HEALER: "There's a job on the board for you, so go and get it, and come back with all your own bits, I'm sick of sewing.",
  } as Record<HeroClass, string>,
  /** Your board's posting for each (the Haulier's has none: he's in the Deep). */
  post: (q: QuestDef, place: Place): { title: string; text: string } => {
    const t: Record<string, { title: string; text: string }> = {
      q3: { title: `Quest: MAWL at ${place.name}`, text: `MAWL has the barn at ${place.name}. Kill him and Tollan can have it back.` },
      q4: { title: `Quest: dens at ${place.name}`, text: "The carr's thick with dens again, so burn three and Corporal Brisk will send you to Hangman's Wood." },
      q5: { title: `Quest: the folk at ${place.name}`, text: "Four of the ford's people are in cages. Bring them out and Corporal Brisk will send you to the Barrowfields and Fenmere." },
      q7: { title: 'Quest: GUTCHAIN in the Copperdeep Shafts', text: 'Five rooms down the Copperdeep Shafts, GUTCHAIN at the bottom, and if you kill him Cobb will put your name on his slate for the Deep.' },
    };
    return t[q.id] ?? { title: 'Quest', text: '' };
  },
  /** Said once, when a quest's done. */
  /** (The long trips are Corporal Brisk's, at the barracks' map table, not the board's: boardwords.ts.) */
  opened: { hangman: "Corporal Brisk will send you to Hangman's Wood.", exped: 'Corporal Brisk will send you to the Barrowfields and Fenmere.', deep: 'Cobb will let you down to the Deep.', opencut: 'Corporal Brisk will send you to the Open Cut.' } as Record<Gate, string>,
  /** The board's foot: where Brisk sends you, only what you've opened (boardwords.ts toMap's words). */
  toMap: (trips: { exped?: string; instance?: string }[]) => {
    const names = [...new Set(trips.map((j) => (j.instance ? 'the Open Cut' : j.exped === 'hangmans' ? "Hangman's Wood" : j.exped === 'fen' ? 'Fenmere' : 'the Barrowfields')))];
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}` : names[0];
    return `Corporal Brisk in the barracks sends you to ${list}.`;
  },
  /** At Brisk's map table with nothing opened yet. */
  noTrips: 'Nothing on the map for you yet. The board in the square has work.',
  done: 'QUEST DONE',
};
