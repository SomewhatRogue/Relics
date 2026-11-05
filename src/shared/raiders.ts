/**
 * Numbers for five of the hungry's new sorts (rules in sim/, drawing in client/; Kyle, 2026-11-04:
 * "I like them all, let's make them"). Each has a telegraph you've seen before and a counter you have.
 */
import type { EnemyAttackSpec } from './tuning.js';

/**
 * The banner-bearer: a pole with a stretched hide on it, hung with what they've taken. It hangs
 * `behind` its pack and out of reach (runs from anyone closer than `keep`); every goblin within
 * `radius` of a standing banner hits `heart.dmg` as hard and winds up in `heart.windup` of the time,
 * and can't be routed. Kill it and every goblin within `rout.radius` breaks and runs for `rout.time`
 * seconds, at `rout.pace`, striking nothing; blows on a routed goblin land `rout.hurt` as hard.
 */
export const BANNER = {
  hp: 46,
  keep: 3.6,
  flee: 1.1,
  behind: 2.6,
  radius: 5,
  heart: { dmg: 1.25, windup: 0.9 },
  rout: { radius: 7, time: 4.5, pace: 1.2, hurt: 1.5 },
  poke: { windup: 0.7, active: 0.08, recover: 0.6, dmg: 6, knock: 3, range: 1.4, arc: 60, unblockable: false } as EnemyAttackSpec,
};

/**
 * The netter: a weighted net, thrown from `reach` at whoever's furthest from their friends (alone,
 * whoever's nearest). The red circle goes down where you stand, striped (a guard doesn't stop a net):
 * step or roll out. Caught, you're held for `hold` seconds; each press of attack, dodge or guard takes
 * `mash` off it and each swing of the stick `wiggle`; a friend pressing GRAB within `cut` cuts you out
 * at once. Goblins go for a netted hero first (`lure` tiles nearer than they are). `pause` between nets.
 */
export const NETTER = {
  hp: 30,
  reach: 6.5,
  keep: 3,
  flee: 1.05,
  pause: 4,
  hold: 4,
  mash: 0.45,
  wiggle: 0.15,
  cut: 1.5,
  lure: 3,
  net: { windup: 0.95, active: 0.1, recover: 0.8, dmg: 2, knock: 0, radius: 0.9, unblockable: true } as EnemyAttackSpec,
};

/**
 * The sneak-thief: small, quick (`speed` of a small goblin's pace), keeps `lurk` tiles off until the
 * fight's on, then darts in and grabs (a short red wedge: block it, parry it, or get out of it). It
 * takes `take` gold off you (half what you carry at most), or the potion at the front of your belt if
 * you're carrying less than `least`, and bolts for the room's edge at `run`. Kill it and what it took
 * drops where it falls; let it get `escape` tiles from everyone, or to the edge, and it's gone.
 */
export const THIEF = {
  hp: 24,
  speed: 1.35,
  run: 1.22,
  lurk: 5,
  take: [12, 30] as [number, number],
  least: 6,
  escape: 16,
  edge: 1.4,
  grab: { windup: 0.45, active: 0.08, recover: 0.3, dmg: 2, knock: 1, range: 1.25, arc: 70, unblockable: false } as EnemyAttackSpec,
};

/**
 * The log-carriers: two big goblins with a battering log between them, one body to the room (`radius`,
 * `weight`). Slow on their feet (`speed` of a small goblin's), slower to turn (`turn` radians a second).
 * From `from` tiles off they charge: a long striped lane the length of the run; it can't be blocked,
 * smashes any barrel, crate, fence, hedge or cart on its line, and knocks anyone on it down for `down`
 * seconds. Into a wall or a house, they stun themselves for `stun`. After a run they stand a long while
 * (`charge.recover`) and turn slowly: that's when to hit them. Close in, a short shove with the log end.
 */
export const LOGS = {
  hp: 170,
  radius: 0.85,
  weight: 5,
  speed: 0.55,
  turn: 1.1,
  from: 3,
  every: 0.5,
  down: 1,
  stun: 2.4,
  smash: 60,
  charge: { windup: 1.35, active: 0.9, recover: 1.8, dmg: 24, knock: 16, range: 9, arc: 0, radius: 0.85, unblockable: true } as EnemyAttackSpec,
  shove: { windup: 0.8, active: 0.1, recover: 0.8, dmg: 12, knock: 9, range: 1.9, arc: 80, unblockable: false } as EnemyAttackSpec,
};

/**
 * A roof archer: an archer up on a house's roof (level `z`), out of reach of any blade. It shoots like
 * any archer, from further (`reach`). Shoot it, throw something at it, pull it down with the hook, or set
 * the house alight: a burning roof throws it off (it lands alight, hurt by the fall).
 */
export const ROOF = { z: 2, hp: 30, reach: 9 };

/**
 * The ironhide (a placeholder name for the lore pass): a goblin in scraps of iron. Until its guard is
 * broken it takes `armour` of anything that lands (at least 1). A parry of its blow, a charged blow or
 * a perfect (or any heavy hit: a burst, a crit) breaks it: for `broken` seconds it takes full damage,
 * more from behind as anything does, its plates knocked askew. Medium pace (`speed` of a small goblin's),
 * one heavy, readable blow that can be blocked and parried. It burns half as long, as a brute does.
 */
export const IRONHIDE = {
  hp: 90,
  armour: 0.2,
  broken: 3,
  speed: 0.85,
  reach: 1.7,
  swing: { windup: 0.95, active: 0.1, recover: 0.85, dmg: 16, knock: 7, range: 1.9, arc: 90, unblockable: false } as EnemyAttackSpec,
};
