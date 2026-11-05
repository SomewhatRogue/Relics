// Goblins through the shallows (Kyle: "some shallow water seems to really hurt pathing"): a butcher
// crosses the Barrowfields' ford rather than wedging itself between a reed and the deep; nobody walks
// into deep water; wading is a little slower than dry ground; the way found is the same every time.
// And the water's look: blood landing in it clouds there instead of staining, other things are lost.
import { describe, expect, it } from 'vitest';
import { inArea, useMap, wadeAt, WADE } from '../src/shared/arena';
import { expedition } from '../src/shared/expedjob';
import { expedPlan } from '../src/shared/expedmap';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT } from '../src/sim/types';
import { wayTo } from '../src/sim/pathing';
import { DEEP, EAST, SHALLOW, STILL, levelAt, waterField } from '../src/client/waterfield';
import { Wet } from '../src/client/wetfx';

const MAP = expedPlan(expedition(2)).map;

/** A goblin of a kind from a to a hero standing at b: seconds to reach, and whether it ever stood in deep water. */
function cross(kind: 'scrapper' | 'butcher', a: { x: number; y: number }, b: { x: number; y: number }): { secs: number; wet: boolean } {
  const room = new ArenaRoom(7, { map: MAP, foes: [{ kind, x: a.x, y: a.y, awake: true }] }), h = room.join('me'), e = room.enemies[0];
  Object.assign(h, { x: b.x, y: b.y, safeT: 1e9 });
  room.setIntent('me', { ...NO_INTENT });
  let wet = false, t = 0;
  for (; t < 30 * 30 && Math.hypot(e.x - b.x, e.y - b.y) > 2.4; t++) {
    Object.assign(h, { x: b.x, y: b.y, hp: h.maxHp });
    room.step();
    if ((MAP.water ?? []).some((w) => w.deep && inArea(w, e.x, e.y))) wet = true;
  }
  return { secs: t / 30, wet };
}

describe('wading', () => {
  it('a butcher crosses the ford by the reeds and never wades the deep', () => {
    // Before: wedged between a reed and the deep water at 53.7, 33.4 for good.
    for (const [a, b] of [[{ x: 52.8, y: 32.9 }, { x: 60.1, y: 39.4 }], [{ x: 52.3, y: 39 }, { x: 61, y: 30.1 }]]) {
      const r = cross('butcher', a, b);
      expect(r.secs).toBeLessThan(12);
      expect(r.wet).toBe(false);
    }
    expect(cross('scrapper', { x: 52.8, y: 32.9 }, { x: 60.1, y: 39.4 }).secs).toBeLessThan(8);
  });

  it('finds the same way every time, and a body its size fits', () => {
    useMap(MAP);
    const big = wayTo({ x: 52.8, y: 32.9, radius: 0.62 }, 60.1, 39.4);
    expect(wayTo({ x: 52.8, y: 32.9, radius: 0.62 }, 60.1, 39.4)).toEqual(big);
    // Not the gap between the reed at 54, 32.7 and the deep water a butcher can't get through.
    expect(Math.hypot(big.x - 54.25, big.y - 33.25)).toBeGreaterThan(0.3);
  });

  it('wading is a little slower than dry ground', () => {
    useMap(MAP);
    const ford = MAP.water!.find((w) => !w.deep)!;
    expect(wadeAt(ford.x + ford.w / 2, ford.y + ford.h / 2)).toBe(WADE);
    expect(WADE).toBeGreaterThanOrEqual(0.65);
    expect(WADE).toBeLessThan(1);
  });
});

describe('the water drawn', () => {
  it('knows deep, shallow and which way the river runs', () => {
    const f = waterField(MAP)!, ford = MAP.water!.find((w) => !w.deep)!, deep = MAP.water!.find((w) => w.deep)!;
    expect(levelAt(f, ford.x + ford.w / 2, ford.y + ford.h / 2)).toBe(SHALLOW);
    expect(levelAt(f, deep.x + deep.w / 2, deep.y + deep.h / 2)).toBe(DEEP);
    const i = Math.floor((deep.x + deep.w / 2) * f.n), j = Math.floor((deep.y + deep.h / 2) * f.n);
    expect(f.flow[j * f.cols + i]).toBe(EAST);
    const pool = waterField({ ...MAP, water: [{ x: 4, y: 4, w: 3, h: 2 }] })!;
    expect(levelAt(pool, 5, 5)).toBe(SHALLOW);
    expect(pool.flow[Math.floor(5 * pool.n) * pool.cols + Math.floor(5 * pool.n)]).toBe(STILL);
  });

  it('blood landing in the water clouds there; on the bank it stains', () => {
    const wet = new Wet(), deep = MAP.water!.find((w) => w.deep)!, px = (x: number, y: number) => [8 + x * 16, 56 + y * 16];
    wet.use(MAP);
    const [ax, ay] = px(deep.x + deep.w / 2, deep.y + deep.h / 2);
    expect(wet.take(ax, ay, '#7a1d1d')).toBe(true);
    expect(wet.take(ax + 1, ay, '#9a2a2a')).toBe(true);
    expect(wet.clouds.length).toBe(1);
    // A crack in the stone or a green bit: lost in the water, no cloud.
    expect(wet.take(ax, ay, '#1a1720')).toBe(true);
    expect(wet.clouds.length).toBe(1);
    const [bx, by] = px(deep.x + deep.w / 2, deep.y - 3);
    expect(wet.take(bx, by, '#7a1d1d')).toBe(false);
    // It drifts downstream and is gone in a few seconds.
    const x0 = wet.clouds[0].x;
    for (let i = 0; i < 30; i++) wet.update(0.1);
    expect(wet.clouds[0].x).toBeGreaterThan(x0 + 0.5);
    for (let i = 0; i < 60; i++) wet.update(0.1);
    expect(wet.clouds.length).toBe(0);
  });
});
