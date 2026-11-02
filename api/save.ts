/**
 * Vercel Function: saves kept under recovery codes (`/api/save`), so a hero can be brought to another
 * phone or computer. No accounts: the code is the key.
 *   GET ?code=kiln-fern-47        the save, when it was saved, and the token to write it from now on
 *   POST {save}                   a new code for this save: {code, token, savedAt}
 *   POST {code, token, base, save} write over it: {savedAt}; 403 wrong token, 409 a newer copy came in
 *                                 since `base` (another device), a missing code is made again
 * Redis as for the world (REDIS_URL or KV_URL), memory without it. Bodies over 256 KB are turned away.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomBytes, randomInt } from 'node:crypto';
import { codeFrom, keyOf, parseCode } from '../src/shared/recovery.js';
import { cleanSave, memorySaveStore, redisSaveStore, type SaveStore } from './_save.js';

export const MAX_BODY = 256 * 1024;

let store: Promise<SaveStore> | null = null;
function redisUrl(): string | undefined {
  const named = process.env.REDIS_URL ?? process.env.KV_URL;
  if (named) return named;
  return Object.entries(process.env).find(([k, v]) => k.endsWith('URL') && /^rediss?:\/\//.test(v ?? ''))?.[1];
}
const getStore = () => {
  const url = redisUrl();
  return (store ??= (url ? redisSaveStore(url) : Promise.resolve(memorySaveStore())).catch((e) => {
    store = null;
    throw e;
  }));
};

function send(res: ServerResponse, code: number, body: unknown): void {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

class TooBig extends Error {}
async function body(req: IncomingMessage): Promise<unknown> {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) throw new TooBig();
  }
  return JSON.parse(raw || 'null');
}

const token = () => randomBytes(18).toString('base64url');
/** The server's clock caps a save's time, so a device whose clock runs fast can't stay "newest". */
const capped = (at: number) => Math.min(at || Date.now(), Date.now());

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (req.method === 'GET') {
      const c = parseCode(url.searchParams.get('code'));
      const k = c && (await (await getStore()).pull(keyOf(c)));
      if (!c || !k) return send(res, 404, { error: 'no such code' });
      return send(res, 200, { code: keyOf(c), save: JSON.parse(k.save), token: k.token, savedAt: k.at });
    }
    if (req.method !== 'POST') return send(res, 405, { error: 'GET or POST' });
    let b: { code?: unknown; token?: unknown; base?: unknown; save?: unknown } | null;
    try {
      b = (await body(req)) as typeof b;
    } catch (e) {
      if (e instanceof TooBig) return send(res, 413, { error: 'too big' });
      return send(res, 400, { error: 'not JSON' });
    }
    const save = cleanSave(b?.save);
    if (!save) return send(res, 400, { error: 'bad save' });
    const s = await getStore(), at = capped(save.at);
    if (b?.code === undefined) {
      const t = token();
      for (let tries = 0; tries < 8; tries++) {
        const code = keyOf(codeFrom((k) => randomInt(k)));
        if (await s.make(code, { save: save.json, token: t, at })) return send(res, 200, { code, token: t, savedAt: at });
      }
      return send(res, 503, { error: 'no free code' });
    }
    const c = parseCode(b.code);
    if (!c || typeof b.token !== 'string' || b.token.length < 16 || b.token.length > 64 || typeof b.base !== 'number') return send(res, 400, { error: 'bad push' });
    const code = keyOf(c), got = await s.push(code, b.token, b.base, save.json, at);
    if (got === 'token') return send(res, 403, { error: 'not your code' });
    if (got === 'stale') return send(res, 409, { error: 'a newer copy is kept' });
    // Gone (a year unused, or the store was emptied): the device that still has it makes it again.
    if (got === 'missing') {
      if (await s.make(code, { save: save.json, token: b.token, at })) return send(res, 200, { savedAt: at });
      return send(res, 409, { error: 'a newer copy is kept' });
    }
    send(res, 200, { savedAt: got });
  } catch (e) {
    console.log(JSON.stringify({ save: 1, ev: 'err', msg: String((e as Error)?.message ?? e) }));
    send(res, 503, { error: 'the keeper is out of reach' });
  }
}
