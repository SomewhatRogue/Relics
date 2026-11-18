/**
 * Goblins path on levels (sim/pathlevels.ts, docs/design/elevation.md): up a slope anywhere along it, along raised
 * ground round what stands on it, off a face onto lower ground, never up a face; on the proving hill, on a
 * bank with no slope, and on a flat map just as before.
 */
import { describe, expect, it } from 'vitest';
import { collide, solid, useMap, type GameMap } from '../src/shared/arena';
import { landJob, territoryPlan } from '../src/shared/territory';
import { TICK } from '../src/shared/tuning';
import { gridOf } from '../src/sim/pathgrid';
import { wayTo } from '../src/sim/pathing';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';

const R = 0.38;
type Body = { x: number; y: number; z: number; radius: number };
type Box = { x: number; y: number; w: number; h: number };
const inBox = (b: Box, x: number, y: number) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
const gap = (b: Box, x: number, y: number) => Math.hypot(x - Math.max(b.x, Math.min(b.x + b.w, x)), y - Math.max(b.y, Math.min(b.y + b.h, y)));

/** The proving hill's map, both gates open when asked. */
function low(open = false): GameMap {
  const map = territoryPlan(landJob('hill', 3)).map;
  if (open) for (const b of map.blocks) if (b.kind === 'gate') b.ruined = true;
  useMap(map);
  return map;
}

/** Walk a body toward a goal with wayTo and collide, 3 tiles a second, for up to `secs` or till within `near` of it
 *  on its level (a goal among trees is pressed at, not stood on); `each` sees it every step. */
function drive(at: { x: number; y: number; z: number }, goal: { x: number; y: number; z: number }, secs = 60, each?: (b: Body) => void, near = 0.1) {
  const b: Body = { ...at, radius: R };
  let walked = 0;
  for (let n = 0; n < secs / TICK; n++) {
    if (Math.hypot(goal.x - b.x, goal.y - b.y) < near && b.z === goal.z) break;
    const w = wayTo(b, goal.x, goal.y, goal.z), dx = w.x - b.x, dy = w.y - b.y, d = Math.hypot(dx, dy);
    expect(Number.isFinite(w.x) && Number.isFinite(w.y)).toBe(true);
    const k = Math.min(d, 3 * TICK) / (d || 1), x0 = b.x, y0 = b.y;
    b.x += dx * k, b.y += dy * k;
    collide(b, R);
    walked += Math.hypot(b.x - x0, b.y - y0);
    each?.(b);
  }
  return { b, walked, off: Math.hypot(goal.x - b.x, goal.y - b.y) };
}

describe('goblins path on the proving hill', () => {
  it('up a slope anywhere along it, round the scarecrow', () => {
    const map = low(), crow = map.rounds.find((r) => r.kind === 'scarecrow')!;
    for (const x of [10, 30, 36]) {
      const { b, walked, off } = drive({ x, y: 74, z: 0 }, { x, y: 64, z: 1 }, 10, (b) => expect(Math.hypot(b.x - crow.x, b.y - crow.y)).toBeGreaterThan(crow.r + R - 0.02));
      expect(off).toBeLessThan(0.3);
      expect(b.z).toBe(1);
      expect(walked).toBeLessThanOrEqual(11);
    }
  });

  it('from the hollow lane onto the west bank by its slope, never through its face', () => {
    const map = low(), bank = map.ledges!.find((l) => l.x === 0 && l.y === 23)!;
    const { b, walked, off } = drive({ x: 22, y: 32, z: 1 }, { x: 10, y: 32, z: 2 }, 30, (b) => expect(inBox(bank, b.x, b.y) && b.z === 1).toBe(false), 0.9);
    expect(b.z).toBe(2);
    expect(off).toBeLessThan(1);
    expect(walked).toBeLessThan(40);
  });

  it('off a face: straight off the bank into the lane', () => {
    low();
    const { b, walked } = drive({ x: 15, y: 32, z: 2 }, { x: 22, y: 32, z: 1 }, 10);
    expect(walked).toBeLessThan(9);
    expect(b.z).toBe(1);
  });

  it('round things on raised ground: into the fold yard`s pen by its gap', () => {
    const map = low(), fences = map.blocks.filter((f) => f.kind === 'fence' && f.y > 9 && f.y < 15 && f.x >= 12 && f.x < 18);
    expect(fences.length).toBe(5);
    const { b, off } = drive({ x: 10, y: 12, z: 2 }, { x: 15, y: 12, z: 2 }, 30, (b) => { for (const f of fences) expect(gap(f, b.x, b.y)).toBeGreaterThan(R - 0.02); });
    expect(off).toBeLessThan(0.5);
    expect(b.z).toBe(2);
  });

  it('the whole hill, both gates open', () => {
    low(true);
    const { b, walked, off } = drive({ x: 22, y: 80, z: 0 }, { x: 22, y: 6, z: 2 }, 60);
    expect(off).toBeLessThan(0.5);
    expect(b.z).toBe(2);
    expect(walked).toBeLessThan(110);
  });

  it('a goal on a bank`s very edge is reached up on the bank, not under it', () => {
    low();
    const { b, off } = drive({ x: 22, y: 36, z: 1 }, { x: 17.9, y: 32, z: 2 }, 30);
    expect(b.z).toBe(2);
    expect(off).toBeLessThan(1.2);
  });
});

describe('levels off the proving hill', () => {
  const base = (): GameMap => ({ name: 'T', w: 30, h: 20, rounds: [], blocks: [], braziers: [], torches: [], hero: { x: 5, y: 15 }, exit: { x: 14, y: 0, w: 2, h: 1 } } as unknown as GameMap);

  it('a bank with no slope: as near as its own ground goes, never into it', () => {
    const m = base(), l = { x: 10, y: 4, w: 10, h: 6, lv: 1, ramps: [] };
    m.ledges = [l];
    useMap(m);
    const w = wayTo({ x: 15, y: 16, z: 0, radius: R }, 15, 7, 1);
    expect(Number.isFinite(w.x) && Number.isFinite(w.y)).toBe(true);
    const { b } = drive({ x: 15, y: 16, z: 0 }, { x: 15, y: 7, z: 1 }, 10, (b) => expect(inBox(l, b.x, b.y)).toBe(false));
    expect(b.z).toBe(0);
    expect(b.y - (l.y + l.h)).toBeLessThan(R + 0.6);
  });

  it('a flat map paths as ever: through the gap in a wall', () => {
    const m = base();
    m.blocks = [{ kind: 'rockwall', x: 0, y: 9, w: 20, h: 1 }, { kind: 'rockwall', x: 23, y: 9, w: 7, h: 1 }] as GameMap['blocks'];
    useMap(m);
    expect(m.blocks.every(solid)).toBe(true);
    expect(gridOf(m, R).flat).toBe(true);
    const { b, off } = drive({ x: 5, y: 16, z: 0 }, { x: 5, y: 3, z: 0 }, 30);
    expect(off).toBeLessThan(0.3);
    expect(b.z).toBe(0);
  });
});

describe('in a real room', () => {
  it('a woken scrapper in the lane comes up onto the bank to the hero', () => {
    const run = newRun(landJob('hill', 3));
    const room = runRoom(run), h = room.join('me');
    room.setIntent(h.id, NO_INTENT);
    const e = room.allEnemies.find((f) => f.pack === 102 && !f.bow && f.kind === 'scrapper')!;
    expect(e).toBeTruthy();
    let got = false;
    for (let n = 0; n < 20 / TICK && !got; n++) {
      if (n === 0) Object.assign(e, { x: 22, y: 34, z: 1, alert: true, dozing: false });
      Object.assign(h, { hp: 1e6, maxHp: 1e6, ...(n === 0 ? { x: 10, y: 30, z: 2, safeT: 99 } : {}) });
      room.step();
      got = Math.hypot(e.x - h.x, e.y - h.y) < 1.5 && e.z === 2;
    }
    expect(got).toBe(true);
  });
});
