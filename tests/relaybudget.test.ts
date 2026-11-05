/**
 * Redis's budget (docs/DECISIONS.md 2026-11-04): what crosses to another instance goes in batches
 * (in order, nothing lost, never over the size limit), a host's liveness is written far less often
 * but a live host still isn't taken for gone (and a dead one still is), the relay says so plainly
 * when the month's commands are used up, and the meter counts every command, its own included.
 */
import WebSocket from 'ws';
import { describe, expect, it } from 'vitest';
import { memoryBackend, type Backend } from '../api/_relay';
import { Outbox, batchOf, unbatch } from '../api/_outbox';
import { Meter, metered, monthKey } from '../api/_meter';
import { code, instance, player, wait } from './relaykit';

/** Two instances on one memory bus, each counting its PUBLISHes and the largest. */
async function pair() {
  const pool = { kv: new Map(), subs: new Map() };
  const n = [{ v: 0, big: 0 }, { v: 0, big: 0 }];
  const make = (i: number): Backend => {
    const b = memoryBackend(pool);
    return { ...b, bus: { ...b.bus, publish: async (ch, m) => (n[i].v++, (n[i].big = Math.max(n[i].big, m.length)), b.bus.publish(ch, m)) } };
  };
  const [A, B] = await Promise.all([instance(make(0)), instance(make(1))]);
  return { A, B, n, pool, close: () => (A.close(), B.close()) };
}
const nums = (p: ReturnType<typeof player>, from: string, k = 's') =>
  p.msgs.filter((m) => m.t === 'msg' && m.from === from && typeof (m.d as Record<string, unknown>)?.[k] === 'number').map((m) => (m.d as Record<string, number>)[k]);

describe('the outbox', () => {
  it('sends the first at once, then one batch a slot, in order, nothing lost, never over the limit', async () => {
    const got: string[] = [];
    const box = new Outbox(() => 'o1', async (_room, text) => void got.push(text), { ms: 50, max: 400 });
    await box.push('R', '{"n":0}');
    expect(got).toHaveLength(1);
    for (let i = 1; i <= 40; i++) await Promise.race([box.push('R', JSON.stringify({ n: i, pad: 'x'.repeat(i % 3 ? 10 : 90) })), wait(1)]);
    await wait(120);
    const all = got.flatMap((t) => unbatch(t)) as { n: number }[];
    expect(all.map((e) => e.n)).toEqual([...Array(41).keys()]);
    expect(Math.max(...got.map((t) => t.length))).toBeLessThanOrEqual(400 + 30);
    // 40 messages within a slot or two: a handful of batches (split only by the size limit).
    expect(got.length).toBeLessThan(15);
  });

  it('an urgent message takes what waits with it, at once', async () => {
    const got: string[] = [];
    const box = new Outbox(() => 'o1', async (_r, text) => void got.push(text), { ms: 1000, max: 10_000 });
    void box.push('R', '{"n":0}');
    void box.push('R', '{"n":1}');
    void box.push('R', '{"n":2}');
    expect(got).toHaveLength(1);
    await box.push('R', '{"n":3}', true);
    expect(got).toHaveLength(2);
    expect(unbatch(got[1]).map((e) => (e as { n: number }).n)).toEqual([1, 2, 3]);
    expect(unbatch(batchOf('o1', ['{"n":9}']))).toEqual([{ n: 9 }]);
    box.drop('R');
  });
});

describe('the relay in batches', { timeout: 15000 }, () => {
  it("a friend on the other instance gets every message, in order, in a tenth as many PUBLISHes", async () => {
    const { A, B, n, close } = await pair();
    const room = code();
    const lead = player(A.port, room, 'lead-0401', 'host');
    await lead.until((m) => m.role === 'host');
    const sam = player(B.port, room, 'sam-00401', 'join');
    await sam.until((m) => m.role === 'guest');
    sam.send('lead-0401', { t: 'hello' });
    await lead.until((m) => m.t === 'msg' && m.from === 'sam-00401');
    await wait(600);
    const before = n[0].v + n[1].v;
    // Two seconds of play: the leader's patches every 10 ms, Sam's input every 20 ms.
    for (let i = 0; i < 200; i++) {
      lead.send('*', { s: i });
      if (i % 2 === 0) sam.send('lead-0401', { i: i / 2 });
      await wait(10);
    }
    await wait(300);
    expect(nums(sam, 'lead-0401')).toEqual([...Array(200).keys()]);
    expect(nums(lead, 'sam-00401', 'i')).toEqual([...Array(100).keys()]);
    // 300 messages over the bus: about one PUBLISH a tenth of a second for each instance.
    const pubs = n[0].v + n[1].v - before;
    expect(pubs).toBeLessThan(80);
    // Big messages: every one through, in order, and no batch past the limit.
    for (let i = 0; i < 12; i++) lead.send('*', { s: 1000 + i, pad: 'p'.repeat(40_000) });
    await wait(500);
    expect(nums(sam, 'lead-0401').slice(200)).toEqual([...Array(12).keys()].map((i) => 1000 + i));
    expect(n[0].big).toBeLessThan(192_000 + 70_000);
    [lead, sam].forEach((p) => p.close());
    close();
  });

  it('an urgent message (a button pressed) goes at once, not in the next batch', async () => {
    const { A, B, close } = await pair();
    const room = code();
    const lead = player(A.port, room, 'lead-0402', 'host');
    await lead.until((m) => m.role === 'host');
    const sam = player(B.port, room, 'sam-00402', 'join');
    await sam.until((m) => m.role === 'guest');
    await wait(600);
    sam.send('lead-0402', { warm: 1 });
    const t0 = Date.now();
    sam.ws.send(JSON.stringify({ to: 'lead-0402', d: { press: 1 }, u: 1 }));
    await lead.until((m) => m.t === 'msg' && (m.d as { press?: number })?.press === 1);
    expect(Date.now() - t0).toBeLessThan(60);
    [lead, sam].forEach((p) => p.close());
    close();
  });
});

describe('a friend far from the leader', { timeout: 15000 }, () => {
  it("is told the leader is on another instance (so it can connect again), and one beside the leader isn't", async () => {
    const { A, B, close } = await pair();
    const room = code();
    const lead = player(A.port, room, 'lead-0406', 'host');
    await lead.until((m) => m.role === 'host');
    const near = player(A.port, room, 'ava-00406', 'join'), far = player(B.port, room, 'sam-00406', 'join');
    const [n, f] = await Promise.all([near.until((m) => m.role === 'guest'), far.until((m) => m.role === 'guest')]);
    expect((n as { far?: number }).far).toBeUndefined();
    expect((f as { far?: number }).far).toBe(1);
    // A friend in before the leader hears 'hosted' from the other instance, also marked far.
    const room2 = code();
    const early = player(B.port, room2, 'bo-000406', 'join');
    await early.until((m) => m.t === 'nohost');
    const lead2 = player(A.port, room2, 'lead-1406', 'host');
    await lead2.until((m) => m.role === 'host');
    expect(((await early.until((m) => m.t === 'hosted')) as { far?: number }).far).toBe(1);
    [lead, near, far, early, lead2].forEach((p) => p.close());
    close();
  });
});

describe('a friend who hops over to the leader', { timeout: 15000 }, () => {
  it("leaves the leader's instance publishing nothing (not for the 40 s a PUBLISH count would keep it)", async () => {
    const { A, B, n, close } = await pair();
    const room = code();
    const lead = player(A.port, room, 'lead-0407', 'host');
    await lead.until((m) => m.role === 'host');
    const far = player(B.port, room, 'sam-00407', 'join');
    await far.until((m) => m.role === 'guest');
    // Played split a moment: A's PUBLISHes are heard by B too.
    for (let i = 0; i < 10; i++) (lead.send('*', { s: i }), far.send('lead-0407', { i }), await wait(30));
    // Sam lands beside the leader, and his old socket closes.
    const near = player(A.port, room, 'sam-00407', 'join');
    await near.until((m) => m.role === 'guest');
    far.close();
    await wait(300);
    const before = n[0].v;
    for (let i = 10; i < 40; i++) (lead.send('*', { s: i }), near.send('lead-0407', { i }), await wait(30));
    expect(n[0].v - before).toBeLessThanOrEqual(1);
    expect(nums(near, 'lead-0407').slice(-5)).toEqual([35, 36, 37, 38, 39]);
    [lead, near].forEach((p) => p.close());
    close();
  });
});

describe('the slower touch', { timeout: 15000 }, () => {
  it("a host saying only its heartbeat isn't taken for gone, in far fewer writes; a dead one still is", async () => {
    const pool = { kv: new Map(), subs: new Map() };
    const sets = { v: 0 };
    const counted = (): Backend => {
      const b = memoryBackend(pool);
      return { ...b, store: { ...b.store, set: (k, v, t) => (k.startsWith('rl:seen:') && sets.v++, b.store.set(k, v, t)) } };
    };
    const A = await instance(counted(), 600), B = await instance(counted(), 600);
    const room = code();
    const host = player(A.port, room, 'host-0403', 'host');
    await host.until((m) => m.role === 'host');
    // Busy (a message every 20 ms, 2 s): the old touch wrote every 150 ms of a 600 ms stale time.
    sets.v = 0;
    for (let i = 0; i < 100; i++) (host.send('*', { s: i }), await wait(20));
    expect(sets.v).toBeLessThanOrEqual(Math.ceil(2000 / (600 * 7 / 16)) + 1);
    // Only heartbeats (every half the stale time, as the game's 4 s are of 8): never stale.
    for (let i = 0; i < 6; i++) (host.ws.send('{"ping":1}'), await wait(300));
    const ana = player(B.port, room, 'ana-00403', 'take');
    await ana.until((m) => m.role === 'guest' || m.role === 'host');
    expect(ana.msgs.some((m) => m.role === 'guest' && m.host === 'host-0403')).toBe(true);
    ana.close();
    // The host's page freezes (its socket open, silent): past the stale time, a friend takes it.
    await wait(900);
    const bo = player(B.port, room, 'bo-000403', 'take');
    await bo.until((m) => m.role === 'host');
    [host, bo].forEach((p) => p.close());
    A.close();
    B.close();
  });
});

describe('when the month is used up', { timeout: 15000 }, () => {
  const LIMIT = 'ERR max requests limit exceeded. Limit: 500000, Usage: 500000.';
  it('a player is told plainly (full, then closed with 4429), and Redis is not tried again', async () => {
    const base = memoryBackend();
    let calls = 0;
    const spent: Backend = { ...base, store: new Proxy(base.store, { get: () => async () => (calls++, Promise.reject(new Error(LIMIT))) }) };
    const inst = await instance(spent);
    const room = code();
    const ws = new WebSocket(`ws://127.0.0.1:${inst.port}/api/room?room=${room}&id=kyle-0404&want=peer`);
    const got: string[] = [];
    ws.on('message', (d) => got.push(String(d)));
    const closed = await new Promise<number>((r) => ws.on('close', (c) => r(c)));
    expect(closed).toBe(4429);
    expect(got).toContain('{"t":"full"}');
    expect(inst.relay.full).toBe(true);
    const tried = calls;
    const again = new WebSocket(`ws://127.0.0.1:${inst.port}/api/room?room=${room}&id=sam-00404&want=join`);
    expect(await new Promise<number>((r) => again.on('close', (c) => r(c)))).toBe(4429);
    expect(calls).toBe(tried);
    expect((await inst.relay.meterView()).full).toBe(true);
    inst.close();
  });

  it('players already in a room are told the moment Redis refuses, and the instance stays up', async () => {
    const base = memoryBackend();
    let spent = false;
    const b: Backend = { ...base, store: new Proxy(base.store, { get: (t, k) => async (...a: unknown[]) => { if (spent) throw new Error(LIMIT); return (t as any)[k](...a); } }) };
    const inst = await instance(b);
    const room = code();
    const host = player(inst.port, room, 'host-0405', 'host');
    await host.until((m) => m.role === 'host');
    const g = player(inst.port, room, 'guest-0405', 'join');
    await g.until((m) => m.role === 'guest');
    spent = true;
    await wait(400);
    host.ws.send('{"ping":1}');
    await host.until((m) => m.t === 'full');
    await g.until((m) => m.t === 'full');
    inst.close();
  });
});

describe('the meter', () => {
  it('counts every command by kind, and adds to the month at most once a minute, the INCRBY counted', async () => {
    const m = new Meter();
    const b = metered(memoryBackend(), m);
    await b.store.set('a', '1', 10);
    await b.store.get('a');
    await b.store.setNx('b', '1', 10);
    await b.bus.publish('c', 'x');
    expect(m.by).toEqual({ set: 2, get: 2, publish: 1 });
    expect(m.total).toBe(5);
    // Into the month's key: only once 200 have built up (or 15 minutes have passed).
    const kv = memoryBackend().store, sink = { incrBy: kv.incrBy, expire: kv.expire };
    const n = new Meter(sink);
    n.add('publish', 150);
    await n.tick();
    expect(Number(await kv.get(monthKey()))).toBe(0);
    n.add('publish', 60);
    await n.tick();
    // 210 counted, and the INCRBY itself; the month's first also sets its keeping (counted next time).
    expect(Number(await kv.get(monthKey()))).toBe(211);
    expect(n.pending).toBe(1);
    await n.tick(Date.now() + 16 * 60_000);
    expect(Number(await kv.get(monthKey()))).toBe(213);
    // The meter's own share: 3 of 213 here; at most 1 in 201 in steady use.
    expect((n.by.incrby + n.by.expire) / n.total).toBeLessThan(0.02);
  });
});
