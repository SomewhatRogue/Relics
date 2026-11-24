/**
 * Fury: bosses made scarier (Kyle, 2026-11-23: "bosses, even mission bosses, can be much scarier: faster, more
 * health, bigger on a map, more destructive"; then "up to 3x, why the hell not", "they vary in size depending on
 * their stats: a small fast one with high health could be fun, or a fat one"). A NAMED one (a hunt's, a story's, a
 * camp's: a butcher with a name) takes one of the BUILDS: `hp` times its health, hits `harm` times as hard, winds up
 * in `windup` of the time and rests `pause` of it, walks `pace` times as fast, `radius` times as broad, drawn `size`
 * times as big, its blows reaching `reach` as far (half its growth). Each name keeps its build (`BUILD_OF`; any
 * other name by a hash). It smashes props its blows or its charge cover (`propDmg` a blow) and fells trees. A boss of
 * the kit (the Doorkeepers, Hempen and the rest) gets `bossHp` times its health. Read by sim/room.ts (fromFoe),
 * sim/enemies.ts (pace, reach), sim/fury.ts (the smashing) and client/pacedraw.ts (the size, Enemy.scale).
 */
export type BuildId = 'brute' | 'hulk' | 'fat' | 'quick';
export interface Build { size: number; radius: number; hp: number; harm: number; pace: number; windup: number; pause: number }
export const BUILDS: Record<BuildId, Build> = {
  /** Big and quick to it: the all-rounder. */
  brute: { size: 1.8, radius: 1.45, hp: 1.6, harm: 1.25, pace: 1.3, windup: 0.85, pause: 0.8 },
  /** Three times the size: the slowest to move, the hardest to stop, the hardest hitting. */
  hulk: { size: 3, radius: 2, hp: 2.2, harm: 1.5, pace: 1.05, windup: 1, pause: 0.9 },
  /** Wide and deep: the most health, hits like a brute, slow on its feet. */
  fat: { size: 2.4, radius: 2.1, hp: 2.6, harm: 1.15, pace: 0.9, windup: 0.95, pause: 1 },
  /** Hardly bigger than a butcher, quick and hard to kill: on you before you're ready. */
  quick: { size: 1.25, radius: 1.1, hp: 1.8, harm: 1.1, pace: 1.75, windup: 0.75, pause: 0.65 },
};
/** The board's named butchers (shared/jobs.ts BOSSES), each its own build. */
export const BUILD_OF: Record<string, BuildId> = { MAWL: 'fat', SKARN: 'quick', 'OLD KNUCKLES': 'hulk', 'OLD SPOON': 'brute', GUTCHAIN: 'hulk', 'MOTHER RUST': 'fat' };
const ORDER: BuildId[] = ['brute', 'hulk', 'fat', 'quick'];
/** A name's build: its own, else one by the name's letters (the same every time). */
export function buildOf(name: string): BuildId {
  if (BUILD_OF[name]) return BUILD_OF[name];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return ORDER[h % ORDER.length];
}
/** How much further its blows reach for its size (half its growth). */
export const reachFor = (size: number) => 1 + (size - 1) * 0.5;
export const FURY = { propDmg: 80, bossHp: 1.4 };

/**
 * At higher levels the BIG ONEs and shield goblins grow toward the old boss size and get about more (Kyle,
 * 2026-11-23: "current size or old size boss can be big ones or even shield guys who start running around more
 * as you get into high levels"). From level `from`, each level more: `size` bigger (body and drawing) up to
 * `sizeMost`, and `pace` quicker up to `paceMost`. sim/fury.ts growOn, at spawn.
 */
export const HIGH_GROWTH = { from: 5, size: 0.05, sizeMost: 1.3, pace: 0.04, paceMost: 1.25 };
