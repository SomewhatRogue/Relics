/**
 * The relay's subscriptions kept true (api/_subs.ts, docs/DECISIONS.md 2026-11-05): on the Florida
 * night the leader's instance asked Redis to SUBSCRIBE to the job's room on a connection gone half-open,
 * waited forever, and kept every message home after (20 published, 11,216 kept); Kyle, on another
 * instance, heard nothing and rejoined in a storm. Here: a SUBSCRIBE that's never answered, a connection
 * that's quietly stopped delivering, and a player leaving as another arrives with a slow UNSUBSCRIBE.
 */
import { describe, expect, it } from 'vitest';
import { memoryBackend, type Backend } from '../api/_relay';
import { code, instance, player, wait } from './relaykit';

type Pool = { kv: Map<string, { v: string; exp: number }>; subs: Map<string, Set<(m: string) => void>> };
const pool = (): Pool => ({ kv: new Map(), subs: new Map() });

/**
 * A subscriber connection gone half-open for `ch` rooms: a SUBSCRIBE is never answered (`hang`), or is
 * answered but nothing ever comes in (`mute`); a reset brings a working one.
 */
function halfOpen(b: Backend, how: 'hang' | 'mute'): Backend & { resets: () => number } {
  let dead = true, resets = 0;
  return {
    ...b,
    resets: () => resets,
    bus: {
      ...b.bus,
      subscribe: (ch, fn) => (!dead ? b.bus.subscribe(ch, fn) : how === 'hang' ? new Promise<void>(() => {}) : Promise.resolve()),
      reset: async () => {
        resets++;
        dead = false;
        await b.bus.reset();
      },
    },
  };
}
const said = (p: ReturnType<typeof player>, from: string) => p.msgs.filter((m) => m.t === 'msg' && m.from === from);

describe("the relay's subscriptions", { timeout: 20000 }, () => {
  it('a SUBSCRIBE never answered: the player still gets a role, the connection is reset, and the room hears the bus', async () => {
    const p = pool(), deaf = halfOpen(memoryBackend(p), 'hang');
    const [A, B] = await Promise.all([instance(memoryBackend(p)), instance(deaf)]);
    const room = code();
    // Kyle first on the leader's instance (his subscribe hangs), the leader with him, then Kyle moved to A.
    const kyle0 = player(B.port, room, 'kyle-1105', 'join');
    await kyle0.until((m) => m.t === 'nohost', 6000);
    const lead = player(B.port, room, 'lead-1105', 'host');
    await lead.until((m) => m.role === 'host');
    const kyle = player(A.port, room, 'kyle-1105', 'join');
    await kyle.until((m) => m.role === 'guest');
    kyle0.close();
    await wait(300);
    expect(deaf.resets()).toBe(1);
    expect(B.relay.subs.has(room)).toBe(true);
    for (let i = 0; i < 30; i++) (lead.send('*', { s: i }), i % 5 === 0 && kyle.send('lead-1105', { t: 'in', i }), await wait(30));
    await wait(300);
    expect(said(kyle, 'lead-1105').length).toBeGreaterThanOrEqual(29);
    expect(said(lead, 'kyle-1105').length).toBeGreaterThanOrEqual(5);
    [kyle, lead].forEach((x) => x.close());
    A.close(), B.close();
  });

  it("a connection that answers but delivers nothing is found by its own 'here' not coming back, and reset", async () => {
    const p = pool(), mute = halfOpen(memoryBackend(p), 'mute');
    const [A, B] = await Promise.all([instance(memoryBackend(p)), instance(mute)]);
    const room = code();
    const lead = player(B.port, room, 'lead-1106', 'host');
    await lead.until((m) => m.role === 'host');
    const kyle = player(A.port, room, 'kyle-1106', 'join');
    await kyle.until((m) => m.role === 'guest');
    // Within the echo's wait (5 s) and a beat, B finds itself deaf and resets.
    for (let t = 0; t < 80 && !mute.resets(); t++) await wait(100);
    expect(mute.resets()).toBe(1);
    await wait(200);
    for (let i = 0; i < 20; i++) (lead.send('*', { s: i }), kyle.send('lead-1106', { t: 'in', i }), await wait(30));
    await wait(300);
    expect(said(kyle, 'lead-1106').length).toBeGreaterThanOrEqual(19);
    expect(said(lead, 'kyle-1106').length).toBeGreaterThanOrEqual(19);
    [kyle, lead].forEach((x) => x.close());
    A.close(), B.close();
  });

  it("a player leaving as another arrives, with a slow UNSUBSCRIBE, doesn't leave the room deaf", async () => {
    const p = pool();
    const slow = (b: Backend): Backend => ({ ...b, bus: { ...b.bus, unsubscribe: (ch) => wait(40).then(() => b.bus.unsubscribe(ch)) } });
    const [A, B] = await Promise.all([instance(slow(memoryBackend(p))), instance(memoryBackend(p))]);
    const room = code();
    const lead = player(B.port, room, 'lead-1107', 'host');
    await lead.until((m) => m.role === 'host');
    // (The leader's heartbeat, so it's never taken for gone.)
    const beat = setInterval(() => lead.ws.send('{"ping":1}'), 150);
    // Kyle's socket on A swapped again and again, the old one closing just as the new one comes.
    let kyle = player(A.port, room, 'kyle-1107', 'join');
    await kyle.until((m) => m.role === 'guest');
    for (const gap of [0, 5, 10, 20, 30, 45]) {
      kyle.close();
      await wait(gap);
      kyle = player(A.port, room, 'kyle-1107', 'join');
      await kyle.until((m) => m.role === 'guest');
      await wait(60);
    }
    await wait(200);
    expect(A.relay.subs.has(room)).toBe(true);
    for (let i = 0; i < 20; i++) (lead.send('*', { s: i }), await wait(30));
    await wait(300);
    expect(said(kyle, 'lead-1107').length).toBe(20);
    clearInterval(beat);
    [kyle, lead].forEach((x) => x.close());
    A.close(), B.close();
  });
});
