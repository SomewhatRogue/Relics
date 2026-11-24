/** Bosses scarier (shared/fury.ts; Kyle, 2026-11-23): a named boss tougher, quicker, broader, and destructive. */
import { describe, expect, it } from 'vitest';
import { landJob } from '../src/shared/territory';
import { BUTCHER, FURY, HIGH_GROWTH, TICK } from '../src/shared/tuning';
import { newEnemy } from '../src/sim/enemies';
import { furyOn, growOn, stepFury } from '../src/sim/fury';
import { newProp } from '../src/sim/props';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';

const setup = () => {
  const run = newRun(landJob('knoll', 3)), room = runRoom(run), h = room.join('me');
  for (const e of room.allEnemies) Object.assign(e, { hp: 0, act: 'dead' });
  Object.assign(h, { x: 30, y: 40, hp: 9999, maxHp: 9999, safeT: 0, z: 0 });
  room.setIntent(h.id, NO_INTENT);
  for (let i = 0; i < 40; i++) room.step();
  return { room, h };
};

describe('a named boss in its fury', () => {
  it('has more health, hits harder, winds up and rests quicker, and is broader', () => {
    const plain = newEnemy(1, 'butcher', 5, 5), e = newEnemy(2, 'butcher', 5, 5);
    Object.assign(plain, { hp: 420, maxHp: 420 }), Object.assign(e, { hp: 420, maxHp: 420, name: 'MAWL' });
    furyOn(e);
    expect(e.maxHp).toBe(Math.round(420 * FURY.hp));
    expect(e.harm).toBeCloseTo(FURY.harm);
    expect(e.edge).toEqual({ windup: FURY.windup, pause: FURY.pause });
    expect(e.radius).toBeGreaterThan(plain.radius);
    expect(e.fury).toBe(true);
  });

  it('walks faster than a plain butcher', () => {
    const { room, h } = setup();
    const a = newEnemy(901, 'butcher', 24, 30), b = newEnemy(902, 'butcher', 36, 30);
    furyOn(b);
    for (const e of [a, b]) Object.assign(e, { alert: true, cooldown: 99, respawns: false });
    room.enemies.push(a, b);
    const [a0, b0] = [Math.hypot(a.x - h.x, a.y - h.y), Math.hypot(b.x - h.x, b.y - h.y)];
    for (let i = 0; i < Math.round(1 / TICK); i++) room.step();
    expect(b0 - Math.hypot(b.x - h.x, b.y - h.y)).toBeGreaterThan((a0 - Math.hypot(a.x - h.x, a.y - h.y)) * 1.15);
  });

  it('its blow smashes the crates under it and fells a tree in reach', () => {
    const { room } = setup();
    const e = newEnemy(903, 'butcher', 30, 30);
    furyOn(e);
    Object.assign(e, { fx: 0, fy: -1 });
    const crate = newProp('crate', 30, 28.8);
    room.props.push(crate);
    room.map.rounds.push({ kind: 'tree', x: 30.5, y: 28.6, r: 0.5 });
    const i = room.map.rounds.length - 1;
    e.attack = { kind: 'cleave', t: BUTCHER.cleave.windup + 0.01, windup: BUTCHER.cleave.windup, active: BUTCHER.cleave.active, recover: BUTCHER.cleave.recover, dmg: 1, knock: 0, range: BUTCHER.cleave.range, arc: BUTCHER.cleave.arc, ox: e.x, oy: e.y, dx: 0, dy: -1, cx: e.x, cy: e.y, radius: 0 } as never;
    stepFury([e], room.props, { now: room.time, ev: room.events, enemies: room.enemies, heroes: room.heroes, props: room.props } as never);
    expect(crate.hp < newProp('crate', 0, 0).hp || crate.broken).toBe(true);
    expect(room.map.rounds[i].kind).toBe('stump');
  });

  it('at high levels a shield goblin or a BIG ONE grows toward the old boss size and gets about more; low, no', () => {
    const at = (lv: number, big: boolean) => {
      const e = newEnemy(5, 'scrapper', 5, 5);
      if (big) e.big = true;
      else e.variant = 'shield';
      const r0 = e.radius;
      growOn(e, lv);
      return { k: e.scale ?? 1, stride: e.stride ?? 1, wider: e.radius / r0 };
    };
    expect(at(HIGH_GROWTH.from, false)).toEqual({ k: 1, stride: 1, wider: 1 });
    const hi = at(10, false), top = at(30, true);
    expect(hi.k).toBeGreaterThan(1.2);
    expect(hi.stride).toBeGreaterThan(1.15);
    expect(top.k).toBe(HIGH_GROWTH.sizeMost);
    expect(top.stride).toBe(HIGH_GROWTH.paceMost);
    // A plain goblin doesn't grow.
    const plain = newEnemy(6, 'scrapper', 5, 5);
    growOn(plain, 10);
    expect(plain.scale).toBeUndefined();
  });
});
