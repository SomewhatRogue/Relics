/**
 * The item ledger's keeping (docs/design/trading.md, api/ledger.ts): one Redis string per ledgered piece,
 * `relic:item:<id>`, holding its owner's hero id. Kept for good, with no expiry: an owner that quietly ran
 * out would let an old copy of the save take the piece back. Without Redis it lives in memory (tests,
 * local dev). Every command is counted (_meter.ts).
 *   owners: one MGET for a whole save.
 *   claim:  each id's owner written only where it has none (SET NX), answered with the owner it ends up
 *           with; one small script, so a mint and a check can't cross.
 *   accept: a trade (shared/trade.ts). `relic:trade:<id>` holds its terms and who has accepted them. The
 *           first ACCEPT waits there; the second, with the same terms, checks every item is its giver's
 *           and swaps the owners in the same script, or moves nothing. Other terms start it over, so a
 *           changed offer clears both accepts. Settled (done or bad), it answers the same to a repeat.
 */
import { Meter } from './_meter.js';
import { termsKey, type Terms, type TradeState } from '../src/shared/trade.js';

export interface LedgerStore {
  /** Each id's owner, or null where the ledger has none. */
  owners(ids: string[]): Promise<(string | null)[]>;
  /** Give each id to its hero where it has no owner yet; the owner each id has after. */
  claim(pairs: [id: string, hero: string][]): Promise<string[]>;
  /** `hero` accepts the terms: 'wait' for the other, 'done' (swapped), or 'bad' (an item wasn't its giver's). */
  accept(t: Terms, hero: string): Promise<Exclude<TradeState, 'none'>>;
  /** Where a trade stands, without accepting it (a trade cut off by a crash, asked again on load). */
  ask(id: string): Promise<{ state: TradeState; terms?: string }>;
  /** A trade called off by one of its heroes: still open, it's dropped ('none'); settled, how it settled. */
  withdraw(id: string, hero: string): Promise<TradeState>;
}

/** How long an open trade waits for the second ACCEPT, and how long a settled one is remembered, s. */
export const TRADE_WAIT_S = 180, TRADE_KEEP_S = 30 * 24 * 3600;
export const tradeKey = (id: string) => `relic:trade:${id}`;

export const itemKey = (id: string) => `relic:item:${id}`;

export function memoryLedgerStore(): LedgerStore {
  const kept = new Map<string, string>(), trades = new Map<string, { terms: string; ok: string; s?: 'done' | 'bad' }>();
  return {
    async accept(t, hero) {
      const key = termsKey(t), cur = trades.get(t.id);
      if (cur?.s) return cur.terms === key ? cur.s : 'bad';
      if (!cur || cur.terms !== key) return trades.set(t.id, { terms: key, ok: hero }), 'wait';
      if (cur.ok === hero) return 'wait';
      const owns = (s: Terms['a']) => s.give.every((id) => kept.get(id) === s.h);
      if (!owns(t.a) || !owns(t.b)) return (cur.s = 'bad');
      for (const id of t.a.give) kept.set(id, t.b.h);
      for (const id of t.b.give) kept.set(id, t.a.h);
      return (cur.s = 'done');
    },
    async ask(id) {
      const cur = trades.get(id);
      return cur ? { state: cur.s ?? 'wait', terms: cur.terms } : { state: 'none' };
    },
    async withdraw(id, hero) {
      const cur = trades.get(id);
      if (cur?.s) return cur.s;
      if (cur?.terms.includes(`"${hero}"`)) trades.delete(id);
      return 'none';
    },
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

// KEYS: the trade, then a's items, then b's. ARGV: terms, hero, a's hero, b's hero, how many are a's, wait s, keep s.
const ACCEPT = `local t = KEYS[1]
local cur = redis.call('HGET', t, 'terms')
local st = redis.call('HGET', t, 's')
if st then
  if cur == ARGV[1] then return st end
  return 'bad'
end
if cur ~= ARGV[1] then
  redis.call('DEL', t)
  redis.call('HSET', t, 'terms', ARGV[1], 'ok', ARGV[2])
  redis.call('EXPIRE', t, tonumber(ARGV[6]))
  return 'wait'
end
if redis.call('HGET', t, 'ok') == ARGV[2] then return 'wait' end
local n = tonumber(ARGV[5])
for i = 2, #KEYS do
  local giver = ARGV[4]
  if i - 1 <= n then giver = ARGV[3] end
  if redis.call('GET', KEYS[i]) ~= giver then
    redis.call('HSET', t, 's', 'bad')
    redis.call('EXPIRE', t, tonumber(ARGV[7]))
    return 'bad'
  end
end
for i = 2, #KEYS do
  local taker = ARGV[3]
  if i - 1 <= n then taker = ARGV[4] end
  redis.call('SET', KEYS[i], taker)
end
redis.call('HSET', t, 's', 'done')
redis.call('EXPIRE', t, tonumber(ARGV[7]))
return 'done'`;

// KEYS: the trade. ARGV: the hero calling it off (only one of its two can).
const WITHDRAW = `local st = redis.call('HGET', KEYS[1], 's')
if st then return st end
local cur = redis.call('HGET', KEYS[1], 'terms')
if cur and string.find(cur, '"' .. ARGV[1] .. '"', 1, true) then redis.call('DEL', KEYS[1]) end
return 'none'`;

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
    async accept(t, hero) {
      const items = [...t.a.give, ...t.b.give];
      // Upstash counts the script, and each redis.call: three or four reads and writes, a GET and a SET an item.
      meter.add('eval', 5 + 2 * items.length);
      return (await r.eval(ACCEPT, {
        keys: [tradeKey(t.id), ...items.map(itemKey)],
        arguments: [termsKey(t), hero, t.a.h, t.b.h, String(t.a.give.length), String(TRADE_WAIT_S), String(TRADE_KEEP_S)],
      })) as Exclude<TradeState, 'none'>;
    },
    async ask(id) {
      meter.add('hmget');
      const [terms, s, ok] = await r.hmGet(tradeKey(id), ['terms', 's', 'ok']);
      if (!terms) return { state: 'none' };
      return { state: (s as TradeState | null) ?? (ok ? 'wait' : 'none'), terms };
    },
    async withdraw(id, hero) {
      meter.add('eval', 4);
      return (await r.eval(WITHDRAW, { keys: [tradeKey(id)], arguments: [hero] })) as TradeState;
    },
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
