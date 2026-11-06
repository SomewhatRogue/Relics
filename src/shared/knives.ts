/**
 * The rules of a round at the Drowned Rat's knife board, pure and seeded, in fixed steps (KNIVES.fps a
 * second): the same seed and the same moments of throwing give the same score anywhere. The player's
 * browser plays it (client/knifemode.ts); the world server plays it again from those moments alone
 * before a score goes on the town's board (`replayKnives`; shared/knifeboard.ts), as with the butts. No
 * Math.sin or Math.random: the sway is `wave` (shared/range.ts).
 */
import { Rng } from './rng.js';
import { wave } from './range.js';
import { HOUSE, KNIVES } from './knifetune.js';

export type KnifeEvent = { k: 'throw' } | { k: 'stick'; ring: number; pts: number; x: number; y: number } | { k: 'miss'; x: number; y: number } | { k: 'over' };
export interface KnifeFlight { x: number; y: number; land: number }
export interface KnifeStuck { x: number; y: number; ring: number; pts: number; t: number }

export interface KnifeState {
  seed: number; steady: boolean; rng: Rng;
  frame: number; t: number; over: boolean;
  /** Knives thrown; when the next is in hand (and its sway began). */
  thrown: number; readyAt: number;
  score: number; bulls: number; onBoard: number;
  flights: KnifeFlight[]; stuck: KnifeStuck[];
  ph: [number, number, number, number];
  events: KnifeEvent[];
  /** The frame of each throw, which is all a replay needs. */
  record: number[];
}

export function newKnives(seed: number, steady: boolean): KnifeState {
  const rng = new Rng(seed), ph: [number, number, number, number] = [rng.next(), rng.next(), rng.next(), rng.next()];
  return { seed, steady, rng, frame: 0, t: 0, over: false, thrown: 0, readyAt: 0.5, score: 0, bulls: 0, onBoard: 0, flights: [], stuck: [], ph, events: [], record: [] };
}

/** Is a knife in hand and ready to go? */
export const ready = (s: KnifeState, t = s.t) => !s.over && s.thrown < KNIVES.knives && t >= s.readyAt;

/** Where the knife's point is at `t`, from the board's middle (px): the hand's sway, wider the longer it's held. */
export function aimAt(s: KnifeState, t = s.t): [number, number] {
  const held = Math.max(0, t - s.readyAt), a = KNIVES.sway * (s.steady ? KNIVES.steady : 1) * Math.min(KNIVES.most, 1 + held * KNIVES.grow);
  const q = (1 + s.thrown * KNIVES.quicken) * KNIVES.hz, [p, u, v, w] = s.ph;
  return [a * (0.65 * wave(t * 0.53 * q + p) + 0.35 * wave(t * 1.31 * q + u)), a * (0.6 * wave(t * 0.41 * q + v) + 0.4 * wave(t * 1.07 * q + w))];
}

/** The ring a point lands in (0 the bull), or -1 off the board. */
export function ringOf(dx: number, dy: number): number {
  const d = Math.sqrt(dx * dx + dy * dy);
  return d > KNIVES.r ? -1 : Math.min(KNIVES.rings.length - 1, Math.floor((d / KNIVES.r) * KNIVES.rings.length));
}

/** One fixed step; `go`: throw now, if a knife is ready. True if one went. */
export function stepKnives(s: KnifeState, go: boolean): boolean {
  s.events = [];
  if (s.over) return false;
  const t = (s.t = s.frame / KNIVES.fps);
  let went = false;
  if (go && ready(s, t)) {
    const [ax, ay] = aimAt(s, t), wob = KNIVES.wobble * (s.steady ? KNIVES.steady : 1);
    s.flights.push({ x: ax + s.rng.range(-wob, wob), y: ay + s.rng.range(-wob, wob), land: t + KNIVES.fly });
    s.record.push(s.frame);
    s.thrown++;
    s.readyAt = t + KNIVES.reach;
    s.events.push({ k: 'throw' });
    went = true;
  }
  for (const f of s.flights) if (f.land <= t) land(s, f, t);
  s.flights = s.flights.filter((f) => f.land > t);
  s.frame++;
  if (s.thrown >= KNIVES.knives && !s.flights.length) (s.over = true), s.events.push({ k: 'over' });
  return went;
}

function land(s: KnifeState, f: KnifeFlight, t: number): void {
  const ring = ringOf(f.x, f.y);
  if (ring < 0) return void s.events.push({ k: 'miss', x: f.x, y: f.y });
  const pts = KNIVES.rings[ring];
  s.score += pts;
  s.onBoard++;
  if (ring === 0) s.bulls++;
  s.stuck.push({ x: f.x, y: f.y, ring, pts, t });
  s.events.push({ k: 'stick', ring, pts, x: f.x, y: f.y });
}

/**
 * A whole round again from its seed and its throws (what the world server does with a score before
 * it goes on the board). Null if the throws couldn't have happened (out of order, before a knife was in
 * hand, too many or too few): a made-up record, not a round.
 */
export function replayKnives(seed: number, steady: boolean, frames: readonly number[]): KnifeState | null {
  if (!Array.isArray(frames) || frames.length !== KNIVES.knives || !frames.every((f) => Number.isInteger(f) && f >= 0 && f < KNIVES.longest * KNIVES.fps)) return null;
  const s = newKnives(seed, steady);
  let i = 0;
  while (!s.over && s.frame < KNIVES.longest * KNIVES.fps + 60) {
    if (i < frames.length && frames[i] < s.frame) return null;
    const mine = i < frames.length && frames[i] === s.frame;
    const went = stepKnives(s, mine);
    if (mine && !went) return null;
    if (mine) i++;
  }
  return s.over && i === frames.length ? s : null;
}

/** The card sharp's round for this seed, the score to beat for a bet (its own stream, so throwing doesn't move it). */
export function houseScore(seed: number): number {
  const r = new Rng((seed ^ 0x5bd1e995) >>> 0 || 7);
  return Math.round(HOUSE.low + (HOUSE.high - HOUSE.low) * (r.next() + r.next()) / 2);
}

/** A hero's record at the board: rounds thrown (seeds the next) and their best. */
export interface KnifeRecord { rounds: number; best: number }
export function fitKnifeRecord(raw: unknown): KnifeRecord {
  const r = (raw ?? {}) as Partial<KnifeRecord>, n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
  return { rounds: n(r.rounds), best: Math.min(n(r.best), 90) };
}
