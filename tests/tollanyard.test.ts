/**
 * Tollan's Farm, map 2: THE YARD (shared/tollanyard.ts; docs/design/territories.md, "2. Tollan's Farm";
 * docs/design/elevation.md, "Raised areas"). Fixed where the spec fixes it, the packs where they belong, the terrace
 * and its two flights, the density, a walk through it by the game's own collide rules (levels and all), and the room.
 */
import { describe, expect, it } from 'vitest';
import { collide, FACE_FOOT, inArea, levelAt, solid, useMap, type GameMap } from '../src/shared/arena';
import { landJob, territoryPlan, type TerrPlan } from '../src/shared/territory';
import { yardPlan, YARD_SPOTS } from '../src/shared/tollanyard';
import { BARN, BAYS, PORCH } from '../src/shared/tollanyardbarn';
import { FLIGHT, STEPS, TERRACE } from '../src/shared/tollanyardland';
import { HERO, TICK } from '../src/shared/tuning';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';

const R = 0.3, C = 0.5, LV = 4, FACE = TERRACE.y + TERRACE.h;
const plan = (day = 3) => territoryPlan(landJob('tollan', day), 1);
const zone = (p: TerrPlan, name: string) => p.zones.find((z) => z.name === name)!;
const inBox = (b: { x: number; y: number; w: number; h: number }, x: number, y: number) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
const fixed = (p: TerrPlan) => ({
  hero: p.map.hero, exit: p.map.exit, zones: p.zones, ledges: p.map.ledges, water: p.map.water, stretches: p.map.stretches,
  gates: p.map.blocks.filter((b) => b.kind === 'gate'), spots: YARD_SPOTS,
});
const open = (p: TerrPlan) => ((p.map.blocks[p.map.stretches![0].gate!].ruined = true), p);

/** Walk the map on a half-tile grid with collide() itself, levels and all (as tests/lowfurrowrise.test.ts does). */
function walk(m: GameMap, from: { x: number; y: number }) {
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
      collide(p, R);
      if (Math.hypot(p.x - x, p.y - y) > 0.02) continue;
      const k = key(ni, nj, p.z ?? z);
      if (!dist.has(k)) dist.set(k, d + 1), q.push(k);
    }
  }
  const cells = [...dist.keys()].map((s) => {
    const z = s % LV, c = (s - z) / LV, i = c % cols;
    return { x: (i + 0.5) * C, y: ((c - i) / cols + 0.5) * C, z };
  });
  return { cells, near: (x: number, y: number, r = 1.4) => cells.some((c) => Math.hypot(c.x - x, c.y - y) <= r) };
}

/** A hero set down at (x, y, z) walking toward (mx, my) for `secs`, with every goblin dead (tests/knoll.test.ts). */
function stroll(x: number, y: number, mx: number, my: number, secs: number, z = 0) {
  const run = newRun(landJob('tollan', 3));
  run.index = 1;
  const room = runRoom(run), h = room.join('me');
  room.setIntent(h.id, NO_INTENT), Object.assign(h, { hp: 1e6, maxHp: 1e6 });
  for (const e of room.allEnemies) Object.assign(e, { hp: 0, act: 'dead' });
  for (let n = 0; n < 60; n++) room.step();
  Object.assign(h, { x, y, z, safeT: 99 });
  room.setIntent(h.id, { ...NO_INTENT, mx, my });
  for (let n = 0; n < Math.round(secs / TICK); n++) room.step();
  return h;
}

describe('THE YARD, the plan', () => {
  it('is built quickly, the same from the same seed, and the seed moves nothing fixed', () => {
    const t = performance.now();
    yardPlan(landJob('tollan', 9));
    expect(performance.now() - t).toBeLessThan(300);
    expect(plan(3)).toEqual(plan(3));
    const a = plan(3), b = plan(41);
    expect(fixed(a)).toEqual(fixed(b));
    expect(a.map.rounds).not.toEqual(b.map.rounds);
  });

  it('is 96 by 104, in at the bottom and out through the barn`s doors, which keep the yard', () => {
    const p = plan(), m = p.map, st = m.stretches!, g0 = m.blocks[st[0].gate!];
    expect([m.w, m.h, m.name, m.settle]).toEqual([96, 104, "TOLLAN'S FARM", true]);
    expect([m.hero, m.exit]).toEqual([{ x: 48, y: 101 }, { ...PORCH }]);
    // The porch is right behind the doors, between the barn's two bays, and nothing else is.
    expect([PORCH.x, PORCH.w, PORCH.y + PORCH.h <= g0.y + 0.01, PORCH.y >= BARN.y + BARN.h - 0.01]).toEqual([g0.x, g0.w, true, true]);
    for (const b of BAYS) expect([b.y, b.x + b.w === PORCH.x || b.x === PORCH.x + PORCH.w]).toEqual([PORCH.y, true]);
    expect(p.zones.map((z) => [z.name, z.kind, z.stretch])).toEqual([['THE HOME CLOSE', 'scape', 0], ['THE YARD', 'zone', 0]]);
    const g = m.blocks[st[0].gate!];
    expect([g.kind, g.x + g.w / 2, g.y + g.h / 2]).toEqual(['gate', YARD_SPOTS.doors.x, YARD_SPOTS.doors.y]);
    expect(st.map((s) => [s.name, s.packs, s.keep])).toEqual([['THE YARD', [320, 323, 324, 325, 326], []], ['THE BARN', [], []]]);
    for (const n of [...st[0].packs!, ...st[1].packs!]) expect(p.foes.some((f) => f.pack === n), `pack ${n}`).toBe(true);
  });

  it('has fourteen goblins and nobody named (MAWL is inside the barn, the next map)', () => {
    for (const day of [3, 41, 77]) {
      const p = plan(day);
      expect(p.foes.filter((f) => f.name)).toEqual([]);
      expect(p.foes.length).toBe(14);
      expect(p.foes.filter((f) => f.bow).length).toBe(2);
      for (const f of p.foes.filter((f) => f.pack === 320)) expect([f.z, f.y < FACE && f.y > FACE - 2.5]).toEqual([2, true]);
      expect(p.foes.filter((f) => f.task?.k === 'haul').length).toBe(3), expect(p.foes.filter((f) => f.haul?.sack).length).toBe(1);
      for (const f of p.foes) expect(f.z ?? 0).toBe(levelAt(p.map, f.x, f.y));
      for (const f of p.foes) expect(Math.hypot(f.x - p.map.hero.x, f.y - p.map.hero.y)).toBeGreaterThanOrEqual(14);
    }
  });

  it('keeps the raised-area rules: one terrace two levels up to the top edge, narrow flights, the low ground south, water low', () => {
    const m = plan().map, l = m.ledges!;
    expect(l.length).toBe(1);
    expect([l[0].lv, l[0].kind, l[0].y, l[0].x, l[0].w, l[0].ramps.length]).toEqual([2, 'crag', 0, 0, 96, 2]);
    for (const q of l[0].ramps) expect(Math.min(q.w, q.h)).toBeLessThanOrEqual(3), expect(Math.max(q.w, q.h)).toBeLessThanOrEqual(6);
    expect(Math.max(...l.map((x) => x.lv ?? 1))).toBe(2);
    for (const x of [6, 30, 48, 70, 90]) expect([levelAt(m, x, FACE - 3), levelAt(m, x, FACE + 4), levelAt(m, x, 2)]).toEqual([2, 0, 2]);
    for (const w of m.water ?? []) for (const [x, y] of [[w.x, w.y], [w.x + w.w, w.y + w.h], [w.x + w.w / 2, w.y + w.h / 2]]) expect(levelAt(m, x, y)).toBe(0);
  });

  it('holds its fixed spots over seeds 1 to 5, each up on the terrace and clear of anything solid', () => {
    const first = plan(1);
    for (const day of [1, 2, 3, 4, 5]) {
      const p = plan(day);
      expect(fixed(p)).toEqual(fixed(first));
      useMap(p.map);
      for (const [name, s] of Object.entries(YARD_SPOTS)) {
        if (name === 'doors') continue;
        const q = { x: s.x, y: s.y, z: 2 };
        expect(levelAt(p.map, s.x, s.y), name).toBe(2);
        collide(q, R);
        expect(Math.hypot(q.x - s.x, q.y - s.y), `${name} day ${day}`).toBeLessThan(0.05);
      }
    }
  });

  it('stands nothing inside something solid, and nothing solid in the doors` gathering ground or on the road', () => {
    for (const day of [3, 41]) {
      const p = open(plan(day)), m = p.map;
      useMap(m);
      for (const s of [...p.foes, ...p.chests, ...p.props]) {
        const q = { x: s.x, y: s.y, z: levelAt(m, s.x, s.y) };
        collide(q, R);
        expect(Math.hypot(q.x - s.x, q.y - s.y), `${s.x.toFixed(1)},${s.y.toFixed(1)} day ${day}`).toBeLessThan(0.05);
      }
      for (const s of m.soil!.filter((s) => s.mat === 'earth' && s.line)) {
        const n = Math.ceil(Math.hypot(s.w, s.h) / 0.25);
        for (let i = 0; i <= n; i++) {
          const x = s.x + (s.w * i) / n, y = s.y + (s.h * i) / n, q = { x, y, z: levelAt(m, x, y) };
          collide(q, R);
          expect(Math.hypot(q.x - x, q.y - y), `road at ${x.toFixed(2)},${y.toFixed(2)} day ${day}`).toBeLessThan(0.01);
        }
      }
      const a = m.stretches![0].at!, stops = [...m.blocks.filter((b) => b.kind !== 'gate' && solid(b)), ...m.rounds.map((r) => ({ x: r.x - r.r, y: r.y - r.r, w: r.r * 2, h: r.r * 2 }))];
      expect(stops.filter((b) => b.x < a.x + a.w && a.x < b.x + b.w && b.y < a.y + a.h && a.y < b.y + b.h)).toEqual([]);
    }
  });

  it('is dense: things to find in every place, so it can never go plain again', () => {
    const p = plan(9), m = p.map, things = [...m.rounds, ...m.blocks.map((b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 })), ...m.marks!.map((q) => ({ x: q.x + q.w / 2, y: q.y + q.h / 2 })), ...p.props];
    const n = (name: string) => things.filter((q) => inBox(zone(p, name), q.x, q.y)).length;
    expect(n('THE HOME CLOSE')).toBeGreaterThanOrEqual(110);
    expect(n('THE YARD')).toBeGreaterThanOrEqual(110);
  });
});

describe('THE YARD, walked', () => {
  it('walks to every pack, spot and chest; into the porch only once the doors are open', () => {
    for (const day of [3, 41]) {
      const p = open(plan(day)), w = walk(p.map, p.map.hero);
      for (const f of p.foes) expect(w.near(f.x, f.y), `foe ${f.pack} at ${f.x.toFixed(1)},${f.y.toFixed(1)}`).toBe(true);
      for (const c of [...p.chests, ...Object.values(YARD_SPOTS)]) expect(w.near(c.x, c.y), `${c.x},${c.y}`).toBe(true);
      expect(w.cells.some((c) => inArea(p.map.exit!, c.x, c.y))).toBe(true);
    }
    const shut = plan(), w = walk(shut.map, shut.map.hero);
    expect(w.cells.filter((c) => inArea(shut.map.exit!, c.x, c.y))).toEqual([]);
    for (const f of shut.foes) expect(w.near(f.x, f.y), `foe ${f.pack}`).toBe(true);
  });

  it('stops a hero walking north into the wall everywhere but the two flights', () => {
    for (const x of [8, 24, 38, 56, 70, 80, 92]) {
      const h = stroll(x, FACE + 4.5, 0, -1, 3);
      expect(h.y, `x ${x}`).toBeGreaterThan(FACE + FACE_FOOT + HERO.radius - 0.05);
      expect(h.z ?? 0).toBe(0);
    }
  });

  it('takes a hero up both flights onto the terrace', () => {
    for (const f of [FLIGHT, STEPS]) {
      const h = stroll(f.x + f.w / 2, FACE + 4.5, 0, -1, 4);
      expect(h.z ?? 0).toBe(2);
      expect(h.y).toBeLessThan(f.y);
    }
  });

  it('builds as a room: the hero joins at the way in, nobody named among the goblins', () => {
    const run = newRun(landJob('tollan', 3));
    run.index = 1;
    const room = runRoom(run), h = room.join('me');
    room.setIntent(h.id, NO_INTENT);
    for (let i = 0; i < 30; i++) room.step();
    expect(room.map.name).toBe("TOLLAN'S FARM");
    expect(Math.hypot(h.x - 48, h.y - 101)).toBeLessThan(1.5);
    expect(room.allEnemies.some((e) => e.name)).toBe(false);
  });
});
