/**
 * Fury: bosses made scarier (Kyle, 2026-11-23: "bosses, even mission bosses, can be much scarier: faster, more
 * health, bigger on a map, more destructive"). A NAMED one (a hunt's or a story's, a camp's: a butcher with a name)
 * gets `hp` times its health, hits `harm` times as hard, winds up in `windup` of the time and rests `pause` of it,
 * walks `pace` times as fast, is `radius` times as broad and drawn `size` times as big, and smashes any crate,
 * barrel or other prop its blows or its charge cover (`propDmg` a blow). A boss of the kit (the Doorkeepers,
 * Hempen and the rest) gets `bossHp` times its health. Read by sim/room.ts (fromFoe), sim/enemies.ts (pace),
 * sim/fury.ts (the smashing) and client/foes.ts (the size). 
 */
export const FURY = { hp: 1.6, harm: 1.25, windup: 0.85, pause: 0.8, pace: 1.3, radius: 1.25, size: 1.3, propDmg: 80, bossHp: 1.4 };
