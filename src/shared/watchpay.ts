/**
 * When the watch stands (only at night in Wickhold, by the shared town clock) and what a shift is worth
 * to the hero: a personal best kept in the save, and a little pay by score, capped each night.
 */
import { DAY_MINUTES, daylight } from './daylight.js';
import { WATCH_DARK, WATCH_PAY, type FieldName } from './watchtune.js';

/** A hero's record on the wall: their best side-on (`best`) and upright on a phone (`deep`), kept apart
 *  because they're different shoots; and the pay taken on the night it was taken (one cap for both). */
export interface WatchRecord { best: number; night: number; paid: number; deep?: number }

/** The best on the record for a view. */
export const bestOf = (r: WatchRecord | undefined, field: FieldName) => (field === 'deep' ? r?.deep ?? 0 : r?.best ?? 0);

/** Whether the watch is on at this point in Wickhold's day (0 midnight .. 0.5 noon). */
export const watchOpen = (phase: number) => daylight(phase) < WATCH_DARK;

/** Which night it is (the count goes up each noon, so one night never splits at midnight). */
export const nightOf = (ms: number) => Math.floor(ms / 60000 / DAY_MINUTES + 0.5);

export interface Settled { record: WatchRecord; pay: number; best: boolean; capped: boolean }
/** A finished shift's `total` in a view: the new record, the gold it pays (under tonight's cap), and whether it's a new best there. */
export function settleWatch(old: WatchRecord | undefined, total: number, night: number, field: FieldName = 'wide'): Settled {
  const r = old ?? { best: 0, night: -1, paid: 0 };
  const paid = r.night === night ? r.paid : 0, room = Math.max(0, WATCH_PAY.cap - paid);
  const earned = Math.floor(Math.max(0, total) / WATCH_PAY.per), pay = Math.min(room, earned);
  const was = bestOf(r, field), best = total > was, top = Math.max(was, total);
  const record = field === 'deep' ? { ...r, deep: top, night, paid: paid + pay } : { ...r, best: top, night, paid: paid + pay };
  return { record, pay, best, capped: earned > pay };
}
