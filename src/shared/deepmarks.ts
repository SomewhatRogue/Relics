/**
 * The Deep's curses and blessings (docs/design/the-deep.md, "Paths, blessings and curses"; build step 6).
 * At the end of every fifth floor the way on forks three ways, each with a curse on it, and going deeper
 * means taking one; at the end of every tenth, a blessing first, one of three. Both stack for the run and
 * end with it (shared/deepkit.ts DeepRun.marks). Each player takes their own: a hero's marks ride on their
 * input to the room (sim/deepmarks.ts), which adds them to the hero's numbers (sim/gearstats.ts) and to how
 * far goblins see it (sim/enemies.ts). The three offered come from the run's seed and the floor, so a
 * reload offers the same three. Names and lines: client/deepwords.ts.
 */
import { Rng } from './rng.js';

/** What a mark changes: added to the hero's damage, health, stamina or faith; pace and goblins' sight as a share; relic uses back a floor. */
export type MarkStat = 'damage' | 'health' | 'speed' | 'breath' | 'focus' | 'seen' | 'relic';

export const CURSES = {
  dull: { stat: 'damage', v: -0.06 },
  heavy: { stat: 'speed', v: -0.06 },
  frail: { stat: 'health', v: -10 },
  winded: { stat: 'breath', v: -0.12 },
  dim: { stat: 'focus', v: -0.12 },
  seen: { stat: 'seen', v: 0.15 },
} satisfies Record<string, { stat: MarkStat; v: number }>;
export const BLESSINGS = {
  keen: { stat: 'damage', v: 0.08 },
  hale: { stat: 'health', v: 15 },
  wind: { stat: 'breath', v: 0.15 },
  devout: { stat: 'focus', v: 0.15 },
  relic: { stat: 'relic', v: 1 },
} satisfies Record<string, { stat: MarkStat; v: number }>;
export type CurseId = keyof typeof CURSES;
export type BlessId = keyof typeof BLESSINGS;
export type MarkId = CurseId | BlessId;

/** A curse at the end of every `curse`th floor, a blessing every `bless`th; `offer` of each to choose from. */
export const DEEP_MARKS = { curse: 5, bless: 10, offer: 3 };

const MARK: Record<string, { stat: MarkStat; v: number }> = { ...CURSES, ...BLESSINGS };
export const isCurse = (id: string): id is CurseId => id in CURSES;
export const isMark = (id: unknown): id is MarkId => typeof id === 'string' && id in MARK;

const three = <T extends string>(ids: T[], seed: number, floor: number, salt: number): T[] => {
  const rng = new Rng((seed * 31 + floor * 977 + salt) >>> 0), pool = [...ids], out: T[] = [];
  while (out.length < DEEP_MARKS.offer && pool.length) out.push(pool.splice(rng.int(pool.length), 1)[0]);
  return out;
};
/** The three curses on the three ways on from the end of floor `floor` of the run with `seed`. */
export const cursesAt = (seed: number, floor: number) => three(Object.keys(CURSES) as CurseId[], seed, floor, 1);
/** The three blessings offered at the end of floor `floor`. */
export const blessingsAt = (seed: number, floor: number) => three(Object.keys(BLESSINGS) as BlessId[], seed, floor, 2);
export const forksAt = (floor: number) => floor > 0 && floor % DEEP_MARKS.curse === 0;
export const blessesAt = (floor: number) => floor > 0 && floor % DEEP_MARKS.bless === 0;

/** A hero's marks added up for one stat (stacking: two of the same count twice). */
export const markSum = (marks: readonly string[] | undefined, stat: MarkStat) => (marks ?? []).reduce((s, id) => s + (MARK[id]?.stat === stat ? MARK[id].v : 0), 0);
