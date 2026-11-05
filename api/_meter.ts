/**
 * Redis's meter, kept by each instance (docs/REALTIME-REDIS-BUDGET.md). Upstash's free plan is 500K
 * commands a month and refuses commands past it, so every instance counts the commands it sends
 * (by kind, in memory) and now and then adds its count to the month's key, `rl:meter:2026-11`, with
 * one INCRBY that counts itself. It adds at most once a minute, and only once 200 have built up or
 * 15 minutes have passed, so the meter costs well under 1% of the budget: at most 1 command in 201,
 * or 4 an hour for an instance that's almost idle. `/api/room?meter=1` reads it back.
 *
 * Also here: telling Upstash's "over the limit" refusal from any other failure (`isLimit`).
 */
import type { Backend } from './_backends.js';

export const MONTH_LIMIT = 500_000;
export const METER = { everyMs: 60_000, min: 200, longestMs: 15 * 60_000, ttl: 40 * 24 * 3600 };
export const monthKey = (d = new Date()) => `rl:meter:${d.toISOString().slice(0, 7)}`;

/**
 * Upstash past its plan: "ERR max requests limit exceeded. Limit: 500000, Usage: 500000" (and the
 * older "max daily request limit exceeded", or a bandwidth limit). Any other error is not this.
 */
export const isLimit = (e: unknown): boolean => /limit exceeded|max (daily |monthly )?requests? limit/i.test(String((e as Error)?.message ?? e));

/** Where the count goes: INCRBY key n, and EXPIRE it when that made it (the month's first). */
export type Sink = { incrBy(key: string, n: number): Promise<number>; expire(key: string, ttl: number): Promise<unknown> };

export class Meter {
  /** Every command counted, by kind (GET, SET, PUBLISH...), since this instance started. */
  by: Record<string, number> = {};
  total = 0;
  /** Messages handed to other instances' subscribers (PUBLISH's replies): not commands, shown apart. */
  deliveries = 0;
  /** Counted but not yet added to the month's key. */
  pending = 0;
  private addedAt = Date.now();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private sink: Sink | null = null, private opts = METER) {}

  add(kind: string, n = 1): void {
    this.by[kind] = (this.by[kind] ?? 0) + n;
    this.total += n;
    this.pending += n;
  }

  /** Add what's built up to the month's key, if it's time (at most once a minute: `start`). */
  async tick(now = Date.now()): Promise<void> {
    if (!this.sink || !this.pending || (this.pending < this.opts.min && now - this.addedAt < this.opts.longestMs)) return;
    // The INCRBY counts itself.
    this.add('incrby');
    const n = this.pending, key = monthKey(new Date(now));
    this.pending = 0;
    this.addedAt = now;
    try {
      if ((await this.sink.incrBy(key, n)) === n) (this.add('expire'), await this.sink.expire(key, this.opts.ttl));
    } catch {
      // Not added (Redis out of reach, or full): kept for next time.
      this.pending += n;
    }
  }

  /** Count into Redis from now on (a store's own client: world, saves, owed). */
  attach(sink: Sink): this {
    this.sink = sink;
    this.start();
    return this;
  }

  start(): void {
    if (this.timer || !this.sink) return;
    this.timer = setInterval(() => void this.tick(), this.opts.everyMs);
    (this.timer as { unref?: () => void }).unref?.();
  }
}

/** The month's count as kept, plus what this instance hasn't added yet. `get`: one GET, counted by its caller. */
export async function monthUsed(get: (key: string) => Promise<string | null>, m: Meter): Promise<number> {
  return (Number(await get(monthKey())) || 0) + m.pending;
}

/** A relay backend that counts each command it sends Redis (the counting decorator). */
export function metered(b: Backend, m: Meter): Backend {
  const s = b.store, bus = b.bus;
  const c = <T>(kind: string, n: number, p: Promise<T>) => (m.add(kind, n), p);
  return {
    shared: b.shared,
    store: {
      get: (k) => c('get', 1, s.get(k)),
      // SET NX EX, then GET (what's held now).
      setNx: (k, v, t) => (m.add('get'), c('set', 1, s.setNx(k, v, t))),
      set: (k, v, t) => c('set', 1, s.set(k, v, t)),
      expire: (k, t) => c('expire', 1, s.expire(k, t)),
      del: (k) => c('del', 1, s.del(k)),
      incr: (k) => c('incr', 1, s.incr(k)),
      incrBy: (k, n) => c('incrby', 1, s.incrBy(k, n)),
    },
    bus: {
      publish: async (ch, msg) => {
        const n = await c('publish', 1, bus.publish(ch, msg));
        if (n > 0) m.deliveries += n;
        return n;
      },
      subscribe: (ch, fn) => c('subscribe', 1, bus.subscribe(ch, fn)),
      unsubscribe: (ch) => c('unsubscribe', 1, bus.unsubscribe(ch)),
    },
  };
}
