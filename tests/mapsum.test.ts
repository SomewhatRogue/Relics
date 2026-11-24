/**
 * A map's fingerprint (shared/mapsum.ts), and the leader and a friend using it (client/coop.ts): a friend whose map
 * for a big room differs from the leader's says so, is sent theirs, and stands on that. Both ends are stood up
 * here with fake sockets and handed each other's messages.
 */
import { describe, expect, it, vi } from 'vitest';
import { guestMap } from '../src/shared/guestmap';
import { mapSum } from '../src/shared/mapsum';
import { landJob, territoryPlan } from '../src/shared/territory';
import { readBody } from '../src/client/wire2';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';

type Ent = Record<string, unknown>;
class Fake {
  onMessage: (m: unknown) => void = () => {};
  out: { to: string; d: Ent }[] = [];
  rtt = 0;
  send(to: string, d: Ent) {
    this.out.push({ to, d });
  }
  close() {}
  reconnect() {}
}
const socks: Fake[] = [];
vi.mock('../src/client/relay', async (orig) => ({ ...(await orig<typeof import('../src/client/relay')>()), RelaySocket: class extends Fake { constructor() { super(); socks.push(this); } } }));
vi.mock('../src/client/session', () => ({ keepJob: () => {}, keepSession: () => {}, keptJob: () => null }));
vi.mock('../src/client/owed', () => ({ OwedBook: class { frame() {} end() {} } }));
const { CoopHost, CoopGuest } = await import('../src/client/coop');

const plan = (land: 'gatefields' | 'lowfurrow', day = 3) => territoryPlan(landJob(land, day), 0).map;
const wire = <T>(d: T): T => JSON.parse(JSON.stringify(d));

describe('mapSum', () => {
  it('is the same for two builds of one map, and differs between maps', () => {
    expect(mapSum(plan('gatefields'))).toBe(mapSum(plan('gatefields')));
    expect(mapSum(plan('lowfurrow'))).toBe(mapSum(plan('lowfurrow')));
    expect(mapSum(plan('gatefields'))).not.toBe(mapSum(plan('lowfurrow')));
  });

  it('changes when one round moves a hundredth, a block goes, or a water rectangle changes', () => {
    const base = mapSum(plan('lowfurrow'));
    const moved = plan('lowfurrow');
    moved.rounds[0].x += 0.01;
    expect(mapSum(moved)).not.toBe(base);
    const fewer = plan('lowfurrow');
    fewer.blocks.pop();
    expect(mapSum(fewer)).not.toBe(base);
    const wet = plan('lowfurrow');
    wet.water = [...(wet.water ?? []), { x: 10, y: 10, w: 5, h: 5 }];
    expect(mapSum(wet)).not.toBe(base);
    if (plan('lowfurrow').water?.length) {
      const w = plan('lowfurrow');
      w.water![0].w += 1;
      expect(mapSum(w)).not.toBe(base);
    }
  });
});

/** A leader with one friend `b2` in a big room, and that friend, handed each other's messages. */
function pair(mapFor?: (run: never) => ReturnType<typeof guestMap>, oldLeader = false) {
  const run = newRun(landJob('gatefields', 3));
  Object.assign(run, { index: 0, party: 2 });
  const room = runRoom(run);
  for (const id of ['me', 'b2']) room.join(id);
  const game = { room, run, roomKey: 1, goalText: () => '', houses: () => [], addFriend: () => {}, dropFriend: () => {}, roomOf: () => room, keyOf: () => 7, stepped: new Map(), doorMarks: () => [], jobSave: () => ({ room: {}, houses: [] }) };
  const host = new CoopHost('PMAPSUM1', 'me', 'A', game as never, [['me', 'A'], ['b2', 'B']]), hs = socks[socks.length - 1];
  const guest = new CoopGuest('PMAPSUM1', 'b2', 'me', () => ({}) as never, {} as never), gs = socks[socks.length - 1];
  if (mapFor) guest.mapFor = mapFor as never;
  const g = guest as unknown as { apply(b: unknown): void; heard(m: unknown): void };
  let hAt = 0, gAt = 0, t = 1;
  const tell = (d: Ent) => hs.onMessage({ t: 'msg', from: 'b2', d });
  /** The host's new messages to the friend into the guest (patches applied at once); the guest's new ones into the host. */
  const flow = () => {
    for (const m of hs.out.slice(hAt)) {
      if (m.to !== 'b2') continue;
      const d = wire(m.d);
      if (oldLeader && 'b' in d) delete (d.b as Ent).sum;
      if (oldLeader && 's' in d) d.s = (d.s as string).replace(/"sum":\d+,?/, '');
      const body = readBody(d, 'b2');
      if (body) g.apply(body);
      else g.heard({ t: 'msg', from: 'me', d });
    }
    hAt = hs.out.length;
    for (const m of gs.out.slice(gAt)) tell(wire(m.d));
    gAt = gs.out.length;
  };
  const step = () => {
    t += 0.1;
    host.frame(t);
    flow();
    guest.frame(performance.now() / 1000 + 100 + t, NO_INTENT);
    flow();
  };
  tell({ t: 'hello', profile: {}, v: 2 });
  return { host, guest, hs, gs, run, step, sent: () => gs.out.map((m) => m.d) };
}

describe('the leader and a friend, a big room', () => {
  it('an honest friend never asks, and the leader sends it no map', () => {
    const p = pair();
    for (let i = 0; i < 80; i++) p.step();
    expect(p.guest.room).not.toBeNull();
    expect(p.sent().filter((d) => 'needmap' in d)).toEqual([]);
    expect(p.hs.out.filter((m) => 'map' in m.d)).toEqual([]);
  });

  it('only whole rooms carry the fingerprint', () => {
    const p = pair();
    for (let i = 0; i < 40; i++) p.step();
    const sums = p.hs.out.filter((m) => m.to === 'b2').map((m) => JSON.stringify(m.d).includes('"sum"'));
    expect(sums[0]).toBe(true);
    expect(sums.filter(Boolean).length).toBe(1);
  });

  it('a friend with another map asks, is sent the leader`s, and ends on its fingerprint', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const off = (run: Parameters<typeof guestMap>[0]) => {
      const m = guestMap(run);
      m.rounds[0].x += 3;
      return m;
    };
    const p = pair(off as never);
    for (let i = 0; i < 80; i++) p.step();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(p.sent().filter((d) => 'needmap' in d)).toEqual([{ needmap: 7 }]);
    expect(p.hs.out.filter((m) => 'map' in m.d).length).toBe(1);
    expect(mapSum(p.guest.room!.map)).toBe(mapSum(guestMap(p.run)));
    warn.mockRestore();
  });

  it('a leader that sends no fingerprint is never checked or asked', () => {
    const off = (run: Parameters<typeof guestMap>[0]) => {
      const m = guestMap(run);
      m.rounds[0].x += 3;
      return m;
    };
    const p = pair(off as never, true);
    for (let i = 0; i < 60; i++) p.step();
    expect(p.guest.room).not.toBeNull();
    expect(p.sent().filter((d) => 'needmap' in d)).toEqual([]);
  });
});
