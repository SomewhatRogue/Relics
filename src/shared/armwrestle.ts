/**
 * The rules of a bout of arm-wrestling at the Drowned Rat, pure and seeded, in fixed steps (ARM.fps a
 * second): the same seed and the same holds give the same bout. Played only in the player's browser
 * (client/armmode.ts); the seed is the hero and their count of bouts (shared/fishing.ts `seedOf`),
 * counted as the bout starts, so a refresh can't roll it again. No Math.sin or Math.random: the band's
 * drift is `wave` (shared/range.ts), plain arithmetic.
 */
import { Rng } from './rng.js';
import { wave } from './range.js';
import { ARM, type ArmFoe } from './armtune.js';

export type ArmEvent = { k: 'tell' } | { k: 'heave' } | { k: 'in' } | { k: 'out' } | { k: 'won' } | { k: 'lost' };

export interface ArmState {
  seed: number; foe: ArmFoe; rng: Rng;
  /** A Warrior's arm (ARM.knight). */
  strong: boolean;
  frame: number; t: number;
  /** Your grip on the bar (0..1), and where the arms are: 1 their hand down, -1 yours. */
  grip: number; lean: number;
  over: boolean; won: boolean;
  /** In the sweet spot this step. */
  inZone: boolean;
  /** The drift's phases (from the seed). */
  ph: [number, number];
  /** The next heave's tell starts at `heaveAt`; one under way began at `heaveT0` (-1: none), toward `dir`. */
  heaveAt: number; heaveT0: number; dir: number;
  /** Seconds in the spot, all told (the card). */
  held: number;
  events: ArmEvent[];
}

export function newArm(seed: number, foe: ArmFoe, strong = false): ArmState {
  const rng = new Rng(seed), ph: [number, number] = [rng.next(), rng.next()];
  return { seed, foe, strong, rng, frame: 0, t: 0, grip: ARM.start, lean: 0, over: false, won: false, inZone: false, ph, heaveAt: 2 + rng.range(foe.heave[0], foe.heave[1]) * 0.6, heaveT0: -1, dir: 1, held: 0, events: [] };
}

const smooth = (k: number) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));

/** Where a heave throws the band at `t` (0 none, up to its full shove and back). */
function shove(s: ArmState, t: number): number {
  if (s.heaveT0 < 0) return 0;
  const k = t - s.heaveT0 - ARM.tell;
  if (k < 0) return 0;
  return s.dir * s.foe.move * (k < ARM.heaveFor ? smooth(k / ARM.heaveFor) : 1 - smooth((k - ARM.heaveFor) / ARM.back));
}
/** Is a heave shoving now (past its tell, not yet easing back)? */
export const heaving = (s: ArmState, t = s.t) => s.heaveT0 >= 0 && t - s.heaveT0 >= ARM.tell && t - s.heaveT0 < ARM.tell + ARM.heaveFor;
/** Is a heave about to come (its tell)? */
export const telling = (s: ArmState, t = s.t) => s.heaveT0 >= 0 && t - s.heaveT0 < ARM.tell;

/** The sweet spot's middle at `t` (its half height is the foe's `width`). */
export function zoneAt(s: ArmState, t = s.t): number {
  const f = s.foe, w = f.width, z = 0.5 + f.drift * (0.6 * wave(t * f.hz + s.ph[0]) + 0.4 * wave(t * f.hz * 2.3 + s.ph[1])) + shove(s, t);
  return Math.max(w, Math.min(1 - w, z));
}

/** Their push this second, grown once they've tired of it. */
export const pushOf = (s: ArmState, t = s.t) => s.foe.push * (s.strong ? ARM.knight.push : 1) * (heaving(s, t) ? ARM.heavePush : 1) * (1 + Math.max(0, t - ARM.tired) * ARM.tiredBy);

/** One fixed step, holding or not. */
export function stepArm(s: ArmState, held: boolean): void {
  s.events = [];
  if (s.over) return;
  const dt = 1 / ARM.fps, t = (s.t = s.frame / ARM.fps), f = s.foe;
  // A heave: the tell, the shove, back. The next one is set as this one eases off.
  if (s.heaveT0 < 0 && t >= s.heaveAt) {
    s.heaveT0 = t;
    s.dir = zoneAt(s, t) > 0.5 ? -1 : 1;
    s.events.push({ k: 'tell' });
  } else if (s.heaveT0 >= 0 && Math.abs(t - s.heaveT0 - ARM.tell) < dt / 2) s.events.push({ k: 'heave' });
  if (s.heaveT0 >= 0 && t >= s.heaveT0 + ARM.tell + ARM.heaveFor + ARM.back) (s.heaveT0 = -1), (s.heaveAt = t + s.rng.range(f.heave[0], f.heave[1]));
  s.grip = Math.max(0, Math.min(1, s.grip + (held ? ARM.rise : -ARM.fall) * dt));
  const z = zoneAt(s, t), off = Math.abs(s.grip - z), was = s.inZone;
  s.inZone = off <= f.width;
  if (s.inZone !== was) s.events.push({ k: s.inZone ? 'in' : 'out' });
  if (s.inZone) (s.lean += f.give * (s.strong ? ARM.knight.give : 1) * (off <= f.width * ARM.near ? 1 + ARM.nearBonus : 1) * dt), (s.held += dt);
  else s.lean -= pushOf(s, t) * dt;
  s.frame++;
  if (s.lean >= 1 || s.lean <= -1 || s.frame >= ARM.cap * ARM.fps) {
    s.over = true;
    s.won = s.lean > 0;
    s.lean = Math.max(-1, Math.min(1, s.lean));
    s.events.push({ k: s.won ? 'won' : 'lost' });
  }
}

/** A hero's record at the table: bouts (seeds the next), wins, and who they've put down. */
export interface ArmRecord { bouts: number; wins: number; beat: string[] }
export function fitArmRecord(raw: unknown): ArmRecord {
  const r = (raw ?? {}) as Partial<ArmRecord>, n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
  return { bouts: n(r.bouts), wins: n(r.wins), beat: Array.isArray(r.beat) ? r.beat.filter((x): x is string => typeof x === 'string').slice(0, 8) : [] };
}
