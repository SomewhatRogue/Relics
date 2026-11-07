/**
 * The host's 4-minute socket swap, as a friend hears it (docs/DECISIONS.md 2026-11-06): the relay says
 * `hosted` again for the same leader, and the friend used to follow them afresh, dropping its copy of
 * the room until the next whole one came (a freeze every 4 minutes) and saying hello (so the leader sent
 * the whole room again). A swapped-in socket of the friend's own did the same with its `role`.
 */
import { describe, expect, it, vi } from 'vitest';
import { Encoder, stateOf } from '../src/client/snap';
import { quiet } from '../src/client/interest';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT } from '../src/sim/types';

const sent: { to: string; d: Record<string, unknown> }[] = [];
let sock: { onMessage: (m: unknown) => void } | null = null;
class Fake {
  onMessage: (m: unknown) => void = () => {};
  rtt = 0;
  constructor() {
    sock = this;
  }
  send(to: string, d: Record<string, unknown>) {
    sent.push({ to, d });
  }
  close() {}
  reconnect() {}
}
vi.mock('../src/client/relay', async (orig) => ({ ...(await orig<typeof import('../src/client/relay')>()), RelaySocket: Fake }));
const { CoopGuest } = await import('../src/client/coop');

/** The leader's room and what it sends a friend: a whole one, then patches. */
function leader() {
  const room = new ArenaRoom(3, { scrappers: true });
  room.join('me');
  room.join('kyle-0001');
  const enc = new Encoder();
  const body = (full: boolean) => ({ s: JSON.stringify({ p: enc.encode(quiet(stateOf(room), room.time), full), f: full ? 1 : 0, k: 5, map: full ? { ...room.map, blocks: [] } : undefined, t: room.time, x: 0, in: 0, run: null, goal: '', ev: [], names: { me: 'LEAD' } }) });
  return { room, body };
}

describe("the host's socket swap, on a friend's screen", () => {
  it('keeps the room: no starting over, no hello, patches go on applying', () => {
    const { room, body } = leader();
    const g = new CoopGuest('PSWAP1234', 'kyle-0001', 'lead-0001', () => ({}) as never, {} as never);
    const say = (m: unknown) => sock!.onMessage(m);
    say({ t: 'role', role: 'guest', host: 'lead-0001' });
    say({ t: 'msg', from: 'lead-0001', d: body(true) });
    let now = 10;
    g.frame(now, NO_INTENT);
    expect(g.room).toBeTruthy();
    const kept = g.room;
    sent.length = 0;
    // Four minutes on: the leader's socket swaps (same instance), and later mine does.
    say({ t: 'hosted', id: 'lead-0001' });
    say({ t: 'role', role: 'guest', host: 'lead-0001', swap: true });
    for (let i = 0; i < 6; i++) {
      room.setIntent('me', { ...NO_INTENT, mx: 1 });
      for (let k = 0; k < 3; k++) room.step();
      say({ t: 'msg', from: 'lead-0001', d: body(false) });
      g.frame((now += 0.05), NO_INTENT);
    }
    g.frame((now += 0.3), NO_INTENT);
    expect(g.room).toBe(kept);
    const lead = g.room!.heroes.find((h) => h.id === '@lead')!, real = room.heroes.find((h) => h.id === 'me')!;
    expect(Math.abs(lead.x - real.x)).toBeLessThan(0.05);
    expect(sent.filter((m) => m.d.t === 'hello')).toHaveLength(0);
  });

  it('a different leader is still followed afresh', () => {
    const { body } = leader();
    const g = new CoopGuest('PSWAP1235', 'kyle-0001', 'lead-0001', () => ({}) as never, {} as never);
    const say = (m: unknown) => sock!.onMessage(m);
    say({ t: 'msg', from: 'lead-0001', d: body(true) });
    g.frame(1, NO_INTENT);
    sent.length = 0;
    say({ t: 'hosted', id: 'ann-00001' });
    expect(g.lead).toBe('ann-00001');
    expect(sent.some((m) => m.d.t === 'hello' && m.to === 'ann-00001')).toBe(true);
  });
});
