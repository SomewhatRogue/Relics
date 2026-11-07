/**
 * Who hosts a party's job, and a hidden host handing it on (docs/DECISIONS.md 2026-11-06, "who hosts").
 * The pick (lowest trip to the relay, a small lean to a healthy frame time, the leader kept on a near
 * tie, picked once at setting out); the hidden rule (a desktop after HIDE.desk s, a phone at once, alone
 * nothing, back in sight as a guest); the goodbye that names who takes it on; and the room the same
 * fight after it's handed on, tick for tick.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HIDE, HOSTPICK, handNow, linkScore, pickHost, sayAgain, type Link } from '../src/shared/hostpick';
import { HideWatch } from '../src/client/hidehost';
import { board, type Job } from '../src/shared/jobs';
import { expedition } from '../src/shared/expedjob';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT, type Intent } from '../src/sim/types';
import { ArenaRoom } from '../src/sim/room';
import { TICK } from '../src/shared/tuning';
import { packRoom, unpackRoom } from '../src/client/bigsave';

/** Every word a CoopHost or CoopGuest sends, and whether its socket was closed. */
const sent: { to: string; d: Record<string, unknown> }[] = [];
let closed = 0;
class Fake {
  onMessage: (m: unknown) => void = () => {};
  constructor() {}
  send(to: string, d: Record<string, unknown>) {
    sent.push({ to, d });
  }
  close() {
    closed++;
  }
  reconnect() {}
}
vi.mock('../src/client/relay', async (orig) => ({ ...(await orig<typeof import('../src/client/relay')>()), RelaySocket: Fake }));
vi.mock('../src/client/session', () => ({ keepJob: () => {}, keepSession: () => {}, keptJob: () => null }));
vi.mock('../src/client/owed', () => ({ OwedBook: class { frame() {} end() {} } }));
const { CoopGuest, CoopHost, jobJson, loadRoom, saveRoom } = await import('../src/client/coop');
const { Parties } = await import('../src/client/parties');

const L = (r: number, f = 16): Link => ({ r, f });

describe('who hosts', () => {
  it('the lowest trip to the relay wins', () => {
    expect(pickHost(['kyle', 'liacor'], { kyle: L(170), liacor: L(30) })).toBe('liacor');
    expect(pickHost(['kyle', 'a', 'b'], { kyle: L(170), a: L(90), b: L(40) })).toBe('b');
  });
  it('at the same trip, a healthy frame time wins (a laptop over a phone)', () => {
    expect(pickHost(['kyle', 'phone', 'laptop'], { kyle: L(200), phone: L(40, 45), laptop: L(40, 16) })).toBe('laptop');
    // (Order doesn't decide it: the laptop listed first or last.)
    expect(pickHost(['kyle', 'laptop', 'phone'], { kyle: L(200), phone: L(40, 45), laptop: L(40, 16) })).toBe('laptop');
    // A small lean, capped: a page at 200 ms a frame costs no more than frameMost.
    expect(linkScore(L(40, 200))).toBe(40 + HOSTPICK.frameMost);
    expect(linkScore(L(40, 20))).toBe(40);
  });
  it('the margin keeps the leader on a near tie', () => {
    expect(pickHost(['kyle', 'sam'], { kyle: L(54), sam: L(30) })).toBe('kyle');
    expect(pickHost(['kyle', 'sam'], { kyle: L(55), sam: L(30) })).toBe('sam');
    // The frame lean alone never moves the room: a phone leader at the same trip as a laptop keeps it.
    expect(pickHost(['kyle', 'sam'], { kyle: L(40, 60), sam: L(40, 10) })).toBe('kyle');
  });
  it('a trip not yet measured never wins, and an unmeasured leader keeps it', () => {
    expect(pickHost(['kyle', 'sam'], { kyle: L(170), sam: L(0) })).toBe('kyle');
    expect(pickHost(['kyle', 'sam'], { kyle: L(170) })).toBe('kyle');
    expect(pickHost(['kyle', 'sam'], { kyle: L(0), sam: L(20) })).toBe('kyle');
  });
  it('a member says their link again only when it is new or has moved', () => {
    expect(sayAgain(L(0), null, 0)).toBe(false);
    expect(sayAgain(L(40), null, 0)).toBe(true);
    const said = { l: L(40), at: 10 };
    expect(sayAgain(L(60), said, 12)).toBe(false); // (not within HOSTPICK.gap)
    expect(sayAgain(L(45), said, 30)).toBe(false);
    expect(sayAgain(L(52), said, 30)).toBe(true);
    expect(sayAgain(L(40, 30), said, 30)).toBe(true);
    expect(sayAgain(L(40), said, 10 + HOSTPICK.every)).toBe(true);
  });
});

/** Two browsers' parties on one fake town: what each says reaches the other. */
function town() {
  const words: { from: string; to: string; d: Record<string, unknown> }[] = [];
  const ps = new Map<string, InstanceType<typeof Parties>>();
  const make = (id: string, name: string, link: () => Link) => {
    const t = {
      offer: () => undefined as unknown,
      onWord: (_f: string, _d: Record<string, unknown>) => {},
      onOffers: () => {},
      others: () => [...ps].filter(([x]) => x !== id).map(([x, p]) => ({ id: x, name: x, pt: (p as unknown as { mine: unknown }).mine })),
      where: (x: string) => (ps.has(x) ? { hero: { tag: x.toUpperCase() }, at: 'square' } : null),
      say: (to: string, d: Record<string, unknown>) => (words.push({ from: id, to, d }), towns.get(to)?.onWord(id, d)),
      soon: () => {},
      rtt: 0,
    };
    towns.set(id, t);
    const p = new Parties(t as never, () => ({ id, name }));
    p.link = link;
    ps.set(id, p);
    return p;
  };
  const towns = new Map<string, { onWord: (f: string, d: Record<string, unknown>) => void }>();
  return { make, words };
}
const JOB = { ...board(3)[0] } as Job;

describe('setting out: the pick, once', () => {
  it("a member's link rides on their join word; setting out tells everyone who hosts", () => {
    const { make, words } = town();
    const lead = make('kyle', 'KYLE', () => L(170)), sam = make('sam', 'SAM', () => L(30));
    let told: string | undefined;
    sam.onGo = (_r, _j, _l, _m, host) => (told = host);
    lead.gather(JOB);
    sam.join('kyle');
    for (let t = 0; t < 3; t++) lead.step(true, t), sam.step(true, t);
    expect(lead.heardLinks().sam).toEqual(L(30));
    const go = lead.setOut()!;
    expect(go.host).toBe('sam');
    expect(told).toBe('sam');
    expect(words.filter((w) => w.d.k === 'go')).toHaveLength(1);
    expect(words.filter((w) => w.d.k === 'join').every((w) => Array.isArray(w.d.q))).toBe(true);
  });
  it('near equal, the leader hosts', () => {
    const { make } = town();
    const lead = make('kyle', 'KYLE', () => L(50)), sam = make('sam', 'SAM', () => L(30));
    lead.gather(JOB);
    sam.join('kyle');
    for (let t = 0; t < 3; t++) lead.step(true, t), sam.step(true, t);
    expect(lead.setOut()!.host).toBe('kyle');
  });
  it('a link not known at joining is said once it is, and only then', () => {
    const { make, words } = town();
    let r = 0;
    const lead = make('kyle', 'KYLE', () => L(170)), sam = make('sam', 'SAM', () => L(r));
    lead.gather(JOB);
    sam.join('kyle');
    for (let t = 0; t < 20; t++) lead.step(true, t), sam.step(true, t);
    expect(lead.heardLinks().sam).toBeUndefined();
    const before = words.length;
    r = 30;
    for (let t = 20; t < 40; t++) lead.step(true, t), sam.step(true, t);
    expect(words.length - before).toBe(1);
    expect(lead.setOut()!.host).toBe('sam');
  });
  it('no switch mid-job: once set out, later word changes nothing', () => {
    const { make, words } = town();
    let r = 30;
    const lead = make('kyle', 'KYLE', () => L(170)), sam = make('sam', 'SAM', () => L(r)), amy = make('amy', 'AMY', () => L(90));
    const hosts: string[] = [];
    sam.onGo = amy.onGo = (_r, _j, _l, _m, host) => void hosts.push(host);
    lead.gather(JOB);
    sam.join('kyle');
    amy.join('kyle');
    for (let t = 0; t < 3; t++) lead.step(true, t), sam.step(true, t), amy.step(true, t);
    lead.setOut();
    expect(hosts).toEqual(['sam', 'sam']);
    // Sam's link goes bad and Amy's good: out of town now, nobody's party, nothing more is picked.
    (r = 400), lead.step(false, 70), sam.step(false, 70), amy.step(false, 70);
    expect(words.filter((w) => w.d.k === 'go')).toHaveLength(2);
    expect(lead.setOut()).toBeNull();
  });
});

describe('a hidden host hands on', () => {
  afterEach(() => vi.restoreAllMocks());
  it('the rule: desktop after HIDE.desk (15 s), touch at once, a page going away at once, alone never', () => {
    const base = { hosting: true, friends: 1, touch: false };
    expect(handNow({ ...base, hiddenFor: -1 })).toBe(false);
    expect(handNow({ ...base, hiddenFor: HIDE.desk - 0.1 })).toBe(false);
    expect(handNow({ ...base, hiddenFor: HIDE.desk })).toBe(true);
    expect(handNow({ ...base, touch: true, hiddenFor: 0 })).toBe(true);
    expect(handNow({ ...base, hiddenFor: -1, gone: true })).toBe(true);
    expect(handNow({ ...base, friends: 0, touch: true, hiddenFor: 9, gone: true })).toBe(false);
    expect(handNow({ ...base, hosting: false, touch: true, hiddenFor: 9 })).toBe(false);
  });

  /** A page's watch on a fake clock and timers. */
  function watch(touch: boolean, friends = 1) {
    let now = 0;
    const timers: { at: number; fn: () => void }[] = [], log: string[] = [];
    let hosting = true;
    const w = new HideWatch({
      touch, now: () => now, hosting: () => hosting, friends: () => friends,
      hand: () => (log.push('hand'), (hosting = false), true),
      back: () => void log.push('back'),
      later: (fn, ms) => (timers.push({ at: now + ms / 1000, fn }), timers.length),
      cancel: (t) => void (timers[(t as number) - 1].fn = () => {}),
    });
    const to = (t: number) => {
      now = t;
      for (const x of timers.splice(0).filter((x) => x.at <= t || !timers.push(x))) x.fn();
    };
    return { w, log, to };
  }
  it('desktop: not at 14.9 s out of sight, at 15; back in sight, a guest', () => {
    expect(HIDE.desk).toBe(15);
    const { w, log, to } = watch(false);
    w.hidden();
    to(2.6), w.tick();
    to(14.9), w.tick();
    expect(log).toEqual([]);
    to(15.1);
    expect(log).toEqual(['hand']);
    w.visible();
    expect(log).toEqual(['hand', 'back']);
  });
  it('desktop: another tab 14 s (2026-11-06), back: nothing happens', () => {
    const { w, log, to } = watch(false);
    w.hidden();
    to(14), w.visible();
    to(30), w.tick();
    expect(log).toEqual([]);
  });
  it('touch: at once', () => {
    const { w, log } = watch(true);
    w.hidden();
    expect(log).toEqual(['hand']);
    w.visible();
    expect(log).toEqual(['hand', 'back']);
  });
  it('a page going away (pagehide): at once, on a desktop too', () => {
    const { w, log } = watch(false);
    w.gone();
    expect(log).toEqual(['hand']);
  });
  it("solo: today's behaviour (the room runs on here, nothing handed, nothing to follow)", () => {
    const { w, log, to } = watch(true, 0);
    w.hidden(), to(9), w.tick(), w.gone(), w.visible();
    expect(log).toEqual([]);
  });

  it('the host: the whole job to everyone, a goodbye naming who takes it, the socket shut at once', () => {
    sent.length = closed = 0;
    const room = new ArenaRoom(3, { scrappers: false });
    room.join('me');
    const game = { room, run: null, roomKey: 1, goalText: () => '', houses: () => [], addFriend() {}, dropFriend() {}, roomOf: () => room, keyOf: () => 1, stepped: new Map(), doorMarks: () => [], jobSave: () => ({ room: saveRoom(room), houses: [] }) };
    const host = new CoopHost('PROOM0001', 'kyle', 'KYLE', game as never, [['kyle', 'KYLE'], ['sam', 'SAM'], ['amy', 'AMY']]);
    expect(host.handOver(true)).toBe('amy');
    expect(sent.map((s) => Object.keys(s.d).sort().join())).toEqual(['save', 'bye,stay,to']);
    expect(sent[1].d).toEqual({ bye: 1, stay: 1, to: 'amy' });
    expect(closed).toBe(1);
  });

  /** A friend following, with a room of three (me, the host, and `other`) and a save to take on from. */
  function guest(me: string, other: string) {
    vi.spyOn(performance, 'now').mockReturnValue(100_000);
    const g = new CoopGuest('PROOM0001', me, 'kyle', () => ({}) as never, JOB);
    const room = new ArenaRoom(3, { scrappers: false });
    for (const id of ['me', '@lead', other]) room.join(id);
    Object.assign(g, { room, save: '{}' });
    const hear = (m: object) => (g as unknown as { heard: (m: object) => void }).heard(m);
    const at = (s: number) => (vi.spyOn(performance, 'now').mockReturnValue(s * 1000), g.shouldTake(s));
    return { g, hear, at };
  }
  it('the friend named takes it on, ahead of one first by id; the host stays in the job', () => {
    const sam = guest('sam', 'amy'), amy = guest('amy', 'sam');
    for (const x of [sam, amy]) x.hear({ t: 'msg', from: 'kyle', d: { bye: 1, stay: 1, to: 'sam' } });
    expect(sam.at(101)).toBe(false);
    expect(sam.at(102.6)).toBe(true);
    expect(amy.at(102.6)).toBe(false);
    expect(sam.g.left).toBe(false);
  });
  it("the relay saying the host's gone frees it at once", () => {
    const sam = guest('sam', 'amy');
    sam.hear({ t: 'msg', from: 'kyle', d: { bye: 1, stay: 1, to: 'sam' } });
    sam.hear({ t: 'left', id: 'kyle' });
    expect(sam.at(100.05)).toBe(true);
  });
  it('a goodbye for home (LEAVE) is as it was: first by id, and the leader goes with it', () => {
    const sam = guest('sam', 'amy'), amy = guest('amy', 'sam');
    for (const x of [sam, amy]) x.hear({ t: 'msg', from: 'kyle', d: { bye: 1 } }), x.hear({ t: 'left', id: 'kyle' });
    expect(amy.at(102.6)).toBe(true);
    expect(sam.at(102.6)).toBe(false);
    expect(amy.g.left).toBe(true);
  });
  it("hearing the leader while out of sight (no frames) doesn't make them look quiet when back", () => {
    const sam = guest('sam', 'amy');
    sam.at(100);
    // (Its last frame was at 100 s.)
    (sam.g as unknown as { now: number }).now = 100;
    // Twenty seconds hidden: no frames, but the leader's words still come.
    for (let s = 101; s <= 120; s++) vi.spyOn(performance, 'now').mockReturnValue(s * 1000), sam.hear({ t: 'msg', from: 'kyle', d: { save: '{}' } });
    expect(sam.g.quiet(120.1)).toBeLessThan(1);
    expect(sam.at(120.1)).toBe(false);
  });
});

/** The same Intents for player `who` on tick `i`: walking about, swinging, blocking, dodging. */
function act(i: number, who: number): Intent {
  const a = (i / 40 + who) * 1.7;
  return { ...NO_INTENT, mx: Math.cos(a), my: Math.sin(a), ax: Math.cos(a), ay: Math.sin(a), attackSeq: Math.floor(i / 9), block: i % 50 > 40, rollSeq: Math.floor(i / 70) };
}
const swap = (s: string, a: string, b: string) => s.split(`"${a}"`).join('"\u0000"').split(`"${b}"`).join(`"${a}"`).split('"\u0000"').join(`"${b}"`);

/**
 * The whole job as the host hands it on (packRoom, jobJson, the ids swapped as the friend taking it on
 * swaps them, unpackRoom, loadRoom), then stepped on with the same Intents beside the host's own room and
 * beside the same save loaded without the swap. Returns the three, each with the ids as the host had them.
 */
function handedOn(job: Job, party: number, before: number, after: number): { host: string; friend: string; plain: string; drift: number } {
  const room = runRoom({ ...newRun(job), party });
  const ids = ['me', 'sam-0001', 'amy-0001'].slice(0, party);
  for (const id of ids) room.join(id);
  for (let i = 0; i < before; i++) {
    ids.forEach((id, w) => room.setIntent(id, act(i, w)));
    room.step();
  }
  // Sam takes it on: the old host's `me` is their id now, and Sam is `me`.
  const wire = jobJson({ room: packRoom(saveRoom(room), job) });
  const copy = loadRoom(unpackRoom(JSON.parse(swap(swap(wire, 'me', 'kyle-0001'), 'sam-0001', 'me')).room, job));
  const plain = loadRoom(unpackRoom(JSON.parse(wire).room, job));
  const drift = Math.max(0, ...room.enemies.map((e, k) => Math.hypot(e.x - copy.enemies[k].x, e.y - copy.enemies[k].y)));
  const ids2 = ['kyle-0001', 'me', 'amy-0001'].slice(0, party);
  for (let i = before; i < before + after; i++) {
    ids.forEach((id, w) => (room.setIntent(id, act(i, w)), plain.setIntent(id, act(i, w))));
    ids2.forEach((id, w) => copy.setIntent(id, act(i, w)));
    for (const r of [room, copy, plain]) r.step();
  }
  const back = (r: ArenaRoom) => swap(swap(JSON.stringify(saveRoom(r)), 'sam-0001', 'me'), 'me', 'kyle-0001');
  return { host: JSON.stringify(saveRoom(room)), friend: back(copy), plain: JSON.stringify(saveRoom(plain)), drift };
}

describe('the room across a handover', () => {
  it('a street mid-fight (a pack rushing, barrels about): the same fight, tick for tick, on the friend who took it', () => {
    const job = board(3).find((j) => !j.exped)!;
    const r = handedOn(job, 2, Math.round(6 / TICK), Math.round(20 / TICK));
    expect(r.friend).toBe(r.host);
    expect(JSON.parse(r.host).props.length).toBeGreaterThan(0);
  });
  it('an expedition with three: its save is to the centimetre (bigsave.ts), and from it the same fight on any page', () => {
    const r = handedOn(expedition(2), 3, Math.round(4 / TICK), Math.round(12 / TICK));
    expect(r.drift).toBeLessThanOrEqual(0.0071);
    expect(r.friend).toBe(r.plain);
  });
});
