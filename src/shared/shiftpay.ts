/**
 * What a shift at the forge pays, and the rest before the next paid one (numbers: shared/shifttune.ts
 * SHIFT_PAY). Kept on the hero (`Profile.shift`): how many shifts (seeds the next), the best score, when
 * the next paid shift can start, and which shift is owed pay. Pay is promised as a paid shift starts
 * (`startShift`, saved then, with the rest counted from then) and handed over once, only for that shift,
 * only if it ran to the bell (`settleShift`). A refresh or STOP mid-shift: no pay, and the rest still runs.
 */
import { SHIFT, SHIFT_PAY } from './shifttune.js';
import { SHIFT_MOST } from './forgeshift.js';

export interface ShiftRecord {
  shifts: number; best: number;
  /** Real time (ms) the next paid shift may start. */
  restUntil: number;
  /** The shift (its number) that's owed pay at the bell, if any. */
  owed?: number;
}

/** Gold for a shift's score: one for every `per` points, at most `cap`. */
export const shiftGold = (score: number) => Math.max(0, Math.min(SHIFT_PAY.cap, Math.floor(score / SHIFT_PAY.per)));

/** Is a shift started now a paid one? */
export const paidNow = (r: ShiftRecord | undefined, now: number) => !r || now >= r.restUntil;

/** Seconds until the next paid shift (0: now). */
export const restLeft = (r: ShiftRecord | undefined, now: number) => (r ? Math.max(0, Math.ceil((r.restUntil - now) / 1000)) : 0);

/** A new shift begins at `now`: its number (the seed), and whether it's paid (then the rest runs from now). */
export function startShift(r: ShiftRecord, now: number): { n: number; paid: boolean } {
  const n = r.shifts++, paid = paidNow(r, now);
  if (paid) (r.owed = n), (r.restUntil = now + (SHIFT.length + SHIFT_PAY.rest) * 1000);
  return { n, paid };
}

/** Shift `n` is over: what it pays (once), and the best kept. `whole`: it ran to the bell. */
export function settleShift(r: ShiftRecord, n: number, score: number, whole: boolean): { gold: number; best: boolean } {
  const best = whole && score > r.best;
  if (best) r.best = score;
  if (r.owed !== n) return { gold: 0, best };
  delete r.owed;
  return { gold: whole ? shiftGold(score) : 0, best };
}

/** A record as saved, made sound (a rest can't be pushed past one full shift and rest from `now`). */
export function fitShiftRecord(raw: unknown, now = Date.now()): ShiftRecord {
  const r = (raw ?? {}) as Partial<ShiftRecord>, n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
  const out: ShiftRecord = { shifts: n(r.shifts), best: Math.min(n(r.best), SHIFT_MOST), restUntil: Math.min(n(r.restUntil), now + (SHIFT.length + SHIFT_PAY.rest) * 1000) };
  if (typeof r.owed === 'number' && Number.isInteger(r.owed) && r.owed >= 0 && r.owed < out.shifts) out.owed = r.owed;
  return out;
}
