/**
 * The boss kit's numbers (docs/plans/bosses.md section 1, rollout item 2), used by every boss: POISE and
 * the stagger, BRACED, one clock a hero, the late-press grace, the phase roar, scaling by party, the
 * sure chest. Then the first boss, the Doorkeepers (Latch and Hasp, the shield pair in the great barn).
 * What the room judges and what the screen draws both read these (exported through shared/tuning.ts).
 */
import type { EnemyAttackSpec } from './tuning.js';

/**
 * Open with Kyle: each behind one flag here.
 * - `braced`: a blocker isn't shoved back by a blocked blow, and a boss's blocked red blow rebounds it.
 *   'boss' (the default): boss blows only. 'all': no shove from any blocked blow (the rebound stays a boss's).
 *   'off': as before, a small shove on every block, and no rebound.
 * - `grace`: a guard or dodge pressed up to `GRACE.window` late, by the hero's own screen, still counts
 *   against a boss's blow. On (the default) for boss blows only; off, a boss blow is judged as any.
 */
export const BOSS_FLAGS: { braced: 'boss' | 'all' | 'off'; grace: boolean } = { braced: 'boss', grace: true };

/**
 * POISE (sim/poise.ts). Bosses ignore ordinary stuns. What fills the bar, in points of a `bar`-point bar
 * (a party's bar is bigger: `party`). Full: STAGGERED for `stagger` seconds, the party's shared payoff.
 * A relic's stun lands in full and fills `relic` of the bar.
 */
export const POISE_KIT = {
  bar: 100,
  party: [1, 1.3, 1.6, 1.9],
  fill: { charged: 18, perfect: 22, ambush: 30, backstab: 14, braced: 30, slip: 18 },
  relic: 0.5,
  stagger: 2.5,
};

/** BRACED: a held block of a boss's red blow rebounds it this long (untimed), and fills POISE (`POISE_KIT.fill.braced`). */
export const BRACED_KIT = { rebound: 0.8, knock: 3 };

/**
 * The late-press grace on a boss's blow (sim/bossgrace.ts). A press up to `window` seconds after the blow
 * lands, by the hero's own screen, counts. With a friend's lag (sim/lagcomp.ts) the room holds the blow
 * `min(lag + window, max(LAGCOMP.cap, window))` at most: the two never add up past the lag cap.
 */
export const GRACE = { window: 0.15 };

/**
 * The rest of the kit. `clock`: one boss wind-up aimed at a hero at a time, and the hungry within `clock`
 * tiles of that hero hold their blows while it winds up. `tell`: the pose before the floor shows (the
 * telegraph's own time is the spec's). `aimLock`: the share of the wind-up a blow keeps turning to its
 * hero. `roar`: a phase change, nothing landing either way. `aggro`: it faces whoever hurt it most in the
 * last `aggro` seconds; a block held within `keep` tiles of its face keeps it. `adds`: small ones a phase
 * by party size (from three). `chest`: the sure chest's odds, each hero their own.
 */
export const BOSS = {
  clock: 3,
  tell: 0.2,
  aimLock: 0.7,
  roar: 2,
  aggro: 4,
  keep: 2.5,
  adds: [0, 0, 3, 4],
  chest: { prewar: 0.15, relic: 0.15, gold: [80, 120] as [number, number], armor: 0.5 },
};

const spec = (s: EnemyAttackSpec) => s;

/**
 * The Doorkeepers (Latch and Hasp): two big shield goblins with the barn's own doors, 320 health each.
 * One is the WALL (its front takes nothing; it walks its hero down and turns slowly, so get behind it),
 * the other the MOVER (the sweep and the charge, its door swung aside while it recovers). They swap jobs
 * every `swap` seconds. Within `lockIn` tiles they lock doors and shove. Over `apart` tiles apart for
 * `apartFor` seconds, the mover walks back to its partner, its back open `back` seconds. Phase 2: the
 * survivor carries both doors and spins. Ranged shots into a shut door cut its straps: `straps` cuts and
 * the door is DOWN `down` seconds (its front takes blows). Every wind-up below is the floor's time; the
 * pose (BOSS.tell) comes first.
 */
export const DOORKEEPERS = {
  hp: 320,
  radius: 0.72,
  weight: 6,
  walk: { move: 2.4, wall: 1.5 },
  turn: { move: 2.6, wall: 1.4 },
  /** The door covers its front: a blow or shot from within this of its facing (cosine) is stopped dead. */
  cone: 0.34,
  swap: 20,
  lockIn: 2.5,
  lockCool: 9,
  apart: 7,
  apartFor: 4,
  back: 3,
  straps: 3,
  down: 4,
  /** A charge into a hay stack, a post or a wall: stunned this long (the punish). */
  stuck: 2.5,
  /** At their post they hear anyone not creeping this near (creep up for an ambush). */
  hear: 4.5,
  /** The wall stands this far off its hero (in its face, not on top of it). */
  stand: 1.5,
  /** A rotation entry it can't get to for this long is skipped (so a hero hugging it can't stall it). */
  skip: 3,
  /** A party of two: the wall swings at a second hero this long after the mover's blow begins. */
  split: 0.6,
  sweep: spec({ windup: 1.1, active: 0.12, recover: 1.0, dmg: 24, knock: 9, range: 2.6, arc: 120, unblockable: false }),
  charge: spec({ windup: 1.3, active: 0.7, recover: 0.8, dmg: 30, knock: 16, range: 8, radius: 0.8, unblockable: true }),
  /** Locked Doors: both together, a shove 3 wide (on the mover, the partner carried with it). */
  lock: spec({ windup: 1.4, active: 0.45, recover: 1.5, dmg: 22, knock: 20, range: 3.5, radius: 1.5, unblockable: true }),
  /** Phase 2's Door Spin: a ring round itself, then dizzy (the recover). */
  spin: spec({ windup: 1.5, active: 0.15, recover: 2.0, dmg: 26, knock: 14, radius: 2.4, unblockable: true }),
  /** From where it charges (it backs off to get it), and the rotations by phase (one seeded swap each; a party of four one more). */
  chargeFrom: 3,
  rotation: { 1: ['sweep', 'charge', 'sweep', 'sweep', 'charge'], 2: ['sweep', 'spin', 'charge', 'sweep', 'spin'] } as Record<1 | 2, DoorMove[]>,
  more: 'sweep' as DoorMove,
};
export type DoorMove = 'sweep' | 'charge' | 'lock' | 'spin';

/** The barn hunt on the board (shared/bossjobs.ts): posted once the chapter's well on (this many brought home), or the bell rung. */
export const BARN_HUNT = { from: 3 };
