/**
 * Standing on the ground (docs/design/elevation.md, "What height does in a fight"). On most maps the ground is
 * level 0 and anything higher is a shelf or a roof. On a map whose ledges carry `lv` (Lowfurrow's hill, the town's
 * three levels) the levels ARE the ground: a body stands on it when it is at the level under its feet, or on a
 * slope between two. Off such a map every answer here is exactly what the rules always asked (`z === 0`).
 */
import { currentMap, inRamp, levelAt, type GameMap } from '../shared/arena';
import { HEIGHT } from '../shared/tuning';

type At = { x: number; y: number; z?: number };

/** The map's levels are its ground: some ledge carries a level. */
export const landed = (m: GameMap = currentMap()) => !!m.ledges?.some((l) => l.lv !== undefined);

/** A body's level, or (a spot with no z, lying on the ground) the level of the ground there. */
const levelOf = (b: At, m: GameMap) => ('z' in b ? b.z ?? 0 : levelAt(m, b.x, b.y));

/** The body stands on the ground (not up on a shelf or a roof, not dug under). */
export function afoot(b: At, m: GameMap = currentMap()): boolean {
  const z = b.z ?? 0;
  if (!landed(m)) return z === 0;
  if (z < 0) return false;
  return z === levelAt(m, b.x, b.y) || inRamp(m, b.x, b.y);
}

/** Two bodies, or a body and a spot on the ground, on the same level and both afoot. */
export function sameGround(a: At, b: At, m: GameMap = currentMap()): boolean {
  const spot = !('z' in b);
  if (!landed(m)) return afoot(a, m) && (spot || afoot(b, m));
  return afoot(a, m) && (spot || afoot(b, m)) && levelOf(a, m) === levelOf(b, m);
}

/** a stands higher than b (the high ground). */
export const above = (a: At, b: At, m: GameMap = currentMap()) => levelOf(a, m) > levelOf(b, m);

/** A shot loosed from a level (`hz`, set only where the levels are the ground) lands harder on anyone lower. */
export const highShot = (b: { hz?: number }, e: { z?: number }) => (b.hz !== undefined && b.hz > (e.z ?? 0) ? HEIGHT.shot : 1);
