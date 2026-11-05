/**
 * Wet goblins, for storm (shared/magic.ts STORM; Kyle, 2026-11-04: "storm does better on water"). A
 * goblin is wet standing in the room's water (a ford, the shallows, the fen's pools, any wading water:
 * the map's `water`, the same boxes `wadeAt` slows a body in), or anywhere when it's raining on the room.
 * One helper, so every storm rule asks the same question and a guest's room answers it the same way.
 */
import { wet as skyWet } from '../shared/sky';
import { currentMap, inArea, type GameMap } from '../shared/arena';

/** In the room's water (shallow or deep; nothing stands in the deep for long). */
export const inWater = (x: number, y: number, room: GameMap = currentMap()) => !!room.water?.some((w) => inArea(w, x, y));

/**
 * Raining on the room (a storm rains too): the room's sky, a rule since the weather landed (shared/sky.ts).
 */
export const raining = (room: GameMap = currentMap()) => skyWet(room.theme);

/** Wet: standing in water, or out in the rain. */
export const wet = (e: { x: number; y: number }, room: GameMap = currentMap()) => raining(room) || inWater(e.x, e.y, room);
