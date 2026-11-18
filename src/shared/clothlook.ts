/**
 * The cloth a hero wears (docs/design/cloak-choice.md; Kyle, 2026-11-17: "something you can unlock ... doing x
 * number of things killing goblins, quests, etc let you unlock a new color or effect"): a dye, an edge and a cut,
 * each earned by a deed the game already counts and put on with the tailor on the square. Drawing only: the room
 * never reads it.
 *
 * Only what is worn is saved (`Profile.cloth`), copied to `Hero.clothLook` and sent to friends with the hero's
 * look as the shield is. What is earned is worked out from the hero's tallies each time, so deeds already done
 * count and there is nothing to migrate. Anything heard from outside goes through `fitCloth`. Entry 0 of every row
 * is the look's own, as drawn, and is everyone's.
 */
import { QUESTS, doneQuests } from './heroquests.js';
import type { Profile, Stats } from './progress.js';

export const DYES = ['own', 'red', 'blue', 'green', 'black', 'white', 'ochre'] as const;
export const EDGES = ['own', 'iron', 'silver', 'gold'] as const;
export const CUTS = ['own', 'lined', 'ragged'] as const;
export type Row = 'dye' | 'edge' | 'cut';
export const ROWS: Record<Row, readonly string[]> = { dye: DYES, edge: EDGES, cut: CUTS };
export const ROW_ORDER: Row[] = ['dye', 'edge', 'cut'];

export interface ClothLook { dye: number; edge: number; cut: number }
export const defaultCloth = (): ClothLook => ({ dye: 0, edge: 0, cut: 0 });

/** The rows the tailor has for a class: the Warrior's cape takes all three; the Ranger's and the Rogue's cloaks, the
 *  Mage's robe and hat and the Healer's tabard a dye and an edge. */
const DYED = ['RANGER', 'ROGUE', 'MAGE', 'HEALER'];
export const rowsFor = (cls: string): Row[] => (cls === 'WARRIOR' ? ROW_ORDER : DYED.includes(cls) ? ['dye', 'edge'] : []);
export const wearsCloth = (cls: string): boolean => rowsFor(cls).length > 0;

/** What a deed is counted in: one of the Roll's tallies, the Deep's deepest floor, or hero quests done. */
export type Tally = keyof Stats | 'deep' | 'quests';
export interface Deed { row: Row; i: number; by: Tally; need: number }

/** What earns each entry (first guesses: the balance thread's to set). An entry with no deed is everyone's: the
 *  look's own, and the lined cut. */
export const DEEDS: Deed[] = [
  { row: 'edge', i: 1, by: 'jobs', need: 1 },
  { row: 'dye', i: 1, by: 'kills', need: 100 },
  { row: 'dye', i: 2, by: 'jobs', need: 10 },
  { row: 'dye', i: 3, by: 'raised', need: 10 },
  { row: 'dye', i: 4, by: 'butchers', need: 5 },
  { row: 'dye', i: 5, by: 'saved', need: 25 },
  { row: 'dye', i: 6, by: 'given', need: 500 },
  { row: 'edge', i: 2, by: 'deep', need: 5 },
  { row: 'edge', i: 3, by: 'quests', need: QUESTS.length },
  { row: 'cut', i: 2, by: 'jobs', need: 25 },
];
export const deedFor = (row: Row, i: number): Deed | undefined => DEEDS.find((d) => d.row === row && d.i === i);

/** What the tallies are read from. */
export type Doer = Pick<Profile, 'stats' | 'deepBest' | 'quests' | 'level'>;

/** How far along a hero is in a tally. */
export function tally(p: Doer, by: Tally): number {
  if (by === 'deep') return p.deepBest ?? 0;
  if (by === 'quests') return (p.quests ?? doneQuests(p.level)).done.length;
  return Math.floor(p.stats?.[by] ?? 0);
}

/** Whether a hero may wear entry `i` of a row. */
export function earned(p: Doer, row: Row, i: number): boolean {
  const d = deedFor(row, i);
  return !d || tally(p, d.by) >= d.need;
}

/** Anything claimed to be a cloth, as one: a whole number inside each row, else the look's own. */
export function fitCloth(s: unknown): ClothLook {
  const o = (s && typeof s === 'object' ? s : {}) as Partial<Record<Row, unknown>>;
  const of = (row: Row): number => {
    const v = o[row];
    return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < ROWS[row].length ? v : 0;
  };
  return { dye: of('dye'), edge: of('edge'), cut: of('cut') };
}

/** A cloth as this hero may wear it: any part not earned, or that the tailor has no row of for their class, falls
 *  back to the look's own. */
export function wearable(p: Doer, s: unknown, cls: string = 'WARRIOR'): ClothLook {
  const c = fitCloth(s), has = rowsFor(cls);
  for (const row of ROW_ORDER) if (!has.includes(row) || !earned(p, row, c[row])) c[row] = 0;
  return c;
}

/** Small for the town's `me` word: three numbers. */
export type PackedCloth = [number, number, number];
export const packCloth = (c: ClothLook): PackedCloth => [c.dye, c.edge, c.cut];
export function unpackCloth(p: unknown): ClothLook | undefined {
  if (!Array.isArray(p) || p.length < 3) return undefined;
  return fitCloth({ dye: p[0], edge: p[1], cut: p[2] });
}
