/**
 * What a hero does to the shared world, as one message: a contribution. The world server applies it
 * (api/_world.ts), and so does the browser straight away (so the town changes at once, online or
 * off). Pure and isomorphic: the same rules on both sides.
 */
import type { HeroClass } from './weapons.js';
import type { Stats } from './progress.js';
import { CHAPTER_1, QUORUM, vote, type WorldState } from './story.js';
import type { WorkId } from './works.js';

export interface HeroTag { id: string; name: string; cls: HeroClass }
/** How many jobs done the board keeps (newest first). */
export const DEEDS = 8;

export interface Contribution {
  hero: HeroTag;
  /** Added to the hero's line on the Roll of the Brave. */
  stats?: Partial<Stats>;
  /** People brought home, dens burned (the world's own counts). */
  rescued?: number;
  dens?: number;
  /** Gold given to the Lantern, or to a town work. */
  lantern?: number;
  works?: Partial<Record<WorkId, number>>;
  /** A story mission done. */
  story?: string;
  /** A council vote, and who casts it: the device, not the hero, so one person's heroes share one voice. */
  vote?: string;
  voter?: string;
  /** A job done, for the board: what, where, and the party that did it. */
  deed?: { title: string; place: string; party: string[] };
  /** Days that pass (a finished run). */
  days?: number;
}

/** Apply a contribution to a world. `quorum` is the council's (1 when you play alone, offline). */
export function contribute(w: WorldState, c: Contribution, quorum = QUORUM): void {
  w.rescued += c.rescued ?? 0;
  w.dens += c.dens ?? 0;
  w.lantern += c.lantern ?? 0;
  w.day += c.days ?? 0;
  for (const [k, n] of Object.entries(c.works ?? {})) w.works[k] = (w.works[k] ?? 0) + (n ?? 0);
  if (c.story && !w.storyDone.includes(c.story)) w.storyDone.push(c.story);
  if (c.vote) vote(w, c.voter ?? c.hero.id, c.vote, quorum);
  if (c.deed) (w.deeds ??= []).unshift({ ...c.deed, day: w.day }), (w.deeds.length = Math.min(w.deeds.length, DEEDS));
}

/** The Roll of the Brave: per stat, the top heroes. */
export type Board = Record<keyof Stats, { id: string; name: string; cls: HeroClass; n: number }[]>;
export const BOARD_SIZE = 10;

/** How many have voted on the open council decision, and for what. */
export function ballot(w: WorldState): { voters: number; counts: Record<string, number> } {
  const b = w.ballots[CHAPTER_1.decision.id] ?? {}, counts: Record<string, number> = {};
  for (const c of Object.values(b)) counts[c] = (counts[c] ?? 0) + 1;
  return { voters: Object.keys(b).length, counts };
}
