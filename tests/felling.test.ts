/**
 * Trees knocked down (sim/felling.ts; Kyle, 2026-11-19): a Warrior's or Cleric's heavy swing fells a small or
 * middling tree away from the blow along one of four ways; the trunk is in the air for a moment, then lands on
 * everything under it, heroes too; after that it is a wooden block that stops you and burns, and the stump stays.
 */
import { describe, expect, it } from 'vitest';
import { collide, solid, useMap } from '../src/shared/arena';
import { landJob } from '../src/shared/territory';
import { FELL, TICK } from '../src/shared/tuning';
import { ignite, wood } from '../src/sim/catching';
import { fell, fellable, trunkRect } from '../src/sim/felling';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';

const setup = (weapon = 'sword') => {
  const run = newRun(landJob('knoll', 3)), room = runRoom(run), h = room.join('me');
  for (const e of room.allEnemies) Object.assign(e, { hp: 0, act: 'dead' });
  Object.assign(h, { weapon, x: 30, y: 36, fx: 0, fy: -1, hp: 500, maxHp: 500, safeT: 0, z: 0 });
  room.setIntent(h.id, NO_INTENT);
  for (let i = 0; i < 80; i++) room.step();
  // A middling tree two tiles north of the hero, on open ground.
  room.map.rounds.push({ kind: 'tree', x: 30, y: 34.2, r: 0.5 });
  const secs = (n: number, intent = NO_INTENT) => { for (let t = 0; t < Math.round(n / TICK); t++) room.setIntent(h.id, intent), room.step(); };
  return { room, h, i: room.map.rounds.length - 1, secs };
};

describe('felling a tree', () => {
  it('small and middling trees, dead trees, apple trees and pines go over (pines since 2026-11-27); big ones stand', () => {
    expect([{ kind: 'tree', r: 0.5 }, { kind: 'deadtree', r: 0.45 }, { kind: 'apple', r: 0.6 }, { kind: 'tree', r: FELL.r + 0.05 }, { kind: 'pine', r: 0.4 }, { kind: 'bush', r: 0.4 }]
      .map((t) => fellable({ ...t, x: 0, y: 0 } as never))).toEqual([true, true, true, false, true, false]);
  });

  it('falls away from the blow along the nearer of four ways, leaving a stump and a trunk in the air', () => {
    const { room, i } = setup(), m = room.map, n = m.blocks.length, ev: never[] = [];
    const b = fell(m, i, 0.3, -1, room.time, ev)!;
    expect(m.rounds[i]).toMatchObject({ kind: 'stump', r: 0.3, x: 30, y: 34.2 });
    expect(m.blocks.length).toBe(n + 1);
    // North: a trunk lying north of the stump, long north to south, its crown at the far (north) end.
    expect([b.kind, b.stump, b.soft, b.lands! > room.time, b.h > b.w, b.y + b.h < 34.2, Math.abs(b.x + b.w / 2 - 30) < 0.01]).toEqual(['log', i, true, true, true, true, true]);
    expect([b.w, b.h]).toEqual([FELL.wide, FELL.long + 0.5 * FELL.grow]);
    expect(solid(b)).toBe(false);
    expect(ev).toEqual([{ k: 'timber', x: 30, y: 34.2, way: 3, wood: 0, r: 0.5 }]);
    // The four ways.
    const t = { kind: 'tree', x: 20, y: 20, r: 0.5 } as never;
    expect([0, 1, 2, 3].map((w) => { const q = trunkRect(m, t, w); return [q.x > 20, q.y > 20, q.x + q.w < 20, q.y + q.h < 20]; }))
      .toEqual([[true, false, false, false], [false, true, false, false], [false, false, true, false], [false, false, false, true]]);
  });

  it('lands on everything under it, heroes too, then lies there as wood that stops you and burns', () => {
    const { room, h, i, secs } = setup(), m = room.map;
    const spawn = (x: number, y: number) => (room as unknown as { spawn(k: string, x: number, y: number): { hp: number; act: string } }).spawn('scrapper', x, y);
    const gob = spawn(30, 32.4), far = spawn(34, 32.4);
    const ghp = gob.hp, fhp = far.hp;
    Object.assign(gob, { act: 'pinned' }), Object.assign(far, { act: 'pinned' });
    const b = fell(m, i, 0, -1, room.time, room.events)!;
    // The hero walks under it while it is in the air: nothing stops them yet.
    Object.assign(h, { x: 30, y: 33.2 });
    secs(FELL.fall - 0.15);
    expect([b.lands !== undefined, h.hp, gob.hp]).toEqual([true, 500, ghp]);
    secs(0.4);
    expect([b.lands, b.soft, solid(b)]).toEqual([undefined, undefined, true]);
    expect(gob.hp).toBeLessThanOrEqual(Math.max(0, ghp - FELL.dmg));
    expect(far.hp).toBe(fhp);
    expect(h.hp).toBe(500 - FELL.hero);
    // Cover now: a body cannot stand in it.
    useMap(m);
    const q = { x: b.x + b.w / 2, y: b.y + b.h / 2, z: 0 };
    collide(q, 0.3);
    expect(Math.hypot(q.x - (b.x + b.w / 2), q.y - (b.y + b.h / 2))).toBeGreaterThan(0.2);
    // And wood: it takes fire.
    expect(wood(b)).toBe(true);
    ignite(b, { now: room.time, ev: room.events, rng: { next: () => 0 } } as never);
    expect((b.burning ?? -1) >= 0).toBe(true);
  });

  it('a Warrior`s charged heavy swing does it, a quick cut does not, and a Ranger`s never', () => {
    const quick = setup();
    quick.secs(0.08, { ...NO_INTENT, attack: true, attackSeq: 1, ax: 0, ay: -1 });
    quick.secs(1.2, { ...NO_INTENT, attackSeq: 1, ax: 0, ay: -1 });
    expect(quick.room.map.rounds[quick.i].kind).toBe('tree');

    const heavy = setup();
    heavy.secs(1.6, { ...NO_INTENT, attack: true, attackSeq: 1, ax: 0, ay: -1 });
    heavy.secs(1.5, { ...NO_INTENT, attackSeq: 1, ax: 0, ay: -1 });
    expect(heavy.room.map.rounds[heavy.i].kind).toBe('stump');
    const trunk = heavy.room.map.blocks.find((b) => b.stump === heavy.i)!;
    expect([trunk.kind, trunk.lands, trunk.y + trunk.h < 34.2]).toEqual(['log', undefined, true]);

    const bow = setup('longbow');
    bow.secs(1.6, { ...NO_INTENT, attack: true, attackSeq: 1, ax: 0, ay: -1 });
    bow.secs(1.5, { ...NO_INTENT, attackSeq: 1, ax: 0, ay: -1 });
    expect(bow.room.map.rounds[bow.i].kind).toBe('tree');
  });
});
