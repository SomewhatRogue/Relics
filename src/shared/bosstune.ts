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
 * One is the WALL (its front takes nothing; it walks its hero down, jabs round its door at whoever's in its
 * face, and turns slowly, so get behind it), the other the MOVER (quick jabs between the big sweep and the
 * charge, its door swung aside only for the big ones). They swap jobs every `swap` seconds. Within `lockIn`
 * tiles they lock doors and shove. Over `apart` tiles apart for `apartFor` seconds, the mover walks back to
 * its partner, its back open `back` seconds. Phase 2 (one dead): the survivor ENRAGED (`enrage`), carries
 * both doors and spins. Ranged shots into a shut door cut its straps: `straps` cuts and the door is DOWN
 * `down` seconds (its front takes blows). Every wind-up below is the floor's time; the pose (BOSS.tell)
 * comes first.
 */
export const DOORKEEPERS = {
  hp: 320,
  /** In the Deep (shared/sealarena.ts) each has this many times `hp` (Kyle, 2026-11-13: "the Doorkeepers need more health"). */
  deepHp: 1.6,
  radius: 0.72,
  weight: 6,
  /** Its pace (Kyle, 2026-11-06: "they don't chase a ton": both close on you, the mover hardest). */
  walk: { move: 3.1, wall: 2.0 },
  turn: { move: 4.6, wall: 2.0 },
  /** The door covers its front: a blow or shot from within this of its facing (cosine; 0.34 is 70 degrees either side, as the Planker's) is stopped dead. */
  cone: 0.34,
  /**
   * How long after a blow lands its door stays swung aside (the punish), at most its recover: the big ones
   * only. A jab goes round the door's edge and the door stays shut.
   */
  aside: { jab: 0, sweep: 0, charge: 0.8, lock: 1.0, spin: 2.0, vault: 0.8, bash: 0.7, quake: 1.2 } as Record<DoorMove, number>,
  /** The gap between one blow and the next (in place of the butcher's own). */
  /** (0.2 before Kyle's 2026-11-11 "attack more often".) */
  pause: 0.08,
  swap: 20,
  lockIn: 2.5,
  lockCool: 7,
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
  /** The wall jabs at whoever's in its face, this long apart at most (after the jab's own time). */
  wallJab: 1.4,
  /** A rotation entry it can't get to for this long is skipped (so a hero hugging it can't stall it). */
  skip: 3,
  /** A party of two: the wall swings at a second hero this long after the mover's blow begins. */
  split: 0.6,
  /** The Door Jab: a quick red blow round the door's edge, mixed in between the big ones (keeps you on your toes). */
  jab: spec({ windup: 0.6, active: 0.1, recover: 0.35, dmg: 8, knock: 5, range: 2.2, arc: 50, unblockable: false }),
  sweep: spec({ windup: 0.95, active: 0.12, recover: 1.0, dmg: 24, knock: 9, range: 2.6, arc: 120, unblockable: false }),
  charge: spec({ windup: 1.2, active: 0.7, recover: 0.8, dmg: 30, knock: 16, range: 8, radius: 0.8, unblockable: true }),
  /** Locked Doors: both together, a shove 3 wide (on the mover, the partner carried with it); both stand open its recover after. */
  lock: spec({ windup: 1.25, active: 0.45, recover: 1.0, dmg: 22, knock: 20, range: 3.5, radius: 1.5, unblockable: true }),
  /**
   * Threat (docs/design/boss-threat.md step 3; Kyle, 2026-11-11): the VAULT, the mover up and over to the hero
   * furthest off (at least `vaultFrom`, else passed over), a striped circle where it lands, its door swung
   * open after (the punish); the BASH, the door swung back the other way straight after the sweep (a quick
   * red blow; the sweep's own opening is gone, the bash's after it); and ENRAGED, the QUAKE: both doors
   * driven into the floor and the crack running at you, `quakeN` striped circles `quakeStep` apart landing
   * `quakeGap` s after each other.
   */
  vault: spec({ windup: 0.9, active: 0.15, recover: 0.9, dmg: 24, knock: 12, radius: 1.5, ahead: 0, unblockable: true }),
  vaultFrom: 3.5,
  /** The last `air` s of the vault's wind-up it's in the air (drawn: client/doordraw.ts). */
  air: 0.4,
  bash: spec({ windup: 0.45, active: 0.1, recover: 0.8, dmg: 16, knock: 8, range: 3.1, arc: 120, unblockable: false }),
  quake: spec({ windup: 1.05, active: 0.6, recover: 1.4, dmg: 20, knock: 10, radius: 1.2, ahead: 0, unblockable: true }),
  quakeN: 3,
  quakeStep: 1.7,
  quakeGap: 0.22,
  /** Phase 2's Door Spin: a ring round itself, then dizzy (the recover). */
  spin: spec({ windup: 1.5, active: 0.15, recover: 2.0, dmg: 26, knock: 14, radius: 2.4, unblockable: true }),
  /**
   * ENRAGED (phase 2, its partner dead; Kyle: "when one's dead it should enrage the other"): its pace and
   * turn `pace` times, its wind-ups and the gap between blows `windup` times (never under `floor`: red,
   * striped, and the jab's own; a striped one also never so short a hero at its middle can't walk out in 60%
   * of it at the slowest kit's pace), its blows `dmg` times as hard. Drawn with burning eyes; it growls as
   * each big blow begins. Going berserk it gets `heal` of its health back (Kyle, 2026-11-11).
   */
  /** (Floors 0.9 red, 1.1 striped till Kyle's 2026-11-11 "faster tells".) */
  enrage: { pace: 1.25, windup: 0.8, dmg: 1.25, floor: { red: 0.75, striped: 0.95, jab: 0.55 }, heal: 0.25 },
  /** From where it charges (it backs off to get it), and the rotations by phase (one seeded swap each; a party of four one more). */
  chargeFrom: 3,
  rotation: {
    1: ['jab', 'sweep', 'bash', 'jab', 'vault', 'jab', 'charge', 'jab', 'sweep', 'bash', 'jab', 'charge'],
    2: ['jab', 'spin', 'jab', 'quake', 'jab', 'spin', 'jab', 'sweep', 'bash', 'jab', 'spin', 'vault', 'jab', 'spin', 'jab', 'spin'],
  } as Record<1 | 2, DoorMove[]>,
  more: 'sweep' as DoorMove,
};
export type DoorMove = 'jab' | 'sweep' | 'charge' | 'lock' | 'spin' | 'vault' | 'bash' | 'quake';

/** The barn hunt on the board (shared/bossjobs.ts): posted once the chapter's well on (this many brought home), or the bell rung. */
export const BARN_HUNT = { from: 3 };
