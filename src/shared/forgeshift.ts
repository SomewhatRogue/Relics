/**
 * A shift at Halvard's forge: a run of town work, struck on the glow as at the anvil (shared/forgestrike.ts)
 * but piece after piece, faster as the shift goes on (numbers in shared/shifttune.ts). Halvard lays a piece
 * on (a nail, a pot hook, a hinge, a blade blank), it glows up and fades a few times, and each strike near
 * a peak counts toward it; finish it and he takes it off and lays the next. Points for clean and near
 * strikes, a streak bonus, and each piece finished. A Warrior's windows are wider (`strong`, SHIFT.knight). Everything comes from the shift's seed (the hero and
 * their count of shifts) and the frames struck, so the world can play it again from the strikes alone
 * (`replayShift`). Pure, fixed steps, no Math.random.
 */
import { Rng } from './rng.js';
import { PIECE_KINDS, SHIFT, type PieceKind } from './shifttune.js';
import type { StrikeMark } from './forgestrike.js';

export interface ShiftPiece {
  kind: PieceKind; need: number; t0: number;
  /** When each of its glows peaks, how long they rise and fade, and which have been struck or let go. */
  peaks: number[]; rise: number; used: boolean[]; passed: boolean[];
  /** Good strikes on it so far, and every strike's mark in order. */
  hits: number; marks: StrikeMark[];
}
export type ShiftEvent =
  | { k: 'lay'; kind: PieceKind }
  | { k: 'strike'; mark: StrikeMark; pts: number; streak: number }
  | { k: 'made'; kind: PieceKind; pts: number }
  | { k: 'spoiled'; kind: PieceKind }
  | { k: 'pass' }
  | { k: 'over' };
export interface ShiftState {
  seed: number; strong: boolean; rng: Rng; frame: number; t: number; over: boolean;
  piece: ShiftPiece | null; nextAt: number; lockTo: number;
  score: number; made: number; spoiled: number; streak: number; bestStreak: number;
  clean: number; fair: number; cold: number;
  /** The frame of every strike the rules took, which is all a claim needs. */
  record: number[];
  events: ShiftEvent[];
}

export function newShift(seed: number, strong = false): ShiftState {
  return { seed, strong, rng: new Rng(seed), frame: 0, t: 0, over: false, piece: null, nextAt: SHIFT.first, lockTo: 0,
    score: 0, made: 0, spoiled: 0, streak: 0, bestStreak: 0, clean: 0, fair: 0, cold: 0, record: [], events: [] };
}

/** How far through the shift (0 to 1), which sets the pace and the mix. */
const along = (t: number) => Math.max(0, Math.min(1, t / SHIFT.length));
const lerp = (a: readonly [number, number], k: number) => a[0] + (a[1] - a[0]) * k;
const snap = (t: number) => Math.round(t * SHIFT.fps) / SHIFT.fps;

/** The next piece, laid on at `t`: its kind by the mix, its glows at the pace of the moment. */
function lay(s: ShiftState, t: number): ShiftPiece {
  const k = along(t), w = PIECE_KINDS.map((p) => lerp(SHIFT.mix[p], k)), total = w.reduce((a, b) => a + b, 0);
  let r = s.rng.next() * total, kind = PIECE_KINDS[0];
  for (let i = 0; i < w.length; i++) if ((r -= w[i]) < 0) { kind = PIECE_KINDS[i]; break; }
  const need = SHIFT.pieces[kind].strikes, gap = lerp(SHIFT.gap, k), peaks: number[] = [];
  let at = t + lerp(SHIFT.lead, k);
  for (let i = 0; i < need + SHIFT.spare; i++) peaks.push(snap(at)), (at += gap * (1 + s.rng.range(-SHIFT.jitter, SHIFT.jitter)));
  const n = peaks.length;
  return { kind, need, t0: t, peaks, rise: Math.min(SHIFT.rise, gap * SHIFT.riseShare), used: Array(n).fill(false), passed: Array(n).fill(false), hits: 0, marks: [] };
}

/** How bright the piece on the anvil is at `t` (0 dull to 1 at a peak), exactly as it's drawn. */
export function shiftGlow(s: ShiftState, t = s.t): number {
  const p = s.piece;
  if (!p) return 0;
  let b = 0;
  for (const x of p.peaks) b = Math.max(b, Math.max(0, 1 - Math.abs(t - x) / p.rise) ** 2);
  return b;
}

/** Seconds left in the shift. */
export const shiftLeft = (s: ShiftState) => Math.max(0, SHIFT.length - s.t);

/** Take the piece off: finished (`made`) or spoiled, and the next laid on after a short swap. */
function takeOff(s: ShiftState, t: number, made: boolean): void {
  const p = s.piece!;
  if (made) {
    const pts = SHIFT.pieces[p.kind].pts;
    s.made++, (s.score += pts), s.events.push({ k: 'made', kind: p.kind, pts });
  } else s.spoiled++, (s.streak = 0), s.events.push({ k: 'spoiled', kind: p.kind });
  s.piece = null;
  s.nextAt = t + SHIFT.swap;
}

/**
 * One fixed step; `hit`: the hammer comes down now. Returns whether the rules took the strike (a press while
 * the hammer's still coming up, between pieces or after the bell is no strike, and isn't kept).
 */
export function stepShift(s: ShiftState, hit: boolean): boolean {
  s.events = [];
  if (s.over) return false;
  const t = (s.t = s.frame / SHIFT.fps);
  s.frame++;
  if (t >= SHIFT.length) return (s.over = true), s.events.push({ k: 'over' }), false;
  if (!s.piece && t >= s.nextAt) (s.piece = lay(s, t)), s.events.push({ k: 'lay', kind: s.piece.kind });
  const p = s.piece;
  if (!p) return false;
  // Glows let go by without a strike end the streak.
  const wide = s.strong ? SHIFT.knight : 1, clean = SHIFT.clean * wide, fair = SHIFT.fair * wide;
  for (let i = 0; i < p.peaks.length; i++) if (!p.used[i] && !p.passed[i] && t > p.peaks[i] + fair) (p.passed[i] = true), (s.streak = 0), s.events.push({ k: 'pass' });
  let took = false;
  if (hit && t >= s.lockTo) {
    // The nearest glow not struck or gone already.
    let best = -1;
    for (let i = 0; i < p.peaks.length; i++) if (!p.used[i] && !p.passed[i] && (best < 0 || Math.abs(p.peaks[i] - t) < Math.abs(p.peaks[best] - t))) best = i;
    if (best >= 0) {
      const d = Math.abs(t - p.peaks[best]), mark: StrikeMark = d <= clean ? 'clean' : d <= fair ? 'fair' : 'cold';
      p.used[best] = true, p.marks.push(mark), (s.lockTo = t + SHIFT.lock), s.record.push(s.frame - 1), (took = true);
      let pts = 0;
      if (mark === 'cold') s.cold++, (s.streak = 0);
      else {
        mark === 'clean' ? s.clean++ : s.fair++;
        s.streak++, p.hits++;
        s.bestStreak = Math.max(s.bestStreak, s.streak);
        pts = SHIFT.points[mark] + SHIFT.streak.per * Math.min(s.streak - 1, SHIFT.streak.cap);
        s.score += pts;
      }
      s.events.push({ k: 'strike', mark, pts, streak: s.streak });
    }
  }
  if (p.hits >= p.need) takeOff(s, t, true);
  else if (p.peaks.every((_, i) => p.used[i] || p.passed[i])) takeOff(s, t, false);
  return took;
}

/** Strike on a shift as given (frames, in order), to the bell; null if any strike isn't one the rules would take. */
export function replayShift(seed: number, frames: readonly number[], strong = false): ShiftState | null {
  if (frames.length > SHIFT.most) return null;
  const s = newShift(seed, strong);
  let i = 0;
  while (!s.over) {
    const want = i < frames.length && frames[i] === s.frame;
    if (i < frames.length && frames[i] < s.frame) return null;
    const took = stepShift(s, want);
    if (want && !took) return null;
    if (want) i++;
  }
  return i === frames.length ? s : null;
}

/** The most a shift could score, for fitting a save (every strike clean at full streak, every piece the biggest). */
export const SHIFT_MOST = Math.ceil((SHIFT.length / SHIFT.lock) * (SHIFT.points.clean + SHIFT.streak.per * SHIFT.streak.cap + SHIFT.pieces.blank.pts));
