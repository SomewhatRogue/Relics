/**
 * The second wire format (src/client/wire2.ts, docs/ONLINE.md 2026-11-17): over the same seeded fights, a friend
 * fed the first format and a friend fed the second end with the same room after every patch (heroes' act
 * clocks to within a hundredth), their own hero handed the same; a friend with no room ignores a whole room
 * without its map, and its hello gets the map; a message it doesn't know is ignored; and it costs less.
 * (The leader's side, mixed parties and the relay: tests/wire2host.test.ts.)
 */
import { describe, expect, it, vi } from 'vitest';
import { BigSend } from '../src/client/bigsend';
import { isBig } from '../src/client/interest';
import { RoomSend } from '../src/client/roomsend';
import { COLLS } from '../src/client/snap';
import { Joiner, isPart, splitMsg } from '../src/client/split';
import { readBody, swapIds } from '../src/client/wire2';
import type { FightEvent } from '../src/sim/types';
import { NO_INTENT } from '../src/sim/types';
import { IDS, newPress, scenes, stepScene, type Scene } from './perfparity.scenes';

const sent: { to: string; d: Record<string, unknown> }[] = [];
const socks: { onMessage: (m: unknown) => void }[] = [];
class Fake {
  onMessage: (m: unknown) => void = () => {};
  rtt = 0;
  constructor() {
    socks.push(this);
  }
  send(to: string, d: Record<string, unknown>) {
    sent.push({ to, d });
  }
  close() {}
  reconnect() {}
}
vi.mock('../src/client/relay', async (orig) => ({ ...(await orig<typeof import('../src/client/relay')>()), RelaySocket: Fake }));
const { CoopGuest } = await import('../src/client/coop');
type Guest = InstanceType<typeof CoopGuest>;
type Ent = Record<string, unknown>;

const NAMES = { me: 'A', b2: 'B', b3: 'C', b4: 'D' };
/** A frame time ahead of the page's clock (the playout weighs a patch's arrival, by that clock, against it). */
const at = (t: number) => performance.now() / 1000 + 100 + t;
const guest = (id: string) => new CoopGuest('PWIRE2', id, 'me', () => ({}) as never, {} as never);
/** As the relay carries it: through JSON (fields left undefined go, as they do on the wire). */
const wire = (d: unknown) => JSON.parse(JSON.stringify(d));
const apply = (g: Guest, d: Ent) => {
  const b = readBody(wire(d), g.myId);
  if (b) (g as unknown as { apply(b: unknown): void }).apply(b);
};
/** A hero without its clock (compared apart, to a hundredth). */
const bare = (h: Ent) => Object.fromEntries(Object.entries(h).filter(([k]) => k !== 'actT' && k !== 'a0'));
/** What a friend's copy of the room shows, and what its own hero was handed (ownhero.ts). */
function view(g: Guest): { s: string; clocks: number[]; own: string; ownT: number } {
  const r = g.room as unknown as Ent, o: Ent = { time: r.time, exitOpen: r.exitOpen, indoors: r.indoors, map: { ...(r.map as Ent), blocks: undefined }, run: g.run, goal: g.goal, houses: g.houses, kit: g.kitSeq };
  for (const c of COLLS) o[c] = c === 'blocks' ? (r.map as Ent).blocks : c === 'heroes' ? (r.heroes as Ent[]).map(bare) : r[c];
  const srv = (g as unknown as { own: { srv: Ent | null } }).own.srv ?? {};
  return { s: JSON.stringify(o), clocks: (r.heroes as Ent[]).map((h) => h.actT as number), own: JSON.stringify(bare(srv)), ownT: srv.actT as number };
}
function same(a: Guest, b: Guest, where: string): void {
  const x = view(a), y = view(b);
  expect(y.s, where).toBe(x.s);
  expect(y.own, where).toBe(x.own);
  x.clocks.forEach((t, i) => expect(Math.abs(y.clocks[i] - t), where).toBeLessThan(0.011));
  expect(Math.abs(y.ownT - x.ownT), where).toBeLessThan(0.011);
}

/** A scene's sends in both formats (`late`: a friend arriving at that send); each pair handed to `each`. */
function play(s: Scene, ticks: number, late: number, each: (send: number, to: string, one: Ent, two: Ent) => void): void {
  const press = newPress(), big = isBig(s.room), evs: FightEvent[] = [];
  const r1 = new RoomSend(), r2 = new RoomSend(), b1 = new BigSend(), b2 = new BigSend();
  let now = 0, sends = 0;
  for (let t = 1; t <= ticks; t++) {
    stepScene(s, press);
    evs.push(...s.room.events);
    now += 1 / 30;
    if (t % 3) continue;
    const room = s.room, w = Math.round(now * 1000) / 1000, acks = { b2: w - 0.1 };
    const slow = { hc: [], dm: [], run: s.run ? { ...s.run, board: undefined } : null, goal: sends % 40 < 20 ? 'Free the captives' : 'Find the way on', names: NAMES };
    if (big) {
      const common = { k: 1, t: room.time, w, x: room.exitOpen ? 1 : 0, in: room.indoors ? 1 : 0, ...slow, acks };
      for (const g of ['b2', 'b3']) {
        const whole = sends === 0 || (g === 'b3' && sends === late);
        each(sends, g, b1.msg(room, g, now, whole, common, evs, 1).d, b2.msg(room, g, now, whole, common, evs, 2).d);
      }
    } else {
      const rest = { k: 1, w, slow, ev: evs, acks }, whole = sends === 0 || sends === late;
      each(sends, '*', r1.msg(room, now, whole, rest, 1).d, r2.msg(room, now, whole, rest, 2).d);
    }
    evs.length = 0;
    sends++;
  }
}

const picked = () => scenes().filter((s) => ['village-rescue', 'deep-dive', 'swarm60'].includes(s.name));

describe('the second wire format', () => {
  for (const s of picked()) {
    it(`${s.name}: a friend on either format has the same room after every patch, and so does one arriving mid-fight`, () => {
      const late = 61, a = [guest('b2'), guest('b2')], b = [guest('b3'), guest('b3')];
      let maps = 0, mapless = 0;
      play(s, 450, late, (n, to, one, two) => {
        const body = two.b as Ent;
        if (body.f) body.map || body.ms ? maps++ : mapless++;
        // (The object's swap is the text's: the same body either way.)
        if (n % 25 === 0) expect(readBody(wire(two), 'b2')).toEqual(readBody({ s: JSON.stringify(two.b) }, 'b2'));
        for (const [g, who] of [[a, 'b2'], [b, 'b3']] as const) {
          if ((to !== '*' && to !== who) || (g === b && n < late)) continue;
          apply(g[0], one), apply(g[1], two);
          same(g[0], g[1], `${s.name} ${who} send ${n}`);
        }
      });
      expect(a[0].room && b[0].room).toBeTruthy();
      // (Periodic whole rooms went without the map in an ordinary room.)
      if (!isBig(s.room)) expect(mapless).toBeGreaterThan(0);
      expect(maps).toBeGreaterThan(0);
    });
  }

  it('costs at least 20% fewer bytes on the wire in the village; deep dive and swarm printed', () => {
    const out: Record<string, [number, number]> = {};
    for (const s of picked()) {
      let one = 0, two = 0;
      play(s, 1500, -1, (_n, to, x, y) => ((one += JSON.stringify({ to, d: x }).length), (two += JSON.stringify({ to, d: y }).length)));
      out[s.name] = [one, two];
      console.log(`${s.name}: format 1 ${(one / 50 / 1024).toFixed(1)} KB/s, format 2 ${(two / 50 / 1024).toFixed(1)} KB/s (${Math.round((1 - two / one) * 100)}% less)`);
    }
    // (The brief hoped for 30%: a Ranger's hound is a nested object, sent whole in every patch it moves in, and is
    // now the largest part of a patch: see docs/ONLINE.md. What format 2 saves is held here.)
    const [one, two] = out['village-rescue'];
    expect(two).toBeLessThan(one * 0.8);
  });

  it('a whole room without its map is ignored by a friend with no room, and its hello brings the map', () => {
    const s = scenes()[0], rs = new RoomSend(), g = guest('b2'), sock = socks[socks.length - 1], room = s.room, press = newPress();
    const rest = () => ({ k: 1, w: room.time, slow: { names: NAMES }, ev: [], acks: {} });
    rs.msg(room, 0, true, rest(), 2);
    for (let i = 0; i < 4 * 30 + 3; i++) stepScene(s, press);
    const periodic = rs.msg(room, 4.1, false, rest(), 2).d;
    expect((periodic.b as Ent).f).toBe(1);
    expect((periodic.b as Ent).map).toBeUndefined();
    sent.length = 0;
    expect(() => (sock.onMessage({ t: 'msg', from: 'me', d: wire(periodic) }), g.frame(at(10), NO_INTENT))).not.toThrow();
    expect(g.room).toBeNull();
    const hello = sent.find((m) => m.to === 'me' && m.d.t === 'hello');
    expect(hello?.d.v).toBe(2);
    // (The leader, hearing it, sends the room whole: CoopHost marks them fresh, and a whole room carries the map.)
    const again = rs.msg(room, 4.15, true, rest(), 2).d;
    expect((again.b as Ent).map).toBeTruthy();
    sock.onMessage({ t: 'msg', from: 'me', d: wire(again) });
    g.frame(at(10.2), NO_INTENT);
    expect(g.room?.heroes.some((h) => h.id === 'me')).toBe(true);
    // A friend with a room, told of another room without its map: nothing applied to the wrong room.
    const other = rs.msg(room, 9, false, { ...rest(), k: 2 }, 2).d;
    expect((other.b as Ent).map).toBeUndefined();
    const kept = g.room;
    expect(() => (sock.onMessage({ t: 'msg', from: 'me', d: wire(other) }), g.frame(at(10.4), NO_INTENT))).not.toThrow();
    expect(g.room).toBe(kept);
  });

  it("a new friend reads an old leader's text as before, and ignores what it doesn't know", () => {
    const s = scenes()[0], rs = new RoomSend(), g = guest('b2'), sock = socks[socks.length - 1];
    const old = { s: rs.body(s.room, 0, true, { k: 1, w: 0, slow: { names: NAMES }, ev: [], acks: {} }).s };
    for (const d of [{ b: 'x' }, { b: {} }, { b: [] }, { b: null }, { q: 1 }, { s: '{not json' }, null, 7]) expect(() => (sock.onMessage({ t: 'msg', from: 'me', d }), g.frame(at(1), NO_INTENT))).not.toThrow();
    expect(g.room).toBeNull();
    sock.onMessage({ t: 'msg', from: 'me', d: old });
    g.frame(at(1.1), NO_INTENT);
    expect(g.room?.heroes.map((h) => h.id).sort()).toEqual(['@lead', 'b3', 'b4', 'me']);
    expect(IDS).toContain('b2');
  });

  it('the ids swap at once, keys and strings, and leaves a string with "me" inside it alone', () => {
    expect(swapIds({ me: ['me', 'b2', 'x"me"'], b2: { id: 'b2', o: ['me'] } }, 'b2')).toEqual({ '@lead': ['@lead', 'me', 'x"me"'], me: { id: 'me', o: ['@lead'] } });
  });

  it('a body as an object over the split limit comes back whole', () => {
    const b = { p: { heroes: { u: [['me', { tag: 'x'.repeat(70_000), q: '"me"' }]] } }, f: 1 }, parts = splitMsg('*', { b }, 9), j = new Joiner();
    expect(parts.length).toBeGreaterThan(1);
    let got: unknown;
    for (const t of parts) got = j.add('me', (JSON.parse(t) as { d: never }).d), expect(isPart((JSON.parse(t) as { d: unknown }).d)).toBe(true);
    expect(got).toEqual({ b });
  });
});
