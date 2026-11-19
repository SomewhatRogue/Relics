/**
 * Tollan's Farm, map 1: THE HOME GROUND (shared/tollanorchard.ts; docs/design/territories.md, "2. Tollan's Farm";
 * docs/design/elevation.md, "Raised areas"). Fixed where the spec fixes it, the packs where they belong, flat ground
 * and water level, the density, a walk through it by the game's own collide rules, and the room built on it.
 */
import { describe, expect, it } from 'vitest';
import { collide, inArea, levelAt, solid, useMap, type GameMap } from '../src/shared/arena';
import { landJob, territoryPlan, type TerrPlan } from '../src/shared/territory';
import { orchardPlan, ORCHARD_SPOTS } from '../src/shared/tollanorchard';
import { GATE } from '../src/shared/tollanorchardland';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';

const R = 0.3, C = 0.5;
const plan = (day = 3) => territoryPlan(landJob('tollan', day), 0);
const zone = (p: TerrPlan, name: string) => p.zones.find((z) => z.name === name)!;
const inBox = (b: { x: number; y: number; w: number; h: number }, x: number, y: number) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
const fixed = (p: TerrPlan) => ({
  hero: p.map.hero, exit: p.map.exit, zones: p.zones, water: p.map.water, ledges: p.map.ledges ?? [],
  gates: p.map.blocks.filter((b) => b.kind === 'gate'), stretches: p.map.stretches, cages: p.props.filter((q) => q.kind === 'cage'), spots: ORCHARD_SPOTS,
});
const open = (p: TerrPlan) => ((p.map.blocks[p.map.stretches![0].gate!].ruined = true), p);
const ORCHARD_PACKS = [301, 302, 303, 304], PADDOCK_PACKS = [305, 306];

/** Walk the map on a half-tile grid with collide() itself (flat ground: one level). */
function walk(m: GameMap, from: { x: number; y: number }) {
  useMap(m);
  const cols = Math.ceil(m.w / C), rows = Math.ceil(m.h / C), seen = new Set<number>(), q: number[] = [];
  const s0 = Math.floor(from.y / C) * cols + Math.floor(from.x / C);
  seen.add(s0), q.push(s0);
  for (let h = 0; h < q.length; h++) {
    const i = q[h] % cols, j = (q[h] - i) / cols;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj, s = nj * cols + ni;
      if (ni < 0 || nj < 0 || ni >= cols || nj >= rows || seen.has(s)) continue;
      const x = (ni + 0.5) * C, y = (nj + 0.5) * C, p = { x, y };
      collide(p, R);
      if (Math.hypot(p.x - x, p.y - y) > 0.02) continue;
      seen.add(s), q.push(s);
    }
  }
  const cells = [...seen].map((s) => ({ x: ((s % cols) + 0.5) * C, y: (Math.floor(s / cols) + 0.5) * C }));
  const near = (x: number, y: number, r = 1.4) => cells.some((c) => Math.hypot(c.x - x, c.y - y) <= r);
  return { cells, minY: Math.min(...cells.map((c) => c.y)), near };
}

describe('THE HOME GROUND, the plan', () => {
  it('is built quickly, the same from the same seed, and the seed moves nothing fixed', () => {
    const t = performance.now();
    orchardPlan(landJob('tollan', 9));
    expect(performance.now() - t).toBeLessThan(300);
    expect(plan(3)).toEqual(plan(3));
    const a = plan(3), b = plan(41);
    expect(fixed(a)).toEqual(fixed(b));
    expect(a.map.rounds).not.toEqual(b.map.rounds);
  });

  it('is 96 by 108, in at the bottom, out at the top, in two stretches, the first gated by the orchard door', () => {
    const p = plan(), m = p.map, st = m.stretches!;
    expect([m.w, m.h, m.name, st.length]).toEqual([96, 108, "TOLLAN'S FARM", 2]);
    expect([m.hero, m.exit]).toEqual([{ x: 48, y: 105 }, { x: 46.5, y: 0, w: 3, h: 0.9 }]);
    const g = m.blocks[st[0].gate!];
    expect([g.kind, g.x, g.y, g.w, g.h]).toEqual(['gate', GATE.x, GATE.y, GATE.w, GATE.h]);
    expect(st[0].packs).toEqual(ORCHARD_PACKS);
    expect([st[1].gate, st[1].packs]).toEqual([undefined, []]);
    expect(p.zones.map((z) => [z.name, z.kind, z.stretch])).toEqual([['THE HOME ORCHARD', 'zone', 0], ['THE PADDOCKS', 'scape', 1]]);
  });

  it('keeps each pack in its place: the gate`s in the orchard, the rest in the paddocks keeping nothing', () => {
    for (const day of [3, 41, 77]) {
      const p = plan(day), pack = (n: number) => p.foes.filter((f) => f.pack === n), o = zone(p, 'THE HOME ORCHARD'), pd = zone(p, 'THE PADDOCKS');
      for (const n of ORCHARD_PACKS) expect(pack(n).length).toBeGreaterThanOrEqual(2), expect(pack(n).every((f) => inBox(o, f.x, f.y))).toBe(true);
      for (const n of PADDOCK_PACKS) expect(pack(n).length).toBeGreaterThanOrEqual(2), expect(pack(n).every((f) => inBox(pd, f.x, f.y))).toBe(true);
      expect(new Set(p.foes.map((f) => f.pack))).toEqual(new Set([...ORCHARD_PACKS, ...PADDOCK_PACKS]));
      expect(p.foes.length).toBeGreaterThanOrEqual(16), expect(p.foes.length).toBeLessThanOrEqual(20);
      expect(p.foes.filter((f) => f.bow).length).toBe(1);
      expect(p.foes.filter((f) => f.variant === 'heavy').length).toBe(1);
      expect(p.foes.filter((f) => f.variant === 'lunger' || f.variant === 'netter').length).toBe(1);
      for (const f of p.foes) expect(Math.hypot(f.x - p.map.hero.x, f.y - p.map.hero.y)).toBeGreaterThanOrEqual(14), expect(f.z).toBeUndefined();
      expect(p.props.filter((q) => q.kind === 'cage')).toEqual([{ kind: 'cage', ...ORCHARD_SPOTS.shelter }]);
    }
  });

  it('holds the fixed spots over seeds 1 to 5, and keeps them clear', () => {
    const first = plan(1);
    for (let day = 1; day <= 5; day++) {
      const p = plan(day);
      expect(fixed(p)).toEqual(fixed(first));
      useMap(p.map);
      for (const s of [ORCHARD_SPOTS.milkStand, ORCHARD_SPOTS.dogLane]) expect(p.map.rounds.filter((r) => r.r > 0.1 && Math.hypot(r.x - s.x, r.y - s.y) < 0.4)).toHaveLength(s === ORCHARD_SPOTS.milkStand ? 1 : 0);
    }
  });

  it('is flat: no raised ground, and any ledge would follow the raised-area rules; all water on level 0', () => {
    for (const day of [3, 41]) {
      const m = plan(day).map;
      for (const l of m.ledges ?? []) {
        expect([l.kind, l.lv]).toEqual(['earth', 1]);
        for (const q of l.ramps) expect(Math.min(q.w, q.h)).toBeLessThanOrEqual(3), expect(Math.max(q.w, q.h)).toBeLessThan(Math.min(l.w, l.h));
        // Lower ground to the south or beside it, never north: the back runs to the map's top or is closed.
        expect(l.y <= 0.5 || l.ramps.every((q) => q.y >= l.y)).toBe(true);
      }
      expect(m.water!.length).toBeGreaterThanOrEqual(1);
      for (const w of m.water!) expect(levelAt(m, w.x + w.w / 2, w.y + w.h / 2)).toBe(0);
    }
  });
});

describe('THE HOME GROUND, walked', () => {
  it('reaches the orchard`s packs with the door shut, and the paddocks only through it', () => {
    for (const day of [3, 41]) {
      const shut = plan(day), w0 = walk(shut.map, shut.map.hero);
      expect(w0.minY).toBeGreaterThan(GATE.y + GATE.h - 0.5);
      expect(w0.cells.every((c) => c.x > 5 && c.x < 91)).toBe(true);
      for (const f of shut.foes.filter((f) => ORCHARD_PACKS.includes(f.pack!))) expect(w0.near(f.x, f.y), `foe ${f.pack} at ${f.x.toFixed(1)},${f.y.toFixed(1)}`).toBe(true);
      const p = open(plan(day)), w = walk(p.map, p.map.hero);
      expect(w.cells.some((c) => inArea(p.map.exit!, c.x, c.y))).toBe(true);
      for (const f of p.foes) expect(w.near(f.x, f.y), `foe ${f.pack} at ${f.x.toFixed(1)},${f.y.toFixed(1)}`).toBe(true);
      for (const c of [...p.chests, ORCHARD_SPOTS.shelter, ORCHARD_SPOTS.dogLane, ORCHARD_SPOTS.milkStand]) expect(w.near(c.x, c.y, 1.6), `${c.x},${c.y}`).toBe(true);
    }
  });

  it('stands nothing inside anything solid, and keeps the road, the gathering ground and the checkpoint clear', () => {
    for (const day of [3, 41, 77]) {
      const p = open(plan(day)), m = p.map;
      useMap(m);
      for (const t of [...p.foes, ...p.props, ...p.chests, m.hero]) {
        const q = { x: t.x, y: t.y };
        collide(q, 0.25);
        expect(Math.hypot(q.x - t.x, q.y - t.y), `${t.x.toFixed(1)},${t.y.toFixed(1)} day ${day}`).toBeLessThan(0.05);
      }
      for (const s of m.soil!.filter((s) => s.mat === 'earth' && s.line)) {
        const n = Math.ceil(Math.hypot(s.w, s.h) / 0.25);
        for (let i = 0; i <= n; i++) {
          const x = s.x + (s.w * i) / n, y = s.y + (s.h * i) / n, q = { x, y };
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

  it('is dense: things to find in every place, so it can never go plain again', () => {
    for (const day of [3, 41]) {
      const p = plan(day), m = p.map;
      const things = [...m.rounds, ...m.blocks.map((b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 })), ...m.marks!.map((q) => ({ x: q.x + q.w / 2, y: q.y + q.h / 2 })), ...p.props];
      const n = (name: string) => things.filter((q) => inBox(zone(p, name), q.x, q.y)).length;
      expect(n('THE HOME ORCHARD')).toBeGreaterThanOrEqual(DENSE.orchard);
      expect(n('THE PADDOCKS')).toBeGreaterThanOrEqual(DENSE.paddocks);
      expect(m.rounds.filter((r) => r.kind === 'apple').length).toBeGreaterThanOrEqual(DENSE.apples);
    }
  });
});

const DENSE = { orchard: 260, paddocks: 520, apples: 110 };

describe('THE HOME GROUND, as a room', () => {
  it('builds, the hero joins at the way in, and the cage stays at the shelter', () => {
    const run = newRun(landJob('tollan', 3));
    run.party = 1;
    const room = runRoom(run), h = room.join('me');
    room.setIntent(h.id, NO_INTENT);
    expect(room.map.name).toBe("TOLLAN'S FARM");
    expect(Math.hypot(h.x - 48, h.y - 105)).toBeLessThan(1.5);
    for (let i = 0; i < 30; i++) room.step();
    const cage = room.props.find((f) => f.kind === 'cage')!;
    expect(Math.hypot(cage.x - ORCHARD_SPOTS.shelter.x, cage.y - ORCHARD_SPOTS.shelter.y)).toBeLessThan(0.05);
  });
});
