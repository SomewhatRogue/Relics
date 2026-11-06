/**
 * Petting your own hound anywhere (docs/DECISIONS.md 2026-11-06, client/petting.ts, petwhen.ts,
 * petword.ts): PET is there with the hound at heel in town, a hall, the yard, a job and an expedition,
 * and gone with a goblin awake within PETTING.calm tiles; talking, a chest, a door, helping up and a
 * crate to grab all come first; any input stops it; petting again soon gets another reaction; and a
 * friend hears of it in one word, never per frame.
 */
import { describe, expect, it, vi } from 'vitest';
import { PETTING, TICK } from '../src/shared/tuning';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { NO_INTENT, type Enemy, type Hero } from '../src/sim/types';

/** A relay in a box: every socket the pages open, and each word sent reaches the others in its room. */
const socks: Fake[] = [];
class Fake {
  onMessage: (m: unknown) => void = () => {};
  onDown = () => {};
  sent: unknown[] = [];
  closed = false;
  open_ = true;
  rtt = 0;
  constructor(readonly room: string, readonly id: string, readonly want: string) {
    socks.push(this);
  }
  send(to: string, d: unknown) {
    if (this.closed) return;
    this.sent.push(d);
    for (const s of socks) if (s !== this && !s.closed && s.room === this.room && (to === '*' || to === s.id)) s.onMessage({ t: 'msg', from: this.id, d });
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

const { PET, REACTS, petFrame, petReact, startPet, stopPet } = await import('../src/client/petting');
const { ownPetOk } = await import('../src/client/petwhen');
const { petWord, readPet } = await import('../src/client/petword');
const { touchedIdle } = await import('../src/client/idlepoke');
const { houndAt, companion } = await import('../src/client/idlehound');
const { idlePose } = await import('../src/client/idlepose');
const { newPose } = await import('../src/client/motion');
const { newHero } = await import('../src/sim/hero');
const { Game } = await import('../src/client/game');
const { Townfolk } = await import('../src/client/townfolk');
const { presence } = await import('../src/client/townpresence');
const { ChatNet } = await import('../src/client/chatnet');
const { expedition } = await import('../src/shared/expedjob');

type G = InstanceType<typeof Game>;
const steps = (g: G, n: number) => {
  for (let k = 0; k < n; k++) g.step(TICK, NO_INTENT);
};
const fresh = () => (store.clear(), new Game());
const ranger = (): G => {
  const g = fresh();
  g.create('RANGER', 'WREN');
  if (g.mode === 'wood') g.skipWood();
  return g;
};
/** The hound brought to heel by a still hero, and PET looked for. */
const petHere = (g: G) => (steps(g, 80), g.near());
const job = (seed = 41): Job => ({ ...board(1)[0], layout: undefined, rooms: 3, place: PLACES.find((p) => p.kind === 'village')!, objective: 'hunt', boss: 'SKARN', seed, deep: false });
/** Every goblin asleep (or `awake` at `d` tiles to the hero's right). */
function quiet(g: G, awake?: number): Enemy | null {
  for (const e of g.room.enemies) Object.assign(e, { alert: false, x: g.hero.x + 40, y: g.hero.y + 40 });
  if (awake === undefined) return null;
  const e = g.room.enemies[0];
  Object.assign(e, { alert: true, x: g.hero.x + awake, y: g.hero.y, act: 'idle' });
  return e;
}
/** A clear spot on this map with nothing else to use near it (no door, person or chest). */
function clearSpot(g: G): void {
  // (The hound comes with the first steps.)
  steps(g, 3);
  const m = g.room.map;
  for (let y = 2; y < m.h - 2; y += 0.5) for (let x = 2; x < m.w - 2; x += 0.5) {
    Object.assign(g.hero, { x, y, moving: false });
    if (g.hero.hound) Object.assign(g.hero.hound, { x: x - 1, y: y + 0.2, state: 'heel' });
    const n = g.near();
    if (n?.pet === 'own') return;
  }
  throw new Error('no clear spot on ' + m.name);
}

describe('PET, your own hound, anywhere', () => {
  it('shows in the square, a hall and the yard, with the hound at heel', () => {
    const g = ranger();
    expect(g.mode).toBe('town');
    clearSpot(g);
    expect(petHere(g)).toMatchObject({ pet: 'own', label: 'PET YOUR HOUND' });
    for (const door of ['tavern', 'forge', 'hall']) {
      g.enterTown();
      steps(g, 4);
      g.enter(g.room.map.blocks.find((x) => x.door === door)!);
      steps(g, 4);
      clearSpot(g);
      expect(petHere(g)?.pet, door).toBe('own');
    }
    g.enterYard();
    steps(g, 10);
    clearSpot(g);
    expect(ownPetOk(g.hero, g.room, g.mode)).toBe(true);
  });

  it('shows on a job and an expedition with nothing awake near, and hides with a goblin awake close by', () => {
    for (const j of [job(), expedition(3)]) {
      const g = ranger();
      g.startJob(j);
      expect(g.mode).toBe('run');
      quiet(g);
      clearSpot(g);
      expect(petHere(g)?.pet, j.title).toBe('own');
      // A goblin awake inside PETTING.calm tiles: gone. Further off, or asleep close by: back.
      quiet(g, PETTING.calm - 1.5);
      expect(g.near()?.pet).toBeUndefined();
      expect(ownPetOk(g.hero, g.room, g.mode)).toBe(false);
      const e = quiet(g, PETTING.calm + 1.5)!;
      e.alert = true;
      expect(ownPetOk(g.hero, g.room, g.mode)).toBe(true);
      Object.assign(e, { alert: false, x: g.hero.x + 1.5, y: g.hero.y });
      expect(ownPetOk(g.hero, g.room, g.mode)).toBe(true);
    }
  });

  it('never for a Warrior, nor while mid-swing, nor with the hound off after something', () => {
    const w = fresh();
    w.create('WARRIOR', 'BRAM');
    if (w.mode === 'wood') w.skipWood();
    steps(w, 40);
    expect(w.near()?.pet).toBeUndefined();
    const g = ranger();
    clearSpot(g);
    g.hero.act = 'attack';
    expect(ownPetOk(g.hero, g.room, g.mode)).toBe(false);
    g.hero.act = 'idle';
    g.hero.hound!.state = 'run';
    expect(g.near()?.pet).toBeUndefined();
  });
});

describe('the context slot: everything else comes first', () => {
  it('talk, a chest and a door are offered before PET', () => {
    const g = ranger();
    // By a door in the square: ENTER.
    const b = g.room.map.blocks.find((x) => x.door === 'tavern')!;
    g.enter(b), g.enterTown(), steps(g, 4);
    const town = g.near();
    expect(town === null || !town.pet || !town.door).toBe(true);
    for (const blk of g.room.map.blocks.filter((x) => x.door && !x.locked)) {
      g.hero.x = blk.x + blk.w / 2;
      g.hero.y = blk.y + blk.h + 0.3;
      if (g.near()?.door) break;
    }
    expect(g.near()?.door).toBeTruthy();
    // By someone to talk to: TALK.
    const npc = g.room.map.npcs?.find((n) => !n.pose && !n.mute && !n.path);
    if (npc) {
      Object.assign(g.hero, { x: npc.x + 0.6, y: npc.y });
      expect(g.near()?.talk).toBeTruthy();
    }
    // On a job, by a shut chest: OPEN.
    g.startJob(job());
    quiet(g);
    clearSpot(g);
    g.room.chests.push({ id: 99, x: g.hero.x + 0.4, y: g.hero.y, state: 'shut' } as never);
    expect(g.near()?.chest).toBe(99);
  });

  it('help up and a crate to grab claim the slot; with them gone, PET', () => {
    const g = ranger();
    g.startJob(job());
    quiet(g);
    clearSpot(g);
    expect(g.near()?.pet).toBe('own');
    // A friend down at your feet: HELP UP, not PET.
    const f: Hero = Object.assign(newHero('f1', g.hero.x + 0.5, g.hero.y), { act: 'down', bleeding: true, actT: 0, actDur: 99 });
    g.room.heroes.push(f);
    expect(ownPetOk(g.hero, g.room, g.mode)).toBe(false);
    expect(g.near()?.pet).toBeUndefined();
    g.room.heroes.pop();
    expect(g.near()?.pet).toBe('own');
    // Carrying something: THROW.
    g.hero.carrying = 1 as never;
    expect(g.near()?.pet).toBeUndefined();
    g.hero.carrying = null as never;
    expect(g.near()?.pet).toBe('own');
  });
});

describe('a pet', () => {
  const still = (id: string): Hero => Object.assign(newHero(id, 10, 10), { weapon: 'longbow', fx: 1, fy: 0, hound: { x: 9, y: 10.2, fx: 1, fy: 0, state: 'heel', target: 0, t: 0, next: 0, back: 0, bites: 0, moving: false } });

  it('stops at any input: a press, the stick, a dodge, a step, a turn', () => {
    const h = still('me-a');
    let now = 100;
    // Each frame's input as main.ts reads it: anything at all stops the pet.
    const live = { ...NO_INTENT };
    touchedIdle(live);
    for (const poke of [{ rollSeq: 1 }, { attackSeq: 1 }, { mx: 0.5 }, { ax: 2 }, { potionSeq: 1 }]) {
      now += 10;
      expect(startPet(h, 'own', now)).toBe(true);
      expect(petFrame(h, now + 0.2)).not.toBeNull();
      const i = { ...live, ...poke };
      if (touchedIdle(i)) stopPet(h.id, now + 0.3);
      expect(petFrame(h, now + 0.4), JSON.stringify(poke)).toBeNull();
      touchedIdle({ ...NO_INTENT });
    }
    // And whatever the room does to the hero ends it on every screen: a dodge, a step, a turn.
    for (const k of [{ act: 'roll' }, { moving: true }, { fx: -1 }, { x: 11 }] as Partial<Hero>[]) {
      now += 10;
      const o = still('me-b');
      expect(startPet(o, 'own', now)).toBe(true);
      Object.assign(o, k);
      expect(petFrame(o, now + 0.2), JSON.stringify(k)).toBeNull();
    }
    // The drawing's clock is the frame's, a hair behind the press: that's the pet's start, not its end.
    const e = still('me-early');
    expect(startPet(e, 'own', 800)).toBe(true);
    expect(petFrame(e, 799.99)?.t).toBe(0);
    expect(petFrame(e, 801)).not.toBeNull();
    // Never started on the move: a dodge is never waited on.
    const m = Object.assign(still('me-c'), { moving: true });
    expect(startPet(m, 'own', 900)).toBe(false);
  });

  it('again soon after, the hound takes it another way; after a while, the first again', () => {
    const h = still('again-1');
    let now = 2000;
    const seen: string[] = [];
    for (let k = 0; k < 4; k++) {
      expect(startPet(h, 'own', now)).toBe(true);
      const f = petFrame(h, now + 0.1)!;
      seen.push(f.r);
      expect(petReact(h.id)).toBe(REACTS.indexOf(f.r));
      now += f.dur + PET.wait + 0.1;
    }
    expect(seen).toEqual(['lean', 'belly', 'lick', 'lean']);
    now += PET.again + 5;
    expect(startPet(h, 'own', now)).toBe(true);
    expect(petFrame(h, now + 0.1)!.r).toBe('lean');
    // Each drawn: the hero knelt, the hound beside them (on its back for the belly rub, up for the lick).
    for (const [r, t, want] of [[1, 1.6, 'belly'], [2, 1.6, 'lift']] as const) {
      const o = still('draw-' + r);
      startPet(o, 'own', 5000, r);
      expect(idlePose(o, newPose(), 5000 + t)?.petR).toBe(REACTS[r]);
      const a = houndAt(o, o.hound!.x, o.hound!.y, o.x, o.y, 5000 + t)!;
      expect(Math.hypot(a.x - o.x, a.y - o.y)).toBeLessThan(1.2);
      if (want === 'belly') expect(a.mood.belly).toBe(true);
      else expect(a.mood.lift).toBeGreaterThan(0);
    }
  });

  it('is cosmetic: the room and its hound are left as they were', () => {
    const g = ranger();
    clearSpot(g);
    steps(g, 60);
    const before = JSON.stringify({ h: { ...g.hero, seen: 0 }, d: g.hero.hound });
    startPet(g.hero, 'own', 7000);
    const pz = newPose();
    for (let t = 0; t < 3; t += 0.1) idlePose(g.hero, pz, 7000 + t), houndAt(g.hero, g.hero.hound!.x, g.hero.hound!.y, g.hero.x, g.hero.y, 7000 + t);
    expect(JSON.stringify({ h: { ...g.hero, seen: 0 }, d: g.hero.hound })).toBe(before);
  });
});

describe('a friend sees it', () => {
  it('in town: one word when it starts, read back on their screen as a pet of your hero', () => {
    socks.splice(0);
    const a = ranger(), b = ranger();
    const ta = new Townfolk('wren-0001'), tb = new Townfolk('sam-00002');
    const na = new ChatNet(() => 'wren-0001'), nb = new ChatNet(() => 'sam-00002');
    na.attach(ta), nb.attach(tb);
    const heard: { from: string; r: number; d: string }[] = [];
    nb.onPet = (from, w) => void heard.push({ from, r: w.r, d: w.d });
    // (On the page's own clock: untouched 3 minutes and the town's room is left, townfolk.ts.)
    let now = performance.now() / 1000;
    const frame = (dt: number) => {
      now += dt;
      a.step(dt, NO_INTENT), b.step(dt, NO_INTENT);
      ta.step(presence(a, 'WREN'), now, dt), tb.step(presence(b, 'SAM'), now, dt);
    };
    frame(0.1);
    // Both arrive: each says hi and hears the other.
    for (const s of socks) s.onMessage({ t: 'role', role: 'peer' });
    for (let k = 0; k < 20; k++) frame(0.1);
    expect(tb.here(b.room.map.name).length).toBe(1);
    const sends = () => socks.reduce((n, s) => n + s.sent.length, 0);
    // Half a minute stood still, then pet: one word more than standing still, and nothing per frame after.
    for (let k = 0; k < 300; k++) frame(0.1);
    const before = sends();
    // (Every page's own hero is 'me', and the tests above left it a wait: this one says its reaction.)
    expect(startPet(a.hero, 'own', now, 0)).toBe(true);
    na.sendPet(petWord('own', petReact(a.hero.id), 'WREN'), false);
    for (let k = 0; k < 300; k++) frame(0.1);
    expect(sends() - before).toBe(1);
    expect(heard).toEqual([{ from: 'wren-0001', r: 0, d: 'own' }]);
    // On Sam's screen, Wren's hero (and the hound walked at their heel) pet.
    const wren = tb.where('wren-0001')!.hero;
    expect(startPet(wren, 'own', now, heard[0].r)).toBe(true);
    expect(petFrame(wren, now + 1)?.r).toBe('lean');
    const d = companion(wren, now + 1)!, at = houndAt(wren, d.x, d.y, wren.x, wren.y, now + 1);
    expect(at?.mood.happy).toBe(true);
  });

  it('on a job: over the party chat room, and a bad word is no pet', () => {
    socks.splice(0);
    const na = new ChatNet(() => 'wren-0001'), nb = new ChatNet(() => 'sam-00002');
    na.setParty('ABCD'), nb.setParty('ABCD');
    const heard: unknown[] = [];
    nb.onPet = (from, w, party) => void heard.push({ from, r: w.r, party });
    na.sendPet(petWord('own', 2, 'WREN'), true);
    expect(heard).toEqual([{ from: 'wren-0001', r: 2, party: true }]);
    expect(readPet({ k: 'pet', d: 'cat', r: 1 })).toBeNull();
    expect(readPet({ k: 'pet', d: 'own', r: 99 })?.r).toBe(0);
    expect(readPet({ k: 'chat' })).toBeNull();
  });
});
