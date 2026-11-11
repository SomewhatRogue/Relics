/**
 * The Deep's boards (docs/design/the-deep.md, step 5): the deepest floor reached, then the gold banked as the
 * tiebreak, each hero once at their best; heroes who went down alone and parties listed apart. Kept in the
 * shared world like the other boards (shared/worldsync.ts contribute, api/_world.ts).
 *
 * A Deep run can't be played again on the server the way a round at the butts is (it's a whole fight), so
 * a claim is held to the world's own record instead: going down stamps the run's seed with the world's clock
 * (`startDeep`), and a claim counts only for that seed, with enough of the world's own time gone by for the
 * floors claimed, and no more gold than the floors could hold. That keeps out a typed-in score and a run
 * faked in a hurry; it can't tell a patient forger from a player. Numbers: DEEP_BOARD.
 */
import type { RangeLine } from './rangeboard.js';

export interface DeepLine extends RangeLine { gold: number }
/** A finished run as sent: its seed, the deepest floor reached, the gold banked, and whether with a party. */
export interface DeepClaim { s: number; f: number; g: number; p: boolean }
export interface DeepStamp { s: number; at: number }

/**
 * `size`: names kept on each board. A claim needs `floorSecs` of the world's time a floor (the first included),
 * at most `goldFloor` gold a floor, and its stamp no older than `stampHours`; at most `stamps` stamps kept.
 */
export const DEEP_BOARD = { size: 10, floorSecs: 30, goldFloor: 400, stampHours: 12, stamps: 200, mostFloor: 999 };

const int = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

/** A claim as it came off the wire, or null if it isn't one. */
export function cleanDeepClaim(raw: unknown): DeepClaim | null {
  const c = raw as Partial<DeepClaim> | null;
  if (!c || !int(c.s, 0, 2 ** 32) || !int(c.f, 1, DEEP_BOARD.mostFloor) || !int(c.g, 0, DEEP_BOARD.mostFloor * DEEP_BOARD.goldFloor)) return null;
  return { s: c.s!, f: c.f!, g: c.g!, p: !!c.p };
}

/** A seed as sent to stamp, or null. */
export const cleanDeepStart = (raw: unknown): number | null => (int(raw, 0, 2 ** 32) ? (raw as number) : null);

/** Going down: the world stamps hero `id`'s run with its own clock (`now`, ms), the oldest dropped past DEEP_BOARD.stamps. */
export function startDeep(runs: Record<string, DeepStamp> | undefined, id: string, seed: number, now: number): Record<string, DeepStamp> {
  const out = { ...(runs ?? {}), [id]: { s: seed, at: now } }, cut = now - DEEP_BOARD.stampHours * 3600e3;
  const keep = Object.entries(out).filter(([, v]) => v.at >= cut).sort((a, b) => b[1].at - a[1].at).slice(0, DEEP_BOARD.stamps);
  return Object.fromEntries(keep);
}

/** Whether a claim stands against the hero's stamp at the world's time `now` (ms). */
export function deepClaimOk(stamp: DeepStamp | undefined, c: DeepClaim, now: number): boolean {
  if (!stamp || stamp.s !== c.s || now - stamp.at > DEEP_BOARD.stampHours * 3600e3) return false;
  return now - stamp.at >= c.f * DEEP_BOARD.floorSecs * 1000 && c.g <= c.f * DEEP_BOARD.goldFloor;
}

/** Better: deeper, or as deep with more gold. */
const better = (a: DeepLine, b: DeepLine) => a.n > b.n || (a.n === b.n && a.gold > b.gold);

/** A run onto a board: each hero once, at their best, the top DEEP_BOARD.size kept. */
export function addDeepLine(board: DeepLine[] | undefined, line: DeepLine): DeepLine[] {
  const was = (board ?? []).find((l) => l.id === line.id);
  if (was && !better(line, was)) return (board ?? []).map((l) => (l.id === line.id ? { ...l, name: line.name } : l));
  return [...(board ?? []).filter((l) => l.id !== line.id), line].sort((a, b) => b.n - a.n || b.gold - a.gold).slice(0, DEEP_BOARD.size);
}
