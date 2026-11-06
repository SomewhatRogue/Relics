/**
 * The rules of a round at the archery range, pure and seeded, in fixed steps (RANGE.fps a second), so
 * the same seed and the same arrows give the same score anywhere: the player's browser runs it
 * (client/rangemode.ts), and the world server runs it again from the arrows alone before a score goes
 * on the town's board (`replayRange`; shared/worldsync.ts). Nothing here uses Math.sin or Math.random:
 * `wave` is plain arithmetic, so every engine agrees to the last bit.
 *
 * Targets come up in three lanes (far, mid, near), stand, slide on a rail or swing from a beam, stay up
 * a few seconds, and go down when hit or when their time's up. An arrow flies RANGE.fly seconds and is
 * judged where it lands, so a moving target needs leading. The sight wanders a little (`sway`), less
 * for a Ranger, the way the plan gives Rogues the edge at knives.
 */
import { Rng } from './rng.js';
import { LANES, MOTION, RANGE, type LaneId, type TargetKind } from './rangetune.js';

/** sin(2 pi x), from plain arithmetic (a refined parabola, within 0.001): the same on every engine. */
export function wave(x: number): number {
  const f = x - Math.floor(x), h = f < 0.5 ? f * 2 : f * 2 - 1, y = 4 * h * (1 - h), s = 0.225 * (y * y - y) + y;
  return f < 0.5 ? s : -s;
}
/** A triangle from -1 to 1 and back, once a cycle. */
const tri = (x: number) => {
  const f = x - Math.floor(x);
  return f < 0.5 ? f * 4 - 1 : 3 - f * 4;
};

export interface Target {
  id: number; slot: number; lane: LaneId; kind: TargetKind;
  /** Up at `t0`, for `life` seconds; down from `end` (hit, or its time up). */
  t0: number; life: number; end: number; hit: boolean;
  /** Where it stands across, and its motion: run or arc, speed (cycles a second), where in the cycle it starts. */
  cx: number; amp: number; hz: number; ph: number;
}
/** An arrow in the air, landing at `land`; one stuck where it landed (in a target, offset from its middle, or in the bank). */
export interface Flight { x: number; y: number; land: number }
export interface Stuck { x: number; y: number; target: number; t: number }
export type RangeEvent =
  | { k: 'loose' }
  | { k: 'hit'; ring: number; pts: number; lane: LaneId; x: number; y: number }
  | { k: 'miss'; x: number; y: number }
  | { k: 'up'; lane: LaneId }
  | { k: 'over' };

export interface RangeState {
  seed: number; steady: boolean; rng: Rng;
  frame: number; t: number; over: boolean;
  score: number; shots: number; hits: number; golds: number; streak: number; bestStreak: number;
  targets: Target[]; flights: Flight[]; stuck: Stuck[];
  /** When each slot's next target comes up (-1: one's up in it). */
  slots: number[];
  nockAt: number; nextId: number;
  /** The sway's phases (from the seed). */
  ph: [number, number, number, number];
  /** This step's happenings (cleared each step). */
  events: RangeEvent[];
  /** The arrows loosed: [frame, x tenths, y tenths], which is all a replay needs. */
  record: [number, number, number][];
}

export function newRange(seed: number, steady: boolean): RangeState {
  const rng = new Rng(seed), ph: [number, number, number, number] = [rng.next(), rng.next(), rng.next(), rng.next()];
  return {
    seed, steady, rng, frame: 0, t: 0, over: false, score: 0, shots: 0, hits: 0, golds: 0, streak: 0, bestStreak: 0,
    targets: [], flights: [], stuck: [], slots: Array.from({ length: RANGE.slots }, (_, i) => 0.3 + i * 0.9), nockAt: 0, nextId: 1, ph, events: [], record: [],
  };
}

/** How far the sight has wandered at `t` (a Ranger's less). */
export function sway(s: RangeState, t: number): [number, number] {
  const a = RANGE.sway * (s.steady ? RANGE.steady : 1), [p, q, u, v] = s.ph;
  return [a * (0.65 * wave(t * 0.37 + p) + 0.35 * wave(t * 0.91 + q)), a * (0.6 * wave(t * 0.29 + u) + 0.4 * wave(t * 0.83 + v))];
}

/** Where a target's middle is at `t`. */
export function targetAt(g: Target, t: number): [number, number] {
  const L = LANES[g.lane], dt = t - g.t0;
  if (g.kind === 'slide') return [g.cx + g.amp * tri(g.ph + dt * g.hz), L.y];
  if (g.kind === 'swing') {
    const a = g.amp * 0.5 * wave(g.ph + dt * g.hz);
    return [g.cx + L.hang * wave(a), L.y - L.hang + L.hang * wave(a + 0.25)];
  }
  return [g.cx, L.y];
}
/** How far up a target is at `t` (0 flat, 1 standing): rising, up, then going down. */
export function upness(g: Target, t: number): number {
  const rise = Math.min(1, Math.max(0, (t - g.t0) / RANGE.rise)), fall = Math.min(1, Math.max(0, (t - g.end) / RANGE.drop));
  return t < g.end ? rise : 1 - fall;
}
/** Up and standing, so an arrow can hit it. */
export const hittable = (g: Target, t: number) => t >= g.t0 + RANGE.rise && t < g.end;

/** One fixed step; `shot`: an arrow loosed at this sight (tenths of a pixel), if one is. True if it went. */
export function stepRange(s: RangeState, shot?: [number, number] | null): boolean {
  s.events = [];
  if (s.over) return false;
  const t = (s.t = s.frame / RANGE.fps);
  let went = false;
  if (shot && t >= s.nockAt && t + RANGE.fly < RANGE.round) {
    const [sx, sy] = sway(s, t), x = shot[0] / 10 + sx, y = shot[1] / 10 + sy;
    s.flights.push({ x, y, land: t + RANGE.fly });
    s.record.push([s.frame, shot[0], shot[1]]);
    s.nockAt = t + RANGE.nock;
    s.shots++;
    s.events.push({ k: 'loose' });
    went = true;
  }
  for (const f of s.flights) if (f.land <= t) land(s, f, t);
  s.flights = s.flights.filter((f) => f.land > t);
  for (const g of s.targets) if (!g.hit && g.end > t && t >= g.t0 + g.life) (g.end = t), free(s, g.slot, t);
  s.targets = s.targets.filter((g) => t < g.end + RANGE.drop);
  s.stuck = s.stuck.filter((a) => a.target < 0 ? t - a.t < 4 : s.targets.some((g) => g.id === a.target));
  s.slots.forEach((at, i) => at >= 0 && t >= at && t < RANGE.round - 1.5 && spawn(s, i, t));
  if (++s.frame >= RANGE.round * RANGE.fps) (s.over = true), s.events.push({ k: 'over' });
  return went;
}

const free = (s: RangeState, slot: number, t: number) => (s.slots[slot] = t + s.rng.range(RANGE.gap[0], RANGE.gap[1]));

/** An arrow comes down: the nearest lane's target first (it stands in front of the others). */
function land(s: RangeState, f: Flight, t: number): void {
  const live = s.targets.filter((g) => hittable(g, t)).sort((a, b) => b.lane - a.lane);
  for (const g of live) {
    const [x, y] = targetAt(g, t), dx = f.x - x, dy = f.y - y, d = Math.sqrt(dx * dx + dy * dy), r = LANES[g.lane].r;
    if (d > r) continue;
    const ring = Math.min(RANGE.rings.length - 1, Math.floor((d / r) * RANGE.rings.length)), pts = RANGE.rings[ring] * LANES[g.lane].mult;
    s.score += pts;
    s.hits++;
    if (ring === 0) s.golds++;
    s.bestStreak = Math.max(s.bestStreak, ++s.streak);
    g.hit = true;
    g.end = t;
    free(s, g.slot, t);
    s.stuck.push({ x: dx, y: dy, target: g.id, t });
    s.events.push({ k: 'hit', ring, pts, lane: g.lane, x: f.x, y: f.y });
    return;
  }
  s.streak = 0;
  s.stuck.push({ x: f.x, y: f.y, target: -1, t });
  s.events.push({ k: 'miss', x: f.x, y: f.y });
}

/** A new target up in `slot`: the lanes and motions open up as the round goes on. */
function spawn(s: RangeState, slot: number, t: number): void {
  const r = s.rng, taken = new Set(s.targets.filter((g) => g.end > t).map((g) => g.lane));
  const lw = [t >= RANGE.farFrom ? 2 : 0, 3, 3].map((w, i) => (taken.has(i as LaneId) ? w * 0.1 : w));
  const kw = [3, t >= RANGE.slideFrom ? 3 : 0, t >= RANGE.swingFrom ? 2.5 : 0];
  const lane = pickW(lw, r.next()) as LaneId, kind = (['post', 'slide', 'swing'] as const)[pickW(kw, r.next())], L = LANES[lane];
  const amp = kind === 'slide' ? r.range(MOTION.slide[0], MOTION.slide[1]) * L.k : kind === 'swing' ? r.range(MOTION.swing[0], MOTION.swing[1]) : 0;
  const hz = kind === 'slide' ? r.range(MOTION.slideHz[0], MOTION.slideHz[1]) : kind === 'swing' ? r.range(MOTION.swingHz[0], MOTION.swingHz[1]) : 0;
  const edge = kind === 'slide' ? amp : kind === 'swing' ? L.hang * 0.6 : L.r;
  const cx = r.range(RANGE.from + edge, RANGE.to - edge), life = r.range(L.life[0], L.life[1]), ph = r.next();
  s.targets.push({ id: s.nextId++, slot, lane, kind, t0: t, life, end: Infinity, hit: false, cx, amp, hz, ph });
  s.slots[slot] = -1;
  s.events.push({ k: 'up', lane });
}
function pickW(w: number[], u: number): number {
  let x = u * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) if ((x -= w[i]) < 0) return i;
  return w.length - 1;
}

/**
 * A whole round again from its seed and its arrows (what the world server does with a score before it
 * goes on the board). Null if the arrows couldn't have been loosed (out of order, too many, between
 * nocks, or after the bell): a made-up record, not a round.
 */
export function replayRange(seed: number, steady: boolean, shots: readonly (readonly number[])[]): RangeState | null {
  if (!Array.isArray(shots) || shots.length > RANGE.shots) return null;
  const s = newRange(seed, steady);
  let i = 0;
  while (!s.over) {
    const next = shots[i];
    const mine = next && next[0] === s.frame ? [next[1], next[2]] as [number, number] : null;
    if (next && (!Array.isArray(next) || next.length !== 3 || !next.every((v) => Number.isInteger(v)) || next[0] < s.frame)) return null;
    if (mine && Math.abs(mine[0]) + Math.abs(mine[1]) > 1e5) return null;
    const went = stepRange(s, mine);
    if (mine && !went) return null;
    if (mine) i++;
  }
  return i === shots.length ? s : null;
}

/** A hero's record at the range: rounds shot (seeds the next) and their best. */
export interface RangeRecord { rounds: number; best: number }
export function fitRangeRecord(raw: unknown): RangeRecord {
  const r = (raw ?? {}) as Partial<RangeRecord>, n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
  return { rounds: n(r.rounds), best: n(r.best) };
}
