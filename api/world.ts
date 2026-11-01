/**
 * Vercel Function: the shared world (`/api/world`). GET ?g=CODE: the world and its Roll of the Brave.
 * POST {g, c}: a hero's contribution (a finished run, a gift, a vote); answers with the world after it.
 * Plain HTTP, a few requests per run; Redis as for the relay (REDIS_URL or KV_URL), memory without it.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { clean, groupOf, memoryWorldStore, redisWorldStore, type WorldStore } from './_world.js';

process.on('unhandledRejection', (e) => console.log(JSON.stringify({ world: 1, ev: 'unhandled', msg: String((e as Error)?.message ?? e) })));

let store: Promise<WorldStore> | null = null;
function redisUrl(): string | undefined {
  const named = process.env.REDIS_URL ?? process.env.KV_URL;
  if (named) return named;
  return Object.entries(process.env).find(([k, v]) => k.endsWith('URL') && /^rediss?:\/\//.test(v ?? ''))?.[1];
}
const getStore = () => {
  const url = redisUrl();
  return (store ??= (url ? redisWorldStore(url) : Promise.resolve(memoryWorldStore())).catch((e) => {
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
    if (raw.length > 8192) throw new Error('too big');
  }
  return JSON.parse(raw || 'null');
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost'), s = await getStore();
    if (req.method === 'GET') return send(res, 200, await s.load(groupOf(url.searchParams.get('g'))));
    if (req.method === 'POST') {
      const b = (await body(req)) as { g?: unknown; c?: unknown } | null, c = clean(b?.c);
      if (!c) return send(res, 400, { error: 'bad contribution' });
      return send(res, 200, await s.apply(groupOf(b?.g), c));
    }
    send(res, 405, { error: 'GET or POST' });
  } catch (e) {
    console.log(JSON.stringify({ world: 1, ev: 'err', msg: String((e as Error)?.message ?? e) }));
    send(res, 503, { error: 'the world is out of reach' });
  }
}
