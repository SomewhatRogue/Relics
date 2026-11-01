/**
 * The shared world's story: one chapter at a time. A chapter has goals (people brought home, its
 * story mission); when they're met, the council table in Lantern Square opens a decision. The group
 * votes (a quorum of 4); the choice changes the town and the world for good, and the next chapter is
 * written at the weekly review from what the group did.
 */
import type { Job } from './jobs.js';
import { PLACES } from './jobs.js';

export interface Vote { decision: string; choice: string; voters: number; day: number }

export interface WorldState {
  chapter: number;
  /** Days pass with each finished run (for now). */
  day: number;
  /** People brought home, all told. */
  rescued: number;
  storyDone: string[];
  /** Decisions made: decision id -> choice id. */
  flags: Record<string, string>;
  votes: Vote[];
  /** Gold given to the Last Lantern at the church. */
  lantern: number;
  /** Gold given to each town work (see works.ts). */
  works: Record<string, number>;
  /** Goblin dens burned out, all told. */
  dens: number;
  /** Council votes in progress: decision id -> hero id -> choice. */
  ballots: Record<string, Record<string, string>>;
}

export const newWorld = (): WorldState => ({ chapter: 1, day: 1, rescued: 0, storyDone: [], flags: {}, votes: [], lantern: 0, works: {}, dens: 0, ballots: {} });

export const QUORUM = 4;

export interface Choice { id: string; label: string; text: string }
export interface Decision { id: string; question: string; choices: Choice[] }

/** Chapter 1, the bones only: bring people home, ring Barrowby's bell, then decide the north fields. */
export const CHAPTER_1 = {
  name: 'Chapter 1: The Last Lantern',
  goals: { rescued: 6, story: 'barrowby-bell' },
  mission: {
    id: 'barrowby-bell', place: PLACES[0], objective: 'story', twist: 'night', rooms: 4, reward: 150, seed: 4242,
    title: "Barrowby's Bell",
    text: "Barrowby's church bell used to call the valley home. The Gnawer nests in the church now, with the village's last families caged around it. Kill it, free them, and ring the bell.",
    boss: 'THE GNAWER',
  } as Job,
  decision: {
    id: 'north-fields',
    question: 'The north fields are safe again. What does Wickhold do with them?',
    choices: [
      { id: 'farm', label: 'Farm them', text: 'Food for the town. Every job pays a quarter more, and a granary goes up by the north gate.' },
      { id: 'refugees', label: 'Take in the refugees', text: 'The camp outside the gate moves in: four more people on Rescue Row, and a trader opens a stall on Market Row.' },
    ],
  } as Decision,
};

export const chapterGoals = (w: WorldState) => ({
  rescued: Math.min(w.rescued, CHAPTER_1.goals.rescued),
  rescuedGoal: CHAPTER_1.goals.rescued,
  story: w.storyDone.includes(CHAPTER_1.goals.story),
});

/** The council's decision is open once the chapter's goals are met and it hasn't been decided. */
export const councilOpen = (w: WorldState) => {
  const g = chapterGoals(w);
  return g.rescued >= g.rescuedGoal && g.story && !w.flags[CHAPTER_1.decision.id];
};

/**
 * A hero's vote at the council. Once `quorum` heroes have voted the council decides by majority (a
 * tie goes to the choice voted first). Returns the choice decided, if this vote decided it.
 */
export function vote(w: WorldState, hero: string, choice: string, quorum = QUORUM): string | null {
  const d = CHAPTER_1.decision;
  if (!councilOpen(w) || !d.choices.some((c) => c.id === choice)) return null;
  const b = (w.ballots[d.id] ??= {});
  b[hero] = choice;
  const voters = Object.keys(b).length;
  if (voters < quorum) return null;
  const count = (c: string) => Object.values(b).filter((x) => x === c).length, order = Object.values(b);
  const win = [...d.choices].map((c) => c.id).sort((x, y) => count(y) - count(x) || order.indexOf(x) - order.indexOf(y))[0];
  decide(w, win, voters);
  return win;
}

/** Record the council's choice and change the world for it. */
export function decide(w: WorldState, choice: string, voters: number): void {
  const d = CHAPTER_1.decision;
  if (!d.choices.some((c) => c.id === choice) || w.flags[d.id]) return;
  w.flags[d.id] = choice;
  w.votes.push({ decision: d.id, choice, voters, day: w.day });
  if (choice === 'refugees') w.rescued += 4;
}

/** What the world's choices do to the town's economy. */
export const rewardMult = (w: WorldState) => (w.flags['north-fields'] === 'farm' ? 1.25 : 1);
export const marketOpen = (w: WorldState) => w.flags['north-fields'] === 'refugees';
