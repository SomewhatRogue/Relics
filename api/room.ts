/**
 * Vercel Function: the WebSocket every online player connects to (`/api/room`). Copied from Come Bye
 * (SomewhatRogue/Comearound, docs/ONLINE.md), where it was proven on real phones. The relay logic is
 * in _relay.ts; rooms are shared across instances through Redis from the Vercel Marketplace
 * (REDIS_URL, or Upstash's KV_URL). Without Redis it still runs, but only players who happen to
 * land on the same instance can meet, so the game warns that online play isn't set up.
 */
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { Relay, memoryBackend, redisBackend } from './_relay.js';

// Last line of defence: one failed promise must never take the instance (and its players) down.
process.on('unhandledRejection', (e) => console.log(JSON.stringify({ relay: 1, ev: 'unhandled', msg: String((e as Error)?.message ?? e) })));

const json = (res: http.ServerResponse, code: number, body: unknown) => {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};
/**
 * Plain GETs: `?meter=1` is Redis's meter (the month's commands so far against the plan's 500K, and
 * this instance's own count, _meter.ts), for the settings panel and for Kyle. Otherwise 426 (connect
 * with a WebSocket), or 503 with {full: true} once the month's budget is used up.
 */
const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.searchParams.has('meter'))
    return void getRelay().then((r) => r.meterView()).then((v) => json(res, 200, v), () => json(res, 503, { error: 'the relay is out of reach' }));
  if (current?.full) return json(res, 503, { full: true, error: "this month's online budget is used up" });
  res.writeHead(426, { 'Content-Type': 'text/plain' });
  res.end('Relic rooms: connect with a WebSocket.');
});
const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });

let relay: Promise<Relay> | null = null;
let current: Relay | null = null;
/**
 * The Redis connection URL: REDIS_URL or KV_URL as the Marketplace sets them, or any other variable
 * holding a redis:// or rediss:// URL (connecting storage with a custom prefix renames them, e.g.
 * STORAGE_URL).
 */
function redisUrl(): string | undefined {
  const named = process.env.REDIS_URL ?? process.env.KV_URL;
  if (named) return named;
  return Object.entries(process.env).find(([k, v]) => k.endsWith('URL') && /^rediss?:\/\//.test(v ?? ''))?.[1];
}

function getRelay(): Promise<Relay> {
  const url = redisUrl();
  return (relay ??= (url ? redisBackend(url) : Promise.resolve(memoryBackend())).then((b) => (current = new Relay(b))).catch((e) => {
    relay = null;
    throw e;
  }));
}

wss.on('connection', (ws, req) => {
  // A message over maxPayload (64 KiB) closes this socket with 1009 and emits 'error': unheard, that
  // error would throw and take the whole instance down with everyone on it (found by the big map's
  // load test, docs/DECISIONS.md 2026-11-03).
  ws.on('error', (e) => console.log(JSON.stringify({ relay: 1, ev: 'sockerr', msg: String(e?.message ?? e) })));
  getRelay()
    .then((r) => r.attach(ws, new URL(req.url ?? '/', 'http://localhost')))
    .catch(() => ws.close(1011));
});

export default server;
