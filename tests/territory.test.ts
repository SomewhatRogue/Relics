/**
 * Territories (docs/design/territories.md, "The format" and "1. Lowfurrow Fields"; docs/design/elevation.md,
 * "The rethink"): the plan side of Lowfurrow Fields. Fixed where the spec fixes it, the packs where they
 * belong, the heights, and a walk through it by the game's own rules (collide() in shared/arena.ts, levels
 * and all): a body of a hero's size reaches the exit only through open gates, and never up a face.
 */
import { describe, expect, it } from 'vitest';
import { collide, inArea, levelAt, solid, useMap, type GameMap } from '../src/shared/arena';
import { landJob, territoryPlan, type TerrPlan } from '../src/shared/territory';

const R = 0.3, C = 0.5;
const plan = (day = 3) => territoryPlan(landJob('lowfurrow', day));
const zone = (p: TerrPlan, name: string) => p.zones.find((z) => z.name === name)!;
const inBox = (b: { x: number; y: number; w: number; h: number }, x: number, y: number) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
const fixed = (p: TerrPlan) => ({
  hero: p.map.hero, exit: p.map.exit, zones: p.zones, ledges: p.map.ledges, water: p.map.water,
  gates: p.map.blocks.filter((b) => b.kind === 'gate'), stretches: p.map.stretches, cages: p.props.filter((q) => q.kind === 'cage'),
  barn: p.map.blocks.filter((b) => b.kind === 'barn'),
});

/** Walk the map on a half-tile grid with collide() itself: a step is good if the body stays where it was set. */
function walk(m: GameMap, from: { x: number; y: number }) {
  useMap(m);
  const cols = Math.ceil(m.w / C), rows = Math.ceil(m.h / C), dist = new Map<number, number>(), q: number[] = [];
  const key = (i: number, j: number, z: number) => (j * cols + i) * 3 + z;
  const i0 = Math.floor(from.x / C), j0 = Math.floor(from.y / C), z0 = levelAt(m, (i0 + 0.5) * C, (j0 + 0.5) * C);
  dist.set(key(i0, j0, z0), 0), q.push(key(i0, j0, z0));
  for (let h = 0; h < q.length; h++) {
    const s = q[h], z = s % 3, c = (s - z) / 3, i = c % cols, j = (c - i) / cols, d = dist.get(s)!;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
      const x = (ni + 0.5) * C, y = (nj + 0.5) * C, p = { x, y, z };
      collide(p, R);
      if (Math.hypot(p.x - x, p.y - y) > 0.02) continue;
      const k = key(ni, nj, p.z ?? z);
      if (!dist.has(k)) dist.set(k, d + 1), q.push(k);
    }
  }
  const cells = [...dist.keys()].map((s) => {
    const z = s % 3, c = (s - z) / 3, i = c % cols;
    return { x: (i + 0.5) * C, y: ((c - i) / cols + 0.5) * C, z, d: dist.get(s)! };
  });
  return { cells, minY: Math.min(...cells.map((c) => c.y)), to: (x: number, y: number, z: number) => dist.get(key(Math.floor(x / C), Math.floor(y / C), z)) };
}
const open = (p: TerrPlan, ...which: number[]) => {
  for (const n of which) p.map.blocks[p.map.stretches![n].gate!].ruined = true;
  return p;
};

describe('Lowfurrow Fields, the plan', () => {
  it('is the same from the same seed, and the seed moves nothing fixed', () => {
    expect(plan(3)).toEqual(plan(3));
    const a = plan(3), b = plan(41);
    expect(fixed(a)).toEqual(fixed(b));
    expect(a.map.soil).not.toEqual(b.map.soil);
  });

  it('is 44 by 96 in three stretches, two gated', () => {
    const p = plan(), m = p.map, st = m.stretches!;
    expect([m.w, m.h, st.length]).toEqual([44, 96, 3]);
    for (const s of st.slice(0, 2)) {
      const g = m.blocks[s.gate!];
      expect(g.kind).toBe('gate');
      expect(s.at!.y).toBeGreaterThanOrEqual(g.y + g.h - 0.01);
      expect(s.at!.x >= 0 && s.at!.y + s.at!.h <= m.h && s.at!.x + s.at!.w <= m.w).toBe(true);
      expect(s.check!.y).toBeLessThan(g.y);
    }
    expect(st[2].gate).toBeUndefined();
    expect(st.map((s) => s.packs)).toEqual([[101], [102], [103]]);
  });

  it('keeps each pack where it belongs', () => {
    const p = plan(), pack = (n: number) => p.foes.filter((f) => f.pack === n);
    for (const [n, name] of [[101, 'THE HEADLAND'], [102, 'THE STOOKS'], [103, 'THE FOLD YARD']] as const) {
      expect(pack(n).length).toBeGreaterThanOrEqual(2);
      for (const f of pack(n)) expect(inBox(zone(p, name), f.x, f.y)).toBe(true);
    }
    expect(pack(110).every((f) => inBox(zone(p, 'THE LONG STRIPS'), f.x, f.y))).toBe(true);
    expect(pack(111).every((f) => inBox(zone(p, 'THE BARN ROAD'), f.x, f.y))).toBe(true);
    for (const z of p.zones.filter((z) => z.kind === 'scape')) expect(p.foes.filter((f) => inBox(z, f.x, f.y)).length).toBeLessThanOrEqual(2);
    expect(pack(103).some((f) => f.variant === 'drummer')).toBe(true);
  });

  it('has five cages: one in the headland, two in the stooks, two in the fold yard', () => {
    const p = plan(), cages = p.props.filter((q) => q.kind === 'cage');
    expect(cages.length).toBe(5);
    const n = (name: string) => cages.filter((c) => inBox(zone(p, name), c.x, c.y)).length;
    expect([n('THE HEADLAND'), n('THE STOOKS'), n('THE FOLD YARD')]).toEqual([1, 2, 2]);
  });

  it('stands at the right heights, every slope a ramp as long as its edge', () => {
    const m = plan().map, at = (x: number, y: number) => levelAt(m, x, y), barn = m.blocks.find((b) => b.kind === 'barn')!;
    expect([at(m.hero.x, m.hero.y), at(20, 84), at(10, 50), at(22, 32), at(8, 32), at(36, 36), at(barn.x + 4, barn.y + 3), at(15, 12)]).toEqual([0, 0, 1, 1, 2, 2, 2, 2]);
    expect(barn.door).toBeUndefined();
    const ramp = (lv: number, x: number, w: number, edge: number) =>
      m.ledges!.some((l) => (l.lv ?? 1) === lv && l.ramps.some((r) => r.x <= x && r.x + r.w >= x + w && r.y < edge && r.y + r.h > edge));
    expect(ramp(1, 0, 44, 70)).toBe(true);
    expect(ramp(2, 0, 18, 40)).toBe(true);
    expect(ramp(2, 26, 18, 40)).toBe(true);
    expect(ramp(2, 18, 8, 24)).toBe(true);
  });

  it('walks to the exit only through open gates', () => {
    const exit = plan().map.exit!;
    const all = walk(open(plan(), 0, 1).map, plan().map.hero);
    expect(all.cells.some((c) => inArea(exit, c.x, c.y))).toBe(true);
    // The hedges down both sides hold: nobody leaves the land sideways.
    expect(all.cells.every((c) => c.x > 4 && c.x < 40)).toBe(true);
    expect(walk(plan().map, plan().map.hero).minY).toBeGreaterThan(76);
    expect(walk(open(plan(), 0).map, plan().map.hero).minY).toBeGreaterThan(42);
  });

  it('keeps the banks faces from the lane: up only by a slope', () => {
    const p = open(plan(), 0, 1), m = p.map, archer = p.foes.find((f) => f.pack === 111)!;
    expect(archer.z).toBe(2);
    // From the lane, a step west at the bank's face goes nowhere.
    useMap(m);
    // (Off the sheep track, which climbs the west bank between y 30 and 33. Walked into, not set down inside it:
    // the map settles anything set down well inside raised ground onto it, as the town does.)
    const step = { x: 18.1, y: 27, z: 1 };
    collide(step, R);
    expect(step.x).toBeGreaterThanOrEqual(18 + R - 0.01);
    // With every slope onto the banks and the rise gone, the lane never reaches the bank.
    const flat: GameMap = JSON.parse(JSON.stringify(m));
    for (const l of flat.ledges!) if ((l.lv ?? 1) === 2) l.ramps = [];
    expect(walk(flat, { x: 22, y: 30 }).to(archer.x, archer.y, 2)).toBeUndefined();
    // With them, the walk from the lane to the archer is short.
    const d = walk(m, { x: 22, y: 36 }).to(archer.x, archer.y, 2);
    expect(d).toBeDefined();
    expect(d! * C).toBeLessThan(30);
  });

  it('puts no foe near the way in, and nothing solid on the road, at a gate or a checkpoint', () => {
    for (const day of [3, 41, 77]) {
      const p = open(plan(day), 0, 1), m = p.map;
      for (const f of p.foes) expect(Math.hypot(f.x - m.hero.x, f.y - m.hero.y)).toBeGreaterThanOrEqual(12);
      useMap(m);
      // The road (and the pond's path): a body set down anywhere on it stays put.
      for (const s of m.soil!.filter((s) => s.mat === 'earth' && s.line)) {
        const n = Math.ceil(Math.hypot(s.w, s.h) / 0.25);
        for (let i = 0; i <= n; i++) {
          const x = s.x + (s.w * i) / n, y = s.y + (s.h * i) / n, q = { x, y, z: levelAt(m, x, y) };
          collide(q, R);
          expect(Math.hypot(q.x - x, q.y - y), `road at ${x.toFixed(2)},${y.toFixed(2)} day ${day}`).toBeLessThan(0.01);
        }
      }
      const stops = [...m.blocks.filter((b) => b.kind !== 'gate' && solid(b)), ...m.rounds.map((r) => ({ x: r.x - r.r, y: r.y - r.r, w: r.r * 2, h: r.r * 2 }))];
      for (const s of m.stretches!.filter((s) => s.at)) {
        const a = s.at!, c = s.check!;
        expect(stops.filter((b) => b.x < a.x + a.w && a.x < b.x + b.w && b.y < a.y + a.h && a.y < b.y + b.h)).toEqual([]);
        expect(stops.filter((b) => Math.hypot(c.x - Math.max(b.x, Math.min(b.x + b.w, c.x)), c.y - Math.max(b.y, Math.min(b.y + b.h, c.y))) < 1.5)).toEqual([]);
      }
    }
  });
  it('nobody under a face is far from a way up: from the lane to either bank is never more than 8 tiles over the straight walk', () => {
    const p = open(plan(), 0, 1);
    for (let y = 26; y <= 38; y += 2) {
      const from = walk(p.map, { x: 22, y });
      for (const x of [15, 28]) {
        const d = from.to(x, y, 2);
        expect(d, `(22,${y}) to (${x},${y})`).toBeDefined();
        // (Steps are half tiles on a grid of four ways, so the straight walk is the sum of the two sides.)
        expect(d! * C).toBeLessThanOrEqual(Math.abs(x - 22) + 8);
      }
    }
  });
});
