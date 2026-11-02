/**
 * Saves kept under recovery codes (api/save.ts): one Redis hash per code, `relic:save:<code>`, with
 * the save (JSON), the token that may write it, and `at`, when it was saved. Each operation is one
 * command (a small Lua script: make, pull and push), and each refreshes a year's keeping, so a code in
 * use never runs out. Without Redis the saves live in memory (tests, local dev).
 */
import { CLASS_ORDER } from '../src/shared/weapons.js';
import { HERO_SLOTS } from '../src/shared/progress.js';

export interface Kept { save: string; token: string; at: number }
/** A push: done (the new `at`), or why not. */
export type Pushed = number | 'missing' | 'token' | 'stale';
export interface SaveStore {
  /** Keep a new code; false if it's taken. */
  make(code: string, k: Kept): Promise<boolean>;
  pull(code: string): Promise<Kept | null>;
  /** Write over a code's save, if `token` is its own and nothing newer than `base` came in since. */
  push(code: string, token: string, base: number, save: string, at: number): Promise<Pushed>;
}

export const YEAR_S = 365 * 24 * 3600;
export const keyOf = (code: string) => `relic:save:${code}`;

/** A save's rough shape: up to three heroes of real classes, a world, a time. The rest is the game's. */
export function cleanSave(raw: unknown): { json: string; at: number } | null {
  const s = raw as { heroes?: unknown; world?: unknown; current?: unknown; savedAt?: unknown } | null;
  if (!s || typeof s !== 'object' || !Array.isArray(s.heroes) || s.heroes.length > HERO_SLOTS) return null;
  if (!s.world || typeof s.world !== 'object' || Array.isArray(s.world) || typeof s.current !== 'number') return null;
  for (const h of s.heroes as { id?: unknown; cls?: unknown }[])
    if (!h || typeof h !== 'object' || typeof h.id !== 'string' || !CLASS_ORDER.includes(h.cls as never)) return null;
  const at = typeof s.savedAt === 'number' && Number.isFinite(s.savedAt) ? Math.max(0, Math.floor(s.savedAt)) : 0;
  return { json: JSON.stringify(s), at };
}

/** The new `at`: never behind what's kept (so a stale copy can always be told apart). */
const next = (prev: number, at: number) => Math.max(prev + 1, at);

export function memorySaveStore(): SaveStore {
  const kept = new Map<string, Kept>();
  return {
    async make(code, k) {
      if (kept.has(code)) return false;
      kept.set(code, { ...k });
      return true;
    },
    async pull(code) {
      const k = kept.get(code);
      return k ? { ...k } : null;
    },
    async push(code, token, base, save, at) {
      const k = kept.get(code);
      if (!k) return 'missing';
      if (k.token !== token) return 'token';
      if (k.at > base) return 'stale';
      k.save = save;
      k.at = next(k.at, at);
      return k.at;
    },
  };
}

const MAKE = `if redis.call('EXISTS', KEYS[1]) == 1 then return 0 end
redis.call('HSET', KEYS[1], 'save', ARGV[1], 'token', ARGV[2], 'at', ARGV[3])
redis.call('EXPIRE', KEYS[1], ARGV[4])
return 1`;
const PULL = `local v = redis.call('HMGET', KEYS[1], 'save', 'token', 'at')
if v[1] then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return v`;
const PUSH = `local v = redis.call('HMGET', KEYS[1], 'token', 'at')
if not v[1] then return -1 end
if v[1] ~= ARGV[1] then return -2 end
local prev = tonumber(v[2])
if prev > tonumber(ARGV[2]) then return -3 end
local at = math.max(prev + 1, tonumber(ARGV[4]))
redis.call('HSET', KEYS[1], 'save', ARGV[3], 'at', string.format('%d', at))
redis.call('EXPIRE', KEYS[1], ARGV[5])
return at`;

export async function redisSaveStore(url: string): Promise<SaveStore> {
  const { createClient } = await import('redis');
  const r = createClient({ url });
  r.on('error', (e) => console.log(JSON.stringify({ save: 1, ev: 'err', msg: String(e?.message ?? e) })));
  await r.connect();
  const year = String(YEAR_S);
  return {
    async make(code, k) {
      return (await r.eval(MAKE, { keys: [keyOf(code)], arguments: [k.save, k.token, String(k.at), year] })) === 1;
    },
    async pull(code) {
      const v = (await r.eval(PULL, { keys: [keyOf(code)], arguments: [year] })) as (string | null)[];
      return v?.[0] ? { save: v[0], token: v[1] ?? '', at: Number(v[2]) || 0 } : null;
    },
    async push(code, token, base, save, at) {
      const n = Number(await r.eval(PUSH, { keys: [keyOf(code)], arguments: [token, String(base), save, String(at), year] }));
      return n === -1 ? 'missing' : n === -2 ? 'token' : n === -3 ? 'stale' : n;
    },
  };
}
