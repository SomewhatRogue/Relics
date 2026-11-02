/**
 * Raids: now and then the hungry come over the north wall in the night and pull down what the town
 * has mended (never the watch, the Old Quarter or the sewers, and never stone). It has to be paid for
 * again, and the town remembers: the board says when, people talk about it.
 *
 * Pure and decided by the world's own day, so everyone sees the same raid: the world server rolls it
 * for a shared world as the days pass (shared/worldsync.ts `contribute`), and a browser rolls it for
 * its own world when it's off the server. Days pass with finished runs, as gold comes in with them,
 * so a busy world is raided more often and mends faster, in proportion.
 */
import { Rng } from './rng.js';
import type { WorldState } from './story.js';
import { WORKS, WORK_ORDER, workDone, type WorkId } from './works.js';

export interface Raid { day: number; lost: WorkId[] }
/** No raid before this day, none within RAID_GAP days of the last, and then this chance a day. */
export const RAID_FROM = 10, RAID_GAP = 6, RAID_CHANCE = 0.15;
/** Raids remembered (newest first). */
export const RAIDS_KEPT = 4;
/** A raid is news for this many days. */
export const RAID_FRESH = 3;
/** The town must have mended at least this much before it's worth a raid. */
const WORTH = 2;

export const lastRaid = (w: WorldState): Raid | undefined => w.raids?.[0];

/**
 * What a raid can undo: every mending work that's done and on top of its line (the garden loses its
 * newest stage, the wall drops back one), except stone.
 */
export const raidable = (w: WorldState): WorkId[] =>
  WORK_ORDER.filter((k) => WORKS[k].mend && workDone(w, k) && !WORK_ORDER.some((j) => WORKS[j].after === k && workDone(w, j)));

/** Does the night of `day` bring a raid? The same answer on every machine. */
export function raidDue(w: WorldState, day: number): boolean {
  const last = lastRaid(w);
  if (day < RAID_FROM || (last && day - last.day < RAID_GAP) || raidable(w).length < WORTH) return false;
  return new Rng(day * 7919 + 104729).next() < RAID_CHANCE;
}

/**
 * The raid: the blood comes back to the square (if it was washed), and one more thing is pulled down,
 * two once the town has a lot to lose. Records it, and returns what was lost.
 */
export function raid(w: WorldState, seed: number): WorkId[] {
  const can = raidable(w);
  if (!can.length) return [];
  const rng = new Rng(seed), rest = rng.shuffle(can.filter((k) => k !== 'wash'));
  const lost = [...(can.includes('wash') ? ['wash' as const] : []), ...rest.slice(0, can.length >= 5 ? 2 : 1)];
  for (const k of lost) w.works[k] = 0;
  (w.raids ??= []).unshift({ day: w.day, lost });
  w.raids.length = Math.min(w.raids.length, RAIDS_KEPT);
  return lost;
}

/** The days from `from` (exclusive) to the world's day, each with its chance of a raid. */
export function nights(w: WorldState, from: number): void {
  for (let d = from + 1; d <= w.day; d++) if (raidDue(w, d)) raid(w, d * 31 + 7);
}

/** What a raid did, in a phrase: "the square is bloodied again and the lane lamps are smashed". */
export const lossText = (r: Raid) => {
  const parts = r.lost.map((k) => WORKS[k].lost ?? WORKS[k].name);
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0] ?? '';
};
