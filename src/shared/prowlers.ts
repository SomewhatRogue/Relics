/**
 * Numbers for the other five (rules in sim/, drawing in client/): the wolves and their keeper, the oil
 * thrower and its torch, the sapper, carrion crows and the blind hunters of the deep workings.
 */
import type { EnemyAttackSpec } from './tuning.js';

/**
 * Wolves: lean grey wolves the hungry keep chained and starved, so they hunt. Fast (`speed` of a small
 * goblin's), light, `hp`. They circle whoever they're after at `orbit` tiles, working round to the side
 * or the back, and dart in from there: a short red lane (`dart`: blockable, parryable, a dodge takes you
 * out of it). They stay within `leash` of their keeper. Kill the keeper and they scatter: they run for
 * `scatter` seconds and are gone if they get `gone` tiles from everyone; any left come back without
 * their circling, one at a time.
 */
export const WOLF = {
  hp: 20,
  speed: 1.55,
  radius: 0.3,
  orbit: 2.6,
  leash: 9,
  scatter: 6,
  gone: 13,
  pause: 1.4,
  dart: { windup: 0.55, active: 0.18, recover: 0.6, dmg: 9, knock: 3, range: 2.6, arc: 0, radius: 0.35, unblockable: false } as EnemyAttackSpec,
};

/** The wolf-keeper: a goblin with a whip and a chain, `behind` its wolves, running from a blade. */
export const KEEPER = {
  hp: 44,
  keep: 3.4,
  flee: 1.1,
  behind: 3,
  crack: 3.5,
  lash: { windup: 0.75, active: 0.08, recover: 0.6, dmg: 7, knock: 3, range: 2.2, arc: 30, unblockable: false } as EnemyAttackSpec,
};

/**
 * The oil thrower lobs a pot of their hoarded lamp oil: a striped circle where it'll land (`lob`), and a
 * slick left there for `life` seconds (`radius`). On a slick you slide: you turn and stop at `grip` of
 * your usual. Its torch-bearer walks to a slick with someone on it and, from `reach`, throws its torch:
 * the slick pulses `warn` seconds and goes up, burning anyone in it `dps` a second for `burn` seconds.
 * Any fire of yours (a fire spell, a burst, a burning goblin, an oil barrel) lights a slick too: turn it on them.
 */
export const OIL = {
  hp: 30,
  reach: 7,
  keep: 3.2,
  flee: 1.05,
  pause: 4.5,
  life: 22,
  radius: 1.25,
  grip: 0.3,
  lob: { windup: 1.0, active: 0.1, recover: 0.9, dmg: 3, knock: 1, radius: 1.25, unblockable: true } as EnemyAttackSpec,
};
export const TORCH = { hp: 34, reach: 3.2, keep: 2, warn: 0.9, burn: 6, dps: 12, foeDps: 14 };

/**
 * The sapper: digs in (`dig` seconds, dust going up) once it's seen you from within `from`, and goes
 * under at `under` of a small goblin's pace, a line of heaving dirt on the floor, for a spot `behind`
 * tiles past the hero it's after. It comes up there: a cracking circle (`burst`, striped) and then a
 * goblin with a pick. Fire on its trail, or a heavy blow on the dirt over it (`flush` reach), forces it up
 * stunned for `stun`. `again` seconds after it's up it may dig in again.
 */
export const SAPPER = {
  hp: 34,
  from: 9,
  dig: 0.7,
  under: 1.1,
  behind: 1.6,
  most: 7,
  again: 9,
  flush: 1.2,
  stun: 2.2,
  burst: { windup: 0.7, active: 0.1, recover: 0.6, dmg: 14, knock: 7, radius: 1.05, unblockable: true } as EnemyAttackSpec,
};

/**
 * Carrion crows: a flock on the dead, not a fighter. Anyone walking within `near` (`creep` if they're
 * walking slowly), a blow or a death within `fight`, and they burst up: anyone within `cloud` is lost in
 * them for `blind` seconds (they can't see past their own reach: goblins see them first), and every
 * goblin within `call` hears it and wakes. They're back on the dead `settle` seconds after it's quiet.
 */
export const CROWS = { near: 2.6, creep: 1, fight: 3.5, cloud: 2.2, blind: 1.6, call: 10, settle: 30, chance: 0.45 };

/**
 * The blind hunters: pale goblins of the deep workings that hunt by sound. They hear anyone walking
 * (not creeping) within `hear`, any blow, hit or death within `fight`, and anyone touching them
 * (`touch`). They go to where they heard it at `pace` of a small goblin's speed and strike whoever's
 * there (`slash`); hear nothing for `forget` seconds and they've lost you, and sniff about.
 */
export const CAVE = {
  hp: 40,
  hear: 6.5,
  fight: 13,
  touch: 1.1,
  pace: 1.15,
  forget: 3,
  slash: { windup: 0.5, active: 0.08, recover: 0.55, dmg: 12, knock: 4, range: 1.45, arc: 70, unblockable: false } as EnemyAttackSpec,
};
