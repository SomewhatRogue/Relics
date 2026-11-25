/** The small goblin in profile as sprites (its pixels and turning: gobsideparts.ts). */
import { GOB, PALE, grow, makeSprite, type Sprite } from './sprites';
import { body, head } from './gobsideparts';
export { gobSideOn } from './gobsideparts';

/** The parts, for a sprite or for growing a size up (foes.ts bigGob). */
export const GOB_SIDE_PARTS = { gob: [...body(GOB), ...head(GOB, false)], pale: [...body(PALE), ...head(PALE, true)] };

let made: { gob: Sprite; pale: Sprite } | undefined;
/** The side sprites, made the first time they're wanted. */
export function gobSide(): { gob: Sprite; pale: Sprite } {
  return (made ??= { gob: makeSprite(17, 20, GOB_SIDE_PARTS.gob), pale: makeSprite(17, 20, GOB_SIDE_PARTS.pale) });
}

/** A side sprite grown `k` as big (a BIG ONE, Rakehead's four). */
export const grownSide = (k: number, pale: boolean) => makeSprite(Math.round(17 * k), Math.round(20 * k), grow(pale ? GOB_SIDE_PARTS.pale : GOB_SIDE_PARTS.gob, k));

