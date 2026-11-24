/**
 * The Keeping Room, walkable (docs/design/keeping-room.md; Kyle, 2026-11-23: "claim walkable room here, map it out").
 * A town interior entered from the sewer grate's bricked arch (client/keepingui.ts), walked out of at the bottom,
 * back up at the grate. Its own furniture drawn the tile way (client/tilefurnkeep.ts: the trough, the cradle, the
 * hoard's shelves, the cistern's lip, the iron door, the kettle). No light but yours, the brazier's coals and the tallow stubs.
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
import type { GameMap, Npc } from './arena.js';
import { b, n, room } from './townhalls.js';

/** The door the grate's arch opens as (shared/interiors.ts `townInterior`). */
export const KEEPING_DOOR = 'keeping';

/**
 * The goblin that keeps the room (Kyle, 2026-11-24; client/keepgob.ts draws it). No name over it, nothing to say, not
 * a foe: it walks its round and works at each stop (the trough, the side shelf, the cradle, the back shelf, the
 * brazier), with two bare points to bring it round the furniture. Nothing in the game says why it's here.
 */
const KEEP_GOB_NPC: Npc = {
  ...n('KEEPGOB', 3.5, 6.3, '', 'keepgob'), mute: true, speed: 0.55,
  path: [[3.5, 6.3], [2.1, 4.7], [3.6, 4.1], [4.8, 3.2], [6.2, 1.9], [8.5, 5.0], [6.5, 7.2]],
  stops: [7, 6, 9, 0, 6, 8, 0],
};

/** The room: wet cistern stone, dark, the hoard on its shelves. */
export function keepingRoom(): GameMap {
  const W = 12, H = 11;
  return room('THE KEEPING ROOM', W, H, { floor: 'flagstone', back: 'stone', ambient: [0.1, 0.1, 0.13], moon: 0 }, [
    // The shelves: along the back, down both sides.
    b('hoard', 1, 0.5, 10, 1),
    b('hoard', 0.6, 1.8, 0.9, 4),
    b('hoard', 10.5, 1.8, 0.9, 5.2),
    // The cradle among the hoard, the cot, the trough under its drip.
    b('cradle', 3, 2.9, 1.2, 0.7),
    b('bed', 8.6, 5.8, 1.6, 1),
    b('trough', 1.2, 5.9, 1.8, 0.9),
    // The cistern's lip, either side of the steps down from the arch.
    b('lip', 0, 8, 4, 0.6),
    b('lip', 8, 8, 4, 0.6),
    // The dry arch's end: the iron door, its slot. The kettle on its trivet by the brazier.
    b('irondoor', 1.9, 9.3, 1.4, 0.4),
    b('kettle', 9.3, 3.5, 0.7, 0.5),
  ], [n('DORCAS', 7.4, 4.9, KEEPING_DOOR, 'keeper'), KEEP_GOB_NPC], {
    // No torches: the brazier's coals, and whatever light the hero brings.
    torches: [],
    braziers: [{ x: 8.5, y: 4.3, r: 0.4 }],
    // Tallow stubs at the iron door's foot, by its slot.
    rounds: [{ kind: 'candles', x: 3.6, y: 9.9, r: 0.2 }],
  });
}
