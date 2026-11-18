/**
 * Height and range (docs/design/elevation.md, "Raised areas"; Kyle, 2026-11-18: "if you're up, you get a range
 * bonus... so that there's benefits to taking higher zones"). Only where the levels are the ground (sim/afoot.ts).
 *
 *   Shooting down: a shot loosed from a height reaches HEIGHT.reach tiles further for each level it looks down,
 *   but only from near the lip: there must be lower ground within HEIGHT.edge tiles ahead of the one shooting.
 *   Stood back from the edge, a shot goes its ordinary way.
 *   Shooting up: each level the mark stands above the one shooting counts as HEIGHT.reach tiles more to cover, so
 *   you have to come in close under a height to hit anyone on it.
 *
 * The same for a hero's shots and a goblin archer's. Pure.
 */
import { levelAt, type GameMap } from '../shared/arena';
import { HEIGHT } from '../shared/tuning';
import { landed } from './afoot';

type At = { x: number; y: number; z?: number };

/** How many levels the ground drops within HEIGHT.edge tiles ahead of `from` along (dx, dy): 0 away from a lip. */
export function looksDown(m: GameMap, from: At, dx: number, dy: number): number {
  if (!landed(m)) return 0;
  const z = from.z ?? 0;
  let drop = 0;
  for (let d = 0.5; d <= HEIGHT.edge + 1e-6; d += 0.5) drop = Math.max(drop, z - levelAt(m, from.x + dx * d, from.y + dy * d));
  return Math.max(0, drop);
}

/** Tiles added to a shot's reach from `from` along (dx, dy) at a mark on level `zt`: more from a lip above, less from below. */
export function reachShift(m: GameMap, from: At, dx: number, dy: number, zt: number): number {
  if (!landed(m)) return 0;
  const z = from.z ?? 0;
  if (zt < z) return HEIGHT.reach * Math.min(z - zt, looksDown(m, from, dx, dy));
  return zt > z ? -HEIGHT.reach * (zt - z) : 0;
}

/** The ground a step ahead is lower than where this one stands: the lip of its height (an archer stops here). */
export const atLip = (m: GameMap, b: At, dx: number, dy: number) => landed(m) && levelAt(m, b.x + dx * 0.9, b.y + dy * 0.9) < (b.z ?? 0);
