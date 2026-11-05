/** What the relay tests share: an instance of the relay on a port, and a player's socket to it. */
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import WebSocket, { WebSocketServer } from 'ws';
import { Relay, type Backend } from '../api/_relay';

type Msg = { t: string; role?: string; host?: string; id?: string; from?: string; d?: unknown };
export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function instance(backend: Backend, staleMs = 600): Promise<{ port: number; close: () => void; relay: Relay }> {
  const relay = new Relay(backend, { staleMs });
  const server = http.createServer();
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws, req) => void relay.attach(ws, new URL(req.url ?? '/', 'http://x')));
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  return { port: (server.address() as AddressInfo).port, relay, close: () => (wss.clients.forEach((c) => c.terminate()), server.close()) };
}

/** A player's socket. Like the game, it says something as soon as it's told it hosts (unless `silent`: a crashed page). */
export function player(port: number, room: string, id: string, want: 'host' | 'take' | 'join' | 'peer', silent = false) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/api/room?room=${room}&id=${id}&want=${want}`);
  const msgs: Msg[] = [];
  ws.on('message', (d) => {
    const m = JSON.parse(String(d)) as Msg;
    msgs.push(m);
    if (!silent && m.t === 'role' && m.role === 'host') ws.send('{"ping":1}');
  });
  const until = async (pred: (m: Msg) => boolean, ms = 4000): Promise<Msg> => {
    const end = Date.now() + ms;
    for (;;) {
      const m = msgs.find(pred);
      if (m) return m;
      if (Date.now() > end) throw new Error(`${id} never got it; had ${JSON.stringify(msgs)}`);
      await wait(15);
    }
  };
  return { ws, msgs, until, send: (to: string, d: unknown) => ws.send(JSON.stringify({ to, d })), close: () => ws.close() };
}

export const code = () => `R${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
