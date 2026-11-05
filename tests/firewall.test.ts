/** The staff's wall of fire (Kyle, 2026-11-05; sim/firewall.ts, shared/spellbook.ts FIRE_WALL): rolled at a goblin with no aiming, it burns goblins and friends alike. */
import { describe, expect, it } from 'vitest';
import { ARENA, type GameMap } from '../src/shared/arena';
import { BURN, FIRE_WALL, TICK, WEATHER } from '../src/shared/tuning';
import { burning } from '../src/sim/elements';
import { allyBurn, wallTarget } from '../src/sim/firewall';
import { NO_INTENT, type FightEvent, type Zone } from '../src/sim/types';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { lost, mageArena } from './magearena';

/** Held a little past the flash (a plain hold), and on the flash (a perfect); the cast comes `CAST` after the let-go. */
const PLAIN = 1.4, FLASH = 1.05, CAST = 0.15;
const wall = (zones: Zone[]) => zones.find((z) => z.kind === 'firewall');
const spell = (ev: FightEvent[]) => ev.find((x): x is Extract<FightEvent, { k: 'spell' }> => x.k === 'spell');
/** How long it rolls from a tile in front of the Mage at (9, 9) to `d` tiles away. */
const roll = (d: number) => (d - FIRE_WALL.start) / FIRE_WALL.speed;
/** A staff Mage at (9, 9) facing up, in fire, goblins at each spot; the hold let go and `after` s run. */
function raise(at: [number, number][], after = CAST, hold = PLAIN, map?: GameMap) {
  const a = mageArena('staff', at, 'fire', false, 'scrapper', map);
  a.h.safeT = 0;
  const ev = a.loose(hold, after);
  return { ...a, ev, z: wall(a.room.zones)! };
}

describe('what it rolls at', () => {
  it('the goblin in front, no aiming: the nearest in the wide cone, though one behind is nearer', () => {
    const a = raise([[11.5, 5], [9, 10.5], [9.6, 6.5]]);
    expect([a.z.tx, a.z.ty].map((v) => +v!.toFixed(5))).toEqual([9.6, 6.5]);
    // It rises a tile in front, the way to the goblin, square to it.
    const d = Math.hypot(0.6, 2.5);
    expect(spell(a.ev)).toMatchObject({ what: 'firewall', r: FIRE_WALL.len / 2, big: false });
    expect(spell(a.ev)!.x).toBeCloseTo(9 + (0.6 / d) * FIRE_WALL.start, 5);
    expect(a.z.ax).toBeCloseTo(0.6 / d, 5);
    expect(a.z.ay).toBeCloseTo(-2.5 / d, 5);
    // The Mage turns to it.
    expect(a.h.fx).toBeGreaterThan(0);
    expect(a.h.fy).toBeLessThan(0);
  });

  it('a goblin out at the side of the cone still counts; past its reach does not', () => {
    const a = raise([[9 + 4, 9 - 4.2], [9, 9 - FIRE_WALL.reach - 0.5], [9, 11]]);
    expect([a.z.tx, a.z.ty].map((v) => +v!.toFixed(5))).toEqual([13, 4.8]);
  });

  it('nothing in front: the nearest goblin within reach anywhere', () => {
    const a = raise([[9, 12], [13, 9], [9, 9 - FIRE_WALL.reach - 1]]);
    expect([a.z.tx, a.z.ty].map((v) => +v!.toFixed(5))).toEqual([9, 12]);
    expect(a.z.ay).toBeCloseTo(1, 5);
  });

  it('nothing in reach: a spot FIRE_WALL.ahead in front, short of a wall', () => {
    const a = raise([[9, 9 + FIRE_WALL.reach + 1]]);
    expect(a.z.tx).toBeCloseTo(9, 5);
    expect(a.z.ty).toBeCloseTo(9 - FIRE_WALL.ahead, 5);
    const b = mageArena('staff', [], 'fire');
    Object.assign(b.h, { x: 9, y: 1.2 });
    expect(wallTarget(b.h, []).y).toBeGreaterThan(1.2 - FIRE_WALL.ahead + 0.5);
  });
});

describe('it rolls, then stands', () => {
  it('rolls at FIRE_WALL.speed from a tile in front to where the goblin stood, then burns there for FIRE_WALL.life', () => {
    const a = raise([[9, 4]]);
    expect(a.z.y).toBeLessThan(9 - FIRE_WALL.start);
    expect(a.z.y).toBeGreaterThan(4);
    const was = a.z.y;
    a.run(0.4);
    expect(was - a.z.y).toBeCloseTo(FIRE_WALL.speed * 0.4, 5);
    expect(a.z.fell).toBeFalsy();
    const ev = a.run(roll(5));
    expect(ev.some((x) => x.k === 'wallup')).toBe(true);
    expect([a.z.x, a.z.y]).toEqual([9, 4]);
    expect(a.z.until - a.z.at!).toBeCloseTo(FIRE_WALL.life, 5);
    a.run(FIRE_WALL.life - 0.5);
    expect([a.z.x, a.z.y]).toEqual([9, 4]);
    a.run(1);
    expect(wall(a.room.zones)).toBeUndefined();
  });

  it('stops short at a wall, and wood it touches catches', () => {
    const fence = { x: 7, y: 5, w: 4, h: 0.3, kind: 'fence', hp: 30, maxHp: 30, burning: -1 };
    const yard = { ...ARENA, blocks: [fence] } as GameMap;
    const a = raise([[9, 3.5]], CAST + roll(5), PLAIN, yard);
    expect(a.z.fell).toBe(true);
    expect(a.z.y).toBeGreaterThan(5.3);
    expect(a.z.y).toBeLessThan(5.9);
    expect(lost(a.e)).toBe(0);
    expect(fence.burning).toBeGreaterThanOrEqual(0);
  });

  it('lights an oil slick it touches', () => {
    const a = mageArena('staff', [[9, 4]], 'fire');
    a.room.slicks = [{ id: 1, x: 10, y: 6, r: 0.6, until: 99, lit: -1 }];
    a.loose(PLAIN, CAST + roll(3.2));
    expect(a.room.slicks[0].lit).toBeGreaterThanOrEqual(0);
  });

  it('let go on the flash: wider, burning longer', () => {
    const a = raise([[9, 6]], CAST, FLASH);
    expect(a.ev.some((x) => x.k === 'perfect')).toBe(true);
    expect(a.z).toMatchObject({ big: true, r: FIRE_WALL.bigLen / 2 });
    expect(a.z.until - a.z.at!).toBeCloseTo(FIRE_WALL.bigLife, 5);
    // A goblin 1.8 off its middle is in the wider wall and out of the plain one.
    const wide = raise([[9, 6], [10.9, 6]], CAST + roll(3) + 0.1, FLASH), plain = raise([[9, 6], [10.9, 6]], CAST + roll(3) + 0.1);
    expect(burning(wide.es[1], wide.room.time)).toBe(true);
    expect(burning(plain.es[1], plain.room.time)).toBe(false);
  });
});

describe('it burns', () => {
  it('sets alight every goblin it rolls through, and burns those it stands on every half second', () => {
    // One beside its path, out of the cone, rolled over near the start; one where it stops; one past it.
    const a = raise([[10.2, 7.9], [9, 5], [9, 3]], CAST + 0.1);
    expect(a.z.ty).toBe(5);
    expect(burning(a.es[0], a.room.time)).toBe(true);
    expect(lost(a.es[1])).toBe(0);
    a.run(roll(4));
    expect(a.es.map((e) => burning(e, a.room.time))).toEqual([true, true, false]);
    const was = lost(a.es[1]);
    a.run(2);
    // Four ticks of the wall and the burn's own on top.
    const n = a.z.n!;
    expect(lost(a.es[1]) - was).toBeGreaterThanOrEqual(4 * n + 3 * BURN.dmg);
    // The one it rolled over was struck by the wall once: what else it lost is its burn.
    expect(lost(a.es[0])).toBeLessThan(n + 8 * BURN.dmg);
    expect(lost(a.es[2])).toBe(0);
  });

  it('friends in it take about a third of what a goblin does, so they move out; the Mage too', () => {
    const a = mageArena('staff', [[9, 6]], 'fire');
    const friend = a.room.join('friend');
    Object.assign(friend, { x: 9.8, y: 6.2, safeT: 0 });
    a.h.safeT = 0;
    a.loose(PLAIN, CAST + roll(3) + 0.05);
    const fWas = friend.hp, gWas = lost(a.e);
    a.run(2);
    const friendLost = fWas - friend.hp, goblinLost = lost(a.e) - gWas;
    expect(allyBurn(wall(a.room.zones)!)).toBe(Math.round((FIRE_WALL.dmg + BURN.dmg) * FIRE_WALL.ally));
    expect(friendLost).toBeGreaterThan(0);
    expect(friendLost / goblinLost).toBeGreaterThan(0.25);
    expect(friendLost / goblinLost).toBeLessThan(0.42);
    // Out of it, nothing.
    friend.x = 14;
    const out = friend.hp;
    a.run(1);
    expect(friend.hp).toBe(out);
    // The Mage's own wall, with a goblin at its feet, stands a tile in front and burns the Mage standing in it.
    const b = mageArena('staff', [[9, 8.4]], 'fire');
    b.h.safeT = 0;
    b.loose(PLAIN, CAST);
    Object.assign(b.h, { y: 8.1 });
    b.run(1.05, { ay: 0 });
    expect(b.h.hp).toBeLessThan(b.h.maxHp);
    expect((b.h.maxHp - b.h.hp) % allyBurn(wall(b.room.zones)!)).toBe(0);
  });

  it('rain shortens it by the weather burn share', () => {
    const rain: GameMap = { ...ARENA, theme: { ...ARENA.theme, sky: 'rain' } };
    const a = raise([[9, 6]], CAST, PLAIN, rain);
    expect(a.z.until - a.z.at!).toBeCloseTo(FIRE_WALL.life * WEATHER.rain.burn, 5);
    a.run(roll(3) + FIRE_WALL.life * WEATHER.rain.burn + 0.2);
    expect(wall(a.room.zones)).toBeUndefined();
    const b = raise([[9, 6]], CAST, FLASH, rain);
    expect(b.z.until - b.z.at!).toBeCloseTo(FIRE_WALL.bigLife * WEATHER.rain.burn, 5);
  });
});

describe('online', () => {
  it("a guest's hold raises it on the leader's room, and every screen gets the same wall, rolling and standing", () => {
    const a = mageArena('wand', [[6, 4]], 'fire');
    const guest = a.room.join('guest');
    Object.assign(guest, { weapon: 'staff', x: 6, y: 9, fx: 0, fy: -1, safeT: 0 });
    guest.augments.channel = 'fire';
    const go = (s: number, attack: boolean) => {
      a.room.setIntent('guest', { ...NO_INTENT, ay: -1, attackSeq: 1, attack });
      for (let k = 0; k < Math.round(s / TICK); k++) a.room.step(), Object.assign(a.e, { x: 6, y: 4, kvx: 0, kvy: 0 });
    };
    const enc = new Encoder(), dec = new Decoder();
    go(PLAIN, true);
    go(CAST + 0.2, false);
    const z = wall(a.room.zones)!, seen = () => dec.apply(enc.encode(stateOf(a.room)), false).zones.find((q) => q.kind === 'firewall')!;
    dec.apply(enc.encode(stateOf(a.room), true), true);
    expect(z).toMatchObject({ owner: 'guest', tx: 6, ty: 4 });
    // Rolling: the guest's wall is where the leader's is.
    go(0.3, false);
    let q = seen();
    expect(q).toMatchObject({ kind: 'firewall', r: z.r, owner: 'guest', big: false, n: z.n, el: 'fire', ax: 0, ay: -1 });
    expect(q.x as number).toBeCloseTo(z.x, 2);
    expect(q.y as number).toBeCloseTo(z.y, 2);
    expect(z.y).toBeGreaterThan(4);
    // Standing: where the goblin stood, the same life.
    go(1, false);
    q = seen();
    expect([q.x, q.y]).toEqual([6, 4]);
    expect(q.until as number).toBeCloseTo(z.until, 2);
    expect(q.fell).toBe(true);
    expect(burning(a.e, a.room.time)).toBe(true);
  });
});
