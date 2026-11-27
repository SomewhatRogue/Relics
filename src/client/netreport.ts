/**
 * Each page's word on its connection, a line in the relay's logs a minute (Kyle, 2026-11-27, after an east-coast
 * friend lagged: so the next time it's read, not guessed). A friend's page counts how the leader's patches came
 * (how many, the gaps between them, the longest), how often its own hero was snapped back to the leader's word,
 * the jitter buffer's longest wait, and its trip and frame time; a leader's says its trip, frame time and friends.
 * Sent over the room's socket as `{ net }` (api/_relay.ts logs it as `ev: 'net'`, never relays it).
 */
import { frameAvg } from './netq';

/** Seconds between reports; a gap between patches longer than these counts (s). */
export const NETREP = { every: 60, gap: 0.15, stall: 0.3 };

export class NetReport {
  private n = 0;
  private gaps = 0;
  private stalls = 0;
  private worst = 0;
  private lastAt = -1;
  private wait = 0;
  snaps = 0;
  private sentAt: number;

  constructor(now: number) {
    this.sentAt = now;
  }

  /** A patch from the leader came in at `at` (s). */
  patch(at: number): void {
    if (this.lastAt >= 0) {
      const d = at - this.lastAt;
      if (d > NETREP.gap) this.gaps++;
      if (d > NETREP.stall) this.stalls++;
      this.worst = Math.max(this.worst, d);
    }
    (this.lastAt = at), this.n++;
  }

  /** The jitter buffer's wait on a patch applied (s). */
  waited(s: number): void {
    this.wait = Math.max(this.wait, s);
  }

  /** The report due now, or null; counts start over once it's taken. `rtt`, `trip` in s. */
  due(now: number, as: 'guest' | 'host', rtt: number, trip = 0, friends = 0): Record<string, number | string> | null {
    if (now - this.sentAt < NETREP.every) return null;
    const secs = now - this.sentAt, ms = (s: number) => Math.round(s * 1000);
    const r: Record<string, number | string> = { as, secs: Math.round(secs), rt: ms(rtt), fr: Math.round(frameAvg()) };
    if (as === 'guest') Object.assign(r, { trip: ms(trip), n: this.n, gaps: this.gaps, stalls: this.stalls, worst: ms(this.worst), wait: ms(this.wait), snaps: this.snaps });
    else r.friends = friends;
    Object.assign(this, { sentAt: now, n: 0, gaps: 0, stalls: 0, worst: 0, wait: 0, snaps: 0 });
    return r;
  }
}
