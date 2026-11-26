/**
 * The High Wood (shared/highwood*.ts; docs/design/the-high-wood.md, slice 1 "The land"): the plan is the seed's alone,
 * 96 by 160, its six parts and its shelter are there, a hero on the ground walks from the way in to the lodge and on
 * to the Coin Oak by the game's own collide() (the banks stopping them, as they stop all but a climbing Rogue), the
 * lodge is a station, the roads are the raids' trails, and it links to the fen both ways.
 */
import { describe, expect, it } from 'vitest';
import { collide, levelAt, useMap, type GameMap } from '../src/shared/arena';
import { HIGHWOOD, HIGH_WOOD, LODGE_NAME } from '../src/shared/highwood';
import { BANKS } from '../src/shared/highwoodground';
import { COIN_OAK, MAIN, SIDES, WAY_IN } from '../src/shared/highwoodland';
import { knownLand, landJob, territoryPlan, type TerrPlan } from '../src/shared/territory';
import { BACKWARD, ONWARD, wayOf } from '../src/shared/landlinks';
import { newRun, runRoom } from '../src/sim/run';

const plan = (day = 3): TerrPlan => territoryPlan(landJob('highwood', day));
const C = 0.5, R = 0.45;
type P = { x: number; y: number };

/** Every half-tile cell a hero on foot can stand in, flooded from `from` with collide() itself (held to the level it
 *  started on, so a bank is a wall and a slope is a way up). */
function walkable(m: GameMap, from: P): (p: P) => boolean {
  useMap(m);
  const cols = Math.ceil(m.w / C), rows = Math.ceil(m.h / C), seen = new Map<number, number>(), q: number[] = [];
  const start = Math.floor(from.y / C) * cols + Math.floor(from.x / C);
  seen.set(start, levelAt(m, from.x, from.y)), q.push(start);
  for (let h = 0; h < q.length; h++) {
    const s = q[h], i = s % cols, j = (s - i) / cols, z = seen.get(s)!;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj, n = nj * cols + ni;
      if (ni < 0 || nj < 0 || ni >= cols || nj >= rows || seen.has(n)) continue;
      const x = (ni + 0.5) * C, y = (nj + 0.5) * C, p = { x, y, z };
      collide(p, R);
      if (Math.hypot(p.x - x, p.y - y) > 0.02) continue;
      seen.set(n, p.z ?? 0), q.push(n);
    }
  }
  return (p) => [[0, 0], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]].some(([dx, dy]) => seen.has(Math.floor((p.y + dy) / C) * cols + Math.floor((p.x + dx) / C)));
}

describe('the High Wood', () => {
  it('builds for three seeds, the same twice for one, and is a roaming land', () => {
    for (const d of [3, 17, 41]) expect(plan(d).map.rounds.length).toBeGreaterThan(300);
    expect(plan(3)).toEqual(plan(3));
    expect(plan(3).map.rounds).not.toEqual(plan(41).map.rounds);
    expect(knownLand('highwood')).toBe(true);
    expect(landJob('highwood', 3).roam).toBe(true);
    expect(landJob('highwood', 3).title).toBe('The High Wood');
  });

  it('is 96 by 160, one stretch, no gate, six parts south to north, the lodge its shelter, no foes yet', () => {
    const p = plan(), m = p.map;
    expect([m.w, m.h]).toEqual([HIGHWOOD.w, HIGHWOOD.h]);
    expect([m.w, m.h]).toEqual([96, 160]);
    expect(m.name).toBe(HIGH_WOOD);
    expect(m.stretches).toHaveLength(1);
    expect(m.blocks.some((b) => b.kind === 'gate')).toBe(false);
    expect(p.zones.map((z) => z.name)).toEqual(['THE ROOT STAIR', 'THE SUNK LANES', LODGE_NAME, 'THE STRUCK OAKS', 'THE OLD TREES', 'THE COIN OAK']);
    expect(p.zones.map((z) => z.y)).toEqual([...p.zones.map((z) => z.y)].sort((a, b) => b - a));
    expect(m.stations!.map((s) => s.name)).toEqual([LODGE_NAME]);
    expect(m.npcs!.find((n) => n.talk === 'station:lodge')).toBeTruthy();
    expect(p.foes).toHaveLength(0);
    // The sunk lanes' banks are real heights; the Coin Oak stands on its rise.
    expect(m.ledges!.filter((l) => l.kind === 'earth').length).toBeGreaterThanOrEqual(BANKS.length + 2);
    expect(levelAt(m, COIN_OAK.x, COIN_OAK.y + 2.5)).toBe(1);
  });

  it('can be walked on foot from the way in to the lodge and on to the Coin Oak, and back', () => {
    for (const d of [3, 17, 41]) {
      const m = plan(d).map, can = walkable(m, m.hero), s = m.stations![0];
      expect(m.hero).toEqual(WAY_IN);
      expect(can(s), `lodge ${d}`).toBe(true);
      for (const l of [MAIN, ...SIDES]) for (const q of l.slice(1)) expect(can(q), `road at ${q.x}, ${q.y} ${d}`).toBe(true);
      expect(can({ x: COIN_OAK.x, y: COIN_OAK.y + COIN_OAK.r + 1.4 }), `oak ${d}`).toBe(true);
      // And back from the oak to the way in (the slopes go both ways).
      const back = walkable(m, { x: COIN_OAK.x, y: COIN_OAK.y + COIN_OAK.r + 1.4 });
      expect(back(WAY_IN), `back ${d}`).toBe(true);
      // A bank top is not reached on foot.
      const [x0, y0, x1, y1] = BANKS[0];
      expect(can({ x: (x0 + x1) / 2, y: (y0 + y1) / 2 }), `bank ${d}`).toBe(false);
    }
  });

  it('gives the raids its roads as trails', () => {
    const m = plan().map;
    expect(m.trails!.length).toBe(1 + SIDES.length);
    expect(m.trails![0][0]).toEqual(WAY_IN);
  });

  it('links to the fen both ways: on from its far end, back to it from the wood\'s way in', () => {
    const on = ONWARD.fenroam!, back = BACKWARD.highwood!, fen = territoryPlan(landJob('fenroam', 3)).map;
    expect(on.to).toBe('highwood');
    expect([back.to, back.at]).toEqual(['fenroam', 'FAR END']);
    const end = wayOf('fenroam', back.at)!, can = walkable(fen, fen.hero);
    expect(can(on.from) && can(end)).toBe(true);
    expect(on.from.y).toBeLessThan(2);
    expect(Math.hypot(end.x - on.from.x, end.y - on.from.y)).toBeLessThan(2.2);
    const into = runRoom(newRun(landJob(on.to, 3)));
    expect(into.map.hero).toEqual(WAY_IN);
    const run = newRun({ ...landJob(back.to, 3), at: back.at }), home = runRoom(run);
    expect(home.map.hero).toEqual(end);
    // Out to the lodge from town: the run starts in its ring.
    const st = newRun({ ...landJob('highwood', 3), at: LODGE_NAME }), r = runRoom(st), s = r.map.stations![0];
    expect(Math.hypot(r.map.hero.x - s.x, r.map.hero.y - s.y)).toBeLessThan(s.r);
  });
});
