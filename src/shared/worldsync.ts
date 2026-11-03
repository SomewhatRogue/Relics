/**
 * What a hero does to the shared world, as one message: a contribution. The world server applies it
 * (api/_world.ts), and so does the browser straight away (so the town changes at once, online or
 * off). Pure and isomorphic: the same rules on both sides.
 */
import type { HeroClass } from './weapons.js';
import type { Stats } from './progress.js';
import { CHAPTER_1, settle, vote, type WorldState } from './story.js';
import { nights } from './raids.js';
import { WORK_ORDER, workDone, type WorkId } from './works.js';

/** Works finished lately, kept for the town's talk. */
export const MENDED_KEPT = 6;

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

/**
 * Apply a contribution to a world at real time `now` (the council's week runs on it: story.ts settle).
 * `raids`: roll the nights that pass for raids (the world server does for a shared world; a browser
 * only for its own, off the server, so a shared world's raid is the server's alone).
 */
export function contribute(w: WorldState, c: Contribution, now = Date.now(), raids = true): void {
  const was = WORK_ORDER.filter((k) => workDone(w, k)), day = w.day;
  w.rescued += c.rescued ?? 0;
  w.dens += c.dens ?? 0;
  w.lantern += c.lantern ?? 0;
  w.day += c.days ?? 0;
  for (const [k, n] of Object.entries(c.works ?? {})) w.works[k] = (w.works[k] ?? 0) + (n ?? 0);
  for (const k of WORK_ORDER) if (!was.includes(k) && workDone(w, k)) (w.mended ??= []).unshift({ id: k, day: w.day }), (w.mended.length = Math.min(w.mended.length, MENDED_KEPT));
  if (raids) nights(w, day);
  if (c.story && !w.storyDone.includes(c.story)) w.storyDone.push(c.story);
  if (c.vote && vote(w, c.voter ?? c.hero.id, c.vote, now)) (w.voters ??= {})[c.voter ?? c.hero.id] = c.hero.name;
  // The council may have just opened (its close is set) or closed (decided): checked after every change.
  settle(w, now);
  if (c.deed) (w.deeds ??= []).unshift({ ...c.deed, day: w.day }), (w.deeds.length = Math.min(w.deeds.length, DEEDS));
}

/** The Roll of the Brave: per stat, the top heroes. */
export type Board = Record<keyof Stats, { id: string; name: string; cls: HeroClass; n: number }[]>;
export const BOARD_SIZE = 10;

/** How many have voted on the open council decision, for what, and who (names, by choice, in voting order). */
export function ballot(w: WorldState): { voters: number; counts: Record<string, number>; names: Record<string, string[]> } {
  const b = w.ballots[CHAPTER_1.decision.id] ?? {}, counts: Record<string, number> = {}, names: Record<string, string[]> = {};
  for (const [who, c] of Object.entries(b)) (counts[c] = (counts[c] ?? 0) + 1), (names[c] ??= []).push(w.voters?.[who] ?? 'A HERO');
  return { voters: Object.keys(b).length, counts, names };
}
