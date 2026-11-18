/**
 * The second wire format on the leader's side (src/client/wire2.ts): a room with a friend who doesn't speak it
 * gets the first, byte for byte what a leader with only old friends sends; when that friend goes, the room goes
 * whole once and then in the second; a big room picks per friend; an encoder that changes format starts whole.
 * And the relay makes each message's text once, every socket getting what it got before.
 */
import { describe, expect, it, vi } from 'vitest';
import { Relay, memoryBackend } from '../api/_relay';
import { BigSend } from '../src/client/bigsend';
import { RoomSend } from '../src/client/roomsend';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT } from '../src/sim/types';

type Ent = Record<string, unknown>;
const socks: Fake[] = [];
class Fake {
  onMessage: (m: unknown) => void = () => {};
  out: { to: string; d: Ent }[] = [];
  rtt = 0;
  constructor() {
    socks.push(this);
  }
  send(to: string, d: Ent) {
    this.out.push({ to, d });
  }
  close() {}
  reconnect() {}
}
vi.mock('../src/client/relay', async (orig) => ({ ...(await orig<typeof import('../src/client/relay')>()), RelaySocket: Fake }));
vi.mock('../src/client/session', () => ({ keepJob: () => {}, keepSession: () => {}, keptJob: () => null }));
vi.mock('../src/client/owed', () => ({ OwedBook: class { frame() {} end() {} } }));
const { CoopHost } = await import('../src/client/coop');

const fight = () => {
  const room = new ArenaRoom(3, { scrappers: true });
  for (const id of ['me', 'b2', 'b3']) room.join(id);
  return room;
};
function host(room: ArenaRoom) {
  const game = { room, run: null, roomKey: 1, goalText: () => '', houses: () => [], addFriend: () => {}, dropFriend: () => {}, roomOf: () => room, keyOf: () => 1, stepped: new Map(), doorMarks: () => [], jobSave: () => ({ room: {}, houses: [] }) };
  const h = new CoopHost('PWIRE2H', 'me', 'A', game as never, [['me', 'A'], ['b2', 'B'], ['b3', 'C']]), sock = socks[socks.length - 1];
  return { h, sock, say: (from: string, d: Ent) => sock.onMessage({ t: 'msg', from, d }) };
}
/** The patches a host sent since `n` (its saves left out). */
const patches = (s: Fake, n: number) => s.out.slice(n).filter((m) => 's' in m.d || 'b' in m.d);

describe('the second wire format, leader side', () => {
  it('a mixed room gets the first format, byte for byte; the old friend gone, whole once and then the second; back, the first', () => {
    const room = fight(), mixed = host(room), ref = host(room);
    mixed.say('b2', { t: 'hello', profile: {}, v: 2 }), mixed.say('b3', { t: 'hello', profile: {} });
    for (const id of ['b2', 'b3']) ref.say(id, { t: 'hello', profile: {} });
    const seen: string[] = [];
    for (let i = 0; i < 360; i++) {
      const now = 1 + i * 0.05;
      if (i === 120) for (const x of [mixed, ref]) x.say('b3', { t: 'bye' });
      if (i === 240) for (const x of [mixed, ref]) x.say('b3', { t: 'hello', profile: {} });
      room.setIntent('me', { ...NO_INTENT, mx: i % 40 < 20 ? 1 : -1 });
      room.step(), room.step();
      const a = mixed.sock.out.length, b = ref.sock.out.length;
      mixed.h.frame(now), ref.h.frame(now);
      const pa = patches(mixed.sock, a), pb = patches(ref.sock, b);
      expect(pa.length).toBe(pb.length);
      pa.forEach((m, k) => {
        const two = 'b' in m.d, f = two ? (m.d.b as Ent).f : JSON.parse(m.d.s as string).f;
        seen.push(`${two ? 2 : 1}${f}`);
        // (Old friend in the room: the very message an all-old leader sends.)
        if (i < 120 || i >= 240) expect(JSON.stringify(m)).toBe(JSON.stringify(pb[k]));
        else expect(two, `send ${i}`).toBe(true);
      });
    }
    expect(seen.length).toBeGreaterThan(300);
    // The send after the bye is whole, in the second format, with its map; the rest of that stretch patches.
    const first2 = seen.indexOf('21'), firstPatch2 = seen.indexOf('20');
    expect(first2).toBeGreaterThan(100);
    expect(seen.slice(0, first2).every((x) => x[0] === '1')).toBe(true);
    expect(firstPatch2).toBe(first2 + 1);
    expect(seen[seen.length - 1][0]).toBe('1');
    const whole2 = mixed.sock.out.find((m) => 'b' in m.d && (m.d.b as Ent).f === 1)!;
    expect((whole2.d.b as Ent).map).toBeTruthy();
  });

  it('an encoder fed one format and then the other sends the room whole', () => {
    const room = fight(), rs = new RoomSend(), rest = { k: 1, w: 0, slow: {}, ev: [], acks: {} };
    expect(rs.msg(room, 0, true, rest, 2).full).toBe(true);
    room.step();
    expect(rs.msg(room, 0.05, false, rest, 2).full).toBe(false);
    expect(rs.msg(room, 0.1, false, rest, 1).full).toBe(true);
    expect(rs.msg(room, 0.15, false, rest, 1).full).toBe(false);
    const whole = rs.msg(room, 0.2, false, rest, 2);
    expect(whole.full && (whole.d.b as Ent).map).toBeTruthy();
  });

  it('a big room picks per friend: the old one gets the very text it got before', () => {
    const room = fight(), a = new BigSend(), b = new BigSend();
    for (let i = 0; i < 200; i++) {
      room.step(), room.step();
      const now = i * 0.05, common = { k: 1, t: room.time };
      const two = a.msg(room, 'b2', now, i === 0, common, [], 2), one = a.msg(room, 'b3', now, i === 0, common, [], 1);
      b.body(room, 'b2', now, i === 0, common, []);
      const old = b.body(room, 'b3', now, i === 0, common, []);
      expect('b' in two.d).toBe(true);
      expect(one.d).toEqual({ s: old.s });
      expect(one.full).toBe(old.full);
    }
  });
});

describe('the relay makes a message its text once', () => {
  it('every socket gets the text it got before: msg to all and to one, hosted (far, a replaced host steps down), left', () => {
    const relay = new Relay(memoryBackend({ kv: new Map(), subs: new Map() })) as unknown as { rooms: Map<string, Set<unknown>>; deliver(r: string, e: Ent): void; origin: string };
    relay.origin = 'here';
    const got = new Map<string, string[]>(), conn = (id: string, host = false, open = 1) => ({ id, room: 'R', host, nonce: id, alive: true, touchedAt: 0, claimedAt: 0, sock: { readyState: open, send: (t: string) => got.set(id, [...(got.get(id) ?? []), t]) } });
    const cs = [conn('kyle', true), conn('sam'), conn('ava'), conn('shut', false, 3)];
    /** What deliver sent before: each socket's message made for it. */
    const before = (e: Ent) => {
      const out = new Map<string, string[]>(), tell = (c: (typeof cs)[number], m: unknown) => c.sock.readyState === 1 && out.set(c.id, [...(out.get(c.id) ?? []), JSON.stringify(m)]);
      for (const c of cs) {
        if (e.k === 'msg') {
          if (c.id !== e.from && (e.to === '*' || e.to === c.id)) tell(c, { t: 'msg', from: e.from, d: e.d, cn: e.cn });
        } else if ((e.k === 'hosted' || e.k === 'left') && c.id !== e.id) {
          tell(c, { t: e.k, id: e.id, cn: e.cn, ...(e.k === 'hosted' && e.o !== 'here' ? { far: 1 } : {}) });
          if (e.k === 'hosted' && c.host) tell(c, { t: 'role', role: 'guest', host: e.id });
        }
      }
      return out;
    };
    const envs: Ent[] = [
      { k: 'msg', from: 'kyle', to: '*', d: { b: { p: {}, t: 1.5, names: { me: 'K' } } }, cn: 'x.1' },
      { k: 'msg', from: 'kyle', to: 'sam', d: { s: '{"p":{}}' }, cn: 'x.2' },
      { k: 'msg', from: 'sam', to: 'kyle', d: { t: 'hello', profile: {}, v: 2 }, cn: 'y.1' },
      { k: 'left', id: 'ava', o: 'here', cn: 'z.1' },
      { k: 'hosted', id: 'sam', o: 'there', cn: 'y.2' },
      { k: 'hosted', id: 'ava', o: 'here', cn: 'z.2' },
    ];
    for (const e of envs) {
      for (const c of cs) c.host = c.id === 'kyle';
      const want = before(e);
      for (const c of cs) c.host = c.id === 'kyle';
      got.clear();
      relay.rooms.set('R', new Set(cs));
      relay.deliver('R', e);
      expect(Object.fromEntries(got)).toEqual(Object.fromEntries(want));
    }
  });
});
