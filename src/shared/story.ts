/**
 * The shared world's story: one chapter at a time. A chapter has goals (people brought home, its
 * story mission); when they're met, the council table in Lantern Square opens a decision. The group
 * votes all week, everyone on the server (councilweek.ts: it closes at the end of Sunday, Pacific); the choice changes the town and the world for good, and the next chapter is
 * written at the weekly review from what the group did.
 */
import type { Job } from './jobs.js';
import { PLACES } from './jobs.js';
import { COUNCIL, closeFor, weekEnd } from './councilweek.js';

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
  /** Council votes in progress: decision id -> voter (a device; a hero id in old worlds) -> choice. */
  ballots: Record<string, Record<string, string>>;
  /** Who each voter is, by the hero who last voted from there (the town hall's boards). */
  voters?: Record<string, string>;
  /** When the open council closes (ms, real time), set when it opens; and whether it's already sat on for a tie. */
  councilCloses?: number;
  councilTied?: boolean;
  /** Jobs done lately, for the board, newest first (worldsync DEEDS). */
  deeds?: { day: number; title: string; place: string; party: string[] }[];
  /** Works finished lately (newest first), for what people talk about (shared/townsays.ts). */
  mended?: { id: string; day: number }[];
  /** Raids on the town (newest first), and what each pulled down (shared/raids.ts). */
  raids?: { day: number; lost: import('./works.js').WorkId[] }[];
  /** The Deep's boards (shared/deepboard.ts): the deepest each hero has been, alone and with a party, the top ten; and each hero's last run down, stamped with the world's clock. */
  deepSolo?: import('./deepboard.js').DeepLine[];
  deepParty?: import('./deepboard.js').DeepLine[];
  deepRuns?: Record<string, import('./deepboard.js').DeepStamp>;
  /** The archery range's board at the hunters' lodge: each hero's best round, the top ten (shared/rangeboard.ts). */
  range?: import('./rangeboard.js').RangeLine[];
  /** The Drowned Rat's knife board: each hero's best round, the top ten (shared/knifeboard.ts). */
  knives?: import('./rangeboard.js').RangeLine[];
  /** Halvard's forge: each hero's best shift, the top ten (shared/shiftboard.ts). */
  shift?: import('./rangeboard.js').RangeLine[];
  /** The millpond: each hero's biggest fish, the top ten (shared/fishboard.ts). */
  fish?: import('./fishboard.js').FishLine[];
  /** Who's on the plinth in Lantern Square, and what they paid (shared/statue.ts). */
  statue?: import('./statue.js').Statue;
}

export const newWorld = (): WorldState => ({ chapter: 1, day: 1, rescued: 0, storyDone: [], flags: {}, votes: [], lantern: 0, works: {}, dens: 0, ballots: {} });

/** `short`: the name on its board in the town hall (fits 12 letters). */
export interface Choice { id: string; label: string; short: string; text: string }
export interface Decision { id: string; question: string; choices: Choice[] }

/** Chapter 1, the bones only: bring people home, ring Barrowby's bell, then decide the north fields. */
export const CHAPTER_1 = {
  name: 'Chapter 1: The Last Lantern',
  goals: { rescued: 6, story: 'barrowby-bell' },
  mission: {
    id: 'barrowby-bell', place: PLACES[0], objective: 'story', twist: 'night', rooms: 4, reward: 150, seed: 4242,
    title: "Barrowby's Bell",
    text: "Barrowby's bell used to call the whole valley in from the fields. It's the last bell for twenty miles that nobody melted down. The Gnawer sleeps under it now, with what's left of Barrowby penned round the font. Kill it. Free them. Then pull that rope with everything you've got, and listen to what the hungry do.",
    boss: 'THE GNAWER',
  } as Job,
  decision: {
    id: 'north-fields',
    question: 'The north fields are ours again, for now. What does Wickhold do with them?',
    choices: [
      { id: 'farm', label: 'Farm them', short: 'FARM THEM', text: 'Every job pays 25% more, and a granary goes up by the north gate. The camp outside stays outside.' },
      { id: 'refugees', label: 'Take in the refugees', short: 'TAKE THEM IN', text: 'Open the gate to the camp. Four more people on Rescue Row, and Dessa the trader opens a stall on Market Row.' },
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
 * The council, looked at `now` (real ms): run whenever the world is read or written, so nothing needs
 * a timer. Once open it gets its close (closeFor); at the close the most votes win and land then. A tie
 * sits one day longer; tied again, the reeve breaks it for the side voted for first. Nobody voted at
 * all: it sits another week. Returns the choice if it was decided just now.
 */
export function settle(w: WorldState, now: number): string | null {
  const d = CHAPTER_1.decision;
  if (!councilOpen(w)) return null;
  w.councilCloses ??= closeFor(now);
  while (now >= w.councilCloses) {
    const order = Object.values(w.ballots[d.id] ?? {});
    if (!order.length) {
      w.councilCloses = weekEnd(w.councilCloses);
      continue;
    }
    const count = (c: string) => order.filter((x) => x === c).length;
    const ranked = d.choices.map((c) => c.id).sort((x, y) => count(y) - count(x) || first(order, x) - first(order, y));
    if (count(ranked[0]) === count(ranked[1]) && !w.councilTied) {
      w.councilTied = true;
      w.councilCloses += COUNCIL.tieExtra;
      continue;
    }
    decide(w, ranked[0], order.length);
    return ranked[0];
  }
  return null;
}
const first = (order: string[], c: string) => (order.includes(c) ? order.indexOf(c) : order.length);

/** A voice at the council (a device: all its heroes share it), changeable until the close. False: closed, or no such choice. */
export function vote(w: WorldState, voter: string, choice: string, now: number): boolean {
  const d = CHAPTER_1.decision;
  settle(w, now);
  if (!councilOpen(w) || !d.choices.some((c) => c.id === choice)) return false;
  (w.ballots[d.id] ??= {})[voter] = choice;
  return true;
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
