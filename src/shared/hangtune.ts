/**
 * Hangman's Wood's numbers (docs/plans/atlas.md sections 2 and 5; re-exported by tuning.ts): the zone, its
 * set pieces and its own hungry. What's drawn and what's judged both read these.
 */
import type { EnemyAttackSpec } from './tuning.js';

/** The zone: its map, how many goblins it holds, how wide its trails are (half, tiles), how thick the trees. */
export const HANGWOOD = { w: 72, h: 48, goblins: 40, cap: 110, trail: 1.05, trees: 5000, story: 5 };

/**
 * The snarer: sets ankle snares, shown by a faint striped mark (walk round it). It keeps `keep` off and
 * runs from closer; every `every` seconds it kneels (`set`) and lays one `ahead` tiles in front of whoever
 * it's after. A snare is live `arm` seconds after it's laid, lasts `life`, catches within `r`; at most `max`
 * of one snarer's out at once (the oldest goes).
 */
export const SNARER = {
  hp: 30, keep: 3.4, flee: 0.85, every: 6, life: 45, arm: 0.6, r: 0.42, max: 5, ahead: 1.4,
  set: { windup: 0.8, active: 0.1, recover: 0.5, dmg: 0, knock: 0, unblockable: true } as EnemyAttackSpec,
};

/**
 * Caught in a snare (or Hempen's noose): hoisted by the ankle, held `hold` seconds, until a friend's GRAB
 * within `cut` cuts you down at once; then you drop, hurt `drop`. The larder rule turned on a hero.
 */
export const HOIST = { hold: 2.5, cut: 1.3, drop: 4 };

/**
 * The dropper: up in the branches until a hero comes within `sense`, then it swings down on its rope onto
 * that spot, a shadow circle `r` round with a striped edge (walk out of it; nothing blocks a body from
 * above) for `fall` seconds; whoever's under it when it lands is hurt `dmg` and knocked; it's down `stun`.
 */
export const DROPPER = { sense: 3.4, fall: 1.0, r: 1.0, dmg: 12, knock: 5, stun: 0.6 };

/**
 * Hempen, the wood's named butcher (the climax): tougher than a named one on a job, and every `every`
 * seconds, with a hero between `min` and `noose.range` tiles, it throws its noose down a thin red lane
 * (block it; a parry snaps the rope, as a gaffer's hook) that hoists whoever it lands on.
 */
export const HEMPEN = {
  hp: 600, every: 8, min: 2.2,
  noose: { windup: 0.9, active: 0.12, recover: 1.0, dmg: 4, knock: 0, range: 6, arc: 6, unblockable: false } as EnemyAttackSpec,
};

/** The gibbet's winch: stand in its ring `r` round the winch `hold` seconds (the grace and waves of any hold) to wind the cage down. */
export const WINCH = { hold: 24, r: 1.8 };

/**
 * The Gospel Oak: its wood `hp` (burns at the usual 24 a second). Alight, it burns from inside like a chimney,
 * dropping burning wood every `every` seconds onto a striped circle `fall` round, `r0` to `r1` from the trunk,
 * warned `warn` seconds; landing, it hurts `dmg` and sets alight whatever it hits. The brood mother in its
 * hollow takes `brood` a second while it burns.
 */
export const OAK = { hp: 480, every: 1.2, warn: 1.1, r0: 1.6, r1: 3.6, fall: 0.85, dmg: 14, brood: 30 };

/** The mid-point: stand by its fire `call` seconds to light it; then anyone down `back` seconds with nobody at them gets up there. */
export const CHECK = { r: 2.2, call: 1.5, back: 8, up: 0.5 };
