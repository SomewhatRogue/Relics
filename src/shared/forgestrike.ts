/**
 * Striking on the glow at Halvard's anvil (docs/plans/town-activities.md: "strike on the glow for a
 * better roll when upgrading"). Upgrading is as it was (client/game.ts `upgrade`): gold and steel, a level
 * up. As you pay you may pick up the hammer and strike it yourself, a short timing game; skip it and
 * it's exactly the upgrade you'd have had. The steel glows up and fades a few times on the anvil; strike
 * as it's brightest. Three strikes. How well they land sets how much the upgrade gets on top (its
 * `temper`, in levels: shared/gear.ts), at most TEMPER.max of a level, and the amount is drawn from the
 * strike's own seed (the hero and their count of strikes, counted before the hammer comes down), so a
 * refresh can't roll it again. Pure and in fixed steps, like the other pastimes.
 */
import { Rng } from './rng.js';
import { TEMPER } from './gear.js';

/**
 * - `strikes`: blows a piece takes. `glows`: how many times it glows before Halvard takes it off you.
 * - `first`: the first glow's peak; `gap`: between peaks (from, to); `rise`: how long a glow takes to come
 *   up to its peak and to fade (s).
 * - `clean`, `fair`: how near the peak a strike must land for full or half marks (s). `lock`: after a
 *   strike, before the next.
 */
export const STRIKE = { fps: 60, strikes: 3, glows: 6, first: 1.1, gap: [0.95, 1.35] as const, rise: 0.45, clean: 0.08, fair: 0.17, lock: 0.3 } as const;

export type StrikeMark = 'clean' | 'fair' | 'cold';
export type StrikeEvent = { k: 'strike'; mark: StrikeMark; at: number } | { k: 'over' };
export interface StrikeState {
  seed: number; rng: Rng; frame: number; t: number; over: boolean;
  /** When each glow is at its brightest. */
  peaks: number[];
  /** Each strike: when, how it was marked, the peak it went for. */
  struck: { t: number; mark: StrikeMark; peak: number }[];
  lockTo: number;
  events: StrikeEvent[];
}

export function newStrike(seed: number): StrikeState {
  const rng = new Rng(seed), peaks: number[] = [];
  let t = STRIKE.first;
  for (let i = 0; i < STRIKE.glows; i++) peaks.push(Math.round(t * STRIKE.fps) / STRIKE.fps), (t += rng.range(STRIKE.gap[0], STRIKE.gap[1]));
  return { seed, rng, frame: 0, t: 0, over: false, peaks, struck: [], lockTo: 0, events: [] };
}

/** How bright the steel is at `t` (0 dull to 1 at a peak), as the picture draws it. */
export function glowAt(s: StrikeState, t = s.t): number {
  let b = 0;
  for (const p of s.peaks) b = Math.max(b, Math.max(0, 1 - Math.abs(t - p) / STRIKE.rise) ** 2);
  return b;
}

const MARKS: Record<StrikeMark, number> = { clean: 1, fair: 0.5, cold: 0 };

/** One fixed step; `hit`: the hammer comes down now. */
export function stepStrike(s: StrikeState, hit: boolean): void {
  s.events = [];
  if (s.over) return;
  const t = (s.t = s.frame / STRIKE.fps);
  if (hit && t >= s.lockTo && s.struck.length < STRIKE.strikes) {
    // The nearest glow not struck already.
    const used = new Set(s.struck.map((x) => x.peak)), free = s.peaks.filter((p) => !used.has(p));
    const peak = free.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a), free[0] ?? t), d = Math.abs(t - peak);
    const mark: StrikeMark = d <= STRIKE.clean ? 'clean' : d <= STRIKE.fair ? 'fair' : 'cold';
    s.struck.push({ t, mark, peak });
    s.lockTo = t + STRIKE.lock;
    s.events.push({ k: 'strike', mark, at: t });
  }
  s.frame++;
  if (s.struck.length >= STRIKE.strikes || t > s.peaks[s.peaks.length - 1] + STRIKE.rise) (s.over = true), s.events.push({ k: 'over' });
}

/** How well it went, 0 to 1 (strikes not made count as cold). */
export const strikeQuality = (s: StrikeState) => s.struck.reduce((n, x) => n + MARKS[x.mark], 0) / STRIKE.strikes;

/** What the strikes add to the upgrade (levels): none for a cold set, at most TEMPER.max, drawn from the seed. */
export function temperFrom(s: StrikeState): number {
  const q = strikeQuality(s);
  if (q <= 0) return 0;
  const r = new Rng((s.seed ^ 0x2c1b3c6d) >>> 0 || 3);
  return Math.round(q * TEMPER.max * r.range(TEMPER.floor, 1) * 1000) / 1000;
}
