/**
 * What the room relay (_relay.ts) shares between instances: a few keys (who hosts, each player's
 * newest connection, a counter that names each instance) and one pub/sub channel per room. In
 * production that's Redis from the Vercel Marketplace; locally and in tests, memory.
 */

export interface Store {
  get(key: string): Promise<string | null>;
  /** SET key val NX EX ttl; returns the value now held. */
  setNx(key: string, val: string, ttl: number): Promise<string | null>;
  set(key: string, val: string, ttl: number): Promise<void>;
  expire(key: string, ttl: number): Promise<void>;
  del(key: string): Promise<void>;
  /** INCR: a number no other caller ever gets. */
  incr(key: string): Promise<number>;
  /** INCRBY (the month's meter, _meter.ts). */
  incrBy(key: string, n: number): Promise<number>;
}
export interface Bus {
  /**
   * Resolves with how many instances heard it (Redis PUBLISH's reply), or -1 if unknown. Only a hint:
   * the relay lets a count open a room to the bus, never close it.
   */
  publish(channel: string, msg: string): Promise<number>;
  subscribe(channel: string, fn: (msg: string) => void): Promise<void>;
  unsubscribe(channel: string): Promise<void>;
}
export interface Backend { store: Store; bus: Bus; shared: boolean }

type Shared = { kv: Map<string, { v: string; exp: number }>; subs: Map<string, Set<(m: string) => void>> };

/** One process, no Redis: rooms only work for players on this same instance (local dev, tests). */
export function memoryBackend(shared?: Shared): Backend {
  const kv = shared?.kv ?? new Map<string, { v: string; exp: number }>();
  const subs = shared?.subs ?? new Map<string, Set<(m: string) => void>>();
  const mine = new Map<string, (m: string) => void>();
  const live = (k: string) => {
    const e = kv.get(k);
    if (e && e.exp < Date.now()) kv.delete(k);
    return kv.get(k)?.v ?? null;
  };
  return {
    shared: !!shared,
    store: {
      get: async (k) => live(k),
      setNx: async (k, v, ttl) => (live(k) ?? (kv.set(k, { v, exp: Date.now() + ttl * 1000 }), v)),
      set: async (k, v, ttl) => void kv.set(k, { v, exp: Date.now() + ttl * 1000 }),
      expire: async (k, ttl) => {
        const e = kv.get(k);
        if (e) e.exp = Date.now() + ttl * 1000;
      },
      del: async (k) => void kv.delete(k),
      incr: async (k) => {
        const n = (Number(live(k)) || 0) + 1;
        kv.set(k, { v: String(n), exp: Infinity });
        return n;
      },
      incrBy: async (k, by) => {
        const e = kv.get(k), n = (Number(live(k)) || 0) + by;
        kv.set(k, { v: String(n), exp: e && e.exp >= Date.now() ? e.exp : Infinity });
        return n;
      },
    },
    bus: {
      publish: async (ch, m) => {
        const fns = [...(subs.get(ch) ?? [])];
        fns.forEach((f) => f(m));
        return fns.length;
      },
      subscribe: async (ch, fn) => {
        mine.set(ch, fn);
        (subs.get(ch) ?? subs.set(ch, new Set()).get(ch)!).add(fn);
      },
      unsubscribe: async (ch) => {
        const fn = mine.get(ch);
        if (fn) subs.get(ch)?.delete(fn);
        mine.delete(ch);
      },
    },
  };
}

/**
 * Redis from the Vercel Marketplace (REDIS_URL): one connection for commands, one for pub/sub.
 * `onError`: what the clients report by themselves (Upstash over its limit says so here too).
 */
export async function redisBackend(url: string, onError: (e: unknown) => void = () => {}): Promise<Backend> {
  const { createClient } = await import('redis');
  const cmd = createClient({ url });
  const sub = cmd.duplicate();
  cmd.on('error', onError);
  sub.on('error', onError);
  await Promise.all([cmd.connect(), sub.connect()]);
  return {
    shared: true,
    store: {
      get: (k) => cmd.get(k),
      setNx: async (k, v, ttl) => {
        await cmd.set(k, v, { NX: true, EX: ttl });
        return cmd.get(k);
      },
      set: async (k, v, ttl) => void (await cmd.set(k, v, { EX: ttl })),
      expire: async (k, ttl) => void (await cmd.expire(k, ttl)),
      del: async (k) => void (await cmd.del(k)),
      incr: (k) => cmd.incr(k),
      incrBy: (k, n) => cmd.incrBy(k, n),
    },
    bus: {
      publish: async (ch, m) => {
        const n = await cmd.publish(ch, m);
        return typeof n === 'number' ? n : -1;
      },
      subscribe: (ch, fn) => sub.subscribe(ch, fn),
      unsubscribe: (ch) => sub.unsubscribe(ch),
    },
  };
}

/**
 * A backend that tells `onLimit` when Redis refuses a command because the plan's limit is reached
 * (`isLimit`, _meter.ts), then fails the command as before. Every command goes through it.
 */
export function guarded(b: Backend, isLimit: (e: unknown) => boolean, onLimit: () => void): Backend {
  const g = <A extends unknown[], T>(f: (...a: A) => Promise<T>) => async (...a: A): Promise<T> => {
    try {
      return await f(...a);
    } catch (e) {
      if (isLimit(e)) onLimit();
      throw e;
    }
  };
  const s = b.store, bus = b.bus;
  return {
    shared: b.shared,
    store: { get: g(s.get), setNx: g(s.setNx), set: g(s.set), expire: g(s.expire), del: g(s.del), incr: g(s.incr), incrBy: g(s.incrBy) },
    bus: { publish: g(bus.publish), subscribe: g(bus.subscribe), unsubscribe: g(bus.unsubscribe) },
  };
}
