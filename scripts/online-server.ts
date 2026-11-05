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
import { Relay, memoryBackend, redisBackend, type Backend } from '../api/_relay';
import owed from '../api/owed';
import world from '../api/world';
import save from '../api/save';

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
/** GET /__spend: from now on Redis refuses every command as Upstash does past its plan (the online tests). */
let spent = false;
const LIMIT = 'ERR max requests limit exceeded. Limit: 500000, Usage: 500000.';
const spendable = (b: Backend): Backend => {
  const w = <T extends object>(o: T): T => new Proxy(o, { get: (t, k) => async (...a: unknown[]) => { if (spent) throw new Error(LIMIT); return (t as any)[k](...a); } });
  return { ...b, store: w(b.store), bus: w(b.bus) };
};
const make = async () => {
  const b = process.env.REDIS_URL ? await redisBackend(process.env.REDIS_URL) : memoryBackend(bus);
  return clone(() => new Relay(spendable(b)));
};
const relays = Promise.all([make(), make()]);
let turn = 0;
/** PIN=1: each player always on the same instance, players taking turns (so two always split). */
const pins = new Map<string, number>();
const firsts = new Set<string>();
const pinned = (id: string) => pins.get(id) ?? (pins.set(id, pins.size % 2), pins.get(id)!);

const PORT = Number(process.env.PORT ?? 8790);
const DIST = join(process.cwd(), 'dist');
const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.wav': 'audio/wav' };

const http = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  // (Each instance finds out at its next command: here, a look at the meter.)
  if (url.pathname === '/__spend') return void ((spent = true), relays.then((r) => Promise.all(r.map((x) => x.meterView()))).then(() => res.end('spent')));
  // The month's meter, as /api/room?meter=1 answers on Vercel (one instance's view, and both instances' counts).
  if (url.pathname === '/api/room' && url.searchParams.has('meter'))
    return void relays.then(async (r) => {
      const view = await r[0].meterView();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ...view, both: r.map((x) => x.meter.by) }));
    });
  // What a job owes its players (api/owed.ts), as the Vercel function serves it.
  if (url.pathname === '/api/owed') return void owed(req, res);
  // The shared world and recovery saves too, when asked (API_ALL=1: the Redis budget harness, scripts/budget-online.cjs).
  if (process.env.API_ALL && url.pathname === '/api/world') return void world(req, res);
  if (process.env.API_ALL && url.pathname === '/api/save') return void save(req, res);
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
  // (`/api/room/i1`: a page pointed at one instance with `?relay=`, the budget harness. With HOP=1 only a
  // player's first connection to a room is held to it; any later one lands on either, as on Vercel.)
  const key = `${q.get('room')}:${q.get('id')}`, again = firsts.has(key);
  firsts.add(key);
  const at = process.env.HOP && again ? String(turn++ % 2) : /^\/api\/room\/i(\d)/.exec(req.url ?? '')?.[1];
  const i = at !== undefined ? Number(at) % 2 : q.has('inst') ? Number(q.get('inst')) % 2 : process.env.PIN ? pinned(q.get('id') ?? '') : turn++ % 2;
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
