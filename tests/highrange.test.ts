/**
 * Height and range (sim/highrange.ts; docs/design/elevation.md, "Raised areas"), on the knoll: from a lip above, a
 * shot reaches further; loosed up at a height, it has more to cover. A hero's arrows and a goblin archer's alike.
 */
import { describe, expect, it } from 'vitest';
import { RISE } from '../src/shared/knollmap';
import { landJob } from '../src/shared/territory';
import { ARCHER, HEIGHT, TICK } from '../src/shared/tuning';
import { newEnemy } from '../src/sim/enemies';
import { looksDown, reachShift } from '../src/sim/highrange';
import type { ArenaRoom } from '../src/sim/room';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT, type Bolt, type Enemy, type Hero } from '../src/sim/types';

const LIP = RISE.y + RISE.h, UP = RISE.lv;

/** The knoll with nobody on it but the hero, who cannot be hurt. */
function knoll() {
  const room = runRoom(newRun(landJob('knoll', 3))), h = room.join('me');
  room.setIntent(h.id, NO_INTENT);
  for (const e of room.allEnemies) Object.assign(e, { hp: 0, act: 'dead' });
  for (let n = 0; n < 60; n++) room.step();
  Object.assign(h, { hp: 1e6, maxHp: 1e6, safeT: 99 });
  return { room, h };
}
/** A goblin held where it stands (pinned), so the distance to it is the distance asked for. */
const goblin = (id: number, x: number, y: number, z: number) => Object.assign(newEnemy(id, 'scrapper', x, y), { z, hp: 999, maxHp: 999, respawns: false, alert: false, cooldown: 99, act: 'pinned' as const, actT: 0, actDur: 99 });
const archer = (id: number, x: number, y: number, z: number) => Object.assign(newEnemy(id, 'scrapper', x, y), { z, bow: true, hp: 999, maxHp: 999, respawns: false, alert: true, cooldown: 0 });
/** A column of the field with nothing standing in an arrow's way from the lip to the bottom. */
const clearX = (room: ArenaRoom) => [6, 7, 10, 12, 13, 17, 18, 21, 22].find((x) => !room.map.rounds.some((o) => Math.abs(o.x - x) < o.r + 0.5 && o.y > LIP - 3) && !room.map.blocks.some((b) => x > b.x - 0.5 && x < b.x + b.w + 0.5 && b.y > LIP - 3))!;

/** Draw a longbow fully at (x, y, z) and let go along (0, fy): the arrow as loosed, what `e` lost, whether it was told short. */
function loose(room: ArenaRoom, h: Hero, x: number, y: number, z: number, fy: number, e?: Enemy) {
  Object.assign(h, { x, y, z, weapon: 'longbow', fx: 0, fy });
  if (e) room.enemies.push(e);
  for (let i = 0; i < 1 / TICK; i++) room.setIntent(h.id, { ...NO_INTENT, attack: true, attackSeq: 1, ax: 0, ay: fy }), room.step();
  let shot: Bolt | undefined, short = 0;
  for (let i = 0; i < 2.5 / TICK; i++) {
    room.setIntent(h.id, { ...NO_INTENT, attack: false, attackSeq: 1 }), room.step();
    short += room.events.filter((v) => v.k === 'short').length;
    const b = room.bolts.find((o) => o.kind === 'arrow' && o.owner === h.id);
    if (b && !shot) shot = { ...b };
  }
  return { shot: shot!, lost: e ? e.maxHp - e.hp : 0, short };
}

describe('height and range', () => {
  it('the rule: more from a lip above, less from below, nothing on the level or stood back from the edge', () => {
    const { room } = knoll(), m = room.map;
    expect(looksDown(m, { x: 15, y: LIP - 1, z: UP }, 0, 1)).toBe(UP);
    expect(looksDown(m, { x: 15, y: LIP - HEIGHT.edge - 1.5, z: UP }, 0, 1)).toBe(0);
    expect(looksDown(m, { x: 15, y: LIP - 1, z: UP }, 0, -1)).toBe(0);
    expect(reachShift(m, { x: 15, y: LIP - 1, z: UP }, 0, 1, 0)).toBe(HEIGHT.reach * UP);
    expect(reachShift(m, { x: 15, y: LIP - 6, z: UP }, 0, 1, 0)).toBe(0);
    expect(reachShift(m, { x: 15, y: LIP + 3, z: 0 }, 0, -1, UP)).toBe(-HEIGHT.reach * UP);
    expect(reachShift(m, { x: 15, y: LIP + 3, z: 0 }, 0, 1, 0)).toBe(0);
  });

  it("a hero's arrow from the lip flies further; from back on the top, or on the field, it flies as far as ever", () => {
    const flat = knoll(), base = loose(flat.room, flat.h, 30, 40, 0, -1).shot.range;
    const lip = knoll(), back = knoll();
    expect(loose(lip.room, lip.h, 15, LIP - 1, UP, 1).shot.range).toBe(base + HEIGHT.reach * UP);
    expect(loose(back.room, back.h, 15, LIP - 6, UP, 1).shot.range).toBe(base);
  });

  it('loosed up at a goblin on the top from too far it falls short and says so; from close in under the height it lands', () => {
    const flat = knoll(), base = loose(flat.room, flat.h, 30, 40, 0, -1).shot.range, far = knoll(), x = clearX(far.room), gy = LIP - 1.5;
    expect(x).toBeDefined();
    // On the level this far is well inside the bow's reach; up two levels it is not.
    const dFar = base - 1.5, a = loose(far.room, far.h, x, gy + dFar, 0, -1, goblin(901, x, gy, UP));
    expect(a.lost).toBe(0);
    expect(a.short).toBe(1);
    const near = knoll(), dNear = base - HEIGHT.reach * UP - 1.5, b = loose(near.room, near.h, x, gy + dNear, 0, -1, goblin(902, x, gy, UP));
    expect(b.lost).toBeGreaterThan(0);
    expect(b.short).toBe(0);
    // And a goblin on the field at that same far range is hit as ever.
    const level = knoll(), c = loose(level.room, level.h, x, LIP + 2 + dFar, 0, -1, goblin(903, x, LIP + 2, 0));
    expect(c.lost).toBeGreaterThan(0);
  });

  /** Steps till the archer begins a shot (or `secs` pass): the distance it began at and the shot's range, or nothing. */
  function shoots(room: ArenaRoom, e: Enemy, h: Hero, secs: number) {
    for (let i = 0; i < secs / TICK; i++) {
      room.step(), Object.assign(h, { hp: 1e6 });
      if (e.attack?.kind === 'shot') return { d: Math.hypot(h.x - e.attack.ox, h.y - e.attack.oy), range: e.attack.range };
    }
    return undefined;
  }

  it('a goblin archer on the lip shoots a hero the bow would not reach on the level', () => {
    const { room, h } = knoll(), d = ARCHER.reach + HEIGHT.reach * UP - 1, e = archer(911, 13, LIP - 1.2, UP);
    room.enemies.push(e), Object.assign(h, { x: 13, y: e.y + d, z: 0 });
    const s = shoots(room, e, h, 3)!;
    expect(s).toBeDefined();
    expect(s.d).toBeGreaterThan(ARCHER.reach + 1);
    expect(s.range).toBeGreaterThanOrEqual(s.d);
    expect(e.z).toBe(UP);
    // The same two on the field: too far, so it comes in first.
    const f = knoll(), g = archer(912, 30, 24, 0);
    f.room.enemies.push(g), Object.assign(f.h, { x: 30, y: 24 + d, z: 0 });
    expect(shoots(f.room, g, f.h, 0.5)).toBeUndefined();
  });

  it('stood back from the edge it comes to the lip and holds it: it never steps off after you', () => {
    const { room, h } = knoll(), e = archer(913, 13, LIP - 7, UP);
    room.enemies.push(e), Object.assign(h, { x: 13, y: LIP + 7, z: 0 });
    for (let i = 0; i < 12 / TICK; i++) room.step(), Object.assign(h, { hp: 1e6 });
    expect(e.z).toBe(UP);
    expect(e.y).toBeGreaterThan(LIP - 2.5);
    expect(e.y).toBeLessThan(LIP);
  });

  it('a goblin archer below a hero on the top has to come in close under the height before it can shoot', () => {
    const { room, h } = knoll(), e = archer(914, 15, LIP + 5.5, 0);
    room.enemies.push(e), Object.assign(h, { x: 15, y: LIP - 1, z: UP });
    const s = shoots(room, e, h, 8)!;
    expect(s).toBeDefined();
    // (It began 6.5 away, inside the bow's reach on the level.)
    expect(s.d).toBeLessThanOrEqual(ARCHER.reach - HEIGHT.reach * UP + 0.05);
  });
});
