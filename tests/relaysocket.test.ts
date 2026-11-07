/**
 * The page's side of the relay (src/client/relay.ts) on a fake WebSocket and fake clocks: one socket
 * per room, never more than one opening at a time, hops that a rejoin doesn't renew, and retries that
 * back off with jitter. The storm it guards against (docs/DECISIONS.md 2026-11-05): a friend whose
 * relay instance was deaf rejoined every 5 s and each rejoin hopped three more times at once, four
 * connections every 5 s, each kept 10 s, until the job was lost (the old client opened 51 in this test's minute).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { backoff, rejoinAfter, REJOIN } from '../src/client/backoff';

class FakeWS {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static all: FakeWS[] = [];
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  constructor(readonly url: string) {
    FakeWS.all.push(this);
  }
  send(d: string) {
    this.sent.push(d);
  }
  close(code = 1000) {
    if (this.readyState === 3) return;
    this.readyState = 3;
    setTimeout(() => this.onclose?.({ code }), 0);
  }
  /** The relay takes it and says `msgs`. */
  accept(...msgs: object[]) {
    this.readyState = 1;
    this.onopen?.();
    for (const m of msgs) this.onmessage?.({ data: JSON.stringify(m) });
  }
  /** Refused or dropped by the network. */
  fail() {
    this.readyState = 3;
    this.onclose?.({ code: 1006 });
  }
}
const alive = (room?: string) => FakeWS.all.filter((w) => w.readyState <= 1 && (!room || w.url.includes(`room=${room}&`)));

let RelaySocket: typeof import('../src/client/relay').RelaySocket;
beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance', 'Date'] });
  vi.stubGlobal('WebSocket', FakeWS);
  vi.stubGlobal('location', { search: '?relay=ws://relay/api/room', protocol: 'http:', host: 'relay' });
  vi.stubGlobal('window', { setTimeout: (f: () => void, ms?: number) => setTimeout(f, ms), clearTimeout: (t: number) => clearTimeout(t), setInterval: (f: () => void, ms?: number) => setInterval(f, ms), clearInterval: (t: number) => clearInterval(t) });
  vi.stubGlobal('document', { addEventListener: () => {}, removeEventListener: () => {}, visibilityState: 'visible' });
  vi.stubGlobal('addEventListener', () => {});
  vi.stubGlobal('removeEventListener', () => {});
  ({ RelaySocket } = await import('../src/client/relay'));
});
afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
beforeEach(() => (FakeWS.all = []));

describe('the relay socket', () => {
  it('holds one socket per room and player: a second for the same room closes the first', () => {
    const a = new RelaySocket('PJOBROOM1', 'kyle-0001', 'join');
    alive()[0].accept({ t: 'role', role: 'guest', host: 'lead-0001' });
    const b = new RelaySocket('PJOBROOM1', 'kyle-0001', 'join');
    expect(alive('PJOBROOM1')).toHaveLength(1);
    expect(a.open_).toBe(false);
    // Another room (the party's chat) is its own socket.
    const chat = new RelaySocket('PJOBROOM1CH', 'kyle-0001', 'peer');
    expect(alive()).toHaveLength(2);
    [b, chat].forEach((s) => s.close());
    expect(alive()).toHaveLength(0);
  });

  it('a deaf instance far from the leader: rejoins every 5 s for a minute open no burst of hops, and never more than two sockets', () => {
    const s = new RelaySocket('PJOBROOM2', 'kyle-0002', 'join');
    let most = 0;
    const answer = () => {
      // The relay answers every new socket: a guest, the leader on another instance (and nothing more: deaf).
      for (const w of alive('PJOBROOM2')) if (w.readyState === 0) w.accept({ t: 'info', shared: true }, { t: 'role', role: 'guest', host: 'lead-0002', far: 1 });
      most = Math.max(most, alive('PJOBROOM2').length);
    };
    answer();
    for (let t = 0; t < 60_000; t += 100) {
      if (t % 5000 === 4900) s.reconnect();
      vi.advanceTimersByTime(100);
      answer();
    }
    // Before: each of 12 rejoins brought 3 fresh hops at once (48 sockets, 4 or 5 open together).
    expect(FakeWS.all.length).toBeLessThanOrEqual(1 + 12 + 3);
    expect(most).toBeLessThanOrEqual(2);
    s.close();
  });

  it('never opens a second socket while one is still opening', () => {
    const s = new RelaySocket('PJOBROOM3', 'kyle-0003', 'join');
    s.reconnect();
    s.reconnect();
    vi.advanceTimersByTime(5000);
    expect(s.opened).toBe(1);
    // A new role (taking the job on) goes at once all the same.
    s.reconnect('take');
    expect(s.opened).toBe(2);
    expect(alive('PJOBROOM3')).toHaveLength(1);
    s.close();
  });

  it('backs off with jitter when the relay keeps refusing, and starts over after a steady connection', () => {
    const s = new RelaySocket('PJOBROOM4', 'kyle-0004', 'join');
    const at: number[] = [];
    for (let t = 0; t < 60_000; t += 50) {
      for (const w of alive('PJOBROOM4')) if (w.readyState === 0) (at.push(t), w.fail());
      vi.advanceTimersByTime(50);
    }
    const gaps = at.slice(1).map((t, i) => t - at[i]);
    // Growing waits up to the cap, so a minute of refusals is a handful of tries, not one a second.
    expect(at.length).toBeLessThanOrEqual(13);
    expect(gaps[3]).toBeGreaterThan(gaps[0]);
    expect(Math.max(...gaps)).toBeLessThanOrEqual(15_000 + 100);
    // A connection that stays up 30 s and then drops: the next try comes quickly again.
    vi.advanceTimersByTime(20_000);
    const w = alive('PJOBROOM4')[0];
    w.accept({ t: 'role', role: 'guest', host: 'lead-0004' });
    for (let t = 0; t < 31_000; t += 2000) (w.onmessage?.({ data: '{"t":"pong"}' }), vi.advanceTimersByTime(2000));
    w.fail();
    const n = s.opened;
    vi.advanceTimersByTime(600);
    expect(s.opened).toBe(n + 1);
    s.close();
  });

  it('a swap: the new socket opens first, and the old one closes the moment the new one is placed', () => {
    const s = new RelaySocket('PJOBROOM5', 'kyle-0005', 'join');
    alive()[0].accept({ t: 'role', role: 'guest', host: 'lead-0005' });
    const heard: string[] = [];
    s.onMessage = (m) => heard.push(m.t);
    // Heartbeat pongs keep it alive till the 4-minute swap.
    for (let t = 0; t < 240_500; t += 2000) {
      for (const w of alive()) if (w.readyState === 1) w.onmessage?.({ data: '{"t":"pong"}' });
      vi.advanceTimersByTime(2000);
    }
    expect(alive()).toHaveLength(2);
    const fresh = alive().find((w) => w.readyState === 0)!;
    fresh.accept({ t: 'info', shared: true });
    // (Told where it is, not yet who leads: the old one still delivers.)
    expect(alive()).toHaveLength(2);
    fresh.onmessage?.({ data: JSON.stringify({ t: 'role', role: 'guest', host: 'lead-0005' }) });
    expect(alive()).toHaveLength(1);
    expect(s.opened).toBe(2);
    s.close();
  });

  /** Pongs to every open socket for `ms`, so heartbeats keep them all. */
  const keep = (ms: number) => {
    for (let t = 0; t < ms; t += 2000) {
      for (const w of alive()) if (w.readyState === 1) w.onmessage?.({ data: '{"t":"pong"}' });
      vi.advanceTimersByTime(2000);
    }
  };

  it("a friend beside the leader whose 4-minute swap lands elsewhere keeps the old socket and tries again (2026-11-06)", () => {
    const s = new RelaySocket('PJOBROOM6', 'kyle-0006', 'join');
    const heard: unknown[] = [];
    s.onMessage = (m) => heard.push(m);
    alive()[0].accept({ t: 'info', shared: true, inst: 'near' }, { t: 'role', role: 'guest', host: 'lead-0006' });
    const first = alive()[0];
    keep(240_500);
    // The swap lands on another instance, away from the leader: it's closed, the old one kept.
    let fresh = alive().find((w) => w.readyState === 0)!;
    fresh.accept({ t: 'info', shared: true, inst: 'far' }, { t: 'role', role: 'guest', host: 'lead-0006', far: 1 });
    expect(alive()).toEqual([first]);
    expect(heard.some((m) => (m as { far?: number }).far)).toBe(false);
    // 15 s on it tries again, and this time lands beside the leader: that one's kept, the old one goes.
    keep(16_000);
    fresh = alive().find((w) => w.readyState === 0)!;
    fresh.accept({ t: 'info', shared: true, inst: 'near' }, { t: 'role', role: 'guest', host: 'lead-0006' });
    expect(alive()).toEqual([fresh]);
    s.close();
  });

  it('a swap that keeps landing away from the leader is taken anyway before Vercel ends the old one', () => {
    const s = new RelaySocket('PJOBROOM7', 'kyle-0007', 'join');
    alive()[0].accept({ t: 'info', shared: true, inst: 'near' }, { t: 'role', role: 'guest', host: 'lead-0007' });
    let at = 0;
    for (let t = 0; t < 300_000; t += 1000) {
      for (const w of alive()) if (w.readyState === 0) (w.accept({ t: 'info', shared: true, inst: 'far' }, { t: 'role', role: 'guest', host: 'lead-0007', far: 1 }), (at = t));
      for (const w of alive()) if (w.readyState === 1) w.onmessage?.({ data: '{"t":"pong"}' });
      vi.advanceTimersByTime(1000);
      if (alive().length === 1 && alive()[0].url && at && FakeWS.all.indexOf(alive()[0]) > 0) break;
    }
    // Taken by the 4 3/4 minute mark (the old one's 285 s), never past Vercel's 300.
    expect(FakeWS.all.indexOf(alive()[0])).toBeGreaterThan(0);
    expect(at).toBeLessThanOrEqual(285_000);
    s.close();
  });

  it('a hop that lands on the instance it left: no more hops this rotation (Vercel keeps the page there)', () => {
    const s = new RelaySocket('PJOBROOM8', 'kyle-0008', 'join');
    alive()[0].accept({ t: 'info', shared: true, inst: 'other' }, { t: 'role', role: 'guest', host: 'lead-0008', far: 1 });
    for (let t = 0; t < 60_000; t += 500) {
      for (const w of alive()) if (w.readyState === 0) w.accept({ t: 'info', shared: true, inst: 'other' }, { t: 'role', role: 'guest', host: 'lead-0008', far: 1 });
      for (const w of alive()) if (w.readyState === 1) w.onmessage?.({ data: '{"t":"pong"}' });
      vi.advanceTimersByTime(500);
    }
    // The first socket and one hop (it came back to 'other'), not three.
    expect(FakeWS.all.filter((w) => w.url.includes('PJOBROOM8'))).toHaveLength(2);
    expect(alive()).toHaveLength(1);
    s.close();
  });

  it("tells the relay its trip on the next connection, for the logs", () => {
    const s = new RelaySocket('PJOBROOM9', 'kyle-0009', 'join');
    alive()[0].accept({ t: 'info', shared: true, inst: 'a' }, { t: 'role', role: 'guest', host: 'lead-0009' });
    vi.advanceTimersByTime(4000);
    vi.advanceTimersByTime(80);
    alive()[0].onmessage?.({ data: '{"t":"pong"}' });
    s.reconnect();
    vi.advanceTimersByTime(5000);
    expect(FakeWS.all.filter((w) => w.url.includes('PJOBROOM9')).pop()!.url).toMatch(/&rtt=\d+/);
    s.close();
  });

  it('backoff and rejoin waits: capped, jittered, a long first wait for a far leader', () => {
    for (let n = 1; n < 12; n++) {
      const lo = backoff(n, () => 0), hi = backoff(n, () => 1);
      expect(lo).toBeGreaterThan(0);
      expect(hi).toBeLessThanOrEqual(15_000);
      expect(hi).toBeLessThanOrEqual(2 * lo);
      if (n > 1) expect(lo).toBeGreaterThanOrEqual(backoff(n - 1, () => 0));
    }
    expect(rejoinAfter(0, false)).toBe(REJOIN.welcome);
    expect(rejoinAfter(0, true)).toBe(REJOIN.first);
    expect(rejoinAfter(1, true, () => 1)).toBe(10);
    expect(rejoinAfter(5, true, () => 1)).toBe(REJOIN.cap);
  });
});
