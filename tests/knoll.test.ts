/**
 * Raised areas (docs/design/elevation.md, "Raised areas"), on the knoll test map (shared/knollmap.ts): the land is
 * flat but for one raised area whose tall face is toward the camera; you get up it only by its narrow steps; you
 * can step off its lip; its back is grown over so nothing drops away out of sight; archers hold its top.
 */
import { describe, expect, it } from 'vitest';
import { inArea, levelAt } from '../src/shared/arena';
import { KNOLL, RISE, STEPS, TRACK } from '../src/shared/knollmap';
import { landJob, territoryPlan } from '../src/shared/territory';
import { TICK } from '../src/shared/tuning';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';

const plan = () => territoryPlan(landJob('knoll', 3));

function walk(x: number, y: number, mx: number, my: number, secs: number, z = 0) {
  const room = runRoom(newRun(landJob('knoll', 3))), h = room.join('me');
  room.setIntent(h.id, NO_INTENT), Object.assign(h, { hp: 1e6, maxHp: 1e6 });
  for (const e of room.allEnemies) Object.assign(e, { hp: 0, act: 'dead' });
  for (let n = 0; n < 60; n++) room.step();
  Object.assign(h, { x, y, z, safeT: 99 });
  room.setIntent(h.id, { ...NO_INTENT, mx, my });
  for (let n = 0; n < Math.round(secs / TICK); n++) room.step();
  return h;
}

describe('a raised area', () => {
  it('is the only height on the map: one flat top, two levels up, everything else ground', () => {
    const m = plan().map;
    expect(m.ledges!.length).toBe(1);
    expect(m.ledges![0].lv).toBe(2);
    expect(levelAt(m, 14, 15)).toBe(2);
    for (const [x, y] of [[20, 43], [16, 30], [30, 20], [30, 8]]) expect(levelAt(m, x, y)).toBe(0);
  });

  it('has narrow ways up and no slope: each ramp three tiles wide at most, none along a whole edge', () => {
    const l = plan().map.ledges![0];
    expect(l.ramps.length).toBe(2);
    for (const q of l.ramps) expect(Math.min(q.w, q.h)).toBeLessThanOrEqual(3);
    expect(l.ramps.every((q) => q.w < l.w / 2 && q.h < l.h / 2)).toBe(true);
  });

  it('its face is toward the camera: the low ground is south and east of it, never north', () => {
    const m = plan().map;
    // South of the south edge and east of the east edge: ground. North of the back and west of it: off the map's play.
    expect(levelAt(m, 14, RISE.y + RISE.h + 1)).toBe(0);
    expect(levelAt(m, RISE.x + RISE.w + 1, 14)).toBe(0);
    expect(RISE.y).toBeLessThan(5), expect(RISE.x).toBeLessThan(4);
  });

  it('its back is grown over: nobody can stand north of the hedge across its top', () => {
    const m = plan().map, back = m.rounds.filter((o) => o.x > RISE.x && o.x < RISE.x + RISE.w && o.y > RISE.y && o.y < 10.2);
    expect(back.length).toBeGreaterThan(30);
    // Walking north on top from the cage, the hedge stops you well short of the map's top.
    const h = walk(8, 13, 0, -1, 4, 2);
    expect(h.y).toBeGreaterThan(9.5);
    expect(h.z ?? 0).toBe(2);
  });

  it('the face stops you from below, anywhere but the steps', () => {
    for (const x of [5.5, 14, 20]) {
      const h = walk(x, 23, 0, -1, 3);
      expect(h.y).toBeGreaterThan(RISE.y + RISE.h - 0.2);
      expect(h.z ?? 0).toBe(0);
    }
    const east = walk(27, 16.5, -1, 0, 3);
    expect(east.x).toBeGreaterThan(RISE.x + RISE.w - 0.2);
    expect(east.z ?? 0).toBe(0);
  });

  it('the steps take you up the south face, and the track up the east end', () => {
    const south = walk(STEPS.x + STEPS.w / 2, 23, 0, -1, 4);
    expect(south.z ?? 0).toBe(2);
    expect(south.y).toBeLessThan(STEPS.y);
    const east = walk(27.5, TRACK.y + TRACK.h / 2, -1, 0, 4);
    expect(east.z ?? 0).toBe(2);
    expect(east.x).toBeLessThan(TRACK.x);
  });

  it('you can step off the lip and land on the field below: a way down anywhere, a way up only by the steps', () => {
    const h = walk(15, 18, 0, 1, 3, 2);
    expect(h.y).toBeGreaterThan(RISE.y + RISE.h + 0.5);
    expect(h.z ?? 0).toBe(0);
  });

  it('holds its top: the two archers and the brute stand up there, the cage with them, three more in the field', () => {
    const p = plan(), up = p.foes.filter((f) => (f.z ?? 0) === 2), down = p.foes.filter((f) => !f.z);
    expect(up.filter((f) => f.bow).length).toBe(2);
    expect(up.length).toBe(3), expect(down.length).toBe(3);
    const cage = p.props.find((q) => q.kind === 'cage')!;
    expect(levelAt(p.map, cage.x, cage.y)).toBe(2);
    expect(inArea({ x: 0, y: 0, w: KNOLL.w, h: KNOLL.h }, p.map.hero.x, p.map.hero.y)).toBe(true);
  });
});
