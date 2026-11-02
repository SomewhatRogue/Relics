/**
 * Spiders: the numbers. Small fast ones that come in waves out of a nest until it's destroyed, each
 * weak alone, with a short telegraphed pounce whose bite poisons; now and then, deep in, a big slow
 * brood mother that bites and spits a glob that leaves a poison puddle. All of them burn easily (WEAK: shared/weakness.ts).
 * Poison is a status on heroes, judged by the room (sim/poison.ts). Where they turn up: shared/nests.ts.
 */
import type { EnemyAttackSpec, EnemySpec } from './tuning.js';

/** A small spider. `pounce`: a short leap along a line it shows you (blockable, parryable). */
export const SPIDER: EnemySpec & { pounce: EnemyAttackSpec; sight: number; skitter: number; zig: number; spread: number } = {
  hp: 14, radius: 0.24, weight: 0.35, speed: 4.6, reach: 2.4, respawn: 5, stun: 1.4, pauseBetween: 1.0, flinches: true, turn: 9,
  pounce: { windup: 0.45, active: 0.2, recover: 0.5, dmg: 5, knock: 1.5, range: 2.4, arc: 0, radius: 0.42, unblockable: false },
  /** Sees you from this far at rest; zigzags `skitter` tiles to the side `zig` times a second. */
  sight: 5.5,
  skitter: 0.9,
  zig: 1.6,
  /** Fire jumps between spiders this much further than between goblins. */
  spread: 0.5,
};

/**
 * The brood mother: slow, tanky, a bite up close and a spit from further off. The spit is lobbed at
 * where you stood when it began (striped: walk or dodge out of it), lands at `spit.radius` around that
 * spot and leaves a puddle there.
 */
export const BROOD: EnemySpec & { bite: EnemyAttackSpec; spit: EnemyAttackSpec; spitFrom: number; spitChance: number } = {
  hp: 240, radius: 0.7, weight: 3, speed: 1.3, reach: 1.7, respawn: 4, stun: 1.8, pauseBetween: 0.9, flinches: false, turn: 2.2,
  bite: { windup: 0.8, active: 0.1, recover: 0.8, dmg: 14, knock: 5, range: 1.9, arc: 70, unblockable: false },
  spit: { windup: 1.1, active: 0.1, recover: 1.0, dmg: 10, knock: 2, range: 7, radius: 1.3, unblockable: true },
  spitFrom: 2.8,
  spitChance: 0.75,
};

/**
 * A nest (a mound of web and egg sacs). Wakes when a hero comes within `wake` (or it's hit); `first`
 * seconds later the first wave hatches, then one every `every` seconds, `wave` spiders (and `party`
 * more for each player past the first), while fewer than `cap` of its own are alive. The sacs swell
 * for `swell` seconds before a wave. Destroying it stops the waves; fire is the quick way.
 */
export const NEST = { hp: 80, radius: 0.65, wake: 8.5, first: 1.2, every: 8, wave: 3, party: 1, cap: 7, swell: 1 };

/**
 * Poison on a hero: each bite adds a stack (at most `most`). Every `every` seconds it does `dmg` a
 * stack (never the last point of health). `time` seconds after the last bite a stack wears off, and
 * each one left after that lasts `fade` more. A Bitter cures it; a Healer's heal takes a stack off.
 */
export const POISON = { every: 1, dmg: 2, most: 3, time: 5, fade: 1.5 };

/** A poison puddle where a glob lands: `life` seconds, a stack every `every` seconds on whoever stands in it. */
export const PUDDLE = { life: 5, every: 0.8, radius: 1.1 };

/** The spider kinds (not goblins: no loot, no coals, the hound leaves them be). */
export const SPIDER_KINDS = ['spider', 'brood', 'nest'] as const;
export const isSpiderKind = (k: string) => (SPIDER_KINDS as readonly string[]).includes(k);
