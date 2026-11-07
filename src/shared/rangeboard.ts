/**
 * The town's board at the archery range, kept in the shared world (one write per finished round, the
 * read riding the world's usual look: shared/worldsync.ts, api/_world.ts). A round goes up only as the
 * world works it out again from the hero's seed and their arrows (shared/range.ts `replayRange`), so a
 * score typed in by hand, or a round rolled again by refreshing, doesn't get on.
 */
import { seedOf } from './fishing.js';
import { replayRange } from './range.js';
import { RANGE, RANGE_BOARD } from './rangetune.js';
import type { HeroClass } from './weapons.js';

/** One line on the board: the hero, their class, their best. */
export interface RangeLine { id: string; name: string; cls: HeroClass; n: number }
/** A finished round as sent: which of the hero's rounds it was (its seed), and the arrows. */
export interface RangeClaim { n: number; shots: [number, number, number][] }

/** A claim as it came off the wire, or null if it isn't one. */
export function cleanClaim(raw: unknown): RangeClaim | null {
  const c = raw as Partial<RangeClaim> | null;
  if (!c || typeof c.n !== 'number' || !Number.isInteger(c.n) || c.n < 0 || c.n > 1e7 || !Array.isArray(c.shots) || c.shots.length > RANGE.shots) return null;
  const shots = c.shots.filter((s) => Array.isArray(s) && s.length === 3 && s.every((v) => Number.isInteger(v)));
  return shots.length === c.shots.length ? { n: c.n, shots: shots as RangeClaim['shots'] } : null;
}

/** What a claim scores, worked out again from the hero's own seed (0 if the arrows don't add up). */
export function claimScore(heroId: string, cls: HeroClass, c: RangeClaim): number {
  return replayRange(seedOf(heroId, c.n), cls === 'RANGER', c.shots)?.score ?? 0;
}

/** A score onto the board: each hero once, at their best, the top RANGE_BOARD kept. */
export function addRangeLine<L extends RangeLine>(board: L[] | undefined, line: L): L[] {
  const was = (board ?? []).find((l) => l.id === line.id);
  if (was && was.n >= line.n) return (board ?? []).map((l) => (l.id === line.id ? { ...l, name: line.name } : l));
  return [...(board ?? []).filter((l) => l.id !== line.id), line].sort((a, b) => b.n - a.n).slice(0, RANGE_BOARD);
}
