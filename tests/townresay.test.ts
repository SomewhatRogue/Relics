/**
 * Two players in Wickhold see each other where they stand even when a word is lost on the way
 * (client/townfolk.ts SETTLE, NEAR, HI_AGAIN). The others carry a walker on along the last walk they heard
 * (reckon.ts), so a lost "stopped" used to leave the walker three seconds further on, on their screens only,
 * for two minutes; and a lost `hi` left a newcomer and the town unseen by each other as long.
 */
import { describe, expect, it, vi } from 'vitest';

type Word = { to: string; d: Record<string, unknown> };
const socks: Fake[] = [];
class Fake {
  onMessage: (m: unknown) => void = () => {};
  onDown = () => {};
  sent: Word[] = [];
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
vi.stubGlobal('window', { setTimeout: () => 0 });

const { Townfolk } = await import('../src/client/townfolk');
type Folk = InstanceType<typeof Townfolk>;
type Me = Parameters<Folk['step']>[0];

/** Two pages on a pretend relay that carries every word to the other, but for those `lose` says to drop. */
function pair(lose: (from: string, w: Word, now: number) => boolean) {
  socks.length = 0;
  let now = 100;
  const a = new Townfolk('aaaaaa'), b = new Townfolk('bbbbbb'), at = { a: [10, 10, 0, 1, 0], b: [14, 10, 0, 1, 0] };
  const me = (n: string, p: number[]): Me => ({ n, w: 'sword', at: 'WICKHOLD', p } as unknown as Me);
  const sock = (t: Folk) => socks.find((s) => s.id === t.id && !s.closed);
  const carry = () => {
    for (const [from, to] of [[a, b], [b, a]] as const) {
      const s = sock(from);
      for (const w of s?.sent.splice(0) ?? []) if (!lose(from.id, w, now) && (w.to === '*' || w.to === to.id)) sock(to)?.onMessage({ t: 'msg', from: from.id, d: w.d });
    }
  };
  /** `secs` of frames at 30 a second: each steps where it is, then the words go across. */
  const run = (secs: number, walk?: (t: number) => void) => {
    for (let i = 0; i < secs * 30; i++) {
      now += 1 / 30;
      walk?.(1 / 30);
      (performance as unknown as { now: () => number }).now = () => now * 1000;
      if (inTown.has(a)) a.step(me('KYLE', at.a), now, 1 / 30);
      if (inTown.has(b)) b.step(me('SAM', at.b), now, 1 / 30);
      carry();
    }
  };
  /** A page comes into town: its socket opens (a first frame), and the relay tells it its part. */
  const inTown = new Set<Folk>();
  const arrive = (t: Folk) => {
    inTown.add(t);
    run(1 / 30);
    sock(t)!.onMessage({ t: 'role', role: 'peer' });
  };
  /** Where `who` has the other, on their screen. */
  const seen = (who: Folk) => who.here('WICKHOLD')[0];
  return { a, b, at, run, arrive, seen, carry, time: () => now };
}

describe('the town says again where you stand', () => {
  it('a lost "stopped": the walker is where they stand on the other screen within a few seconds, not two minutes', () => {
    let walking = false, stoppedAt = Infinity;
    // (Kyle's word that he's stopped, and only that one, never arrives.)
    const t = pair((from, w, now) => from === 'aaaaaa' && w.d.k === 'me' && !walking && now - stoppedAt < 0.5);
    t.arrive(t.a), t.arrive(t.b);
    t.run(1);
    expect(Math.hypot(t.seen(t.b).x - 10, t.seen(t.b).y - 10)).toBeLessThan(0.1);
    // Kyle walks east two seconds, then stops.
    walking = true;
    Object.assign(t.at.a, { 2: 1, 3: 0, 4: 1 });
    t.run(2, (dt) => (t.at.a[0] += 4 * dt));
    walking = false;
    stoppedAt = t.time();
    Object.assign(t.at.a, { 4: 0 });
    t.run(4);
    const off = Math.hypot(t.seen(t.b).x - t.at.a[0], t.seen(t.b).y - t.at.a[1]);
    expect(off).toBeLessThan(0.2);
  });

  it('standing together costs a word every 20 seconds each, and nothing more', () => {
    const words: string[] = [];
    const t = pair((from, w) => (words.push(from + ':' + w.d.k), false));
    t.arrive(t.a), t.arrive(t.b);
    t.run(5);
    words.length = 0;
    t.run(60);
    expect(words.filter((w) => w.startsWith('aaaaaa')).length).toBe(3);
    expect(words.filter((w) => w.startsWith('bbbbbb')).length).toBe(3);
  });

  it('a lost `hi`: the newcomer and the one already there still find each other in a few seconds', () => {
    let first = true;
    // (Sam's first `hi` never arrives.)
    const t = pair((from, w) => from === 'bbbbbb' && w.d.k === 'hi' && first && !(first = false));
    t.arrive(t.a);
    t.run(5);
    t.arrive(t.b);
    t.run(5);
    expect(t.seen(t.a)).toBeTruthy();
    expect(t.seen(t.b)).toBeTruthy();
    expect(Math.hypot(t.seen(t.a).x - 14, t.seen(t.a).y - 10)).toBeLessThan(0.2);
    expect(Math.hypot(t.seen(t.b).x - 10, t.seen(t.b).y - 10)).toBeLessThan(0.2);
  });

  it('alone in town: one more `hi` after arriving, then silence', () => {
    const words: string[] = [];
    // (Nobody else hears anything: the other page's words are lost, and it never arrives.)
    const t = pair((from, w) => (from === 'aaaaaa' && words.push(String(w.d.k)), true));
    t.arrive(t.a);
    t.run(300);
    expect(words).toEqual(['hi', 'hi']);
  });
});
