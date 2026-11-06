/** The Night Watch's state: one shift on the wall, run only in this browser (sim/watch.ts steps it). */
import type { Rng } from '../shared/rng';
import type { FieldName, GobKind } from '../shared/watchtune';

export type Part = 'head' | 'body' | 'legs' | 'shield' | 'torch';
/** An arrow stuck where it hit: on a goblin (from its feet) or in its shield, at the angle it flew. */
export interface Stuck { dx: number; dy: number; ang: number; on: 'gob' | 'shield' }
export interface Gob {
  id: number;
  kind: GobKind;
  /** Side-on, pixels along the field; upright (deep), metres run from the far edge. */
  x: number;
  /** Upright only: where across it came in and where on the wall it's running for, and a runner's zig (0 none). */
  u0: number;
  u1: number;
  zig: number;
  /** Pixels further up the field than the near line (drawn behind, a little higher). */
  lane: number;
  hp: number;
  /** Pixels walked (the step's bob comes from it). */
  walked: number;
  limp: boolean;
  helmet: boolean;
  shieldHp: number;
  torch: boolean;
  /** When it caught fire (its own torch), or -1. */
  burning: number;
  state: 'walk' | 'aim' | 'dead' | 'gone';
  /** When it last changed state. */
  at: number;
  /** An archer: where it stops, arrows loosed, when the next goes. */
  stopX: number;
  shots: number;
  nextShot: number;
  stuck: Stuck[];
  /** How it died: head, body, legs, or fire. */
  how?: Part | 'fire';
}
/** Side-on: x along and y down the field, in pixels. Upright (deep): x across, y up, d out, in metres. */
export interface Arrow { x: number; y: number; vx: number; vy: number; power: number; d?: number; vd?: number }
/** An arrow in the ground, where it missed. */
export interface Pin { x: number; y: number; ang: number; t: number; d?: number }
/** Things knocked loose and falling: a helmet spinning off, a shield's pieces, a dropped torch, a glanced arrow. */
export interface Bit { kind: 'helmet' | 'plank' | 'torch' | 'arrow'; x: number; y: number; vx: number; vy: number; rot: number; spin: number; t: number; rest: boolean; d?: number; vd?: number }
/** A goblin archer's arrow on its way up to the wall. */
export interface Dart { x0: number; y0: number; x1: number; y1: number; t0: number; d0?: number }
/** One pass of cloud over the moon; one fog bank. */
export interface Cloud { at: number; len: number }
export interface FogBank { at: number; x0: number; v: number; w: number }

/** Where a happening was: side-on, field pixels; upright, x across, y up and d out, in metres. */
export interface At { x: number; y: number; d?: number }
export type WatchEvent =
  | ({ k: 'loose'; power: number } & At)
  | ({ k: 'hit'; part: Part; gob: number } & At)
  | ({ k: 'helmet' | 'splinter' | 'shieldbreak' | 'torch'; gob: number } & At)
  | ({ k: 'kill'; gob: number; pts: number; head: boolean; how: Part | 'fire' } & At)
  | ({ k: 'miss' } & At)
  | ({ k: 'wall'; gob: number } & At)
  | ({ k: 'dart' | 'nearmiss' } & At)
  | { k: 'end' };

/** What the player does: where the sight is, the string held, and a count of releases (never lost). */
export interface WatchIntent { ax: number; ay: number; held: boolean; looses: number }

export interface WatchState {
  seed: number;
  /** Which view this shift is played in (side-on or upright): chosen at the start, by the screen's shape. */
  field: FieldName;
  rng: Rng;
  t: number;
  over: boolean;
  gobs: Gob[];
  arrows: Arrow[];
  pins: Pin[];
  bits: Bit[];
  darts: Dart[];
  clouds: Cloud[];
  fogs: FogBank[];
  nextId: number;
  nextSpawn: number;
  /** Kinds already seen (each one's first comes as soon as it's due). */
  met: GobKind[];
  /** Seconds the string's been held, when the next arrow's on the string, a release waiting for it. */
  draw: number;
  nockAt: number;
  queued: boolean;
  looses: number;
  /** Where the sight is (the shake from a near miss is added to it: watchshot.ts aimOf). */
  ax: number;
  ay: number;
  shakeUntil: number;
  score: number;
  streak: number;
  bestStreak: number;
  kills: number;
  heads: number;
  shots: number;
  hits: number;
  /** Goblins that got under the wall. */
  lost: number;
  /** Events of the latest advance (the client draws and sounds them). */
  events: WatchEvent[];
  /** Time not yet stepped (less than one fixed step). */
  carry: number;
}
