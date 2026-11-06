/**
 * The second three of the six new meaty goblins (docs/plans/bosses.md section 3; Kyle, 2026-11-05: "things
 * that take a few hits", "fun splatting a lot of small guys", "it's a bit too easy to kite"). As the first
 * three (shared/meaty.ts): one thing to read, one answer that works for a class that blocks and a class
 * that dodges alike. Numbers only: the rules are sim/meaty2.ts and sim/blast.ts, the drawing
 * client/meatydraw2.ts. Each bleeds in through shared/debut.ts after the Forker, two days apart.
 *
 * Names (proposals for the lore keeper, code and docs only: nothing on screen names sorts): the Kegman,
 * the Pouncer, the Gorger.
 */
import type { Debut } from './debut.js';
import type { EnemyAttackSpec } from './tuning.js';

/** Switch the three off (the composer lays none and nothing is staged): the pins' switch-off check. */
export const MEATY2_ON = { on: true };

/** The three, by their variant. */
export const MEATY2_SORTS = new Set(['kegman', 'pouncer', 'gorger']);

/**
 * A burst on the floor (sim/blast.ts): a striped circle `r` round where it lies, going off `fuse` s after
 * it was lit, `dmg` to a hero in it (nothing blocks it: walk or dodge out), `foe` to a goblin in it and
 * `burn` of fire on it (its own pack too: that's the answer). A hero at the middle walks out in under 60%
 * of the fuse at the slowest kit's pace (HERO.speed times 0.78), so it's fair on any screen.
 */
export interface BurstSpec { fuse: number; r: number; dmg: number; foe: number; knock: number; burn: number }

/**
 * The Kegman: a keg of lamp oil on its back. Killed, the keg falls and bursts `keg.fuse` later where it
 * lies; set alight, or a shot into the keg (any shot: it rides high over its shoulders), it stands
 * there, the keg hissing, and bursts with it on its back. Its own blow is a plain red swing (`swing`).
 * Answer: shoot the keg, or kill it, while it's in among its own, and walk out.
 * Debut: staged in the DRUMS way's room in the Barrowfields, by the war band's long fire.
 */
export const KEGMAN = {
  hp: 70, radius: 0.42, weight: 1.8, speed: 0.75, reach: 1.35,
  swing: { windup: 0.9, active: 0.1, recover: 0.8, dmg: 10, knock: 6, range: 1.5, arc: 90, unblockable: false } as EnemyAttackSpec,
  keg: { fuse: 1.0, r: 1.6, dmg: 20, foe: 36, knock: 10, burn: 8 } as BurstSpec,
  debut: { staged: 'drums', home: 'Barrowfields', from: 67, rare: 2, common: 5, weight: 0.6 } as Debut,
};

/**
 * The Pouncer: from between `near` and `from` tiles it crouches and leaps, a striped circle round where
 * you stood as it crouched (`leap`, locked then, so the circle never moves), landing `leap.windup` later;
 * it sits low the first `crouch` of that, then flies (at most 5 tiles in 0.54 s: under 12 tiles a second).
 * Landed, it's stuck `stuck` s, claws in the ground (stunned: a punish lands GUARD.stunnedMult as hard);
 * then, if you're close, a red rake (`rake`). Between leaps `every` s at least.
 * Answer: walk (or dodge) out of the circle, then hit it while it's stuck; block or dodge the rake.
 * Debut: staged in the QUIET way's room in the Barrowfields, the one awake, on watch over the sleepers.
 */
export const POUNCER = {
  hp: 80, radius: 0.4, weight: 1.5, speed: 0.95, near: 2.4, from: 5, every: 3.5, stuck: 1.0, crouch: 0.55, reach: 1.3,
  leap: { windup: 1.2, active: 0.1, recover: 0.05, dmg: 16, knock: 9, radius: 1.1, ahead: 0, unblockable: true } as EnemyAttackSpec,
  rake: { windup: 0.9, active: 0.1, recover: 0.7, dmg: 10, knock: 5, range: 1.6, arc: 90, unblockable: false } as EnemyAttackSpec,
  debut: { staged: 'quiet', home: 'Barrowfields', from: 69, rare: 2, common: 5, weight: 0.6 } as Debut,
};

/**
 * The Gorger: eats your kills. With nobody within `guard` of it and a small one's whole body within
 * `seek`, it stands and pulls the body in (`pull` s, the butcher's red ring round the body: sim/meal.ts
 * breaks it off on a heavy hit, a stun, a freeze, a net, or the body burned), then eats it: `grow` more
 * size, health (healed by what it gains) and damage, up to `most` times. Its own blow is a red bite.
 * Answer: burn the bodies (ash feeds nothing; a burst body neither), stand on it, or kill it first: the
 * swarm round it is the choice (Kyle: splatting the small ones is fun, and here it feeds the big one).
 * Debut: staged in the SMOKE way's room in the Barrowfields, by the burning house, waiting on whoever's inside.
 */
export const GORGER = {
  hp: 110, radius: 0.48, weight: 2.4, speed: 0.7, reach: 1.45, seek: 4.5, guard: 1.5, pull: 1.5, grow: 0.2, most: 3, again: 1,
  bite: { windup: 1.0, active: 0.1, recover: 0.9, dmg: 14, knock: 7, range: 1.7, arc: 100, unblockable: false } as EnemyAttackSpec,
  debut: { staged: 'smoke', home: 'Barrowfields', from: 71, rare: 2, common: 5, weight: 0.6 } as Debut,
};

/** A Gorger's growth as a multiple of its first size, health and damage (`n` bodies eaten). */
export const grownBy = (n: number) => 1 + GORGER.grow * Math.min(GORGER.most, Math.max(0, n));
