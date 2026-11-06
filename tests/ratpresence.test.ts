/**
 * The Rat's table and knife board and Halvard's anvil in the shared town (shared/pastimes.ts): sitting
 * down sends one word and nothing more however long you play; those in the same hall see you parked at
 * it (elbow on the table, at the board throwing, at the anvil with the hammer); getting up is one more
 * word. Each can only be taken in its own hall, and the spots stand clear of the furniture.
 */
import { describe, expect, it, vi } from 'vitest';
import { NO_INTENT } from '../src/sim/types';

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
const { Townfolk } = await import('../src/client/townfolk');
const { presence } = await import('../src/client/townpresence');
const { parkOf, PARK_LOOP } = await import('../src/client/parked');
const { idlePose } = await import('../src/client/idlepose');
const { newPose } = await import('../src/client/motion');
const { ANVIL, ARM_TABLE, KNIFE_LINE, placeOf, spotOf } = await import('../src/shared/pastimes');
const { townInterior } = await import('../src/shared/interiors');
const { newWorld } = await import('../src/shared/story');
const { collide, useMap } = await import('../src/shared/arena');
const { SPOT_REACH } = await import('../src/shared/town');
const { newArm, stepArm } = await import('../src/shared/armwrestle');
const { ARM_FOES } = await import('../src/shared/armtune');

type Folk = InstanceType<typeof Townfolk>;
type G = InstanceType<typeof Game>;
const into = (g: G, door: string) => g.enter(g.room.map.blocks.find((b) => b.door === door)!);

/** Me (a real Game, gone into `door`) and a friend standing in the same hall, on a pretend relay. */
function hall(door: 'tavern' | 'forge', cls: 'WARRIOR' | 'ROGUE' = 'WARRIOR') {
  socks.length = 0;
  const g = new Game();
  g.create(cls, 'WREN');
  if (g.mode === 'wood') g.skipWood();
  into(g, door);
  const place = g.room.map.name;
  const me = new Townfolk(g.profile.id), friend = new Townfolk('hfriend001');
  const at = new Map<Folk, Fake>(), read = new Map<Fake, number>();
  let now = 1000;
  const fMe = () => ({ n: 'SAM', w: 'longbow', l: 0, at: place, p: [7, 7, 0, 1, 0] as [number, number, number, number, number] });
  const pump = () => {
    for (const [f, s] of at) {
      const start = read.get(s) ?? 0;
      for (const { to, d } of s.sent.slice(start)) for (const [o, t] of at) if (o !== f && !t.closed && (to === '*' || to === o.id)) t.onMessage({ t: 'msg', from: f.id, d });
      read.set(s, s.sent.length);
    }
  };
  const frame = (dt: number) => {
    now += dt;
    g.step(dt, NO_INTENT);
    for (const [f, m] of [[me, presence(g, 'WREN')], [friend, fMe()]] as const) {
      (f as unknown as { touchedAt: number }).touchedAt = now;
      const n = socks.length;
      f.step(m, now, dt);
      if (socks.length > n) at.set(f, socks[socks.length - 1]), socks[socks.length - 1].onMessage({ t: 'role', role: 'peer' });
    }
    pump();
  };
  return { g, friend, frame, place, said: () => at.get(me)!.sent.length, sock: () => at.get(me)!, now: () => now };
}
const seen = (f: Folk, id: string) => f.where(id)?.hero;

describe('parked at the Rat and the anvil, for everyone in the hall', () => {
  for (const [id, door] of [['arm', 'tavern'], ['knives', 'tavern'], ['anvil', 'forge']] as const) {
    it(`${id}: one word to sit, none in five minutes of play, one to get up; the friend sees it drawn`, () => {
      const t = hall(door);
      expect(t.place).toBe(placeOf(id));
      for (let i = 0; i < 20; i++) t.frame(0.1);
      expect(seen(t.friend, t.g.profile.id)).toBeTruthy();
      const before = t.said();
      t.g.enterPastime(id);
      expect([t.g.mode, t.g.pastime]).toEqual(['pastime', id]);
      for (let i = 0; i < 10; i++) t.frame(0.1);
      const start = t.sock().sent.slice(before);
      expect(start).toHaveLength(1);
      expect([start[0].d.g, start[0].d.at]).toEqual([id, t.place]);
      const h = seen(t.friend, t.g.profile.id)!, sp = spotOf(id);
      expect(parkOf(h)).toBe(id);
      expect([h.x, h.y]).toEqual([sp.seat[0], sp.seat[1]]);
      const kept = JSON.stringify(h), out = idlePose(h, newPose(), t.now());
      expect(out?.park).toBe(id);
      expect(out!.parkT).toBeLessThan(PARK_LOOP[id]);
      expect(JSON.stringify(h)).toBe(kept);
      // Five minutes at it, the game itself stepping here all the while: not a word.
      const mid = t.said(), bout = newArm(1, ARM_FOES[3]);
      for (let i = 0; i < 4 * 300; i++) {
        t.frame(0.25);
        for (let k = 0; k < 15 && !bout.over; k++) stepArm(bout, k % 2 === 0);
      }
      expect(t.said() - mid).toBe(0);
      expect(parkOf(seen(t.friend, t.g.profile.id)!)).toBe(id);
      t.g.leavePastime();
      for (let i = 0; i < 10; i++) t.frame(0.1);
      expect(t.said() - mid).toBe(1);
      expect(t.sock().sent[t.said() - 1].d.g).toBeUndefined();
      expect(parkOf(seen(t.friend, t.g.profile.id)!)).toBeNull();
    });
  }

  it('each is taken only in its own hall: not in the square, not in the wrong hall, not in the yard', () => {
    const g = new Game();
    g.create('ROGUE', 'IVY');
    if (g.mode === 'wood') g.skipWood();
    for (const id of ['arm', 'knives', 'anvil'] as const) g.enterPastime(id), expect(g.mode).toBe('town');
    into(g, 'forge');
    g.enterPastime('arm');
    expect(g.mode).toBe('town');
    g.enterPastime('anvil');
    expect([g.mode, g.hero.x, g.hero.y, g.hero.fy]).toEqual(['pastime', ANVIL.seat[0], ANVIL.seat[1], -1]);
    g.leavePastime();
    expect(g.mode).toBe('town');
    g.enterYard();
    g.enterPastime('knives');
    expect(g.mode).toBe('yard');
  });
});

describe('the Rat and the forge laid out for it', () => {
  it('the table, the board and the anvil are there; the spots are clear floor near who keeps them', () => {
    const w = newWorld();
    const rat = townInterior('tavern', w), forge = townInterior('forge', w);
    expect(rat.blocks.some((b) => b.kind === 'armtable')).toBe(true);
    expect(rat.hangs?.some((h) => h.kind === 'knifeboard')).toBe(true);
    const npc = (m: typeof rat, name: string) => m.npcs!.find((n) => n.name === name)!;
    expect(npc(rat, 'A WATCHMAN OFF DUTY').talk).toBe('arm');
    expect(npc(rat, 'A CARD SHARP').talk).toBe('knives');
    // Everyone who was in the Rat is still in it.
    for (const name of ['BARKEEP GANNET', 'DICER MOLL', 'WHISPER', 'NETTLE', 'A DRUNK']) expect(npc(rat, name), name).toBeTruthy();
    for (const [m, sp, keeper] of [[rat, ARM_TABLE, 'A WATCHMAN OFF DUTY'], [rat, KNIFE_LINE, 'A CARD SHARP'], [forge, ANVIL, 'HALVARD THE SMITH']] as const) {
      useMap(m);
      const p = { x: sp.seat[0], y: sp.seat[1] };
      collide(p, 0.3);
      expect(Math.hypot(p.x - sp.seat[0], p.y - sp.seat[1]), keeper).toBeLessThan(0.05);
      const k = npc(m, keeper);
      expect(Math.hypot(k.x - sp.seat[0], k.y - sp.seat[1]), keeper).toBeLessThan(SPOT_REACH + 1);
    }
    // The board hangs over the knife line.
    expect(Math.abs(KNIFE_LINE.board.x + KNIFE_LINE.board.w / 2 - KNIFE_LINE.seat[0])).toBeLessThan(0.5);
  });
});
