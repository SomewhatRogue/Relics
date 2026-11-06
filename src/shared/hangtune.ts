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
 * (block it, or dodge out of the lane, as a gaffer's hook) that hoists whoever it lands on.
 */
export const HEMPEN = {
  hp: 600, every: 8, min: 2.2,
  noose: { windup: 0.9, active: 0.12, recover: 1.0, dmg: 4, knock: 0, range: 6, arc: 6, unblockable: false } as EnemyAttackSpec,
};

/** Hempen's moves in the boss format (design words, never on screen). */
export type HempenMove = 'noose' | 'haul' | 'cleave' | 'slam' | 'rain';

/**
 * Hempen in the boss format (docs/plans/bosses.md "Hempen, brought into the format"; the kit's own rules,
 * POISE, BRACED, the grace, the pose, the aim lock and the roar, are shared/bosstune.ts). `on`: the switch
 * (off, Hempen is the plain named butcher it was, its ground as it was).
 * - Its ground: it fights within `ground` of where it stands (or anyone who hurt it lately, to `chase`),
 *   else goes back. Four trunks (`trunks`, from the ground's middle) stop a rope: the noose and the haul end
 *   at the first one in their lane. Its hoard (`hoard`) is the sure chest, chained till it's dead.
 * - The noose (every HEMPEN.every s, at whoever's furthest from a friend, `min` to its range off and no
 *   further across than `across`): a thin red lane; block it, or dodge out of the lane. Landed: hoisted.
 * - The haul, at a hoisted hero within `haul.range`: a red lane down its rope. It ends at the first friend
 *   standing in it (who can block it, or dodge it); a friend's GRAB that cuts them down first loses it the
 *   rope, open `lost` s. Landed: dragged to its feet (`pull.to`), held `pull.stun`.
 * - Cleave and slam: the butcher's. Rope Rain (phase 2): a striped circle dropped where its hero stands.
 * - Phase 2 below `phase2` of its health. A party of two or more: `split` s after a blow begins, a rope comes
 *   down out of the branches on a second hero (`rope`, a striped circle where they stood, `rope.fall` s).
 * - Its rotation by phase (one seeded swap each; a party of four, `more` besides); a move it can't get to
 *   in `skip` s is passed over. From three players, small ones come in at `adds` (offsets) each phase.
 * - The chest: as a named butcher's (docs/plans/bosses.md "The payoff"), one Forged piece or better rolled
 *   on these odds, and `relic` of the time a relic through the `boss` source (never the wood's own, the hook:
 *   that one is the zone's, at the job's end).
 */
export const HEMPEN_BOSS = {
  on: true,
  ground: 9, chase: 13, across: 5.5, phase2: 0.5, walk: 2.1, turn: 2.4, skip: 3,
  trunk: 0.5,
  trunks: [[3.3, 0.6], [-1.5, -3.0], [1.5, 3.0], [-3.3, -0.6]] as [number, number][],
  hoard: [-2.1, -1.7] as [number, number],
  adds: [[-3.3, 3.8], [2.2, -4.5]] as [number, number][],
  noose: { windup: 0.9, active: 0.12, recover: 0.8, dmg: 4, knock: 0, range: 6, arc: 2, unblockable: false } as EnemyAttackSpec,
  haul: { windup: 1.2, active: 0.12, recover: 1.0, dmg: 12, knock: 0, range: 6, arc: 2, unblockable: false } as EnemyAttackSpec,
  pull: { to: 1.1, stun: 0.6 },
  lost: 1.0,
  cleave: { windup: 1.0, active: 0.1, recover: 0.9, dmg: 30, knock: 8, range: 2.6, arc: 70, unblockable: false } as EnemyAttackSpec,
  slam: { windup: 1.3, active: 0.12, recover: 1.1, dmg: 40, knock: 14, radius: 1.7, ahead: 1.2, unblockable: true } as EnemyAttackSpec,
  rain: { windup: 1.2, active: 0.12, recover: 1.5, dmg: 20, knock: 6, radius: 1.2, range: 6, unblockable: true } as EnemyAttackSpec,
  split: 0.6,
  rope: { fall: 1.2, r: 1.2, dmg: 16, knock: 5 },
  rotation: { 1: ['cleave', 'cleave', 'slam', 'cleave', 'slam'], 2: ['cleave', 'rain', 'slam', 'rain', 'cleave'] } as Record<1 | 2, HempenMove[]>,
  more: 'cleave' as HempenMove,
  chest: { prewar: 0.2, touched: 0.04, turning: 0.015, hungry: 0.05, relic: 0.2, armor: 0.5, gold: [0, 0] as [number, number] },
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
