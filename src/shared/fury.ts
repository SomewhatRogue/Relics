/**
 * Fury: bosses made scarier (Kyle, 2026-11-23: "bosses, even mission bosses, can be much scarier: faster, more
 * health, bigger on a map, more destructive"). A NAMED one (a hunt's or a story's, a camp's: a butcher with a name)
 * gets `hp` times its health, hits `harm` times as hard, winds up in `windup` of the time and rests `pause` of it,
 * walks `pace` times as fast, is `radius` times as broad and drawn `size` times as big, and smashes any crate,
 * barrel or other prop its blows or its charge cover (`propDmg` a blow). A boss of the kit (the Doorkeepers,
 * Hempen and the rest) gets `bossHp` times its health. Read by sim/room.ts (fromFoe), sim/enemies.ts (pace),
 * sim/fury.ts (the smashing) and client/foes.ts (the size). 
 */
// (size 1.3 to 1.7 and radius 1.25 to 1.45: Kyle, 2026-11-23, "there's room for bosses to be EVEN BIGGER".)
export const FURY = { hp: 1.6, harm: 1.25, windup: 0.85, pause: 0.8, pace: 1.3, radius: 1.45, size: 1.7, propDmg: 80, bossHp: 1.4 };

/**
 * At higher levels the BIG ONEs and shield goblins grow toward the old boss size and get about more (Kyle,
 * 2026-11-23: "current size or old size boss can be big ones or even shield guys who start running around more
 * as you get into high levels"). From level `from`, each level more: `size` bigger (body and drawing) up to
 * `sizeMost`, and `pace` quicker up to `paceMost`. sim/fury.ts growOn, at spawn.
 */
export const HIGH_GROWTH = { from: 5, size: 0.05, sizeMost: 1.3, pace: 0.04, paceMost: 1.25 };
