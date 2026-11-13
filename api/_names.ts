/**
 * Who holds each hero name (api/names.ts, shared/names.ts): `relic:name:<NAME>` is the hero id that has it.
 * Claimed with SET NX, so two heroes can never both have one; given up only by the hero holding it.
 */
import { Meter } from './_meter.js';

export interface NameStore {
  /** Whether each name is free (a hero holding it already counts as not free). */
  free(names: string[]): Promise<boolean[]>;
  /** The name for `hero` if nobody has it (or `hero` has it already): true if it's theirs now. */
  claim(name: string, hero: string): Promise<boolean>;
  /** `hero` gives its name up (a hero retired); someone else's is left alone. */
  release(name: string, hero: string): Promise<void>;
}

const key = (n: string) => 'relic:name:' + n;
const RELEASE = "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0";

export function memoryNameStore(): NameStore {
  const held = new Map<string, string>();
  return {
    async free(names) {
      return names.map((n) => !held.has(n));
    },
    async claim(name, hero) {
      if (!held.has(name)) held.set(name, hero);
      return held.get(name) === hero;
    },
    async release(name, hero) {
      if (held.get(name) === hero) held.delete(name);
    },
  };
}

export async function redisNameStore(url: string, meter = new Meter()): Promise<NameStore> {
  const { createClient } = await import('redis');
  const r = createClient({ url });
  r.on('error', (e) => console.log(JSON.stringify({ names: 1, ev: 'err', msg: String(e?.message ?? e) })));
  await r.connect();
  meter.attach({ incrBy: (k, n) => r.incrBy(k, n), expire: (k, t) => r.expire(k, t) });
  return {
    async free(names) {
      meter.add('mget');
      return (await r.mGet(names.map(key))).map((v) => v === null);
    },
    async claim(name, hero) {
      meter.add('set');
      if ((await r.set(key(name), hero, { NX: true })) === 'OK') return true;
      meter.add('get');
      return (await r.get(key(name))) === hero;
    },
    async release(name, hero) {
      meter.add('eval', 3);
      await r.eval(RELEASE, { keys: [key(name)], arguments: [hero] });
    },
  };
}
