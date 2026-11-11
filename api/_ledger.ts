/**
 * The item ledger's keeping (docs/design/trading.md, api/ledger.ts): one Redis string per ledgered piece,
 * `relic:item:<id>`, holding its owner's hero id. Kept for good, with no expiry: an owner that quietly ran
 * out would let an old copy of the save take the piece back. Without Redis it lives in memory (tests,
 * local dev). Every command is counted (_meter.ts).
 *   owners: one MGET for a whole save.
 *   claim:  each id's owner written only where it has none (SET NX), answered with the owner it ends up
 *           with; one small script, so a mint and a check can't cross.
 */
import { Meter } from './_meter.js';

export interface LedgerStore {
  /** Each id's owner, or null where the ledger has none. */
  owners(ids: string[]): Promise<(string | null)[]>;
  /** Give each id to its hero where it has no owner yet; the owner each id has after. */
  claim(pairs: [id: string, hero: string][]): Promise<string[]>;
}

export const itemKey = (id: string) => `relic:item:${id}`;

export function memoryLedgerStore(): LedgerStore {
  const kept = new Map<string, string>();
  return {
    async owners(ids) {
      return ids.map((id) => kept.get(id) ?? null);
    },
    async claim(pairs) {
      return pairs.map(([id, hero]) => {
        if (!kept.has(id)) kept.set(id, hero);
        return kept.get(id)!;
      });
    },
  };
}

const CLAIM = `local out = {}
for i, k in ipairs(KEYS) do
  local o = redis.call('GET', k)
  if not o then redis.call('SET', k, ARGV[i]); o = ARGV[i] end
  out[i] = o
end
return out`;

export async function redisLedgerStore(url: string, meter = new Meter()): Promise<LedgerStore> {
  const { createClient } = await import('redis');
  const r = createClient({ url });
  r.on('error', (e) => console.log(JSON.stringify({ ledger: 1, ev: 'err', msg: String(e?.message ?? e) })));
  await r.connect();
  meter.attach({ incrBy: (k, n) => r.incrBy(k, n), expire: (k, t) => r.expire(k, t) });
  return {
    async owners(ids) {
      if (!ids.length) return [];
      meter.add('mget');
      return (await r.mGet(ids.map(itemKey))).map((v) => v ?? null);
    },
    async claim(pairs) {
      if (!pairs.length) return [];
      // Upstash counts a script as one command and one more for each redis.call (a GET, and a SET for a new one).
      meter.add('eval', 1 + 2 * pairs.length);
      return (await r.eval(CLAIM, { keys: pairs.map(([id]) => itemKey(id)), arguments: pairs.map(([, h]) => h) })) as string[];
    },
  };
}

/**
 * A save's check (on load): `held` is each hero's ledger ids. One read for all of them; an id the ledger has
 * never seen (its mint never got through) goes to the first hero holding it. Returns, for each hero, the ids
 * it holds that the ledger gives to someone else: those are GONE.
 */
export async function checkHeld(store: LedgerStore, held: Record<string, string[]>): Promise<Record<string, string[]>> {
  const first = new Map<string, string>();
  for (const [hero, ids] of Object.entries(held)) for (const id of ids) if (!first.has(id)) first.set(id, hero);
  const ids = [...first.keys()], got = await store.owners(ids), owner = new Map<string, string>();
  const unknown: [string, string][] = [];
  ids.forEach((id, i) => (got[i] ? owner.set(id, got[i]!) : unknown.push([id, first.get(id)!])));
  if (unknown.length) (await store.claim(unknown)).forEach((o, i) => owner.set(unknown[i][0], o));
  const gone: Record<string, string[]> = {};
  for (const [hero, ids] of Object.entries(held)) {
    const g = [...new Set(ids)].filter((id) => owner.get(id) !== hero);
    if (g.length) gone[hero] = g;
  }
  return gone;
}
