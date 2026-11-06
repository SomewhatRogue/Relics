/**
 * Idles and petting (docs/DECISIONS.md 2026-11-05, client/idles.ts, petting.ts): an idle only after
 * standing still, never with a goblin awake near, cut off by any input; three a class and a rare one
 * about one pick in fifty; the Ranger's mostly with the hound; Maeve's hound to pet in the hunters' lodge
 * and nowhere else (your own anywhere: tests/petting.test.ts); and none of it sends a word to the relay or changes the room.
 */
import { describe, expect, it, vi } from 'vitest';
import { Rng } from '../src/shared/rng';
import { CLASS_KITS, CLASS_ORDER } from '../src/shared/tuning';
import { NO_INTENT, type Enemy, type Hero } from '../src/sim/types';

/** Every socket the page opens, and what it sends (as tests/townbudget.test.ts). */
const socks: Fake[] = [];
class Fake {
  onMessage: (m: unknown) => void = () => {};
  onDown = () => {};
  sent: unknown[] = [];
  closed = false;
  constructor(readonly room: string, readonly id: string, readonly want: string) {
    socks.push(this);
  }
  send(_to: string, d: unknown) {
    if (!this.closed) this.sent.push(d);
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

const { IDLE, IDLES, calmAround, commonFor, forceIdle, idleFrame, idleWorld, pickIdle, pokeIdle } = await import('../src/client/idles');
const { LODGE_DOG, PET, petFrame, startPet } = await import('../src/client/petting');
const { idlePose } = await import('../src/client/idlepose');
const { companion, houndAt, lodgeHoundAt } = await import('../src/client/idlehound');
const { newPose } = await import('../src/client/motion');
const { newHero } = await import('../src/sim/hero');
const { Game } = await import('../src/client/game');
const { Townfolk } = await import('../src/client/townfolk');
const { presence } = await import('../src/client/townpresence');

const hero = (id: string, weapon: Hero['weapon'] = 'sword'): Hero => Object.assign(newHero(id, 10, 10), { weapon, fx: 1, fy: 0 });
const goblin = (x: number, y: number, alert?: boolean) => ({ id: 1, x, y, act: 'idle', alert, kind: 'scrapper', hp: 10 }) as unknown as Enemy;
/** Watch a hero `secs` at 20 frames a second from `t0`; the times an idle was playing. */
function watch(h: Hero, t0: number, secs: number, each?: (t: number) => void): number[] {
  const on: number[] = [];
  for (let t = t0; t < t0 + secs; t += 0.05) {
    each?.(t);
    if (idleFrame(h, t)) on.push(t - t0);
  }
  return on;
}

describe('idles', () => {
  it('start only after standing still a few seconds, and come back now and then', () => {
    idleWorld([], null);
    const h = hero('still-1'), on = watch(h, 100, 60);
    expect(on.length).toBeGreaterThan(0);
    expect(on[0]).toBeGreaterThanOrEqual(IDLE.settle[0] - 0.1);
    expect(on[0]).toBeLessThanOrEqual(IDLE.settle[1] + 0.1);
    // More than one in a minute, with gaps between.
    const starts = on.filter((t, i) => i === 0 || t - on[i - 1] > 0.2);
    expect(starts.length).toBeGreaterThanOrEqual(4);
    // Walking about the whole time: never.
    const w = hero('walker-1');
    expect(watch(w, 100, 60, () => (w.moving = true))).toHaveLength(0);
    // Swinging the whole time: never.
    const s = hero('swinger-1');
    expect(watch(s, 100, 60, () => (s.act = 'attack'))).toHaveLength(0);
  });

  it('never play with a goblin awake within about 8 tiles', () => {
    const near = hero('near-1');
    idleWorld([goblin(15, 10)], null);
    expect(calmAround(near, [goblin(15, 10)])).toBe(false);
    expect(watch(near, 200, 60)).toHaveLength(0);
    // Asleep, or 9 tiles off: they do.
    const far = hero('far-1');
    idleWorld([goblin(19, 10), goblin(13, 10, false)], null);
    expect(watch(far, 200, 30).length).toBeGreaterThan(0);
    // One waking near mid-idle cuts it off at once.
    const mid = hero('mid-1');
    idleWorld([], null);
    forceIdle(mid, 'w_lean', 300);
    expect(idleFrame(mid, 300.05)).not.toBeNull();
    idleWorld([goblin(12, 10)], null);
    expect(idleFrame(mid, 300.1)).toBeNull();
    idleWorld([], null);
  });

  it('any input, a hit or a step cuts an idle off at once', () => {
    idleWorld([], null);
    const h = hero('poke-1');
    forceIdle(h, 'w_edge', 10);
    expect(idleFrame(h, 10.05)?.def.id).toBe('w_edge');
    pokeIdle(h.id);
    expect(idleFrame(h, 10.1)).toBeNull();
    forceIdle(h, 'w_edge', 20);
    h.hp -= 5;
    expect(idleFrame(h, 20.05)).toBeNull();
    forceIdle(h, 'w_edge', 30);
    h.moving = true;
    expect(idleFrame(h, 30.05)).toBeNull();
    h.moving = false;
    forceIdle(h, 'w_edge', 40);
    h.fx = -1;
    expect(idleFrame(h, 40.05)).toBeNull();
  });

  it('three a class for every weapon in hand, and a rare one, which comes up about one pick in fifty', () => {
    for (const cls of CLASS_ORDER) {
      for (const w of CLASS_KITS[cls]) expect(commonFor(cls, w).map((d) => d.id)).toHaveLength(3);
      expect(IDLES[cls].filter((d) => d.rare)).toHaveLength(1);
    }
    const r = new Rng(7), n = 50_000;
    for (const cls of CLASS_ORDER) for (const w of CLASS_KITS[cls]) {
      let rare = 0;
      for (let i = 0; i < n; i++) if (pickIdle(cls, r.next(), r.next(), true, w).rare) rare++;
      expect(rare / n).toBeGreaterThan(0.015);
      expect(rare / n).toBeLessThan(0.025);
    }
  });

  it('each pick fits the weapon in hand: an edge needs a blade, a lean needs the shield', () => {
    const r = new Rng(3), blades = ['sword', 'greatsword', 'daggers', 'rapier', 'poisoner', 'spellblade'];
    for (const cls of CLASS_ORDER) for (const w of CLASS_KITS[cls]) {
      const seen = new Set<string>();
      for (let i = 0; i < 5000; i++) {
        const d = pickIdle(cls, r.next(), r.next(), true, w);
        seen.add(d.id);
        expect(!d.kits || d.kits.includes(w)).toBe(true);
        if (d.id === 'w_edge') expect(blades).toContain(w);
        if (d.id === 'w_lean') expect(w).toBe('sword');
        if (d.id === 'w_shoulder' || d.id === 'w_plant') expect(['greatsword', 'spear']).toContain(w);
      }
      // All three of that kit's come up.
      for (const d of commonFor(cls, w)) expect(seen.has(d.id)).toBe(true);
    }
    expect(commonFor('WARRIOR', 'spear').map((d) => d.id)).toEqual(['w_stretch', 'w_plant', 'w_shoulder']);
    expect(commonFor('WARRIOR', 'sword').map((d) => d.id)).toEqual(['w_stretch', 'w_edge', 'w_lean']);
    expect(commonFor('WARRIOR', 'greatsword').map((d) => d.id)).toEqual(['w_stretch', 'w_edge', 'w_plant']);
    // And in play: a spear-carrier standing about never checks an edge or leans on a shield.
    idleWorld([], null);
    const h = hero('spear-1', 'spear');
    for (let t = 0; t < 600; t += 0.05) {
      const f = idleFrame(h, 900 + t);
      if (f) expect(['w_edge', 'w_lean']).not.toContain(f.def.id);
    }
  });

  it("the Ranger's picks favour the hound, and leave it out when it isn't there to play", () => {
    const r = new Rng(11), n = 20_000;
    let dog = 0;
    for (let i = 0; i < n; i++) if (pickIdle('RANGER', r.next(), r.next(), true).hound) dog++;
    expect(dog / n).toBeGreaterThan(0.75);
    for (let i = 0; i < 2000; i++) expect(pickIdle('RANGER', r.next(), r.next(), false).hound).toBeFalsy();
    // In play: a Ranger standing about, the hound at heel, spends most idles with it.
    idleWorld([], null);
    const h = hero('ranger-1', 'longbow'), seen = new Set<string>();
    let withDog = 0, all = 0, last = '';
    for (let t = 0; t < 1200; t += 0.05) {
      const f = idleFrame(h, 500 + t), id = f ? f.def.id + Math.floor(500 + t - f.t) : '';
      if (f && id !== last) all++, f.def.hound && withDog++, seen.add(f.def.id);
      last = id;
    }
    expect(all).toBeGreaterThan(60);
    expect(withDog / all).toBeGreaterThan(0.7);
    expect(seen.has('r_fetch') && seen.has('r_ruffle') && seen.has('r_scan')).toBe(true);
  });

  it('only draw: an idle and the hound at play leave the hero and the room as they were', () => {
    idleWorld([], null);
    const h = hero('pure-1', 'longbow');
    h.hound = { x: 9, y: 10.2, fx: 1, fy: 0, state: 'heel', target: 0, t: 0, next: 0, back: 0, bites: 0, moving: false };
    const before = JSON.stringify(h);
    forceIdle(h, 'r_fetch', 50);
    let ran = false;
    for (let t = 50; t < 57; t += 0.05) {
      idlePose(h, newPose(), t);
      const a = houndAt(h, h.hound.x, h.hound.y, h.x, h.y, t);
      if (a && Math.abs(a.x - h.hound.x) > 1.5) ran = true;
    }
    // The hound drawn running out after the stick, the room's hound never moved.
    expect(ran).toBe(true);
    expect(JSON.stringify(h)).toBe(before);
  });
});

describe('petting', () => {
  const page = (cls: 'RANGER' | 'WARRIOR') => {
    const g = new Game();
    g.create(cls, 'PAT');
    if (g.mode === 'wood') g.skipWood();
    return g;
  };
  const steps = (g: InstanceType<typeof Game>, n: number) => {
    for (let k = 0; k < n; k++) g.step(0.05, NO_INTENT);
  };
  const into = (g: InstanceType<typeof Game>, door: string) => {
    const b = g.room.map.blocks.find((x) => x.door === door)!;
    g.enter(b);
    steps(g, 4);
  };

  it("is in the hunters' lodge, Maeve's hound for anyone and a Ranger's own", () => {
    const g = page('RANGER');
    steps(g, 10);
    // (Your own anywhere, now: tests/petting.test.ts.)
    into(g, 'lodge');
    expect(g.room.map.name).toBe("THE HUNTERS' LODGE");
    // By the fire: Maeve's hound.
    Object.assign(g.hero, { x: LODGE_DOG.x, y: LODGE_DOG.y + 0.8 });
    steps(g, 2);
    expect(g.near()).toMatchObject({ pet: 'lodge', label: "PET MAEVE'S HOUND" });
    // In a quiet corner with the hound come to heel: your own.
    Object.assign(g.hero, { x: 2, y: 6.6 });
    steps(g, 60);
    expect(g.near()).toMatchObject({ pet: 'own', label: 'PET YOUR HOUND' });
    // Pet it: kneeling, it comes to lean in; again only after the wait.
    const now = 1000;
    expect(startPet(g.hero, 'own', now)).toBe(true);
    expect(petFrame(g.hero, now + 1)).toMatchObject({ dog: 'own' });
    expect(idlePose(g.hero, newPose(), now + 1)?.pet).toBeGreaterThan(0);
    const d = g.hero.hound!, a = houndAt(g.hero, d.x, d.y, g.hero.x, g.hero.y, now + 1)!;
    expect(Math.hypot(a.x - g.hero.x, a.y - g.hero.y)).toBeLessThan(1.2);
    expect(a.mood.wag !== undefined && a.mood.happy).toBe(true);
    expect(startPet(g.hero, 'own', now + 1.5)).toBe(false);
    expect(petFrame(g.hero, now + PET.time + 0.1)).toBeNull();
    expect(startPet(g.hero, 'own', now + PET.time + PET.wait + 0.1)).toBe(true);
    // A step ends it.
    g.hero.moving = true;
    expect(petFrame(g.hero, now + PET.time + PET.wait + 0.5)).toBeNull();
  });

  it("anyone can pet Maeve's hound; it gets up from the fire for them and lies down again", () => {
    const g = page('WARRIOR');
    into(g, 'lodge');
    Object.assign(g.hero, { x: LODGE_DOG.x - 0.4, y: LODGE_DOG.y + 0.9 });
    steps(g, 2);
    expect(g.near()?.pet).toBe('lodge');
    // A Warrior has no hound of their own to pet anywhere.
    Object.assign(g.hero, { x: 2, y: 6.6 });
    steps(g, 40);
    expect(g.near()?.pet).toBeUndefined();
    expect(lodgeHoundAt(g.room.heroes, 5000).down).toBe(true);
    expect(startPet(g.hero, 'lodge', 5000)).toBe(true);
    const a = lodgeHoundAt(g.room.heroes, 5001);
    expect(a.down).toBe(false);
    expect(Math.hypot(a.x - g.hero.x, a.y - g.hero.y)).toBeLessThan(1.2);
    expect(lodgeHoundAt(g.room.heroes, 5000 + PET.time + 0.2).down).toBe(true);
  });

  it("Maeve's hound nowhere else: the other halls, the yard, the square", () => {
    const g = page('RANGER');
    for (const door of ['hall', 'tower', 'church', 'tavern', 'forge']) {
      g.enterTown();
      steps(g, 4);
      into(g, door);
      for (let x = 0.5; x < g.room.map.w; x += 0.5) for (let y = 0.5; y < g.room.map.h; y += 0.5) {
        Object.assign(g.hero, { x, y });
        expect(g.near()?.pet).not.toBe('lodge');
      }
    }
    g.enterYard();
    steps(g, 20);
    expect(g.near()?.pet).not.toBe('lodge');
  });
});

describe('nothing goes over the network', () => {
  it('an hour of idles in town, and petting in the lodge, send nothing a still hero would not', () => {
    const run = (draw: boolean) => {
      socks.splice(0);
      const g = new Game();
      g.create('RANGER', 'WREN');
      if (g.mode === 'wood') g.skipWood();
      const town = new Townfolk(g.profile.id);
      let now = 5000;
      const frame = (dt: number) => {
        now += dt;
        g.step(dt, NO_INTENT);
        const before = socks.filter((s) => !s.closed).length;
        town.step(presence(g, 'WREN'), now, dt);
        if (socks.filter((s) => !s.closed).length > before) socks.forEach((s) => !s.closed && s.onMessage({ t: 'role', role: 'peer' }));
        if (!draw) return;
        // What the drawing does each frame: every hero's idle, the hounds at play, a friend's hound.
        idleWorld(g.room.enemies, g.room.map);
        for (const h of [g.hero, ...town.here(g.room.map.name)]) {
          idlePose(h, newPose(), now);
          if (h.hound) houndAt(h, h.hound.x, h.hound.y, h.x, h.y, now);
          else companion(h, now);
        }
        lodgeHoundAt(g.room.heroes, now);
      };
      frame(0.1);
      // Someone else in the square, so where you stand would go out if it changed.
      for (const s of socks) s.onMessage({ t: 'msg', from: 'sam-00001', d: { k: 'me', n: 'SAM', w: 'longbow', at: g.room.map.name, p: [g.hero.x + 2, g.hero.y, 0, 1, 0] } });
      let idled = 0;
      for (let k = 0; k < 3600 * 4; k++) {
        frame(0.25);
        if (draw && idleFrame(g.hero, now)) idled++;
      }
      // Into the lodge and pet Maeve's hound, over and over.
      into(g);
      Object.assign(g.hero, { x: LODGE_DOG.x - 0.4, y: LODGE_DOG.y + 0.9 });
      for (let k = 0; k < 600; k++) {
        if (draw && k % 20 === 0) startPet(g.hero, 'lodge', now);
        frame(0.25);
      }
      return { sent: socks.reduce((n, s) => n + s.sent.length, 0), idled };
      function into(gm: InstanceType<typeof Game>) {
        gm.enter(gm.room.map.blocks.find((x) => x.door === 'lodge')!);
        for (let k = 0; k < 4; k++) frame(0.05);
      }
    };
    const plain = run(false), idling = run(true);
    expect(idling.idled).toBeGreaterThan(1000);
    expect(idling.sent).toBe(plain.sent);
  });
});
