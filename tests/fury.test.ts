/** Bosses scarier (shared/fury.ts; Kyle, 2026-11-23): a named boss tougher, quicker, broader, and destructive. */
import { describe, expect, it } from 'vitest';
import { landJob } from '../src/shared/territory';
import { BUILDS, BUTCHER, HIGH_GROWTH, TICK, buildOf, reachFor } from '../src/shared/tuning';
import { begin, newEnemy } from '../src/sim/enemies';
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
  it('each name its build: more health, harder, quicker blows, broader, bigger, reaching further', () => {
    for (const [name, id] of [['MAWL', 'fat'], ['SKARN', 'quick'], ['OLD KNUCKLES', 'hulk'], ['OLD SPOON', 'brute']] as const) {
      const plain = newEnemy(1, 'butcher', 5, 5), e = newEnemy(2, 'butcher', 5, 5), b = BUILDS[id];
      Object.assign(plain, { hp: 420, maxHp: 420 }), Object.assign(e, { hp: 420, maxHp: 420, name });
      furyOn(e);
      expect(buildOf(name)).toBe(id);
      expect(e.maxHp).toBe(Math.round(420 * b.hp));
      expect(e.harm).toBeCloseTo(b.harm);
      expect(e.edge).toEqual({ windup: b.windup, pause: b.pause });
      expect(e.radius).toBeCloseTo(plain.radius * b.radius);
      expect([e.scale, e.stride]).toEqual([b.size, b.pace]);
      expect(e.reach).toBeCloseTo(reachFor(b.size));
    }
    // Up to three times the size (Kyle: "up to 3x, why the hell not"); a quick one hardly bigger but quickest.
    expect(BUILDS.hulk.size).toBe(3);
    expect(BUILDS.quick.pace).toBeGreaterThan(BUILDS.brute.pace);
    expect(buildOf('SOMEONE NEW')).toBe(buildOf('SOMEONE NEW'));
  });

  it("a big one's blow reaches as far as its size", () => {
    const e = newEnemy(7, 'butcher', 5, 5);
    Object.assign(e, { name: 'OLD KNUCKLES' });
    furyOn(e);
    begin(e, 'cleave', BUTCHER.cleave, { id: 'x', x: 5, y: 3 } as never, []);
    expect(e.attack!.range).toBeCloseTo(BUTCHER.cleave.range! * reachFor(BUILDS.hulk.size));
  });

  it('walks faster than a plain butcher', () => {
    const { room, h } = setup();
    const a = newEnemy(901, 'butcher', 24, 30), b = newEnemy(902, 'butcher', 36, 30);
    b.name = 'OLD SPOON';
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
    e.name = 'OLD SPOON';
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

  it('at high levels a shield goblin or a BIG ONE grows toward the old boss size, a BIG ONE quicker too; low, no', () => {
    const at = (lv: number, big: boolean) => {
      const e = newEnemy(5, 'scrapper', 5, 5);
      if (big) e.big = true;
      else e.variant = 'shield';
      const r0 = e.radius;
      growOn(e, lv);
      return { k: e.scale ?? 1, stride: e.stride ?? 1, wider: e.radius / r0 };
    };
    expect(at(HIGH_GROWTH.from, false)).toEqual({ k: 1, stride: 1, wider: 1 });
    const hi = at(10, false), big = at(10, true), top = at(30, true);
    expect(hi.k).toBeGreaterThan(1.2);
    // (A shield goblin grows but stays slow; a BIG ONE gets about more.)
    expect(hi.stride).toBe(1);
    expect(big.stride).toBeGreaterThan(1.15);
    expect(top.k).toBe(HIGH_GROWTH.sizeMost);
    expect(top.stride).toBe(HIGH_GROWTH.paceMost);
    // A plain goblin doesn't grow.
    const plain = newEnemy(6, 'scrapper', 5, 5);
    growOn(plain, 10);
    expect(plain.scale).toBeUndefined();
  });
});

describe('more on the field as the heroes grow (Kyle, 2026-11-23)', () => {
  it('from level 3 each level more puts more small ones in a pack and lets more be awake on screen; parties more again', async () => {
    const { levelCrowd, LEVEL_CROWD, BUDGET, SCREEN } = await import('../src/shared/tuning');
    const { capsFor } = await import('../src/shared/roombudget');
    expect(levelCrowd(LEVEL_CROWD.from)).toBe(0);
    expect(levelCrowd(9)).toBeGreaterThan(0.4);
    expect(levelCrowd(99)).toBe(LEVEL_CROWD.most);
    expect(capsFor(1, 0, 9).threat).toBe(SCREEN.threat[0] + 6);
    expect(capsFor(4, 0, 1).threat).toBeGreaterThan(capsFor(2, 0, 1).threat);
    expect(BUDGET.party[3]).toBeGreaterThan(1.8);
  });
});
