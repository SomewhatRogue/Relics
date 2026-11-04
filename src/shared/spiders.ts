/**
 * Spiders: the numbers. Small fast ones that come in waves out of a nest until it's destroyed, each
 * weak alone, with a short telegraphed pounce whose bite poisons; now and then, deep in, a big slow
 * brood mother that bites and spits a glob that leaves a poison puddle. All of them burn easily (WEAK: shared/weakness.ts).
 * Poison is a status on heroes, judged by the room (sim/poison.ts). Where they turn up: shared/nests.ts.
 */
import type { EnemyAttackSpec, EnemySpec } from './tuning.js';

/**
 * A small spider. `pounce`: a short leap along a line it shows you (blockable, parryable).
 * Kyle, 2026-11-04: still over-tuned and too fast. Now slower than a hero on foot (HERO.speed 4.4), a
 * shorter leap with a longer wind-up to read, a longer breather between pounces, a little less bite.
 */
export const SPIDER: EnemySpec & { pounce: EnemyAttackSpec; sight: number; skitter: number; zig: number; spread: number } = {
  hp: 12, radius: 0.24, weight: 0.35, speed: 3.6, reach: 2.0, respawn: 5, stun: 1.4, pauseBetween: 1.6, flinches: true, turn: 7,
  pounce: { windup: 0.6, active: 0.2, recover: 0.65, dmg: 4, knock: 1.5, range: 2.0, arc: 0, radius: 0.42, unblockable: false },
  /** Sees you from this far at rest; zigzags `skitter` tiles to the side `zig` times a second. */
  sight: 5.5,
  skitter: 0.8,
  zig: 1.3,
  /** Fire jumps between spiders this much further than between goblins. */
  spread: 0.5,
};

/**
 * The brood mother: slow, tanky, a bite up close and a spit from further off. The spit is lobbed at
 * where you stood when it began (striped: walk or dodge out of it), lands at `spit.radius` around that
 * spot and leaves a puddle there.
 */
export const BROOD: EnemySpec & { bite: EnemyAttackSpec; spit: EnemyAttackSpec; spitFrom: number; spitChance: number; spitPause: number } = {
  hp: 210, radius: 0.7, weight: 3, speed: 1.0, reach: 1.7, respawn: 4, stun: 1.8, pauseBetween: 1.2, flinches: false, turn: 2.0,
  bite: { windup: 0.9, active: 0.1, recover: 0.8, dmg: 12, knock: 5, range: 1.9, arc: 70, unblockable: false },
  spit: { windup: 1.25, active: 0.1, recover: 1.0, dmg: 8, knock: 2, range: 7, radius: 1.3, unblockable: true },
  spitFrom: 2.8,
  spitChance: 0.6,
  /** After a spit she waits this long (not `pauseBetween`) before the next blow. */
  spitPause: 2.4,
};

/**
 * A nest (a mound of web and egg sacs). Wakes when a hero comes within `wake` (or it's hit); `first`
 * seconds later the first wave hatches, then one every `every` seconds (`fewer` less for each player
 * past the first, never under `least`), `wave` spiders (and `party` more for each player past the
 * first), while fewer than `cap` of its own are alive. Once a wave is all dead, the next waits at least
 * `rest` seconds more: the window to reach it. The sacs swell for `swell` seconds before a wave.
 *
 * Burning it out (sim/torch.ts): stand within `reach` of it and press GRAB, and `light` seconds still
 * there sets it alight (a hit, a swing or a step away stops it). Alight, it hatches nothing, sets the
 * spiders on it burning, and is ash `burn` seconds later. From range it takes its `hp` (fire 3x).
 * Kyle, 2026-11-03: it came back too fast to kill, and was too tough for a Rogue. 2026-11-04: fewer a
 * wave (two, not three), and longer between them.
 */
export const NEST = { hp: 55, radius: 0.65, wake: 8.5, first: 2.5, every: 14, fewer: 1, least: 11, rest: 6, wave: 2, party: 1, cap: 5, swell: 1, reach: 1.6, light: 1.2, burn: 3.5 };

/** Seconds between a nest's waves with `party` players. */
export const nestGap = (party: number) => Math.max(NEST.least, NEST.every - NEST.fewer * Math.max(0, party - 1));

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
