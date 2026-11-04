/** The broken bridge and the ford (Kyle, 2026-11-04), and goblins that find their way round water. */
import { describe, expect, it } from 'vitest';
import type { GameMap } from '../src/shared/arena';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { routeOf } from '../src/shared/route';
import { planRoom } from '../src/shared/terrain';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT } from '../src/sim/types';

const job = (name: string, seed: number, rooms = 5): Job => ({ ...board(1)[1], place: PLACES.find((p) => p.name === name)!, rooms, seed, objective: 'hunt', layout: 2 });
/** A room with the broken bridge: the ford room on a Barrowby job, or Brokenbridge's own heart. */
function bridged(name: string, from: number, rooms: number) {
  const has = (j: Job) => routeOf(j).findIndex((s) => (s.node === 'ford' && s.layout === 'broken') || (s.heart && name === 'Brokenbridge'));
  let seed = from;
  while (has(job(name, seed, rooms)) < 0) seed++;
  const j = job(name, seed, rooms), i = has(j);
  const plan = planRoom(j, i, i === rooms - 1 && rooms >= 3 ? 'low' : undefined), m = plan.map, bridge = m.marks!.find((k) => k.kind === 'bridge')!;
  const ford = m.water!.find((w) => !w.deep)!, top = Math.min(...m.water!.map((w) => w.y)), bottom = Math.max(...m.water!.map((w) => w.y + w.h));
  return { plan, m, bridge, ford, top, bottom, bx: bridge.x + bridge.w / 2 };
}
/** A hero put at (x, y) walking up the screen for `s` seconds: where it ends. */
function walkUp(m: GameMap, x: number, y: number, s = 6) {
  const room = new ArenaRoom(1, { map: m, foes: [] }), h = room.join('me');
  Object.assign(h, { x, y });
  room.setIntent('me', { ...NO_INTENT, my: -1 });
  for (let i = 0; i < s * 20; i++) room.step();
  return h;
}

describe('the broken bridge', () => {
  for (const [name, seed, rooms] of [['Barrowby', 10, 5], ['Brokenbridge', 4, 3]] as const) {
    it(`${name}: the bridge's ends stand but its middle is gone; the ford is the way over`, () => {
      const { m, bx, ford, top, bottom } = bridged(name, seed, rooms);
      expect(m.water!.filter((w) => !w.deep)).toHaveLength(1);
      // Out along the near end of the bridge, and no further: the gap stops you.
      const stuck = walkUp(m, bx, bottom + 1);
      expect(stuck.y).toBeLessThan(bottom);
      expect(stuck.y).toBeGreaterThan(top + 0.8);
      // Through the shallows: over to the far bank.
      expect(walkUp(m, ford.x + ford.w / 2, bottom + 1, 10).y).toBeLessThan(top - 0.4);
    });
  }
});

describe('goblins find the way', () => {
  it('a goblin across the river from you comes round by the ford, not stuck at the bank', () => {
    const { m, bx, ford, top, bottom } = bridged('Barrowby', 10, 5);
    const room = new ArenaRoom(3, { map: m, foes: [{ kind: 'scrapper', x: bx, y: top - 2.2, awake: true }] }), h = room.join('me');
    Object.assign(h, { x: bx, y: bottom + 2.4 });
    room.setIntent('me', NO_INTENT);
    const g = room.enemies[0], waded: number[] = [];
    let t = 0;
    for (; t < 40 * 20 && Math.hypot(g.x - h.x, g.y - h.y) > 1.6; t++) {
      room.step();
      if (g.y > top + 0.3 && g.y < bottom - 0.3) waded.push(g.x);
    }
    expect(Math.hypot(g.x - h.x, g.y - h.y)).toBeLessThanOrEqual(1.6);
    expect(waded.length).toBeGreaterThan(0);
    for (const x of waded) expect(x).toBeGreaterThan(ford.x - 0.6), expect(x).toBeLessThan(ford.x + ford.w + 0.6);
  });

  it('goes round a hedge to a gap rather than pushing at it', () => {
    // A long wall of bushes across the room with one gap at the side.
    const base = planRoom(job('Barrowby', 3, 2), 0).map;
    const rounds = Array.from({ length: 34 }, (_, i) => ({ kind: 'bush' as const, x: 0.4 + i * 0.62, y: 12, r: 0.36 }));
    const m = { ...base, rounds, blocks: [], water: undefined, ledges: undefined, braziers: [], npcs: undefined };
    const room = new ArenaRoom(5, { map: m, foes: [{ kind: 'scrapper', x: 6, y: 8, awake: true }] }), h = room.join('me');
    Object.assign(h, { x: 6, y: 16 });
    room.setIntent('me', NO_INTENT);
    const g = room.enemies[0];
    for (let t = 0; t < 30 * 20 && Math.hypot(g.x - h.x, g.y - h.y) > 1.6; t++) room.step();
    expect(Math.hypot(g.x - h.x, g.y - h.y)).toBeLessThanOrEqual(1.6);
  });
});
