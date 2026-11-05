/**
 * Wet goblins, for storm (shared/magic.ts STORM; Kyle, 2026-11-04: "storm does better on water"). A
 * goblin is wet standing in the room's water (a ford, the shallows, the fen's pools, any wading water:
 * the map's `water`, the same boxes `wadeAt` slows a body in), or anywhere when it's raining on the room.
 * One helper, so every storm rule asks the same question and a guest's room answers it the same way.
 */
import { currentMap, inArea, type GameMap } from '../shared/arena';

/** In the room's water (shallow or deep; nothing stands in the deep for long). */
export const inWater = (x: number, y: number, room: GameMap = currentMap()) => !!room.water?.some((w) => inArea(w, x, y));

/**
 * WEATHER HOOK. Raining on the room (a storm rains too). On main the weather is still paint on the
 * room's theme (`rain`, `storm`: shared/weather.ts), so that's what is read here. When the room's
 * weather becomes a rule (the theme's `sky`, shared/sky.ts), this one line becomes
 * `return wet(room.theme)` from shared/sky.ts, and every storm rule follows it.
 */
export const raining = (room: GameMap = currentMap()) => (room.theme?.rain ?? 0) > 0 || (room.theme?.storm ?? 0) > 0;

/** Wet: standing in water, or out in the rain. */
export const wet = (e: { x: number; y: number }, room: GameMap = currentMap()) => raining(room) || inWater(e.x, e.y, room);
