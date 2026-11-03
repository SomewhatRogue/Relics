/**
 * Vercel Function: what a job owes its players (`/api/owed`), kept by the job's leader (api/_owed.ts).
 *   GET ?hero=H                       {owed: [{job, run}]}: every job still owing this hero
 *   POST {job, owed: {hero: run}}     the leader's word on each member's share (as it goes, and at the end)
 *   POST {hero, job, drop: 1}         paid: let it go
 * No accounts, as for the world: a hero's id is its key, and only sane runs get through (cleanRun).
 * A few small writes a minute while a party's on a job (each only when the pot changed), one read on load.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { HERO, JOB, MAX_MEMBERS, cleanRun, memoryOwedStore, redisOwedStore, type OwedStore } from './_owed.js';

let store: Promise<OwedStore> | null = null;
function redisUrl(): string | undefined {
  const named = process.env.REDIS_URL ?? process.env.KV_URL;
  if (named) return named;
  return Object.entries(process.env).find(([k, v]) => k.endsWith('URL') && /^rediss?:\/\//.test(v ?? ''))?.[1];
}
const getStore = () => {
  const url = redisUrl();
  return (store ??= (url ? redisOwedStore(url) : Promise.resolve(memoryOwedStore())).catch((e) => {
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
    if (raw.length > 48_000) throw new Error('too big');
  }
  return JSON.parse(raw || 'null');
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (req.method === 'GET') {
      const hero = url.searchParams.get('hero') ?? '';
      if (!HERO.test(hero)) return send(res, 400, { error: 'bad hero' });
      const owed = (await (await getStore()).list(hero)).map((o) => ({ job: o.job, run: JSON.parse(o.run) }));
      return send(res, 200, { owed });
    }
    if (req.method !== 'POST') return send(res, 405, { error: 'GET or POST' });
    let b: { job?: unknown; hero?: unknown; drop?: unknown; owed?: unknown } | null;
    try {
      b = (await body(req)) as typeof b;
    } catch {
      return send(res, 400, { error: 'not JSON, or too big' });
    }
    if (!b || typeof b.job !== 'string' || !JOB.test(b.job)) return send(res, 400, { error: 'bad job' });
    if (b.drop) {
      if (typeof b.hero !== 'string' || !HERO.test(b.hero)) return send(res, 400, { error: 'bad hero' });
      await (await getStore()).drop(b.hero, b.job);
      return send(res, 200, { ok: 1 });
    }
    const owed: Record<string, string> = {};
    for (const [hero, run] of Object.entries((b.owed ?? {}) as Record<string, unknown>).slice(0, MAX_MEMBERS)) {
      const r = cleanRun(run);
      if (HERO.test(hero) && r) owed[hero] = r;
    }
    if (!Object.keys(owed).length) return send(res, 400, { error: 'nothing owed' });
    await (await getStore()).write(b.job, owed);
    send(res, 200, { ok: 1 });
  } catch (e) {
    console.log(JSON.stringify({ owed: 1, ev: 'err', msg: String((e as Error)?.message ?? e) }));
    send(res, 503, { error: 'the keeper is out of reach' });
  }
}
