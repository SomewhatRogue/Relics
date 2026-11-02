/**
 * The relay between instances when the bus can't be taken at its word: instances whose Math.random
 * runs alike (Vercel starts them from one snapshot; seen live as two instances both "evqgzyea", each
 * dropping the other's messages as its own echo), and a PUBLISH count that leaves out listeners
 * elsewhere. Players should hear each other all the same, and Redis still be spared.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { memoryBackend, type Backend } from '../api/_relay';
import { ANSWER_MS } from '../api/_presence';
import { code, instance, player, wait } from './relaykit';

/** Two instances on one shared memory bus; `lie`: PUBLISH's count says only the sender heard it. */
async function pair(lie = false) {
  const pool = { kv: new Map(), subs: new Map() };
  const n = [{ v: 0 }, { v: 0 }];
  const make = (i: number): Backend => {
    const b = memoryBackend(pool);
    return { ...b, bus: { ...b.bus, publish: async (ch, m) => (n[i].v++, lie ? (await b.bus.publish(ch, m), 1) : b.bus.publish(ch, m)) } };
  };
  const [A, B] = await Promise.all([instance(make(0)), instance(make(1))]);
  return { A, B, n, close: () => (A.close(), B.close()) };
}
const said = (p: ReturnType<typeof player>, from: string) => p.msgs.filter((m) => m.t === 'msg' && m.from === from);

afterEach(() => vi.restoreAllMocks());

describe('the relay between instances', { timeout: 15000 }, () => {
  it("instances that drew the same Math.random still hear each other, a friend there before the leader's claim", async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.4242);
    const { A, B, close } = await pair();
    const room = 'PSAME' + Date.now().toString(36).slice(-4).toUpperCase();
    // Kyle's socket gets there first, on A; the leader claims on B a moment later; Ana joins on B.
    const kyle = player(A.port, room, 'kyle-0201', 'join');
    await kyle.until((m) => m.t === 'nohost');
    const lead = player(B.port, room, 'lead-0201', 'host');
    await lead.until((m) => m.role === 'host');
    const ana = player(B.port, room, 'ana-00201', 'join');
    await ana.until((m) => m.role === 'guest');
    await kyle.until((m) => m.t === 'hosted' && m.id === 'lead-0201');
    kyle.send('lead-0201', { t: 'hello' });
    await lead.until((m) => m.t === 'msg' && m.from === 'kyle-0201');
    // A while of play: the leader's patches reach both, Kyle's input reaches the leader.
    for (let i = 0; i < 40; i++) {
      lead.send('*', { s: i });
      if (i % 4 === 0) kyle.send('lead-0201', { t: 'in', i });
      await wait(30);
    }
    await wait(200);
    expect(said(kyle, 'lead-0201').length).toBe(40);
    expect(said(ana, 'lead-0201').length).toBe(40);
    expect(said(lead, 'kyle-0201').length).toBe(11);
    [kyle, lead, ana].forEach((p) => p.close());
    close();
  });

  it("a PUBLISH count that leaves out the other instance doesn't keep a quiet friend from the leader's room", async () => {
    const { A, B, n, close } = await pair(true);
    const room = code();
    const lead = player(A.port, room, 'lead-0202', 'host');
    await lead.until((m) => m.role === 'host');
    // Long enough alone that the leader's instance has settled into keeping its messages home.
    for (let i = 0; i < 4; i++) (lead.send('*', { warm: i }), await wait(200));
    // A friend on B who only listens (says nothing at all).
    const sam = player(B.port, room, 'sam-00202', 'join');
    await sam.until((m) => m.role === 'guest');
    await wait(50);
    for (let i = 0; i < 45; i++) (lead.send('*', { s: i }), await wait(30));
    await wait(200);
    expect(said(sam, 'lead-0202').filter((m) => typeof (m.d as { s?: number }).s === 'number').length).toBe(45);
    // When Sam goes, A stops sending to the bus (B says it's away).
    sam.close();
    await wait(300);
    const before = n[0].v;
    for (let i = 0; i < 45; i++) (lead.send('*', { s: i }), await wait(20));
    expect(n[0].v - before).toBeLessThanOrEqual(1);
    lead.close();
    close();
  });

  it('a room just opened sends everything only while the others answer', async () => {
    const { A, n, close } = await pair();
    const room = code();
    const lead = player(A.port, room, 'lead-0203', 'host');
    await lead.until((m) => m.role === 'host');
    await wait(ANSWER_MS + 100);
    const before = n[0].v;
    for (let i = 0; i < 30; i++) (lead.send('*', { s: i }), await wait(30));
    expect(n[0].v - before).toBe(0);
    lead.close();
    close();
  });
});
