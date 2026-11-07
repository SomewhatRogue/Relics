/**
 * A friend's screen plays the leader's patches at the pace the leader made them, not the pace they
 * arrive (a jitter buffer). A party split over two relay instances gets the leader's patches in pairs
 * a tenth of a second apart (the relay's batches, api/_outbox.ts): applied as they came, each pair
 * drew the second patch at once and then nothing for the rest of the tenth, so the leader and the
 * goblins moved in hitches (measured: Kyle's view of a walking leader stood still on about one frame in
 * seven). Here each patch waits only as long as it came early, against the latest of the last couple of
 * seconds: a steady link waits next to nothing, a batched one about half a batch, and never more than
 * MAX_DELAY (freshness wins past that). "The latest" is the 90th percentile, not the very latest: one
 * patch held up now and then (behind the whole-job save every 2 s, a garbage collection) no longer sets
 * the wait for everything after it, two seconds at a time (2026-11-06). A patch's events (hits, sounds) don't wait (coop.ts): only the
 * movement does.
 *
 * `t` is the leader's room clock on the patch; `k` the room it's of (a new room starts the clock over,
 * and its first patch goes at once).
 */
export const MAX_DELAY = 0.1;
/** Arrivals remembered (about two seconds of patches). */
const WINDOW = 40;
/** Never more than this many waiting: past it they go, oldest first. */
const MOST = 8;
/** How late a patch counts as "late" in the window: past this share of the recent ones. */
const SPREAD = 0.9;

type Item<T> = { v: T; t: number; at: number; k: number };

export class Playout<T> {
  private q: Item<T>[] = [];
  /** How early or late each recent patch came: arrival time less the leader's clock. */
  private offs: number[] = [];
  private k = NaN;
  private lastT = -Infinity;
  /** The wait the latest patch was given (seconds), for a look at it. */
  delay = 0;

  /** A patch came in at `at` (seconds, this page's clock). */
  push(v: T, t: number, k: number, at: number): void {
    if (k !== this.k && this.q.every((x) => x.k !== k)) this.offs = [];
    this.offs.push(at - t);
    if (this.offs.length > WINDOW) this.offs.shift();
    this.q.push({ v, t, k, at });
    const s = [...this.offs].sort((a, b) => a - b);
    this.lo = s[0];
    this.target = Math.min(MAX_DELAY, s[Math.ceil((s.length - 1) * SPREAD)] - this.lo);
  }

  private lo = 0;
  private target = 0;

  /** The patches due now, in the order they were made. */
  due(now: number): T[] {
    const out: T[] = [];
    const lo = this.lo, target = this.target;
    while (this.q.length) {
      const p = this.q[0];
      // How long this one should have waited: as much as it came early.
      const wait = Math.max(0, lo + target - (p.at - p.t));
      // (A new room's patch behind it: this one's room is done, so it goes now.)
      const go = p.k !== this.k || p.t < this.lastT || this.q.length > MOST || now - p.at >= wait || this.q.some((x) => x.k !== p.k);
      if (!go) break;
      this.q.shift();
      if (p.k !== this.k) this.lastT = -Infinity;
      this.k = p.k;
      this.lastT = p.t;
      this.delay = wait;
      out.push(p.v);
    }
    return out;
  }

  /** Waiting now (tests). */
  get waiting(): number {
    return this.q.length;
  }

  /** Forget everything (a new leader). */
  clear(): void {
    this.q = [];
    this.offs = [];
    this.k = NaN;
    this.lastT = -Infinity;
    this.lo = this.target = 0;
  }
}
