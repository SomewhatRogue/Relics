/**
 * Tollan's Farm, map 3: THE BARN (shared/tollanbarn.ts; docs/design/territories.md, "2. Tollan's Farm"). The
 * hunt's last ground: fixed where it is fixed, MAWL and its three, room to fight, and the job's own goal.
 */
import { describe, expect, it } from 'vitest';
import { collide, useMap } from '../src/shared/arena';
import { landJob, mapsOf, territoryPlan } from '../src/shared/territory';
import { BARN, BARN_SPOTS, barnPlan } from '../src/shared/tollanbarn';
import { newRun, runRoom } from '../src/sim/run';
import { goal as goalOf } from '../src/sim/goal';
import { NO_INTENT } from '../src/sim/types';

const plan = (day = 3) => territoryPlan(landJob('tollan', day), 2);
const fixed = (p: ReturnType<typeof plan>) => ({
  hero: p.map.hero, exit: p.map.exit, zones: p.zones, stretches: p.map.stretches, blocks: p.map.blocks,
  posts: p.map.rounds.filter((r) => r.kind === 'support'), mawl: p.foes.filter((f) => f.name), chests: p.chests,
});

describe('THE BARN', () => {
  it('is the third and last of Tollan`s maps, built quickly, the same from the same seed', () => {
    expect(mapsOf('tollan')).toBe(3);
    const t = performance.now();
    barnPlan(landJob('tollan', 9));
    expect(performance.now() - t).toBeLessThan(300);
    expect(plan(3)).toEqual(plan(3));
    expect(fixed(plan(3))).toEqual(fixed(plan(41)));
    expect(plan(3).map.rounds).not.toEqual(plan(41).map.rounds);
  });

  it('is one room in one stretch: in at the doors, MAWL at its heap with three feeding, the chest chained', () => {
    const p = plan(), m = p.map;
    expect([m.w, m.h, m.name]).toEqual([BARN.w, BARN.h, "TOLLAN'S FARM"]);
    expect(m.hero).toEqual({ x: 13, y: 16.4 });
    expect(m.exit!.y + m.exit!.h).toBe(BARN.h);
    expect(m.stretches).toEqual([{ name: 'THE BARN', keep: [], packs: [328, 329] }]);
    const mawl = p.foes.filter((f) => f.name);
    expect(mawl.map((f) => [f.kind, f.name, f.hp, f.pack, f.x, f.y])).toEqual([['butcher', 'MAWL', 520, 329, BARN_SPOTS.mawl.x, BARN_SPOTS.mawl.y]]);
    expect(p.foes.filter((f) => f.pack === 328 && f.feeding).length).toBe(3);
    expect(p.foes.length).toBe(4);
    expect(p.chests).toEqual([{ ...BARN_SPOTS.chest, chained: true }]);
    for (const f of p.foes) expect(Math.hypot(f.x - m.hero.x, f.y - m.hero.y)).toBeGreaterThan(7.5);
  });

  it('reads as a barn: six roof posts in two rows, three stacks down the west aisle, stalls at the back, goods in the east', () => {
    const p = plan(), m = p.map;
    expect(m.rounds.filter((r) => r.kind === 'support').map((r) => [r.x, r.y])).toEqual(BARN_SPOTS.posts);
    expect(m.blocks.filter((b) => b.kind === 'haystack').every((b) => b.x + b.w < 7)).toBe(true);
    expect(m.blocks.filter((b) => b.kind === 'haystack').length).toBe(3);
    expect(m.blocks.filter((b) => b.kind === 'pen').length).toBe(3);
    expect(m.rounds.filter((r) => r.x > 17 && ['crates', 'barrels', 'sacks', 'pots', 'washtub'].includes(r.kind)).length).toBeGreaterThanOrEqual(9);
    expect([m.theme.floor, m.theme.back]).toEqual(['dirt', 'palisade']);
    expect(m.rounds.length + m.blocks.length + m.marks!.length).toBeGreaterThanOrEqual(45);
  });

  it('stands nothing in anything solid, and leaves the threshing floor open to fight on', () => {
    for (const day of [3, 41]) {
      const p = plan(day), m = p.map;
      useMap(m);
      for (const s of [...p.foes, ...p.chests, m.hero]) {
        const q = { x: s.x, y: s.y };
        collide(q, 0.3);
        expect(Math.hypot(q.x - s.x, q.y - s.y), `${s.x.toFixed(1)},${s.y.toFixed(1)}`).toBeLessThan(0.05);
      }
      // The middle, between the post rows: nothing solid in it at all.
      const mid = { x0: 8.4, y0: 3.6, x1: 17.6, y1: 14.6 };
      expect(m.rounds.filter((r) => r.r > 0.1 && r.x + r.r > mid.x0 && r.x - r.r < mid.x1 && r.y + r.r > mid.y0 && r.y - r.r < mid.y1)).toEqual([]);
      expect(m.blocks.filter((b) => b.x + b.w > mid.x0 && b.x < mid.x1 && b.y + b.h > mid.y0 && b.y < mid.y1)).toEqual([]);
    }
  });

  it('builds as the run`s last room, and its goal is the hunt: kill MAWL', () => {
    const run = newRun(landJob('tollan', 3));
    run.index = 2;
    const room = runRoom(run), h = room.join('me');
    room.setIntent(h.id, NO_INTENT);
    for (let i = 0; i < 30; i++) room.step();
    expect(room.allEnemies.filter((e) => e.name).map((e) => e.name)).toEqual(['MAWL']);
    expect(goalOf(run, room).text).toContain('Kill MAWL');
    expect(goalOf(run, room).done).toBe(false);
    for (const e of room.allEnemies) Object.assign(e, { hp: 0, act: 'dead' });
    for (let i = 0; i < 10; i++) room.step();
    expect(goalOf(run, room).done).toBe(true);
  });
});
