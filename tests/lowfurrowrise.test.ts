/**
 * Lowfurrow Fields, map 2: THE RISE (shared/lowfurrowrise.ts; docs/design/territories.md, "Map 2, THE RISE";
 * docs/design/elevation.md). Fixed where the spec fixes it, the packs where they belong, the heights, the density,
 * a walk through it by the game's own collide rules (levels and all), and the room built on it.
 */
import { describe, expect, it } from 'vitest';
import { collide, inArea, levelAt, solid, useMap, type GameMap } from '../src/shared/arena';
import { landJob, territoryPlan, type TerrPlan } from '../src/shared/territory';
import { risePlan, RISE_SPOTS } from '../src/shared/lowfurrowrise';
import { LANE, ROAD } from '../src/shared/lowfurrowriseland';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';

const R = 0.3, C = 0.5, LV = 4;
const plan = (day = 3) => territoryPlan(landJob('lowfurrow', day), 1);
const zone = (p: TerrPlan, name: string) => p.zones.find((z) => z.name === name)!;
const inBox = (b: { x: number; y: number; w: number; h: number }, x: number, y: number) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
const fixed = (p: TerrPlan) => ({
  hero: p.map.hero, exit: p.map.exit, zones: p.zones, ledges: p.map.ledges, water: p.map.water,
  gates: p.map.blocks.filter((b) => b.kind === 'gate'), stretches: p.map.stretches, cages: p.props.filter((q) => q.kind === 'cage'),
  barn: p.map.blocks.filter((b) => b.kind === 'barn'), carts: p.map.blocks.filter((b) => b.kind === 'cart'), spots: RISE_SPOTS,
});
const open = (p: TerrPlan) => ((p.map.blocks[p.map.stretches![0].gate!].ruined = true), p);

/** Walk the map on a half-tile grid with collide() itself (tests/territory.test.ts, four levels; `box` keeps it near). */
function walk(m: GameMap, from: { x: number; y: number }, box?: { y0: number; y1: number }) {
  useMap(m);
  const cols = Math.ceil(m.w / C), rows = Math.ceil(m.h / C), dist = new Map<number, number>(), q: number[] = [];
  const key = (i: number, j: number, z: number) => (j * cols + i) * LV + z;
  const i0 = Math.floor(from.x / C), j0 = Math.floor(from.y / C), z0 = levelAt(m, (i0 + 0.5) * C, (j0 + 0.5) * C);
  dist.set(key(i0, j0, z0), 0), q.push(key(i0, j0, z0));
  for (let h = 0; h < q.length; h++) {
    const s = q[h], z = s % LV, c = (s - z) / LV, i = c % cols, j = (c - i) / cols, d = dist.get(s)!;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
      const x = (ni + 0.5) * C, y = (nj + 0.5) * C, p = { x, y, z };
      if (box && (y < box.y0 || y > box.y1)) continue;
      collide(p, R);
      if (Math.hypot(p.x - x, p.y - y) > 0.02) continue;
      const k = key(ni, nj, p.z ?? z);
      if (!dist.has(k)) dist.set(k, d + 1), q.push(k);
    }
  }
  const cells = [...dist.keys()].map((s) => {
    const z = s % LV, c = (s - z) / LV, i = c % cols;
    return { x: (i + 0.5) * C, y: ((c - i) / cols + 0.5) * C, z, d: dist.get(s)! };
  });
  const to = (x: number, y: number, z: number) => dist.get(key(Math.floor(x / C), Math.floor(y / C), z));
  /** The nearest walked cell to (x, y) at any level, within `r` (for things you walk up to, not into). */
  const near = (x: number, y: number, r = 1.4) => cells.some((c) => Math.hypot(c.x - x, c.y - y) <= r);
  /** The shortest walk to any cell at level z within r of (x, y) (a point may have a tree on it). */
  const toNear = (x: number, y: number, z: number, r = 1.2) => {
    const ds = cells.filter((c) => c.z === z && Math.hypot(c.x - x, c.y - y) <= r).map((c) => c.d);
    return ds.length ? Math.min(...ds) : undefined;
  };
  return { cells, minY: Math.min(...cells.map((c) => c.y)), to, near, toNear };
}
/** The road's x at y (its fixed points: the seed bends it under a tile in the lane). */
const roadX = (y: number) => {
  for (let i = 1; i < ROAD.length; i++) if (y <= ROAD[i - 1].y && y >= ROAD[i].y) return ROAD[i - 1].x + ((ROAD[i].x - ROAD[i - 1].x) * (y - ROAD[i - 1].y)) / (ROAD[i].y - ROAD[i - 1].y);
  return ROAD[0].x;
};

describe('THE RISE, the plan', () => {
  it('is the same from the same seed, and the seed moves nothing fixed', () => {
    expect(plan(3)).toEqual(plan(3));
    const a = plan(3), b = plan(41);
    expect(fixed(a)).toEqual(fixed(b));
    expect(a.map.rounds).not.toEqual(b.map.rounds);
  });

  it('is 96 by 104 in two stretches, the first gated and kept by nobody', () => {
    const p = plan(), m = p.map, st = m.stretches!;
    expect([m.w, m.h, st.length, m.name]).toEqual([96, 104, 2, 'LOWFURROW FIELDS']);
    expect([m.hero, m.exit, m.settle]).toEqual([{ x: 48, y: 101 }, { x: 50.5, y: 0, w: 3, h: 0.9 }, true]);
    const g = m.blocks[st[0].gate!];
    expect([g.kind, g.x, g.y, g.w, g.h]).toEqual(['gate', 48.4, 54.3, 3.2, 1.4]);
    expect(st[0].at!.y).toBeGreaterThanOrEqual(g.y + g.h - 0.01);
    expect(st[0].check!.y).toBeLessThan(g.y);
    expect(st[1].gate).toBeUndefined();
    expect(st.map((s) => [s.name, s.packs, s.keep])).toEqual([['THE BARN ROAD', [], []], ['THE FOLD YARD', [122], []]]);
    expect(p.zones.map((z) => [z.name, z.kind, z.stretch])).toEqual([['THE BARN ROAD', 'scape', 0], ['THE FOLD YARD', 'zone', 1], ['THE BROW', 'scape', 1]]);
  });

  it('keeps each pack where it belongs, none near the way in, one cage in the fold', () => {
    for (const day of [3, 41, 77]) {
      const p = plan(day), pack = (n: number) => p.foes.filter((f) => f.pack === n), fy = zone(p, 'THE FOLD YARD'), br = zone(p, 'THE BARN ROAD');
      expect(pack(122).length).toBeGreaterThanOrEqual(4);
      expect(pack(122).every((f) => inBox(fy, f.x, f.y))).toBe(true);
      expect(pack(122).some((f) => f.variant === 'drummer')).toBe(true);
      expect(pack(120).length).toBe(2);
      expect(pack(120).every((f) => f.bow && f.z === 1 && f.x < LANE[0][2] - 2 && f.y > 74 && f.y < 82)).toBe(true);
      expect(pack(121).every((f) => inBox(br, f.x, f.y) && !f.z && f.task?.k === 'patrol')).toBe(true);
      expect(pack(123).length).toBe(3);
      expect(pack(123).every((f) => Math.hypot(f.x - 66, f.y - 26) < 6)).toBe(true);
      expect(p.foes.length).toBeGreaterThanOrEqual(14);
      expect(p.foes.length).toBeLessThanOrEqual(18);
      for (const f of p.foes) expect(Math.hypot(f.x - p.map.hero.x, f.y - p.map.hero.y)).toBeGreaterThanOrEqual(14);
      for (const f of p.foes) expect(f.z ?? 0).toBe(levelAt(p.map, f.x, f.y));
      const cages = p.props.filter((q) => q.kind === 'cage');
      expect(cages).toEqual([{ kind: 'cage', ...RISE_SPOTS.cage }]);
      expect(p.foes.filter((f) => inBox(br, f.x, f.y)).length).toBeLessThanOrEqual(4);
    }
  });

  it('stands at the right heights: the lane and the foot are ground, the banks and the top one level up, no more', () => {
    const m = plan().map, at = (x: number, y: number) => levelAt(m, x, y), barn = m.blocks.find((b) => b.kind === 'barn')!;
    expect([at(m.hero.x, m.hero.y), at(roadX(72), 72), at(20, 72), at(70, 80), at(barn.x + 5, barn.y + 3), at(66, 76), at(40, 34), at(26, 28), at(50, 8)]).toEqual([0, 0, 1, 1, 1, 1, 1, 1, 1]);
    expect(Math.max(...m.ledges!.map((l) => l.lv ?? 1))).toBe(1);
    // No slope along a whole edge: every way up is a flight of steps six tiles wide at most.
    for (const l of m.ledges!) for (const q of l.ramps) expect(Math.min(q.w, q.h)).toBeLessThanOrEqual(3), expect(Math.max(q.w, q.h)).toBeLessThanOrEqual(6);
    expect(barn.door).toBeUndefined();
    for (const l of m.ledges!) expect(l.kind).toBe('earth');
  });
});

describe('THE RISE, walked', () => {
  it('reaches the exit with the gate open and nothing past the gate with it shut; never crosses a side hedge', () => {
    const m = open(plan()).map, all = walk(m, m.hero);
    expect(all.cells.some((c) => inArea(m.exit!, c.x, c.y))).toBe(true);
    expect(all.cells.every((c) => c.x > 3.5 && c.x < 92.5)).toBe(true);
    expect(walk(plan().map, plan().map.hero).minY).toBeGreaterThan(55.6);
  });

  it('walks to every foe, the cage, the chest and each spot', () => {
    for (const day of [3, 41]) {
      const p = open(plan(day)), w = walk(p.map, p.map.hero);
      for (const f of p.foes) expect(w.near(f.x, f.y), `foe ${f.pack} at ${f.x.toFixed(1)},${f.y.toFixed(1)}`).toBe(true);
      for (const c of [...p.chests, RISE_SPOTS.cage, RISE_SPOTS.giver, RISE_SPOTS.barnGround]) expect(w.near(c.x, c.y), `${c.x},${c.y}`).toBe(true);
      // The man stands on his spot now (lowfurrowminis.ts): you walk up beside him, on his level, inside talking reach.
      expect(w.toNear(RISE_SPOTS.giver.x, RISE_SPOTS.giver.y, 1, 1.2)).toBeDefined();
      expect(w.to(RISE_SPOTS.barnGround.x, RISE_SPOTS.barnGround.y, 1)).toBeDefined();
    }
  });

  it('keeps the banks faces from the lane: up only by the steps, and never far', () => {
    const p = open(plan()), m = p.map;
    // With every slope and track onto the banks gone, the lane never reaches them.
    const flat: GameMap = JSON.parse(JSON.stringify(m));
    for (const l of flat.ledges!) l.ramps = [];
    const archer = p.foes.find((f) => f.pack === 120)!;
    expect(walk(flat, { x: roadX(72), y: 72 }, { y0: 50, y1: 92 }).to(archer.x, archer.y, 1)).toBeUndefined();
    // With them, from every point of the lane the walk onto either bank beside it is never 8 tiles over the straight one.
    for (let y = 60; y <= 85; y += 2) {
      const x0 = roadX(y), from = walk(m, { x: x0, y }, { y0: 50, y1: 93 }), band = LANE.find(([a, b]) => y >= a && y < b)!;
      for (const x of [band[2] - 3, band[3] + 3]) {
        const d = from.toNear(x, y, 1, 2.2);
        expect(d, `(${x0.toFixed(1)},${y}) to (${x},${y})`).toBeDefined();
        expect(d! * C, `(${x0.toFixed(1)},${y}) to (${x},${y})`).toBeLessThanOrEqual(Math.abs(x - x0) + 8 + 1);
      }
    }
  });

  it('has nothing solid on the road, in the gate`s gathering ground or at its checkpoint', () => {
    for (const day of [3, 41, 77]) {
      const p = open(plan(day)), m = p.map;
      useMap(m);
      for (const s of m.soil!.filter((s) => s.mat === 'earth' && s.line)) {
        const n = Math.ceil(Math.hypot(s.w, s.h) / 0.25);
        for (let i = 0; i <= n; i++) {
          const x = s.x + (s.w * i) / n, y = s.y + (s.h * i) / n, q = { x, y, z: levelAt(m, x, y) };
          collide(q, R);
          expect(Math.hypot(q.x - x, q.y - y), `road at ${x.toFixed(2)},${y.toFixed(2)} day ${day}`).toBeLessThan(0.01);
        }
      }
      const stops = [...m.blocks.filter((b) => b.kind !== 'gate' && solid(b)), ...m.rounds.map((r) => ({ x: r.x - r.r, y: r.y - r.r, w: r.r * 2, h: r.r * 2 }))];
      const a = m.stretches![0].at!, c = m.stretches![0].check!;
      expect(stops.filter((b) => b.x < a.x + a.w && a.x < b.x + b.w && b.y < a.y + a.h && a.y < b.y + b.h)).toEqual([]);
      expect(stops.filter((b) => Math.hypot(c.x - Math.max(b.x, Math.min(b.x + b.w, c.x)), c.y - Math.max(b.y, Math.min(b.y + b.h, c.y))) < 1.5)).toEqual([]);
    }
  });

  it('is dense: things to find everywhere, and built quickly', () => {
    const t = performance.now(), p = risePlan(landJob('lowfurrow', 9));
    expect(performance.now() - t).toBeLessThan(300);
    const m = p.map, things = [...m.rounds, ...m.blocks.map((b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 })), ...m.marks!.map((q) => ({ x: q.x + q.w / 2, y: q.y + q.h / 2 })), ...p.props];
    const n = (name: string) => things.filter((q) => inBox(zone(p, name), q.x, q.y)).length;
    expect(n('THE BARN ROAD')).toBeGreaterThanOrEqual(150);
    expect(n('THE FOLD YARD')).toBeGreaterThanOrEqual(90);
    expect(n('THE BROW')).toBeGreaterThanOrEqual(25);
  });
});

describe('THE RISE, as a room', () => {
  it('builds, the hero joins at the way in, and the cage stays where it was put, on the top', () => {
    const run = newRun(landJob('lowfurrow', 3));
    run.party = 1, run.index = 1;
    const room = runRoom(run), h = room.join('me');
    room.setIntent(h.id, NO_INTENT);
    expect(room.map.name).toBe('LOWFURROW FIELDS');
    expect(Math.hypot(h.x - 48, h.y - 101)).toBeLessThan(1.5);
    for (let i = 0; i < 30; i++) room.step();
    const cage = room.props.find((f) => f.kind === 'cage');
    expect(cage).toBeDefined();
    expect(Math.hypot(cage!.x - RISE_SPOTS.cage.x, cage!.y - RISE_SPOTS.cage.y)).toBeLessThan(0.05);
    expect(levelAt(room.map, cage!.x, cage!.y)).toBe(1);
  });
});
