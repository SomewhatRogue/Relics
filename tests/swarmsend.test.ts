/**
 * What the leader sends with a swarm on the party (docs/DECISIONS.md 2026-11-05): a goblin's blow goes
 * once, with when it began, not again in every patch as its clock ticks; its damage and target stay home;
 * friends' periodic whole rooms don't all go at once; and the whole-job save goes to the friend first in
 * line every 2 s, to everyone every 8, never in the same frame as a patch.
 */
import { describe, expect, it, vi } from 'vitest';
import { BigSend } from '../src/client/bigsend';
import { loud, quiet } from '../src/client/interest';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT } from '../src/sim/types';

/** Every socket a CoopHost opens, and what it sends. */
const sent: { to: string; d: Record<string, unknown> }[] = [];
class Fake {
  onMessage: (m: unknown) => void = () => {};
  constructor() {}
  send(to: string, d: Record<string, unknown>) {
    sent.push({ to, d });
  }
  close() {}
}
vi.mock('../src/client/relay', async (orig) => ({ ...(await orig<typeof import('../src/client/relay')>()), RelaySocket: Fake }));
vi.mock('../src/client/session', () => ({ keepJob: () => {}, keepSession: () => {}, keptJob: () => null }));
vi.mock('../src/client/owed', () => ({ OwedBook: class { frame() {} end() {} } }));
const { CoopHost } = await import('../src/client/coop');

/** The training room with a goblin winding up a blow at the hero. */
function swinging() {
  const room = new ArenaRoom(3, { scrappers: true });
  const h = room.join('me');
  const e = room.enemies.find((x) => x.act !== 'dead')!;
  Object.assign(e, { x: h.x + 1.2, y: h.y, act: 'attack', actT: 0, attack: { kind: 'swing', aimed: 'me', t: 0, windup: 3, active: 0.2, recover: 0.5, dmg: 9, knock: 3, unblockable: false, dx: -1, dy: 0, ox: e.x, oy: e.y, range: 1.5, arc: 1, cx: e.x, cy: e.y, radius: 0, done: false } });
  return { room, e };
}

describe('a swarm on the wire', () => {
  it("a blow goes once, with when it began; a friend works its clock out; what it does stays the leader's", () => {
    const { room, e } = swinging(), enc = new Encoder(), dec = new Decoder();
    dec.apply(enc.encode(quiet(stateOf(room), room.time), true), true);
    for (let i = 0; i < 6; i++) {
      room.setIntent('me', NO_INTENT);
      room.step();
      // (Kept winding up: the test is the clock, not the fight.)
      if (e.attack) e.attack.t = Math.min(e.attack.t, 2.5);
      const p = enc.encode(quiet(stateOf(room), room.time));
      const mine = p.enemies?.u.find(([k]) => k === String(e.id))?.[1];
      expect(mine && 'attack' in mine).toBeFalsy();
      dec.apply(p);
    }
    const got = dec.apply({}).enemies.find((x) => x.id === e.id)!;
    loud([got], room.time);
    const a = got.attack as Record<string, number>;
    expect(Math.abs(a.t - e.attack!.t)).toBeLessThan(0.05);
    for (const k of ['dmg', 'knock', 'recover', 'aimed']) expect(a[k]).toBeUndefined();
    expect(a.windup).toBe(3);
  });

  it("friends' periodic whole rooms go at least a second apart", () => {
    const { room } = swinging(), send = new BigSend(), ids = ['b2', 'b3', 'b4'];
    for (const id of ids) room.join(id);
    const fulls: [string, number][] = [];
    for (let i = 0; i < 400; i++) {
      const now = i * 0.05;
      for (const id of ids) if (send.body(room, id, now, i === 0, { k: 1, t: room.time }, []).full && i) fulls.push([id, now]);
    }
    expect(fulls.length).toBeGreaterThan(9);
    for (let i = 1; i < fulls.length; i++) expect(fulls[i][1] - fulls[i - 1][1]).toBeGreaterThanOrEqual(1 - 1e-9);
  });

  it('the whole-job save: the friend first in line every 2 s, everyone every 8, never in a frame with a patch', () => {
    const room = new ArenaRoom(3, { scrappers: true });
    for (const id of ['lead', 'zed-0001', 'amy-0001', 'kit-0001']) room.join(id);
    const game = { room, run: null, roomKey: 1, goalText: () => '', houses: () => [], addFriend: () => {}, dropFriend: () => {}, roomOf: () => room, keyOf: () => 1, stepped: new Map(), doorMarks: () => [], jobSave: () => ({ room: {}, houses: [] }) };
    const host = new CoopHost('PSAVES123', 'lead', 'LEAD', game as never, [['lead', 'LEAD'], ['zed-0001', 'Z'], ['amy-0001', 'A'], ['kit-0001', 'K']]);
    sent.length = 0;
    const frames: { at: number; save: string[]; patch: boolean }[] = [];
    for (let i = 0; i < 60 * 20; i++) {
      const now = i / 60, n = sent.length;
      // (Everyone's still talking to the leader.)
      for (const f of host.friends.values()) f.heard = now;
      host.frame(now);
      const out = sent.slice(n);
      frames.push({ at: now, save: out.filter((m) => 'save' in m.d).map((m) => m.to), patch: out.some((m) => 's' in m.d) });
    }
    const saves = frames.filter((f) => f.save.length);
    expect(saves.every((f) => !f.patch)).toBe(true);
    const toAll = saves.filter((f) => f.save[0] === '*'), toFirst = saves.filter((f) => f.save[0] !== '*');
    expect(toFirst.every((f) => f.save.length === 1 && f.save[0] === 'amy-0001')).toBe(true);
    expect(toAll.length).toBeGreaterThanOrEqual(2);
    expect(toAll.length).toBeLessThanOrEqual(3);
    expect(toFirst.length).toBeGreaterThanOrEqual(5);
  });
});
