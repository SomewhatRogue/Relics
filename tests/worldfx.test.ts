/**
 * World effects, slices 1 to 3 (Kyle, 2026-11-05; shared/worldfx.ts): rods and lightning through pools,
 * butchers eating the dead and fire turning the dead to ash, ice on the shallows and steam.
 */
import { describe, expect, it } from 'vitest';
import { ARENA, type GameMap } from '../src/shared/arena';
import { BUTCHER, FLING, ICE, MEAL, POOL, ROD, STEAM_CLOUD, TICK } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy, walk } from '../src/sim/enemies';
import { damage, kill } from '../src/sim/damage';
import { afflict, burning, chill, type World } from '../src/sim/elements';
import { fling } from '../src/sim/iceslide';
import { iceAt, iceUnder } from '../src/sim/ice';
import { pickStrike } from '../src/sim/stormpick';
import { visible } from '../src/sim/flasks';
import { Rng } from '../src/shared/rng';
import { NO_INTENT, type Enemy, type FightEvent } from '../src/sim/types';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { lost, mageArena } from './magearena';

/** One body of water across the top (two boxes laid edge to edge: x 3 to 15, y 1 to 5) and a pond apart. */
const POOLS: GameMap = { ...ARENA, water: [{ x: 3, y: 1, w: 6, h: 4 }, { x: 9, y: 1, w: 6, h: 4 }, { x: 1, y: 7, w: 2.5, h: 2 }] };
/** Shallows (y 2 to 5) with deep water below them (y 5 to 6.5), dry ground beyond. */
const FORD: GameMap = { ...ARENA, water: [{ x: 1, y: 2, w: 16, h: 3 }, { x: 1, y: 5, w: 16, h: 1.5, deep: true }] };
/** The wand's storm hold aimed 6 tiles up from (9, 9): at (9, 3). */
const UP6 = { ay: -6 };

const world = (room: ArenaRoom): World => ({ heroes: room.heroes, enemies: room.enemies, javelins: room.javelins, props: room.props, survivors: room.survivors, now: room.time, ev: room.events, fx: room });
function run(room: ArenaRoom, s: number): FightEvent[] {
  const out: FightEvent[] = [];
  for (let i = 0; i < Math.round(s / TICK); i++) room.step(), out.push(...room.events);
  return out;
}
const iron = (e: Enemy) => Object.assign(e, { variant: 'ironhide' as const });
const cracked = (room: ArenaRoom, e: Enemy) => (e.crackUntil ?? -9) > room.time;
const evs = <K extends FightEvent['k']>(ev: FightEvent[], k: K) => ev.filter((x): x is Extract<FightEvent, { k: K }> => x.k === k);

describe('rods: an ironhide draws the lightning, and its guard breaks', () => {
  it("the wand's strike aimed near an ironhide falls on it instead, and breaks its guard", () => {
    const a = mageArena('wand', [[9, 3], [12, 3.5]], 'storm');
    iron(a.es[1]);
    const ev = a.loose(0.9, 0.6, UP6), call = evs(ev, 'spell')[0];
    expect(call.x).toBeCloseTo(12, 5);
    expect(evs(ev, 'rodhit').length).toBe(1);
    expect(cracked(a.room, a.es[1])).toBe(true);
    expect(lost(a.es[1])).toBeGreaterThan(0);
  });

  it('with no ironhide within ROD.reach it falls where it was aimed', () => {
    const a = mageArena('wand', [[9, 3], [9 + ROD.reach + 1.5, 3]], 'storm');
    iron(a.es[1]);
    const ev = a.loose(0.9, 0.6, UP6);
    expect(evs(ev, 'spell')[0].x).toBeCloseTo(9, 5);
    expect(evs(ev, 'rodhit').length).toBe(0);
  });

  it("the sky's own strike is drawn onto an ironhide near what it picked", () => {
    const room = new ArenaRoom(3, { scrappers: false, props: false, map: { ...ARENA, w: 30, h: 30, rounds: [], hero: { x: 15, y: 15 } } });
    const me = room.join('me');
    Object.assign(me, { x: 15, y: 15 });
    const gob = Object.assign(newEnemy(1, 'scrapper', 17, 15), { alert: true }), rod = iron(Object.assign(newEnemy(2, 'scrapper', 15, 17.5), { alert: true }));
    for (let s = 1; s <= 20; s++) {
      const p = pickStrike(room.map, room.heroes, [gob, rod], new Rng(s));
      expect(p?.on).toBe('rod');
      expect(p?.x).toBe(rod.x);
    }
  });

  it('the storm stream taking a new goblin takes an ironhide near it, and breaks its guard', () => {
    const a = mageArena('wand', [[9, 7], [11, 7.6]], 'storm');
    iron(a.es[1]);
    const ev = a.tap(0.3);
    expect(a.h.stream?.id).toBe(a.es[1].id);
    expect(evs(ev, 'rodhit').length).toBe(1);
    expect(cracked(a.room, a.es[1])).toBe(true);
  });
});

describe('lightning through a pool', () => {
  it('jolts the goblins in that same water only: near, far, never the pond apart or the bank', () => {
    const a = mageArena('wand', [[9, 3], [14, 2], [2, 8], [12, 6.2]], 'storm', false, 'scrapper', POOLS);
    const ev = a.loose(0.9, 0.6, UP6);
    const [hit, far, pond, bank] = a.es.map(lost);
    expect(hit).toBeGreaterThan(0);
    expect(far).toBeGreaterThan(0);
    expect(pond).toBe(0);
    expect(bank).toBe(0);
    expect(evs(ev, 'pooljolt').length).toBeGreaterThan(0);
  });

  it('friends wading the same water take nothing from a friend storm, and are drawn as passed by', () => {
    const a = mageArena('wand', [[9, 3], [14, 2]], 'storm', false, 'scrapper', POOLS);
    const pal = a.room.join('pal');
    Object.assign(pal, { x: 6, y: 2 });
    const hp = pal.hp, ev = a.loose(0.9, 0.6, UP6), j = evs(ev, 'pooljolt')[0];
    expect(pal.hp).toBe(hp);
    expect(j.spared.length).toBe(1);
    expect(j.to.length).toBe(1);
  });

  it('reaches POOL.cap bodies at most, nearest first, friends counted', () => {
    const spots: [number, number][] = [[9, 3]];
    for (const x of [3.5, 4.5, 5.5, 6.5, 7.4, 10.6, 11.5, 12.5, 13.5, 14.6]) spots.push([x, 1.6]);
    const a = mageArena('wand', spots, 'storm', false, 'scrapper', POOLS);
    const pal = a.room.join('pal');
    Object.assign(pal, { x: 9, y: 4.6 });
    const ev = a.loose(0.9, 0.6, UP6), j = evs(ev, 'pooljolt')[0];
    expect(j.to.length + j.spared.length).toBe(POOL.cap);
    expect(a.es.slice(1).filter((e) => lost(e) > 0).length).toBe(POOL.cap - 1);
    // The two furthest (3.5 and 14.6) are left.
    expect(lost(a.es[1])).toBe(0);
    expect(lost(a.es[10])).toBe(0);
  });

  it('an ironhide jolted through the water has its guard broken', () => {
    const a = mageArena('wand', [[9, 3], [14.2, 2.2]], 'storm', false, 'scrapper', POOLS);
    iron(a.es[1]);
    a.loose(0.9, 0.6, UP6);
    expect(cracked(a.room, a.es[1])).toBe(true);
  });

  it("the sky's own lightning into water jolts friends in it too, a little", () => {
    const room = new ArenaRoom(1, { scrappers: false, props: false, map: POOLS });
    const me = room.join('me');
    Object.assign(me, { x: 13, y: 2 });
    const g = Object.assign(newEnemy(1, 'scrapper', 5, 3), { alert: true, cooldown: 99, respawns: false }), far = Object.assign(newEnemy(2, 'scrapper', 10, 2), { alert: true, cooldown: 99, respawns: false });
    room.enemies = [g, far];
    room.strikes.push({ id: 1, x: 5, y: 3, r: 1.3, at: room.time + TICK, on: 'goblin' });
    const hp = me.hp, ev = run(room, 0.1);
    expect(hp - me.hp).toBe(POOL.wild);
    expect(far.maxHp - far.hp).toBeGreaterThan(0);
    expect(evs(ev, 'pooljolt')[0].wild).toBe(true);
  });
});

/** The yard with a butcher at (5, 8), hurt, and a small goblin's body beside it; the hero far off. */
function feast(seed = 1) {
  const room = new ArenaRoom(seed, { scrappers: false, props: false });
  const me = room.join('me');
  Object.assign(me, { x: 16, y: 14 });
  room.enemies = [];
  const b = Object.assign(newEnemy(1, 'butcher', 5, 8), { hp: 100, alert: true, respawns: false, cooldown: 0 });
  // (Hit just now, so it isn't taken for one that died alight.)
  const body = Object.assign(newEnemy(2, 'scrapper', 6.6, 8), { respawns: false, hitAt: room.time });
  kill(body, room.events, 'fall');
  room.enemies.push(b, body);
  return { room, me, b, body };
}

describe('butchers eat the dead', () => {
  it('goes to a body, eats it on a clock, heals, and comes up FED', () => {
    const { room, b, body } = feast();
    const ev = run(room, 0.6);
    expect(b.meal?.b).toBe(body.id);
    expect(evs(ev, 'meal').length).toBe(1);
    const ate = run(room, MEAL.time);
    expect(evs(ate, 'fed').length).toBe(1);
    expect(b.hp).toBe(100 + Math.round(BUTCHER.hp * MEAL.heal));
    expect(b.fed).toBe(true);
    expect(body.eaten).toBe(true);
  });

  it('FED, its blows wind up quicker and land harder', () => {
    const { room, me, b } = feast();
    run(room, 0.6 + MEAL.time);
    Object.assign(me, { x: b.x + 1.6, y: b.y });
    for (let i = 0; i < 200 && !b.attack; i++) room.step();
    const spec = b.attack!.kind === 'slam' ? BUTCHER.slam : BUTCHER.cleave;
    expect(b.attack!.windup).toBeCloseTo(spec.windup * MEAL.fed.windup, 5);
    expect(b.attack!.dmg).toBe(Math.round(spec.dmg * MEAL.fed.dmg));
  });

  it('fire on the body turns it to ash, and it feeds nothing', () => {
    const { room, b, body } = feast();
    room.zones.push({ kind: 'fire', x: body.x, y: body.y, r: 1, at: room.time, until: room.time + 0.3, next: room.time + 99, owner: 'me', el: 'fire' });
    const ev = run(room, 0.1);
    expect(body.ashed).toBe(true);
    expect(evs(ev, 'ashed').length).toBe(1);
    run(room, 4);
    expect(b.fed).toBeFalsy();
    expect(body.eaten).toBeFalsy();
  });

  it('a small goblin that dies alight leaves ash', () => {
    const { room, b } = feast();
    const g = Object.assign(newEnemy(3, 'scrapper', 4, 9.5), { respawns: false, burnUntil: room.time + 3, hitAt: room.time - 1 });
    room.enemies.splice(1, 1, g);
    kill(g, room.events, 'fall');
    run(room, 0.1);
    expect(g.ashed).toBe(true);
    run(room, 3);
    expect(b.fed).toBeFalsy();
  });

  it('a heavy hit takes it off the meal; a light one does not', () => {
    const { room, b } = feast();
    run(room, 0.6);
    expect(b.meal).toBeTruthy();
    damage(b, 4, room.time, room.events);
    expect(b.meal).toBeTruthy();
    damage(b, 4, room.time, room.events, { heavy: true });
    expect(b.meal).toBeNull();
    run(room, MEAL.time + 0.2);
    expect(b.fed).toBeFalsy();
  });

  it('a hero right on it gets the blow, not the body', () => {
    const { room, me, b } = feast();
    Object.assign(me, { x: 4, y: 8 });
    run(room, 0.6);
    expect(b.meal).toBeFalsy();
  });
});

describe('ice on the shallows', () => {
  it('a cold blast ices the shallows it reaches, never deep water or dry ground', () => {
    const a = mageArena('wand', [], 'frost', false, 'scrapper', FORD);
    Object.assign(a.h, { y: 7 });
    a.loose(0.9, 0.1);
    const ices = a.room.ices;
    expect(ices.length).toBeGreaterThan(0);
    expect(iceUnder(ices, 9, 4.5, a.room.time)).toBe(true);
    expect(iceUnder(ices, 9, 5.8, a.room.time)).toBe(false);
    expect(iceUnder(ices, 9, 6.8, a.room.time)).toBe(false);
    expect(evs(a.run(ICE.time + 0.1), 'iced').length).toBe(0);
    expect(a.room.ices.length).toBe(0);
  });

  it('frost on dry ground ices nothing', () => {
    const a = mageArena('wand', [], 'frost');
    a.loose(0.9, 0.1);
    expect(a.room.ices.length).toBe(0);
  });

  it('a frost tap on a goblin wading ices round it; the staff nova (hard frost) ices round you', () => {
    const room = new ArenaRoom(1, { scrappers: false, props: false, map: FORD });
    room.join('me');
    const e = Object.assign(newEnemy(1, 'scrapper', 6, 3.5), { alert: true, respawns: false });
    room.enemies = [e];
    chill(world(room), e);
    expect(iceUnder(room.ices, 6, 3.5, room.time)).toBe(true);
    const a = mageArena('staff', [], 'frost', false, 'scrapper', FORD);
    Object.assign(a.h, { y: 4 });
    const ev = a.loose(1.2, 0.6);
    expect(evs(ev, 'spell')[0]?.what).toBe('nova');
    expect(iceUnder(a.room.ices, 9, 4, a.room.time)).toBe(true);
  });

  it('waders on it are held', () => {
    const room = new ArenaRoom(1, { scrappers: false, props: false, map: FORD });
    room.join('me');
    const e = Object.assign(newEnemy(1, 'scrapper', 6, 3.5), { alert: true, respawns: false, cooldown: 99 });
    room.enemies = [e];
    iceAt(room, 6, 3.5, 2, room.time, room.events);
    room.step();
    expect(e.onIce).toBe(true);
    const x0 = e.x;
    walk(e, 1, 0, 3, 0.1);
    const held = e.x - x0;
    e.onIce = false;
    const x1 = e.x;
    walk(e, 1, 0, 3, 0.1);
    expect(held).toBeCloseTo((e.x - x1) * ICE.held, 5);
  });

  it('a frozen goblin hit across it skids further', () => {
    const slide = (iced: boolean) => {
      const room = new ArenaRoom(1, { scrappers: false, props: false, map: FORD });
      room.join('me');
      const e = Object.assign(newEnemy(1, 'scrapper', 2.5, 3.5), { alert: true, respawns: false, cooldown: 99 });
      room.enemies = [e];
      e.frozenUntil = room.time + 5;
      if (iced) iceAt(room, 5, 3.5, 4, room.time, room.events), iceAt(room, 12, 3.5, 4, room.time, room.events);
      fling(e, 'me', 1, 0, false, room.time, room.events);
      for (let i = 0; i < 300 && e.act !== 'dead'; i++) room.step();
      return e.x - 2.5;
    };
    const plain = slide(false), iced = slide(true);
    expect(plain).toBeCloseTo(FLING.len, 0);
    expect(iced).toBeGreaterThan(plain * 1.5);
  });
});

describe('steam', () => {
  it('fire on ice melts it to a cloud of steam', () => {
    const room = new ArenaRoom(1, { scrappers: false, props: false, map: FORD });
    room.join('me');
    room.enemies = [];
    iceAt(room, 9, 3.5, 1.5, room.time, room.events);
    room.zones.push({ kind: 'fire', x: 9, y: 3.5, r: 1, at: room.time, until: room.time + 0.3, next: room.time + 99, owner: 'me', el: 'fire' });
    const ev = run(room, 0.1);
    expect(room.ices.length).toBe(0);
    expect(room.smokes.some((s) => s.steam)).toBe(true);
    expect(evs(ev, 'thaw').length).toBe(1);
    expect(evs(ev, 'steamup').length).toBe(1);
  });

  it('fire on a goblin standing in water goes out in steam; on the bank it burns', () => {
    const room = new ArenaRoom(1, { scrappers: false, props: false, map: FORD });
    room.join('me');
    const wet = Object.assign(newEnemy(1, 'scrapper', 6, 3.5), { respawns: false }), dry = Object.assign(newEnemy(2, 'scrapper', 6, 8), { respawns: false });
    room.enemies = [wet, dry];
    const w = world(room);
    afflict(w, wet, 'fire', 5);
    afflict(w, dry, 'fire', 5);
    expect(burning(wet, room.time)).toBe(false);
    expect(burning(dry, room.time)).toBe(true);
    expect(room.smokes.filter((s) => s.steam).length).toBe(1);
  });

  it('steam hides you from goblins, and scalds a little', () => {
    const room = new ArenaRoom(1, { scrappers: false, props: false, map: FORD });
    const me = room.join('me');
    Object.assign(me, { x: 9, y: 3.5 });
    const g = Object.assign(newEnemy(1, 'scrapper', 9.4, 3.2), { respawns: false, hp: 400, maxHp: 400, cooldown: 99, alert: true });
    room.enemies = [g];
    iceAt(room, 9, 3.5, 1.5, room.time, room.events);
    room.zones.push({ kind: 'fire', x: 9, y: 3.5, r: 1, at: room.time, until: room.time + 0.1, next: room.time + 99, owner: 'me', el: 'fire' });
    run(room, 0.1);
    const hp = me.hp, ghp = g.hp;
    run(room, STEAM_CLOUD.every + 0.1);
    expect(me.hiddenUntil).toBeGreaterThan(room.time);
    expect(visible(me, 6, room.time)).toBe(false);
    expect(hp - me.hp).toBe(STEAM_CLOUD.heroDmg);
    expect(ghp - g.hp).toBeGreaterThanOrEqual(STEAM_CLOUD.dmg);
  });
});

describe('the same every time, and a guest sees the same', () => {
  const scene = () => {
    const a = mageArena('wand', [[9, 3], [14, 2], [12, 3.6], [6, 2]], 'storm', true, 'scrapper', POOLS);
    iron(a.es[2]);
    a.room.setIntent('me', { ...NO_INTENT });
    a.loose(0.9, 0.6, UP6);
    iceAt(a.room, 6, 2, 1.5, a.room.time, a.room.events);
    a.room.zones.push({ kind: 'fire', x: 6, y: 2, r: 1, at: a.room.time, until: a.room.time + 0.3, next: a.room.time + 99, owner: 'me', el: 'fire' });
    a.run(1.5);
    return a.room;
  };
  it('two runs agree', () => {
    const one = scene(), two = scene();
    const key = (r: ArenaRoom) => JSON.stringify({ e: r.enemies.map((e) => [e.id, e.hp, e.x, e.y, e.crackUntil]), i: r.ices, s: r.smokes });
    expect(key(one)).toBe(key(two));
    expect(one.smokes.some((s) => s.steam)).toBe(true);
  });

  it('ice, steam and FED ride the patch', () => {
    const { room, b } = feast();
    run(room, 0.6 + MEAL.time);
    room.ices.push({ id: 7, x: 9, y: 3, r: 1.5, at: 2, until: 8 });
    const got = new Decoder().apply(new Encoder().encode(stateOf(room), true), true) as unknown as ArenaRoom;
    expect(got.ices).toEqual([{ id: 7, x: 9, y: 3, r: 1.5, at: 2, until: 8 }]);
    expect((got.enemies as Enemy[]).find((e) => e.id === b.id)?.fed).toBe(true);
  });
});
