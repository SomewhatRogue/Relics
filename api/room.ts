/**
 * Vercel Function: the WebSocket every online player connects to (`/api/room`). Copied from Come Bye
 * (SomewhatRogue/Comearound), where it was proven on real phones. The relay logic is in _relay.ts;
 * rooms are shared across instances through Redis from the Vercel Marketplace (REDIS_URL, or
 * Upstash's KV_URL). Without Redis it still runs, but only players who land on the same instance meet.
 */
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { Relay, memoryBackend, redisBackend } from './_relay.js';

const server = http.createServer((_req, res) => {
  res.writeHead(426, { 'Content-Type': 'text/plain' });
  res.end('Relic rooms: connect with a WebSocket.');
});
const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });

let relay: Promise<Relay> | null = null;
/** REDIS_URL or KV_URL as the Marketplace sets them, or any variable holding a redis:// URL. */
function redisUrl(): string | undefined {
  const named = process.env.REDIS_URL ?? process.env.KV_URL;
  if (named) return named;
  return Object.entries(process.env).find(([k, v]) => k.endsWith('URL') && /^rediss?:\/\//.test(v ?? ''))?.[1];
}

function getRelay(): Promise<Relay> {
  const url = redisUrl();
  return (relay ??= (url ? redisBackend(url) : Promise.resolve(memoryBackend())).then((b) => new Relay(b)).catch((e) => {
    relay = null;
    throw e;
  }));
}

wss.on('connection', (ws, req) => {
  getRelay()
    .then((r) => r.attach(ws, new URL(req.url ?? '/', 'http://localhost')))
    .catch(() => ws.close(1011));
});

export default server;
