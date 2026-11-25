/** The keeper at the Field Barn (sim/pack.ts GEAR.buy, GEAR.refill): goods bought through the room, only at a station. */
import { describe, expect, it } from 'vitest';
import { RECHARGE } from '../src/shared/church';
import { POTION } from '../src/shared/potions';
import { SHELTER } from '../src/shared/shelter';
import { landJob } from '../src/shared/territory';
import { carriedItem } from '../src/sim/charge';
import { GEAR } from '../src/sim/pack';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT, type FightEvent, type Hero } from '../src/sim/types';
import { relicMax } from '../src/shared/relicitems';

function world(id: 'gatefields' | 'knoll' = 'gatefields') {
  const run = { ...newRun(landJob(id, 3)), index: 0 }, room = runRoom(run), h = room.join('me');
  for (const e of room.allEnemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false });
  const relic = { id: 'r1', kind: 'javelin', tier: 1, charge: 1, el: '' };
  Object.assign(h, { purse: 100, found: [relic], relicItem: 'r1', relics: [h.relics[0], 'javelin'], relic: 'javelin' });
  const s = room.map.stations![0];
  Object.assign(h, { x: s.x, y: s.y });
  let seq = 0;
  const ask = (op: number) => {
    room.setIntent('me', { ...NO_INTENT, gearOp: op, gearArg: 0, gearSeq: ++seq });
    const before = room.events.length;
    room.step();
    return room.events.slice(before).filter((e: FightEvent) => e.k === 'bought');
  };
  return { room, h, ask, s };
}
const cost = (h: Hero) => (relicMax(carriedItem(h)!) - carriedItem(h)!.charge) * RECHARGE.perCharge;

describe('the keeper at a way station', () => {
  it('sells a Bitter onto the belt for its price', () => {
    const { h, ask } = world();
    const got = ask(GEAR.buy);
    expect(h.belt).toEqual(['bitter']);
    expect(h.purse).toBe(100 - SHELTER.bitter);
    expect(got).toEqual([expect.objectContaining({ k: 'bought', id: 'me', n: SHELTER.bitter, what: 'bitter' })]);
  });

  it('fills a half-spent carried relic for the church price', () => {
    const { h, ask } = world(), price = cost(h);
    expect(price).toBeGreaterThan(0);
    const got = ask(GEAR.refill);
    expect(carriedItem(h)!.charge).toBe(relicMax(carriedItem(h)!));
    expect(h.purse).toBe(100 - price);
    expect(got).toEqual([expect.objectContaining({ n: price, what: 'refill' })]);
  });

  it('refuses outside the ring', () => {
    const { h, ask, s } = world();
    Object.assign(h, { x: s.x + s.r + 3, y: s.y });
    expect(ask(GEAR.buy)).toEqual([]);
    expect(ask(GEAR.refill)).toEqual([]);
    expect(h.belt).toEqual([]);
    expect(h.purse).toBe(100);
  });

  it('refuses on a job that does not roam', () => {
    const { room, h, ask } = world();
    room.roam = false;
    expect(ask(GEAR.buy)).toEqual([]);
    expect(h.purse).toBe(100);
  });

  it('refuses a hero who is down', () => {
    const { h, ask } = world();
    Object.assign(h, { hp: 0, act: 'down', actT: 0, actDur: Infinity });
    expect(ask(GEAR.buy)).toEqual([]);
    expect(h.purse).toBe(100);
  });

  it('refuses a full belt, a short purse and a full relic', () => {
    const w = world();
    w.h.belt = Array(POTION.belt).fill('bitter');
    expect(w.ask(GEAR.buy)).toEqual([]);
    expect(w.h.belt.length).toBe(POTION.belt);
    const p = world();
    p.h.purse = SHELTER.bitter - 1;
    expect(p.ask(GEAR.buy)).toEqual([]);
    p.h.purse = cost(p.h) - 1;
    expect(p.ask(GEAR.refill)).toEqual([]);
    expect(carriedItem(p.h)!.charge).toBe(1);
    const f = world();
    carriedItem(f.h)!.charge = relicMax(carriedItem(f.h)!);
    expect(f.ask(GEAR.refill)).toEqual([]);
    expect(f.h.purse).toBe(100);
  });
});

describe('the keeper\'s road to another station', () => {
  /** The roam room with a second shelter, far from the first, and the hero standing in the barn. */
  function two() {
    const w = world(), first = w.s;
    w.room.map.stations!.push({ name: 'THE CHARCOAL HUT', x: first.x + 10, y: first.y, r: first.r });
    let seq = 100;
    const go = (to: number) => {
      w.room.setIntent('me', { ...NO_INTENT, gearOp: GEAR.travel, gearArg: to, gearSeq: ++seq });
      const before = w.room.events.length;
      w.room.step();
      return w.room.events.slice(before).filter((e: FightEvent) => e.k === 'travelled');
    };
    return { ...w, go, hut: w.room.map.stations![w.room.map.stations!.length - 1] };
  }
  const inRing = (h: Hero, s: { x: number; y: number; r: number }) => Math.hypot(h.x - s.x, h.y - s.y) <= s.r;
  const idx = (w: ReturnType<typeof two>) => w.room.map.stations!.indexOf(w.hut);

  it('moves the hero inside the other ring and says so', () => {
    const w = two();
    const got = w.go(idx(w));
    expect(got).toEqual([expect.objectContaining({ k: 'travelled', id: 'me', station: 'THE CHARCOAL HUT' })]);
    expect(inRing(w.h, w.hut)).toBe(true);
    expect(w.h.y).toBeGreaterThan(w.hut.y - 0.01);
  });

  it('refuses outside a ring, when down, to the same station, to a bad index, and off a roaming land', () => {
    const out = two();
    Object.assign(out.h, { x: out.s.x + 5, y: out.s.y + 5 });
    const was = { x: out.h.x, y: out.h.y };
    expect(out.go(idx(out))).toEqual([]);
    expect(out.h).toMatchObject(was);
    const down = two();
    Object.assign(down.h, { hp: 0, act: 'down', actT: 0, actDur: Infinity });
    expect(down.go(idx(down))).toEqual([]);
    const same = two();
    expect(same.go(same.room.map.stations!.indexOf(same.s))).toEqual([]);
    const bad = two();
    expect(bad.go(9)).toEqual([]);
    expect(bad.go(-1)).toEqual([]);
    expect(inRing(bad.h, bad.s)).toBe(true);
    const flat = two();
    flat.room.roam = false;
    expect(flat.go(idx(flat))).toEqual([]);
    expect(inRing(flat.h, flat.s)).toBe(true);
  });
});
