/**
 * The Keeping Room, walkable (docs/design/keeping-room.md; Kyle, 2026-11-23: "claim walkable room here, map it out").
 * A town interior entered from the sewer grate's bricked arch (client/keepingui.ts), walked out of at the bottom,
 * back up at the grate. Slice 1: the room and Dorcas, with the town's furniture standing in for its own (the trough,
 * the cradle, the brazier and its kettle, the iron door come with the art, the tile way). No light but yours, the
 * brazier's coals and the tallow stubs.
 *
 *       0 1 2 3 4 5 6 7 8 9 0 1
 *    0  # # # # # # # # # # # #      shelves all along the back and down both sides
 *    1  # S S S S S S S S S S #
 *    3  # S . c . . . . k . S #      c the cradle, k the kettle
 *    4  # S . . . . . . B . S #      B the brazier, Dorcas beside it
 *    6  # T T . . . . . o . S #      T the trough, o her cot
 *    8  # # # # . . . . # # # #      the cistern's lip
 *    9      # . . . . . . #          the dry arch: you come in here
 */
import type { GameMap } from './arena.js';
import { b, n, room } from './townhalls.js';

/** The door the grate's arch opens as (shared/interiors.ts `townInterior`). */
export const KEEPING_DOOR = 'keeping';

/** The room: wet cistern stone, dark, the hoard on its shelves. */
export function keepingRoom(): GameMap {
  const W = 12, H = 11;
  return room('THE KEEPING ROOM', W, H, { floor: 'flagstone', back: 'stone', ambient: [0.1, 0.1, 0.13], moon: 0 }, [
    // The shelves: along the back, down both sides.
    b('shelf', 1, 0.5, 10, 1),
    b('shelf', 0.6, 1.8, 0.9, 4),
    b('shelf', 10.5, 1.8, 0.9, 5.2),
    // The cradle among the hoard (stand-in), the cot, the trough (stand-in) under its drip.
    b('bench', 3, 2.9, 1.2, 0.7),
    b('bed', 8.6, 5.8, 1.6, 1),
    b('counter', 1.2, 5.9, 1.8, 0.9),
    // The cistern's lip, either side of the steps down from the arch.
    b('partition', 0, 8, 4, 0.6),
    b('partition', 8, 8, 4, 0.6),
  ], [n('DORCAS', 7.4, 4.9, KEEPING_DOOR, 'elder')], {
    // No torches: the brazier's coals, and whatever light the hero brings.
    torches: [],
    braziers: [{ x: 8.5, y: 4.3, r: 0.4 }],
  });
}
