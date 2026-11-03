import { beforeEach, describe, expect, it } from 'vitest';
import { collide, doorAt, useMap } from '../src/shared/arena';
import { runInterior, townInterior } from '../src/shared/interiors';
import { PLACES, board, deepDive, type Job } from '../src/shared/jobs';
import { BLAZE } from '../src/shared/props';
import { newWorld } from '../src/shared/story';
import { planRoom } from '../src/shared/terrain';
import { townMap } from '../src/shared/town';
import { Game, ME } from '../src/client/game';
import { load } from '../src/client/save';
import { ArenaRoom } from '../src/sim/room';
import { goal, newRun, runRoom } from '../src/sim/run';
import { damageProp } from '../src/sim/props';
import { kill } from '../src/sim/damage';
import { stepBuildings } from '../src/sim/buildings';
import { TICK } from '../src/shared/tuning';
import { NO_INTENT, type Intent } from '../src/sim/types';

// A browser's storage, for the saves.
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k),
} as Storage;
beforeEach(() => store.clear());

const job = (kind: Job['place']['kind'], objective: Job['objective']): Job => ({ ...board(1)[0], rooms: 3, place: PLACES.find((p) => p.kind === kind)!, objective, seed: 77 });
const up: Intent = { ...NO_INTENT, my: -1 };

describe('heroes', () => {
  it('are made once with a class for life; the fight never takes a class or kit change', () => {
    const g = new Game();
    g.create('RANGER', 'wren');
    g.skipWood();
    expect(g.profile).toMatchObject({ name: 'WREN', cls: 'RANGER', weapon: 'longbow' });
    g.enterYard();
    g.step(0.1, { ...NO_INTENT, classSeq: 5, weaponSeq: 3, augmentSeq: 2 });
    expect(g.hero.weapon).toBe('longbow');
    expect(g.hero.augments.net).toBe('');
    g.profile.gold = 200;
    expect(g.buy('fine', 'sword')).toBeNull();
    const bow = g.buy('fine', 'crossbow')!;
    expect(g.hero.weapon).toBe('longbow');
    expect(g.profile.bag).toEqual([bow]);
    // Equipped from the pack (the room applies it), and the save follows.
    g.step(0.1, { ...NO_INTENT, gearSeq: 1, gearOp: 1, gearArg: 0 });
    expect(g.hero.weapon).toBe('crossbow');
    expect(g.hero.arms.crossbow).toBe(bow);
    expect(load().heroes[0]).toMatchObject({ weapon: 'crossbow', bag: [] });
    // Back to the plain longbow: the crossbow goes back in the pack.
    g.step(0.1, { ...NO_INTENT, gearSeq: 2, gearOp: 1, gearArg: -1 });
    expect(g.hero.weapon).toBe('longbow');
    expect(load().heroes[0].bag).toEqual([bow]);
    g.step(0.1, { ...NO_INTENT, gearSeq: 3, gearOp: 2, gearArg: 0 });
    expect(load().heroes[0].bag).toEqual([]);
  });

  it('an old save keeps the weapon in hand; its other weapons go in the pack', () => {
    const fine = { kit: 'greatsword', quality: 'fine', traits: ['brutal'] }, held = { kit: 'sword', quality: 'fine', traits: ['riposte'] };
    store.set('relic.save.v2', JSON.stringify({ heroes: [{ name: 'OLD', cls: 'WARRIOR', weapon: 'sword', arms: { sword: held, greatsword: fine } }], current: 0, world: newWorld() }));
    expect(load().heroes[0]).toMatchObject({ weapon: 'sword', arms: { sword: { kit: 'sword', quality: 'tolmouth', traits: ['riposte'] } }, bag: [{ kit: 'greatsword', quality: 'tolmouth', traits: ['brutal'], mods: [] }] });
    expect(load().heroes[0].armor).toMatchObject({ slot: 'armor', armor: 'heavy' });
  });

  it("carry an old save's hero across, class from its weapon", () => {
    store.set('relic.save.v1', JSON.stringify({ profile: { gold: 90, xp: 120, level: 2, perks: [], picks: 1, arms: {}, weapon: 'staff', runs: 3 }, world: { ...newWorld(), day: 4 } }));
    const s = load();
    expect(s.heroes[0]).toMatchObject({ cls: 'MAGE', gold: 90, name: 'HERO' });
    expect(s.world.day).toBe(4);
  });

  it('the relic-wright fits elements for gold', () => {
    const g = new Game();
    g.create('WARRIOR', 'b');
    g.skipWood();
    g.profile.gold = 50;
    expect(g.fitAugment('bash', 'fire')).toBe(true);
    expect(g.fitAugment('javelin', 'frost')).toBe(false);
    expect(g.hero.augments.bash).toBe('fire');
    g.enterYard();
    expect(g.hero.augments.bash).toBe('fire');
  });
});

describe('the forge', () => {
  it('Halvard melts packed gear for steel and levels gear up to its tier cap; Ivo rerolls a modifier', () => {
    const g = new Game();
    g.create('WARRIOR', 'smith');
    g.skipWood();
    g.profile.gold = 2000;
    const spear = g.buy('fine', 'spear')!, junk = g.buy('fine', 'greatsword')!;
    expect(g.melt(junk)).toBe(true);
    expect(g.profile.steel).toBe(3);
    g.profile.steel = 100;
    for (let i = 0; i < 5; i++) g.upgrade(g.profile.bag[0]);
    expect(g.profile.bag[0].level).toBe(3);
    expect(g.profile.bag[0].kit).toBe('spear');
    // Wear a ring and reroll its modifier: a different one, same piece.
    const ring = g.buy('forged', 'sword', 'ring')!;
    g.step(0.1, { ...NO_INTENT, gearSeq: 1, gearOp: 1, gearArg: g.profile.bag.indexOf(ring) });
    const worn = g.hero.rings[0], before = worn.mods![0].id;
    expect(g.rerollMod(worn, 0)).toBe(true);
    expect(g.hero.rings[0].mods![0].id).not.toBe(before);
    expect(g.profile.rings[0]).toBe(g.hero.rings[0]);
    expect(spear).toBeTruthy();
  });
});

describe('relics come from deep dives', () => {
  const win = (g: Game) => (g as unknown as { finish(how: string): void }).finish('won');

  it('every board has one deep dive: five rooms, a named butcher at the bottom', () => {
    const deep = board(3, false).filter((j) => j.deep);
    expect(deep.length).toBe(1);
    expect(deep[0].rooms).toBe(5);
    expect(deep[0].boss).toBeTruthy();
  });

  it('a hero starts with no relic, wins one at the bottom of a deep dive, and carries what they found', () => {
    const g = new Game();
    g.create('MAGE', 'r');
    expect(g.profile.relics).toEqual([]);
    expect(g.hero.relics).toEqual(['channel']);
    g.startJob(board(1, false)[0]);
    win(g);
    expect(g.profile.relics).toEqual([]);
    g.startJob(deepDive(1));
    win(g);
    expect(g.result?.relic).toBe('javelin');
    expect(g.hero.relics).toEqual(['channel', 'javelin']);
    g.carry('hook');
    expect(g.profile.relic).toBe('javelin');
    g.startJob(deepDive(2));
    win(g);
    expect(g.result?.relic).toBe('hook');
    g.carry('hook');
    expect(g.hero.relics).toEqual(['channel', 'hook']);
    // From the pack: put it away, then carry the javelin again.
    g.step(0.1, { ...NO_INTENT, gearSeq: 1, gearOp: 3, gearArg: -1 });
    expect(g.profile.relic).toBe('');
    g.step(0.1, { ...NO_INTENT, gearSeq: 2, gearOp: 3, gearArg: 0 });
    expect(g.hero.relics).toEqual(['channel', 'javelin']);
    expect(g.profile.relic).toBe('javelin');
  });
});

describe('Wickhold, inside', () => {
  it('every door leads to a room with someone to talk to, all of them reachable', () => {
    const w = { ...newWorld(), rescued: 8, flags: { 'north-fields': 'farm' } };
    const doors = townMap(w).blocks.filter((b) => b.door);
    expect(doors.length).toBeGreaterThanOrEqual(10);
    for (const b of doors) {
      const m = townInterior(b.door!, w);
      expect(m.npcs!.length).toBeGreaterThan(0);
      useMap({ ...m, npcs: [] });
      for (const n of m.npcs!) {
        const p = { x: n.x, y: n.y + 0.7 };
        collide(p, 0.32);
        expect(Math.hypot(p.x - n.x, p.y - n.y)).toBeLessThan(1.6);
      }
    }
  });

  it('walk up into the forge door, meet the smith, walk out the bottom and stand at the door', () => {
    const g = new Game();
    const forge = g.room.map.blocks.find((b) => b.door === 'forge')!, d = doorAt(forge);
    Object.assign(g.hero, { x: d.x, y: d.y + 0.1 });
    g.step(0.05, up);
    expect(g.room.map.name).toBe('THE FORGE');
    expect(g.room.map.npcs!.map((n) => n.talk)).toEqual(['smith', 'wright']);
    Object.assign(g.hero, { x: g.room.map.w / 2, y: g.room.map.h - 0.3 });
    g.step(0.05, NO_INTENT);
    expect(g.room.map.name).toBe('WICKHOLD');
    expect(Math.abs(g.hero.x - d.x)).toBeLessThan(0.1);
    expect(g.room.heroes.filter((h) => h.id === ME).length).toBe(1);
  });
});

describe('buildings on a job', () => {
  it('a cottage can be entered; its goblins stay dead, and the room outside keeps your place', () => {
    const g = new Game();
    g.startJob(job('village', 'rescue'));
    // Houses differ: some stand empty, so go into one with goblins in it.
    const blocks = g.room.map.blocks, house = blocks.find((b, i) => b.door === 'cottage' && runInterior(g.run!.job, 0, i, 'cottage').foes.length)!;
    expect(house).toBeTruthy();
    g.enter(house);
    expect(['THE COTTAGE', "THE WEAVER'S COTTAGE", 'THE SMITHY', 'THE STOREHOUSE']).toContain(g.room.map.name);
    expect(g.room.enemies.length).toBeGreaterThan(0);
    for (const e of g.room.enemies) kill(e, g.room.events);
    g.step(0.05, NO_INTENT);
    Object.assign(g.hero, { x: g.room.map.w / 2, y: g.room.map.h - 0.3 });
    g.step(0.05, NO_INTENT);
    expect(g.room.map.blocks).toContain(house);
    g.enter(house);
    expect(g.room.enemies.every((e) => e.act === 'dead')).toBe(true);
  });

  it('oil by a den sets it burning; it spreads, falls in, stops blocking, and the job counts it', () => {
    const run = newRun(job('forest', 'burn'));
    run.index = run.job.rooms - 1;
    const room = runRoom(run), dens = room.map.blocks.filter((b) => b.kind === 'den');
    expect(dens.length).toBe(3);
    expect(room.props.filter((p) => p.kind === 'oil').length).toBeGreaterThanOrEqual(3);
    const den = dens[0], oil = room.props.filter((p) => p.kind === 'oil').sort((a, b) => Math.hypot(a.x - den.x - 1.3, a.y - den.y) - Math.hypot(b.x - den.x - 1.3, b.y - den.y))[0];
    // The barrel goes up mid-tick (as when a blow lands), then the fire looks for wood.
    const w = { heroes: room.heroes, enemies: room.enemies, javelins: [], props: room.props, now: room.time, ev: [] };
    useMap(room.map);
    damageProp(oil, 99, w);
    stepBuildings(w, TICK, () => undefined);
    expect(den.burning).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < 30 * 8; i++) room.step();
    expect(den.ruined).toBe(true);
    useMap(room.map);
    const mid = { x: den.x + den.w / 2, y: den.y + den.h / 2 };
    collide(mid, 0.32);
    expect(Math.hypot(mid.x - den.x - den.w / 2, mid.y - den.y - den.h / 2)).toBeLessThan(0.01);
    for (const b of dens) b.ruined = true;
    expect(goal(run, room).done).toBe(true);
  });

  it('a standing den sends out scrappers; town buildings never burn', () => {
    const plan = planRoom(job('forest', 'burn'), 2);
    const room = new ArenaRoom(5, { map: plan.map, foes: [], furniture: [] });
    for (let i = 0; i < 30 * (BLAZE.denEvery + 0.5); i++) room.step();
    expect(room.enemies.length).toBe(3);
    const town = townMap(newWorld());
    expect(town.blocks.every((b) => b.hp === undefined)).toBe(true);
  });

  it('blows chip a wooden wall', () => {
    const plan = planRoom(job('farm', 'rescue'), 0), barn = plan.map.blocks.find((b) => b.kind === 'barn')!;
    const room = new ArenaRoom(5, { map: plan.map, foes: [], furniture: [] }), h = room.join('me');
    Object.assign(h, { x: barn.x + barn.w / 2, y: barn.y + barn.h + 0.5, fx: 0, fy: -1 });
    let seq = 0;
    for (let i = 0; i < 60; i++) room.setIntent('me', { ...NO_INTENT, attackSeq: (seq += i % 12 === 0 ? 1 : 0) }), room.step();
    expect(barn.hp!).toBeLessThan(barn.maxHp!);
  });

  it('rooms often have a heap of the dead with goblins at it, feeding, facing the body', () => {
    let heaps = 0;
    for (let seed = 1; seed < 20; seed++) {
      const plan = planRoom({ ...job('village', 'rescue'), seed }, 1);
      const feeders = plan.foes.filter((f) => f.feeding);
      if (!feeders.length) continue;
      heaps++;
      expect(plan.map.npcs?.some((n) => n.pose === 'corpse')).toBe(true);
    }
    expect(heaps).toBeGreaterThan(4);
  });
});
