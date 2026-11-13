/**
 * Vercel Function: hero names, one hero each (`/api/names`, shared/names.ts, api/_names.ts).
 *   POST {free: [name, ...]}    which of these nobody has: {free: [true | false, ...]} (NAMES_ASK at most)
 *   POST {claim: name, hero}    a new hero takes the name: {ok: true}, or {ok: false} if another has it
 *   POST {release: name, hero}  a retired hero gives it up: {ok: true}
 * No accounts, as for the saves and the ledger: a hero's id is its key.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { HERO_ID } from '../src/shared/ledger.js';
import { NAMES_ASK, NAME_OK, normName } from '../src/shared/names.js';
import { memoryNameStore, redisNameStore, type NameStore } from './_names.js';

let store: Promise<NameStore> | null = null;
function redisUrl(): string | undefined {
  const named = process.env.REDIS_URL ?? process.env.KV_URL;
  if (named) return named;
  return Object.entries(process.env).find(([k, v]) => k.endsWith('URL') && /^rediss?:\/\//.test(v ?? ''))?.[1];
}
const getStore = () => {
  const url = redisUrl();
  return (store ??= (url ? redisNameStore(url) : Promise.resolve(memoryNameStore())).catch((e) => {
    store = null;
    throw e;
  }));
};

function send(res: ServerResponse, code: number, body: unknown): void {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function body(req: IncomingMessage): Promise<unknown> {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 4_000) throw new Error('too big');
  }
  return JSON.parse(raw || 'null');
}

/** A name as sent, kept form, or null if it isn't one. */
export const cleanName = (raw: unknown): string | null => (typeof raw === 'string' && NAME_OK.test(normName(raw)) ? normName(raw) : null);

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    if (req.method !== 'POST') return send(res, 405, { error: 'POST' });
    let b: { free?: unknown; claim?: unknown; release?: unknown; hero?: unknown } | null;
    try {
      b = (await body(req)) as typeof b;
    } catch {
      return send(res, 400, { error: 'not JSON, or too big' });
    }
    const s = await getStore();
    if (b?.free !== undefined) {
      if (!Array.isArray(b.free) || !b.free.length || b.free.length > NAMES_ASK) return send(res, 400, { error: 'free: 1 to ' + NAMES_ASK + ' names' });
      const names = b.free.map(cleanName);
      const ok = names.every((n): n is string => n !== null) ? await s.free(names as string[]) : null;
      return ok ? send(res, 200, { free: ok }) : send(res, 400, { error: 'a name is not a name' });
    }
    const hero = typeof b?.hero === 'string' && HERO_ID.test(b.hero) ? b.hero : null;
    if (!hero) return send(res, 400, { error: 'hero' });
    if (b?.claim !== undefined) {
      const n = cleanName(b.claim);
      return n ? send(res, 200, { ok: await s.claim(n, hero) }) : send(res, 400, { error: 'not a name' });
    }
    if (b?.release !== undefined) {
      const n = cleanName(b.release);
      if (n) await s.release(n, hero);
      return send(res, 200, { ok: true });
    }
    return send(res, 400, { error: 'free, claim or release' });
  } catch (e) {
    console.log(JSON.stringify({ names: 1, ev: 'fail', msg: String((e as Error)?.message ?? e) }));
    return send(res, 503, { error: 'names unavailable' });
  }
}
