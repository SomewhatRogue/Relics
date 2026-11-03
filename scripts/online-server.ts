/**
 * Local stand-in for the Vercel site: serves the built client from dist/ and runs the room relay
 * (api/_relay.ts) as TWO instances that share rooms the way Vercel's do, through Redis if REDIS_URL
 * is set, else a shared in-memory bus. New connections alternate between them, so local tests cover
 * players landing on different instances. (Come Bye's src/server/node-dev.ts, cut down.)
 * Usage: npx tsx scripts/online-server.ts   (PORT, default 8790)
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { WebSocketServer } from 'ws';
import { Relay, memoryBackend, redisBackend } from '../api/_relay';
import owed from '../api/owed';

const bus = { kv: new Map(), subs: new Map() };
/**
 * Vercel starts instances from one snapshot, so each one's Math.random runs the same numbers (seen
 * live: two instances both named "evqgzyea"). Both relays here are made with the same seeded
 * Math.random, so nothing may hang on it being different.
 */
function clone<T>(make: () => T): T {
  const real = Math.random;
  let seed = 7;
  Math.random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  try {
    return make();
  } finally {
    Math.random = real;
  }
}
const make = async () => {
  const b = process.env.REDIS_URL ? await redisBackend(process.env.REDIS_URL) : memoryBackend(bus);
  return clone(() => new Relay(b));
};
const relays = Promise.all([make(), make()]);
let turn = 0;

const PORT = Number(process.env.PORT ?? 8790);
const DIST = join(process.cwd(), 'dist');
const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.wav': 'audio/wav' };

const http = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  // What a job owes its players (api/owed.ts), as the Vercel function serves it.
  if (url.pathname === '/api/owed') return void owed(req, res);
  let file = normalize(join(DIST, url.pathname));
  if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
new WebSocketServer({ server: http }).on('connection', (ws, req) => {
  if (!(req.url ?? '').startsWith('/api/room')) return ws.close();
  // Test hooks (the stress harness): `inst=0|1` picks the instance, `hold=ms` holds the connection that
  // long before the relay sees it (a slow request, so a friend's socket can get there first).
  const q = new URL(req.url ?? '/', 'http://localhost').searchParams;
  const i = q.has('inst') ? Number(q.get('inst')) % 2 : turn++ % 2;
  const hold = Number(q.get('hold')) || 0;
  // LAG_MS: every message to a player arrives this much later (the whole trip there and back, as on a phone).
  const lag = Number(process.env.LAG_MS) || 0;
  if (lag) {
    const send = ws.send.bind(ws);
    ws.send = ((d: string) => void setTimeout(() => ws.readyState === 1 && send(d), lag)) as typeof ws.send;
  }
  void relays.then((r) => setTimeout(() => ws.readyState === 1 && r[i].attach(ws, new URL(req.url ?? '/', 'http://localhost')), hold));
});
http.listen(PORT, () => console.log(`Relic online dev server on http://localhost:${PORT}`));
