/**
 * Sallow Carr, map 1: THE OSIER BEDS (shared/sallowbeds.ts; docs/design/territories.md, "3. Sallow Carr";
 * docs/design/elevation.md, "Raised areas"). Fixed where the spec fixes it, the packs where they belong, the two
 * sluices hauled with their dens, deep water that really stops a body, the density, a walk through it by the game's
 * own collide rules, and the room built on it.
 */
import { describe, expect, it } from 'vitest';
import { collide, inArea, solid, useMap, type GameMap } from '../src/shared/arena';
import { bedsPlan, BEDS_SPOTS } from '../src/shared/sallowbeds';
import { SLUICE1, SLUICE2 } from '../src/shared/sallowbedsland';
import { landJob, territoryPlan, type TerrPlan } from '../src/shared/territory';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';

const R = 0.3, C = 0.5;
const plan = (day = 3) => territoryPlan(landJob('sallow', day), 0);
const zone = (p: TerrPlan, name: string) => p.zones.find((z) => z.name === name)!;
const inBox = (b: { x: number; y: number; w: number; h: number }, x: number, y: number) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
const fixed = (p: TerrPlan) => ({
  hero: p.map.hero, exit: p.map.exit, zones: p.zones, water: p.map.water, gates: p.map.blocks.filter((b) => b.kind === 'gate'), stretches: p.map.stretches,
  dens: p.map.blocks.filter((b) => b.kind === 'den'), props: p.props.filter((q) => q.kind === 'cage' || q.kind === 'oil'), spots: BEDS_SPOTS,
});
const open = (p: TerrPlan, n: number) => {
  for (let i = 0; i < n; i++) p.map.blocks[p.map.stretches![i].gate!].ruined = true;
  return p;
};
const BEDS = [401, 402, 403], DROVE = [404], HOLM = [405, 406, 407];

/** Walk the map on a half-tile grid with collide() itself, as a body with a footing (deep water stops it). */
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
      const x = (ni + 0.5) * C, y = (nj + 0.5) * C, p = { x, y, z: 0 };
      collide(p, R);
      if (Math.hypot(p.x - x, p.y - y) > 0.02) continue;
      seen.add(s), q.push(s);
    }
  }
  const cells = [...seen].map((s) => ({ x: ((s % cols) + 0.5) * C, y: (Math.floor(s / cols) + 0.5) * C }));
  const near = (x: number, y: number, r = 1.4) => cells.some((c) => Math.hypot(c.x - x, c.y - y) <= r);
  return { cells, minY: Math.min(...cells.map((c) => c.y)), near };
}

describe('THE OSIER BEDS, the plan', () => {
  it('is built quickly, the same from the same seed, and the seed moves nothing fixed', () => {
    const t = performance.now();
    bedsPlan(landJob('sallow', 9));
    expect(performance.now() - t).toBeLessThan(300);
    expect(plan(3)).toEqual(plan(3));
    const a = plan(3), b = plan(41);
    expect(fixed(a)).toEqual(fixed(b));
    expect(a.map.rounds).not.toEqual(b.map.rounds);
  });

  it('is 96 by 112, in at the bottom, out at the top, in three stretches, both sluices hauled with their dens', () => {
    const p = plan(), m = p.map, st = m.stretches!;
    expect([m.w, m.h, m.name, st.length]).toEqual([96, 112, 'SALLOW CARR', 3]);
    expect([m.hero, m.exit]).toEqual([{ x: 48, y: 109 }, { x: 46.5, y: 0, w: 3, h: 0.9 }]);
    for (const [i, g, packs] of [[0, SLUICE1, BEDS], [1, SLUICE2, HOLM]] as const) {
      const b = m.blocks[st[i].gate!];
      expect([b.kind, b.x, b.y, b.w, b.h]).toEqual(['gate', g.x, g.y, g.w, g.h]);
      expect([st[i].packs, st[i].haul, st[i].dens!.length]).toEqual([packs, 5, 1]);
      const den = m.blocks[st[i].dens![0]], spot = i ? BEDS_SPOTS.den2 : BEDS_SPOTS.den1;
      expect([den.kind, den.x + den.w / 2, den.y + den.h / 2]).toEqual(['den', spot.x, spot.y]);
    }
    expect([st[2].gate, st[2].packs]).toEqual([undefined, []]);
    expect(p.zones.map((z) => [z.name, z.kind, z.stretch])).toEqual([['THE OSIER BEDS', 'zone', 0], ['THE DROWNED DROVE', 'scape', 1], ['THE HOLM', 'zone', 1]]);
    // An oil barrel by each den; the cage well off both (a captive by a burning den is lost).
    const oils = p.props.filter((q) => q.kind === 'oil'), cage = p.props.filter((q) => q.kind === 'cage');
    expect([oils.length, cage]).toEqual([2, [{ kind: 'cage', ...BEDS_SPOTS.cage }]]);
    for (const d of [BEDS_SPOTS.den1, BEDS_SPOTS.den2]) expect(oils.some((o) => Math.hypot(o.x - d.x, o.y - d.y) < 5)).toBe(true);
    for (const t of [BEDS_SPOTS.den1, BEDS_SPOTS.den2, ...oils]) expect(Math.hypot(t.x - cage[0].x, t.y - cage[0].y)).toBeGreaterThanOrEqual(5);
  });

  it('keeps each pack in its place, about nineteen for one level 4 hero', () => {
    for (const day of [3, 41, 77]) {
      const p = plan(day), pack = (n: number) => p.foes.filter((f) => f.pack === n);
      for (const [name, packs] of [['THE OSIER BEDS', BEDS], ['THE DROWNED DROVE', DROVE], ['THE HOLM', HOLM]] as const) {
        for (const n of packs) expect(pack(n).length).toBeGreaterThanOrEqual(2), expect(pack(n).every((f) => inBox(zone(p, name), f.x, f.y))).toBe(true);
      }
      expect(DROVE.reduce((s, n) => s + pack(n).length, 0)).toBeLessThanOrEqual(2);
      expect(new Set(p.foes.map((f) => f.pack))).toEqual(new Set([...BEDS, ...DROVE, ...HOLM]));
      expect(p.foes.length).toBeGreaterThanOrEqual(17), expect(p.foes.length).toBeLessThanOrEqual(21);
      expect(p.foes.filter((f) => f.bow).length).toBe(1);
      expect(p.foes.filter((f) => f.variant === 'heavy').length).toBe(1);
      expect(p.foes.filter((f) => f.variant === 'lunger' || f.variant === 'netter').length).toBe(1);
      for (const f of p.foes) expect(Math.hypot(f.x - p.map.hero.x, f.y - p.map.hero.y)).toBeGreaterThanOrEqual(14), expect(f.z).toBeUndefined();
    }
  });

  it('holds the fixed spots over seeds 1 to 5', () => {
    const first = plan(1);
    for (let day = 1; day <= 5; day++) expect(fixed(plan(day))).toEqual(fixed(first));
  });
});

describe('THE OSIER BEDS, walked', () => {
  it('reaches the beds` packs and the first den with the sluice shut, the drove only through it, the last cut only through the second', () => {
    for (const day of [3, 41]) {
      const shut = plan(day), w0 = walk(shut.map, shut.map.hero);
      expect(w0.minY).toBeGreaterThan(SLUICE1.y + SLUICE1.h - 0.5);
      for (const f of shut.foes.filter((f) => BEDS.includes(f.pack!))) expect(w0.near(f.x, f.y), `foe ${f.pack} at ${f.x.toFixed(1)},${f.y.toFixed(1)}`).toBe(true);
      expect(w0.near(BEDS_SPOTS.den1.x, BEDS_SPOTS.den1.y, 2)).toBe(true);
      const one = open(plan(day), 1), w1 = walk(one.map, one.map.hero);
      expect(w1.minY).toBeGreaterThan(SLUICE2.y + SLUICE2.h - 0.5);
      for (const f of one.foes) expect(w1.near(f.x, f.y), `foe ${f.pack} at ${f.x.toFixed(1)},${f.y.toFixed(1)}`).toBe(true);
      for (const c of [...one.chests, BEDS_SPOTS.den2, BEDS_SPOTS.cage, BEDS_SPOTS.sickles]) expect(w1.near(c.x, c.y, 2), `${c.x},${c.y}`).toBe(true);
      const both = open(plan(day), 2), w2 = walk(both.map, both.map.hero);
      expect(w2.cells.some((c) => inArea(both.map.exit!, c.x, c.y))).toBe(true);
    }
  });

  it('stops a body in deep water: the black water either side of the way, and beside the boards', () => {
    const p = open(plan(), 2);
    useMap(p.map);
    for (const [x, y] of [[40, 104], [56, 104], [30, 64.5], [70, 64.5], [36, 52.5], [58, 47.5], [45, 47.5], [20, 8], [48, 37]] as const) {
      const q = { x, y, z: 0 };
      collide(q, R);
      expect(Math.hypot(q.x - x, q.y - y), `${x},${y}`).toBeGreaterThan(0.2);
    }
    // On the boards over the break you stand.
    const q = { x: 47, y: 47.5, z: 0 };
    collide(q, R);
    expect(Math.hypot(q.x - 47, q.y - 47.5)).toBeLessThan(0.02);
  });

  it('stands nothing inside anything solid or in deep water, and keeps the road and each sluice`s ground clear', () => {
    for (const day of [3, 41, 77]) {
      const p = open(plan(day), 2), m = p.map;
      useMap(m);
      for (const t of [...p.foes, ...p.props, ...p.chests, m.hero]) {
        const q = { x: t.x, y: t.y, z: 0 };
        collide(q, 0.25);
        expect(Math.hypot(q.x - t.x, q.y - t.y), `${t.x.toFixed(1)},${t.y.toFixed(1)} day ${day}`).toBeLessThan(0.05);
      }
      for (const s of m.soil!.filter((s) => s.mat === 'earth' && s.line)) {
        const n = Math.ceil(Math.hypot(s.w, s.h) / 0.25);
        for (let i = 0; i <= n; i++) {
          const x = s.x + (s.w * i) / n, y = s.y + (s.h * i) / n, q = { x, y, z: 0 };
          collide(q, R);
          expect(Math.hypot(q.x - x, q.y - y), `road at ${x.toFixed(2)},${y.toFixed(2)} day ${day}`).toBeLessThan(0.01);
        }
      }
      const stops = [...m.blocks.filter((b) => b.kind !== 'gate' && solid(b)), ...m.rounds.filter((r) => r.r > 0.05).map((r) => ({ x: r.x - r.r, y: r.y - r.r, w: r.r * 2, h: r.r * 2 }))];
      for (const st of m.stretches!.slice(0, 2)) {
        const a = st.at!, c = st.check!;
        expect(stops.filter((b) => b.x < a.x + a.w && a.x < b.x + b.w && b.y < a.y + a.h && a.y < b.y + b.h)).toEqual([]);
        expect(stops.filter((b) => Math.hypot(c.x - Math.max(b.x, Math.min(b.x + b.w, c.x)), c.y - Math.max(b.y, Math.min(b.y + b.h, c.y))) < 1.5)).toEqual([]);
      }
    }
  });

  it('is dense: things to find in every place, so it can never go plain', () => {
    for (const day of [3, 41]) {
      const p = plan(day), m = p.map;
      const things = [...m.rounds, ...m.blocks.map((b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 })), ...m.marks!.map((q) => ({ x: q.x + q.w / 2, y: q.y + q.h / 2 })), ...p.props];
      const n = (name: string) => things.filter((q) => inBox(zone(p, name), q.x, q.y)).length;
      expect(n('THE OSIER BEDS')).toBeGreaterThanOrEqual(DENSE.beds);
      expect(n('THE DROWNED DROVE')).toBeGreaterThanOrEqual(DENSE.drove);
      expect(n('THE HOLM')).toBeGreaterThanOrEqual(DENSE.holm);
      expect(m.rounds.filter((r) => r.kind === 'tree' || r.kind === 'deadtree').length).toBeGreaterThanOrEqual(DENSE.willows);
    }
  });
});

const DENSE = { beds: 380, drove: 140, holm: 145, willows: 380 };

describe('THE OSIER BEDS, as a room', () => {
  it('builds, the hero joins at the way in, and the cage stays by the den', () => {
    const run = newRun(landJob('sallow', 3));
    run.party = 1;
    const room = runRoom(run), h = room.join('me');
    room.setIntent(h.id, NO_INTENT);
    expect(room.map.name).toBe('SALLOW CARR');
    expect(Math.hypot(h.x - 48, h.y - 109)).toBeLessThan(1.5);
    for (let i = 0; i < 30; i++) room.step();
    const cage = room.props.find((f) => f.kind === 'cage')!;
    expect(Math.hypot(cage.x - BEDS_SPOTS.cage.x, cage.y - BEDS_SPOTS.cage.y)).toBeLessThan(0.05);
  });
});
