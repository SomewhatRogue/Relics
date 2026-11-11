/**
 * Vercel Function: the item ledger (`/api/ledger`, docs/design/trading.md, api/_ledger.ts).
 *   POST {mint: [[id, hero], ...]}      a room's host mints what landed in a hero's kit: each id goes to its
 *                                       hero only if it has no owner yet. {owners: [...]}, the owner each has
 *   POST {check: {hero: [id, ...]}}     a save on load: {gone: {hero: [id, ...]}}, what the ledger gives to
 *                                       another hero (an id it has never seen is taken by the hero holding it)
 * No accounts, as for the world and the saves: a hero's id is its key. This keeps a piece from being in two
 * places; it can't stop a save edited by hand. A few commands per mint, one read per load.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { HERO_ID, LEDGER_ID, LEDGER_MAX } from '../src/shared/ledger.js';
import { checkHeld, memoryLedgerStore, redisLedgerStore, type LedgerStore } from './_ledger.js';

let store: Promise<LedgerStore> | null = null;
function redisUrl(): string | undefined {
  const named = process.env.REDIS_URL ?? process.env.KV_URL;
  if (named) return named;
  return Object.entries(process.env).find(([k, v]) => k.endsWith('URL') && /^rediss?:\/\//.test(v ?? ''))?.[1];
}
const getStore = () => {
  const url = redisUrl();
  return (store ??= (url ? redisLedgerStore(url) : Promise.resolve(memoryLedgerStore())).catch((e) => {
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
    if (raw.length > 24_000) throw new Error('too big');
  }
  return JSON.parse(raw || 'null');
}

/** A mint as sent: pairs of a sound id and a hero, at most LEDGER_MAX. Null if any is off. */
export function cleanMint(raw: unknown): [string, string][] | null {
  if (!Array.isArray(raw) || !raw.length || raw.length > LEDGER_MAX) return null;
  const out: [string, string][] = [];
  for (const p of raw) {
    if (!Array.isArray(p) || typeof p[0] !== 'string' || typeof p[1] !== 'string' || !LEDGER_ID.test(p[0]) || !HERO_ID.test(p[1])) return null;
    out.push([p[0], p[1]]);
  }
  return out;
}

/** A check as sent: heroes to their ids, LEDGER_MAX ids in all. Null if any is off. */
export function cleanCheck(raw: unknown): Record<string, string[]> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out: Record<string, string[]> = {};
  let n = 0;
  for (const [hero, ids] of Object.entries(raw as Record<string, unknown>)) {
    if (!HERO_ID.test(hero) || !Array.isArray(ids) || !ids.every((id) => typeof id === 'string' && LEDGER_ID.test(id))) return null;
    if ((n += ids.length) > LEDGER_MAX) return null;
    out[hero] = ids as string[];
  }
  return n ? out : null;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    if (req.method !== 'POST') return send(res, 405, { error: 'POST' });
    let b: { mint?: unknown; check?: unknown } | null;
    try {
      b = (await body(req)) as typeof b;
    } catch {
      return send(res, 400, { error: 'not JSON, or too big' });
    }
    if (b?.mint !== undefined) {
      const pairs = cleanMint(b.mint);
      if (!pairs) return send(res, 400, { error: 'bad mint' });
      return send(res, 200, { owners: await (await getStore()).claim(pairs) });
    }
    const held = cleanCheck(b?.check);
    if (!held) return send(res, 400, { error: 'bad check' });
    send(res, 200, { gone: await checkHeld(await getStore(), held) });
  } catch (e) {
    console.log(JSON.stringify({ ledger: 1, ev: 'err', msg: String((e as Error)?.message ?? e) }));
    send(res, 503, { error: 'the keeper is out of reach' });
  }
}
