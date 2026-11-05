/** The staff's fire pit (Kyle, 2026-11-05; sim/firepit.ts, shared/spellbook.ts FIRE_PIT): dropped on a goblin with no aiming, it burns goblins and friends alike. */
import { describe, expect, it } from 'vitest';
import { ARENA, type GameMap } from '../src/shared/arena';
import { BURN, FIRE_PIT, TICK, WEATHER } from '../src/shared/tuning';
import { burning } from '../src/sim/elements';
import { allyBurn, pitSpot } from '../src/sim/firepit';
import { NO_INTENT, type FightEvent, type Zone } from '../src/sim/types';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { lost, mageArena } from './magearena';

/** Held a little past the flash (a plain hold), and on the flash (a perfect); the cast comes `CAST` after the let-go. */
const PLAIN = 1.4, FLASH = 1.05, CAST = 0.15;
const pit = (zones: Zone[]) => zones.find((z) => z.kind === 'firepit');
const spell = (ev: FightEvent[]) => ev.find((x): x is Extract<FightEvent, { k: 'spell' }> => x.k === 'spell');
/** A staff Mage at (9, 9) facing up, in fire, goblins at each spot; the hold let go and `after` s run. */
function drop(at: [number, number][], after = CAST, hold = PLAIN, map?: GameMap) {
  const a = mageArena('staff', at, 'fire', false, 'scrapper', map);
  a.h.safeT = 0;
  const ev = a.loose(hold, after);
  return { ...a, ev, z: pit(a.room.zones)! };
}

describe('where the pit drops', () => {
  it('on the goblin in front, no aiming: the nearest in the wide cone, though one behind is nearer', () => {
    const a = drop([[11.5, 5], [9, 10.5], [9.6, 6.5]]);
    expect([a.z.x, a.z.y]).toEqual([9.6, 6.5]);
    expect(spell(a.ev)).toMatchObject({ what: 'firepit', x: 9.6, y: 6.5, r: FIRE_PIT.r, big: false });
    // The Mage turns to it.
    expect(a.h.fx).toBeGreaterThan(0);
    expect(a.h.fy).toBeLessThan(0);
  });

  it('a goblin out at the side of the cone still counts; past its reach does not', () => {
    const a = drop([[9 + 4, 9 - 4.2], [9, 9 - FIRE_PIT.reach - 0.5], [9, 11]]);
    expect([a.z.x, a.z.y]).toEqual([13, 4.8]);
  });

  it('nothing in front: the nearest goblin within reach anywhere', () => {
    const a = drop([[9, 12], [13, 9], [9, 9 - FIRE_PIT.reach - 1]]);
    expect([a.z.x, a.z.y]).toEqual([9, 12]);
  });

  it('nothing in reach: a spot FIRE_PIT.ahead in front', () => {
    const a = drop([[9, 9 + FIRE_PIT.reach + 1]]);
    expect(a.z.x).toBeCloseTo(9, 5);
    expect(a.z.y).toBeCloseTo(9 - FIRE_PIT.ahead, 5);
    // The spot never goes past a wall: up against the arena's edge it stops short.
    const b = mageArena('staff', [], 'fire');
    Object.assign(b.h, { x: 9, y: 1.2 });
    expect(pitSpot(b.h, []).y).toBeGreaterThan(1.2 - FIRE_PIT.ahead + 0.5);
  });

  it('let go on the flash: bigger, burning longer', () => {
    const a = drop([[9, 6]], CAST, FLASH);
    expect(a.ev.some((x) => x.k === 'perfect')).toBe(true);
    expect(a.z).toMatchObject({ big: true, r: FIRE_PIT.bigR });
    expect(a.z.until - a.z.at!).toBeCloseTo(FIRE_PIT.bigLife, 5);
  });
});

describe('the pit burns', () => {
  it('catches first, then burns goblins in it every half second and sets them alight', () => {
    const a = drop([[9, 6], [10.2, 6.6], [9, 3]]);
    expect(lost(a.es[0])).toBe(0);
    expect(a.z.at! - a.room.time).toBeGreaterThan(FIRE_PIT.catch - 0.05);
    const up = a.run(FIRE_PIT.catch + TICK);
    expect(up.some((x) => x.k === 'pitup')).toBe(true);
    expect(a.es.map((e) => burning(e, a.room.time))).toEqual([true, true, false]);
    const was = lost(a.es[0]);
    a.run(2);
    // Four ticks of the pit and the burn's own on top.
    expect(lost(a.es[0]) - was).toBeGreaterThanOrEqual(4 * FIRE_PIT.dmg + 3 * BURN.dmg);
    expect(lost(a.es[2])).toBe(0);
    expect(a.z.until - a.z.at!).toBeCloseTo(FIRE_PIT.life, 5);
  });

  it('friends in it take about a third of what a goblin does, so they move out; the Mage too', () => {
    const a = mageArena('staff', [[9, 6]], 'fire');
    const friend = a.room.join('friend');
    Object.assign(friend, { x: 9.8, y: 6.2, safeT: 0 });
    a.h.safeT = 0;
    a.loose(PLAIN, CAST + FIRE_PIT.catch);
    const fWas = friend.hp, gWas = lost(a.e);
    a.run(2);
    const friendLost = fWas - friend.hp, goblinLost = lost(a.e) - gWas;
    expect(allyBurn(pit(a.room.zones)!)).toBe(Math.round((FIRE_PIT.dmg + BURN.dmg) * FIRE_PIT.ally));
    expect(friendLost).toBeGreaterThan(0);
    expect(friendLost / goblinLost).toBeGreaterThan(0.25);
    expect(friendLost / goblinLost).toBeLessThan(0.42);
    // Out of it, nothing.
    friend.x = 14;
    const out = friend.hp;
    a.run(1);
    expect(friend.hp).toBe(out);
    // The Mage's own pit, dropped a step in front, burns the Mage on the same terms.
    const b = drop([[9, 8.2]], CAST + FIRE_PIT.catch + 1.1);
    expect(b.h.hp).toBe(b.h.maxHp - 3 * allyBurn(b.z));
  });

  it('rain shortens it by the weather burn share', () => {
    const rain: GameMap = { ...ARENA, theme: { ...ARENA.theme, sky: 'rain' } };
    const a = drop([[9, 6]], CAST, PLAIN, rain);
    expect(a.z.until - a.z.at!).toBeCloseTo(FIRE_PIT.life * WEATHER.rain.burn, 5);
    a.run(FIRE_PIT.life * WEATHER.rain.burn + 0.5);
    expect(pit(a.room.zones)).toBeUndefined();
    const b = drop([[9, 6]], CAST, FLASH, rain);
    expect(b.z.until - b.z.at!).toBeCloseTo(FIRE_PIT.bigLife * WEATHER.rain.burn, 5);
  });
});

describe('online', () => {
  it("a guest's hold drops it on the leader's room, and every screen gets the same pit in the patch", () => {
    const a = mageArena('wand', [[4, 6]], 'fire');
    const guest = a.room.join('guest');
    Object.assign(guest, { weapon: 'staff', x: 4, y: 9, fx: 0, fy: -1, safeT: 0 });
    guest.augments.channel = 'fire';
    const go = (s: number, attack: boolean) => {
      a.room.setIntent('guest', { ...NO_INTENT, ay: -1, attackSeq: 1, attack });
      for (let k = 0; k < Math.round(s / TICK); k++) a.room.step(), Object.assign(a.e, { x: 4, y: 6, kvx: 0, kvy: 0 });
    };
    go(PLAIN, true);
    go(CAST + FIRE_PIT.catch + 0.6, false);
    const z = pit(a.room.zones)!;
    expect(z).toMatchObject({ owner: 'guest', x: 4, y: 6 });
    const seen = new Decoder().apply(new Encoder().encode(stateOf(a.room), true), true).zones.find((q) => q.kind === 'firepit');
    expect(seen).toMatchObject({ kind: 'firepit', x: z.x, y: z.y, r: z.r, owner: 'guest', big: false, n: z.n, el: 'fire' });
    expect(seen!.at as number).toBeCloseTo(z.at!, 2);
    expect(seen!.until as number).toBeCloseTo(z.until, 2);
    expect(burning(a.e, a.room.time)).toBe(true);
  });
});
