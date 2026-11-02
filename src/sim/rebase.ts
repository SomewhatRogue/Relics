/**
 * A hero carried from one room into another: every moment it keeps (cooldowns, buffs, the last block,
 * a press waiting to land) was on the old room's clock, so it moves onto the new one's. Presses still
 * waiting are dropped, so nothing done before the doorway fires again after it.
 */
import type { Hero } from './types';

const ON_CLOCK = /(At|Until)$/;

export function rebase(h: Hero, from: number, to: number): void {
  const shift = to - from, rec = h as unknown as Record<string, unknown>;
  for (const k of Object.keys(rec)) if (ON_CLOCK.test(k) && typeof rec[k] === 'number') rec[k] = (rec[k] as number) + shift;
  for (const r of Object.keys(h.relicReady)) h.relicReady[r as keyof Hero['relicReady']] += shift;
  Object.assign(h, { attackQueuedAt: -9, rollQueuedAt: -9, relicQueuedAt: -9, grabQueuedAt: -9 });
}
