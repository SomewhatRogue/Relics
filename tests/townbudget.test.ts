/**
 * The relay budget, kept (docs/REALTIME-REDIS-BUDGET.md, docs/DECISIONS.md 2026-11-05): the training
 * yard is this browser's alone and says nothing to the relay, swinging nonstop for an hour; walking
 * back into Wickhold opens the town's room again and says `hi` once; alone in a hall you don't speak
 * as you walk; and an idle town tab and a yard tab stay under a set number of Redis commands an hour.
 *
 * The page's side runs for real (Game, Townfolk, townpresence.ts) on a fake socket that counts what
 * it's given; the relay's side is the real relay (api/_relay.ts) on a counted memory backend, which
 * says what a socket's open, close and quiet hour cost. Commands an hour = the two together, for a
 * player alone on their instance (the usual case; a split town costs more per word: budget-online.cjs).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { memoryBackend } from '../api/_relay';
import { ALONE_MS } from '../api/_presence';
import { instance, player, wait } from './relaykit';
import { NO_INTENT, type Intent } from '../src/sim/types';

/** Every socket the page opens, and what it sends. */
const socks: Fake[] = [];
class Fake {
  onMessage: (m: unknown) => void = () => {};
  onDown = () => {};
  sent: { to: string; d: unknown }[] = [];
  closed = false;
  constructor(readonly room: string, readonly id: string, readonly want: string) {
    socks.push(this);
  }
  get open_() {
    return !this.closed;
  }
  send(to: string, d: unknown) {
    if (!this.closed) this.sent.push({ to, d });
  }
  close() {
    this.closed = true;
  }
  reconnect() {}
}
vi.mock('../src/client/relay', async (orig) => ({ ...(await orig<typeof import('../src/client/relay')>()), RelaySocket: Fake }));
vi.stubGlobal('addEventListener', () => {});
vi.stubGlobal('document', { addEventListener: () => {}, visibilityState: 'visible', hidden: false });

const { Game } = await import('../src/client/game');
const { Townfolk } = await import('../src/client/townfolk');
const { presence } = await import('../src/client/townpresence');
const { inArea } = await import('../src/shared/arena');
type G = InstanceType<typeof Game>;

/**
 * What the relay itself spends, measured: a peer socket opening on an instance with nobody else in
 * the room, closing as the room's last, and swapped for a fresh one (relay.ts rotates every 4 minutes).
 */
const cost = { open: 0, close: 0, swap: 0, quietHour: 0 };
beforeAll(async () => {
  const srv = await instance(memoryBackend());
  const c = () => srv.relay.meter.total;
  let n = c();
  const a = player(srv.port, 'WICKHOLD1', 'kyle-0001', 'peer');
  await a.until((m) => m.t === 'role');
  cost.open = c() - n;
  n = c();
  const b = player(srv.port, 'WICKHOLD1', 'kyle-0001', 'peer');
  await b.until((m) => m.t === 'role');
  a.close();
  await wait(150);
  cost.swap = c() - n;
  n = c();
  b.close();
  await wait(150);
  cost.close = c() - n;
  srv.close();
  // An open socket alone on its instance: the presence beat (one 'here' each ALONE_MS) and a swap each 4 minutes.
  cost.quietHour = 3_600_000 / ALONE_MS + 15 * cost.swap;
});

/** A page: the game and its town connection, a hero made and in Wickhold. */
function page() {
  const g = new Game();
  g.create('WARRIOR', 'KYLE');
  if (g.mode === 'wood') g.skipWood();
  const t = new Townfolk(g.profile.id);
  const s = { g, t, now: performance.now() / 1000, opens: 0, closes: 0, openSecs: 0 };
  return s;
}
type Page = ReturnType<typeof page>;
const live = () => socks.filter((x) => !x.closed);
const words = () => socks.reduce((n, x) => n + x.sent.length, 0);

/** One frame of `dt` seconds: the game steps, and the town is told where I am (main.ts does both). */
function frame(p: Page, dt: number, i: Intent = NO_INTENT): void {
  const before = live().length;
  p.now += dt;
  p.g.step(dt, i);
  p.t.step(presence(p.g, 'KYLE'), p.now, dt);
  const after = live().length;
  if (after > before) p.opens++, live().forEach((x) => x.onMessage({ t: 'role', role: 'peer' }));
  if (after < before) p.closes++;
  p.openSecs += after ? dt : 0;
}
/** Someone else in town, standing in place `at`. */
function friend(at: string, x = 20, y = 14) {
  for (const s of live()) s.onMessage({ t: 'msg', from: 'sam-00001', d: { k: 'me', n: 'SAM', w: 'bow', at, p: [x, y, 0, 1, 0] } });
}
/** Swinging nonstop and walking back and forth. */
const swinging = (k: number): Intent => ({ ...NO_INTENT, mx: Math.floor(k / 20) % 2 ? 1 : -1, attack: k % 4 < 2, attackSeq: Math.floor(k / 4) });
const commands = (p: Page, secs: number) => p.opens * cost.open + p.closes * cost.close + (p.openSecs / 3600) * cost.quietHour * (3600 / secs);
const LIMIT = { yard: 12, idleTown: 30 };
/** What was found, for scripts/budget-check.cjs (BUDGET_OUT=file writes it there). */
const found: Record<string, unknown> = { limit: LIMIT };
afterAll(async () => {
  const out = process.env.BUDGET_OUT;
  if (out) (await import('node:fs')).writeFileSync(out, JSON.stringify({ ...found, cost }, null, 1));
});

describe('the training yard is this browser alone', () => {

  it('sends nothing to the relay, swinging nonstop for an hour with straw men set going; walking out rejoins the town once', () => {
    socks.splice(0);
    const p = page();
    frame(p, 0.1);
    friend(p.g.room.map.name);
    for (let k = 0; k < 20; k++) frame(p, 0.1);
    expect(live()).toHaveLength(1);
    const n0 = words();
    p.g.enterYard();
    frame(p, 0.1);
    // The town's room left as you go in.
    expect(live()).toHaveLength(0);
    const yard = { ...p, opens: 0, closes: 0, openSecs: 0 };
    let attacks = 0;
    for (let k = 0; k < 18_000; k++) {
      // The straw men too (sim/practice.ts): a drill, and a heavy now and then.
      if (k === 50) yard.g.practice({ k: 'drill', key: 'hold' });
      if (k % 3000 === 1500) yard.g.practice({ k: 'single', key: 'heavy' });
      const i = swinging(k);
      frame(yard, 0.2, i);
      attacks = i.attackSeq;
      // (Never off to town by walking into the gate: that's the next test.)
      if (yard.g.mode !== 'yard') yard.g.enterYard();
    }
    expect(attacks).toBeGreaterThan(4000);
    expect(socks).toHaveLength(1);
    expect(words()).toBe(n0);
    expect(yard.opens).toBe(0);
    // (The town room left on the way in counts to the yard.)
    found.yard = { perHour: Math.round(cost.close + commands(yard, 3600)), words: words() - n0, opens: yard.opens, swings: attacks };
    expect(cost.close + commands(yard, 3600)).toBeLessThanOrEqual(LIMIT.yard);
  });

  it('walking out of the yard gate (not knocked into it) opens the town again, says hi once, and sees who is there', () => {
    socks.splice(0);
    const p = page();
    p.g.enterYard();
    for (let k = 0; k < 30; k++) frame(p, 0.1);
    expect(socks).toHaveLength(0);
    // To the gate.
    const out = p.g.room.map.exit!, h = p.g.hero;
    Object.assign(h, { x: out.x + out.w / 2, y: out.y + out.h / 2 });
    expect(inArea(out, h.x, h.y)).toBe(true);
    // Knocked into the gate isn't walking out: still in the yard, still nothing sent.
    Object.assign(h, { act: 'hurt', actT: 0, actDur: 0.3 });
    frame(p, 0.05);
    expect(p.g.mode).toBe('yard');
    Object.assign(h, { act: 'idle', x: out.x + out.w / 2, y: out.y + out.h / 2 });
    frame(p, 0.05);
    expect(p.g.mode).toBe('yard');
    expect(socks).toHaveLength(0);
    // Walking out (pushing down through it): back in town.
    Object.assign(h, { x: out.x + out.w / 2, y: out.y + out.h / 2 });
    frame(p, 0.1, { ...NO_INTENT, my: 1 });
    expect(p.g.mode).toBe('town');
    expect(live()).toHaveLength(1);
    expect(live()[0]).toMatchObject({ room: 'WICKHOLD1', want: 'peer' });
    const said = live()[0].sent.map((m) => (m.d as { k?: string }).k);
    expect(said).toEqual(['hi']);
    friend(p.g.room.map.name);
    frame(p, 0.1);
    expect(p.t.count).toBe(1);
  });
});

describe('the town says little', () => {
  it('alone in a hall, walking says nothing; someone walking in is told where you stand at once', () => {
    socks.splice(0);
    const p = page();
    frame(p, 0.1);
    friend(p.g.room.map.name);
    frame(p, 0.1);
    // Into a hall with a door.
    const d = p.g.room.map.blocks.find((b) => b.door && !b.ruined)!;
    p.g.enter(d);
    for (let k = 0; k < 5; k++) frame(p, 0.1);
    const hall = p.g.room.map.name, n0 = words();
    // Back and forth across it (not out of its door).
    for (let k = 0; k < 300; k++) frame(p, 0.1, { ...NO_INTENT, mx: Math.floor(k / 8) % 2 ? 1 : -1, my: Math.floor(k / 8) % 2 ? -0.3 : 0 });
    expect(p.g.room.map.name).toBe(hall);
    expect(words()).toBe(n0);
    friend(hall, p.g.hero.x + 1, p.g.hero.y);
    for (let k = 0; k < 3; k++) frame(p, 0.1);
    const last = live()[0].sent.at(-1)?.d as { at?: string; p?: number[] };
    expect(words()).toBe(n0 + 1);
    expect(last.at).toBe(hall);
    expect(last.p![0]).toBeCloseTo(p.g.hero.x, 1);
  });

  it(`an idle town tab costs under ${LIMIT.idleTown} commands an hour; it leaves the room and nothing after`, () => {
    socks.splice(0);
    const p = page();
    for (let k = 0; k < 18_000; k++) frame(p, 0.2);
    expect(p.t.dozing).toBe(true);
    expect(live()).toHaveLength(0);
    expect(p.opens).toBe(1);
    expect(p.openSecs).toBeLessThan(200);
    expect(cost.open).toBeGreaterThan(0);
    found.idleTown = { perHour: Math.round(commands(p, 3600)), words: words(), opens: p.opens, openSecs: Math.round(p.openSecs) };
    expect(commands(p, 3600)).toBeLessThanOrEqual(LIMIT.idleTown);
  });
});
