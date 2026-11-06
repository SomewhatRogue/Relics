/**
 * The town's pastimes in the shared town (shared/pastimes.ts, Kyle 2026-11-05; docs/DECISIONS.md
 * 2026-11-06): sitting down to fish or stepping up to the butts sends one word and then nothing, however
 * long you play; everyone else sees your hero parked at the spot doing it (and keeps you, silent, past the
 * usual five minutes); a newcomer is told once; getting up sends one more word and you're back. The
 * millpond, Old Pennock and Abel are on the town map, and the spots are on dry ground.
 */
import { describe, expect, it, vi } from 'vitest';
import { NO_INTENT } from '../src/sim/types';

/** Every socket the page opens, and what it sends (as tests/idles.test.ts). */
const socks: Fake[] = [];
class Fake {
  onMessage: (m: unknown) => void = () => {};
  onDown = () => {};
  sent: { to: string; d: Record<string, unknown> }[] = [];
  open_ = true;
  closed = false;
  constructor(readonly room: string, readonly id: string, readonly want: string) {
    socks.push(this);
  }
  send(to: string, d: Record<string, unknown>) {
    if (!this.closed) this.sent.push({ to, d: JSON.parse(JSON.stringify(d)) });
  }
  close() {
    this.closed = true;
  }
  reconnect() {}
}
vi.mock('../src/client/relay', async (orig) => ({ ...(await orig<typeof import('../src/client/relay')>()), RelaySocket: Fake }));
vi.stubGlobal('addEventListener', () => {});
vi.stubGlobal('document', { addEventListener: () => {}, visibilityState: 'visible', hidden: false });
const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });

const { Game } = await import('../src/client/game');
const { Townfolk, AWAY } = await import('../src/client/townfolk');
const { presence } = await import('../src/client/townpresence');
const { parkOf } = await import('../src/client/parked');
const { idlePose } = await import('../src/client/idlepose');
const { newPose } = await import('../src/client/motion');
const { BUTTS, MILLPOND } = await import('../src/shared/pastimes');
const { townMap } = await import('../src/shared/town');
const { collide, useMap, inArea } = await import('../src/shared/arena');

type Folk = InstanceType<typeof Townfolk>;
/** Two players in Wickhold on a pretend relay: `me` (a real Game) and a friend standing in the square. */
function town(cls: 'WARRIOR' | 'RANGER' = 'WARRIOR', touching = true) {
  socks.length = 0;
  const g = new Game();
  g.create(cls, 'WREN');
  if (g.mode === 'wood') g.skipWood();
  const me = new Townfolk(g.profile.id), friend = new Townfolk('hfriend001');
  // (Last touched as the test starts, on its clock.)
  for (const f of [me, friend]) (f as unknown as { touchedAt: number }).touchedAt = 1000;
  const at = new Map<Folk, Fake>(), read = new Map<Fake, number>();
  let now = 1000;
  const fMe = () => ({ n: 'SAM', w: 'longbow', l: 0, at: 'WICKHOLD', p: [30, 22, 0, 1, 0] as [number, number, number, number, number] });
  const pump = () => {
    // Every new word goes to everyone else in the room (or the one it's for).
    for (const [f, s] of at) {
      const from = f.id, start = read.get(s) ?? 0;
      for (const { to, d } of s.sent.slice(start)) for (const [o, t] of at) if (o !== f && !t.closed && (to === '*' || to === o.id)) t.onMessage({ t: 'msg', from, d });
      read.set(s, s.sent.length);
    }
  };
  const frame = (dt: number) => {
    now += dt;
    g.step(dt, NO_INTENT);
    for (const [f, me_] of [[me, presence(g, 'WREN')], [friend, fMe()]] as const) {
      // (Playing a pastime is tapping all the time: nobody dozes off. Unless `touching` is off: then I don't.)
      if (touching || f === friend) (f as unknown as { touchedAt: number }).touchedAt = now;
      const n = socks.length;
      f.step(me_, now, dt);
      if (socks.length > n) at.set(f, socks[socks.length - 1]), socks[socks.length - 1].onMessage({ t: 'role', role: 'peer' });
    }
    pump();
  };
  const said = () => at.get(me)!.sent.length;
  return { g, me, friend, frame, said, now: () => now, sock: () => at.get(me)!, deliver: (d: Record<string, unknown>, from: string) => at.get(me)!.onMessage({ t: 'msg', from, d }) };
}
const seen = (f: Folk, id: string) => f.where(id)?.hero;

describe('parked at a pastime, for everyone else', () => {
  it('sitting down to fish sends one word; ten minutes at it send nothing; getting up sends one more', () => {
    const t = town();
    for (let i = 0; i < 20; i++) t.frame(0.1);
    expect(seen(t.friend, t.g.profile.id)).toBeTruthy();
    const before = t.said();
    t.g.enterPastime('fish');
    for (let i = 0; i < 10; i++) t.frame(0.1);
    const start = t.sock().sent.slice(before);
    expect(start).toHaveLength(1);
    expect(start[0].d.g).toBe('fish');
    // The friend sees the hero parked at the bank, fishing (drawn so, nothing on the hero changed).
    const h = seen(t.friend, t.g.profile.id)!;
    expect(parkOf(h)).toBe('fish');
    expect([h.x, h.y]).toEqual([MILLPOND.seat[0], MILLPOND.seat[1]]);
    const kept = JSON.stringify(h), out = idlePose(h, newPose(), t.now());
    expect(out?.park).toBe('fish');
    expect(JSON.stringify(h)).toBe(kept);
    // Ten minutes of fishing (well past the five a silent player is usually kept): not a word, and still there.
    const mid = t.said();
    for (let i = 0; i < 4 * 600; i++) t.frame(0.25);
    expect(t.said() - mid).toBe(0);
    expect(parkOf(seen(t.friend, t.g.profile.id)!)).toBe('fish');
    // Up again: one word, and the friend sees them stood back in town.
    t.g.leavePastime();
    for (let i = 0; i < 10; i++) t.frame(0.1);
    expect(t.said() - mid).toBe(1);
    expect(t.sock().sent[t.said() - 1].d.g).toBeUndefined();
    expect(parkOf(seen(t.friend, t.g.profile.id)!)).toBeNull();
  });

  it('at the butts: parked there with a bow; a newcomer is told once; no word per tick while shooting', () => {
    const t = town('RANGER');
    for (let i = 0; i < 20; i++) t.frame(0.1);
    const before = t.said();
    t.g.enterPastime('range');
    for (let i = 0; i < 60 * 20; i++) t.frame(1 / 60);
    expect(t.said() - before).toBe(1);
    const h = seen(t.friend, t.g.profile.id)!;
    expect(parkOf(h)).toBe('range');
    expect([h.x, h.y]).toEqual([BUTTS.seat[0], BUTTS.seat[1]]);
    // Someone arrives: they say hi, and hear back once where you are and what you're at.
    t.deliver({ k: 'hi', n: 'AVA', w: 'wand', l: 0, at: 'WICKHOLD', p: [20, 20, 0, 1, 0] }, 'hnewcomer1');
    const answer = t.sock().sent.slice(before + 1);
    expect(answer).toHaveLength(1);
    expect([answer[0].to, answer[0].d.g]).toEqual(['hnewcomer1', 'range']);
    for (let i = 0; i < 60 * 20; i++) t.frame(1 / 60);
    expect(t.said() - before).toBe(2);
    t.g.leavePastime();
    t.frame(0.3);
    expect(t.said() - before).toBe(3);
  });
});

describe('parked, the 3-minute idle rule waits', () => {
  it("fishing untouched 10 minutes (waiting for a bite) stays in the town's room; 20 minutes and it goes", () => {
    const t = town('WARRIOR', false);
    for (let i = 0; i < 20; i++) t.frame(0.1);
    t.g.enterPastime('fish');
    for (let i = 0; i < 2 * 600; i++) t.frame(0.5);
    expect([t.me.dozing, t.me.open]).toEqual([false, true]);
    expect(parkOf(seen(t.friend, t.g.profile.id)!)).toBe('fish');
    for (let i = 0; i < 2 * (AWAY.parked - 600 + 5); i++) t.frame(0.5);
    expect([t.me.dozing, t.me.open]).toEqual([true, false]);
  });

  it('stood in the square, untouched 3 minutes still drops you, as before; at the butts the 20 minutes hold', () => {
    const t = town('WARRIOR', false);
    for (let i = 0; i < 2 * (AWAY.idle + 5); i++) t.frame(0.5);
    expect(t.me.dozing).toBe(true);
    const w = town('RANGER', false);
    for (let i = 0; i < 20; i++) w.frame(0.1);
    w.g.enterPastime('range');
    for (let i = 0; i < 2 * (AWAY.idle + 60); i++) w.frame(0.5);
    expect([w.me.dozing, w.me.open]).toEqual([false, true]);
  });
});

describe('the pond and the butts in Wickhold', () => {
  it('the millpond is deep water by the east wall, Pennock and Abel stand by, and the spots are dry ground', () => {
    const m = townMap((new Game()).world);
    expect(m.water?.some((w) => w.deep && inArea(w, 51, 33))).toBe(true);
    const npc = (name: string) => m.npcs!.find((n) => n.name === name)!;
    expect(npc('OLD PENNOCK').talk).toBe('fish');
    expect(npc('ABEL').talk).toBe('range');
    useMap(m);
    for (const sp of [MILLPOND, BUTTS]) {
      const p = { x: sp.seat[0], y: sp.seat[1] };
      collide(p, 0.3);
      expect(Math.hypot(p.x - sp.seat[0], p.y - sp.seat[1])).toBeLessThan(0.05);
      for (const w of m.water ?? []) expect(inArea(w, p.x, p.y)).toBe(false);
    }
    // Close enough to talk to from the spot they look after.
    expect(Math.hypot(npc('OLD PENNOCK').x - MILLPOND.seat[0], npc('OLD PENNOCK').y - MILLPOND.seat[1])).toBeLessThan(4);
  });

  it('taking a pastime only works in the open town, and parks the hero facing the water or the targets', () => {
    const g = new Game();
    g.create('MAGE', 'IVY');
    if (g.mode === 'wood') g.skipWood();
    g.enterPastime('fish');
    expect([g.mode, g.pastime, g.hero.x, g.hero.y, g.hero.fx]).toEqual(['pastime', 'fish', MILLPOND.seat[0], MILLPOND.seat[1], 1]);
    g.leavePastime();
    expect([g.mode, g.pastime]).toEqual(['town', null]);
    g.enterYard();
    g.enterPastime('range');
    expect(g.mode).toBe('yard');
  });
});
