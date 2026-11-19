/**
 * Sallow Carr, map 2: THE WILLOW HOLT (shared/sallowholt.ts; docs/design/territories.md, "3. Sallow Carr";
 * docs/design/elevation.md, "Raised areas"). Fixed where the spec fixes it, the packs where they belong, the water,
 * the main bank and its two flights, the one den, the density, a walk through it by the game's own collide rules
 * (levels and deep water and all), and the room.
 */
import { describe, expect, it } from 'vitest';
import { collide, FACE_FOOT, inArea, levelAt, solid, useMap, type GameMap } from '../src/shared/arena';
import { holtPlan, HOLT_SPOTS } from '../src/shared/sallowholt';
import { BANK, FACE, FLIGHT, GATE, OUT, STEPS } from '../src/shared/sallowholtland';
import { landJob, territoryPlan, type TerrPlan } from '../src/shared/territory';
import { HERO, TICK } from '../src/shared/tuning';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';

const R = 0.3, C = 0.5, LV = 4;
const plan = (day = 3) => territoryPlan(landJob('sallow', day), 1);
const zone = (p: TerrPlan, name: string) => p.zones.find((z) => z.name === name)!;
const inBox = (b: { x: number; y: number; w: number; h: number }, x: number, y: number) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
const fixed = (p: TerrPlan) => ({
  hero: p.map.hero, exit: p.map.exit, zones: p.zones, ledges: p.map.ledges, water: p.map.water, stretches: p.map.stretches,
  gates: p.map.blocks.filter((b) => b.kind === 'gate'), dens: p.map.blocks.filter((b) => b.kind === 'den'),
  oil: p.props.filter((q) => q.kind === 'oil'), spots: HOLT_SPOTS,
});
const open = (p: TerrPlan) => ((p.map.blocks[p.map.stretches![0].gate!].ruined = true), p);
const dens = (p: TerrPlan) => p.map.blocks.filter((b) => b.kind === 'den');

/** Walk the map on a half-tile grid with collide() itself, levels and deep water and all (tests/tollanyard.test.ts). */
function walk(m: GameMap, from: { x: number; y: number }) {
  useMap(m);
  const cols = Math.ceil(m.w / C), rows = Math.ceil(m.h / C), dist = new Set<number>(), q: number[] = [];
  const key = (i: number, j: number, z: number) => (j * cols + i) * LV + z;
  const i0 = Math.floor(from.x / C), j0 = Math.floor(from.y / C), k0 = key(i0, j0, levelAt(m, (i0 + 0.5) * C, (j0 + 0.5) * C));
  dist.add(k0), q.push(k0);
  for (let h = 0; h < q.length; h++) {
    const s = q[h], z = s % LV, c = (s - z) / LV, i = c % cols, j = (c - i) / cols;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
      const x = (ni + 0.5) * C, y = (nj + 0.5) * C, p = { x, y, z };
      collide(p, R);
      if (Math.hypot(p.x - x, p.y - y) > 0.02) continue;
      const kk = key(ni, nj, p.z ?? z);
      if (!dist.has(kk)) dist.add(kk), q.push(kk);
    }
  }
  const cells = [...dist].map((s) => {
    const z = s % LV, c = (s - z) / LV, i = c % cols;
    return { x: (i + 0.5) * C, y: ((c - i) / cols + 0.5) * C, z };
  });
  return { cells, near: (x: number, y: number, r = 1.4) => cells.some((c) => Math.hypot(c.x - x, c.y - y) <= r) };
}

/** A hero set down at (x, y, z) walking toward (mx, my) for `secs`, with every goblin dead (tests/tollanyard.test.ts). */
function stroll(x: number, y: number, mx: number, my: number, secs: number, z = 0) {
  const run = newRun(landJob('sallow', 3));
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

describe('THE WILLOW HOLT, the plan', () => {
  it('is built quickly, the same from the same seed, and the seed moves nothing fixed', () => {
    const t = performance.now();
    holtPlan(landJob('sallow', 9));
    expect(performance.now() - t).toBeLessThan(300);
    expect(plan(3)).toEqual(plan(3));
    const a = plan(3), b = plan(41);
    expect(fixed(a)).toEqual(fixed(b));
    expect(a.map.rounds).not.toEqual(b.map.rounds);
  });

  it('is 96 by 100, in at the bottom, out at the top edge, two stretches with the gate keeping the holt`s pack', () => {
    const p = plan(), m = p.map, st = m.stretches!, g = m.blocks[st[0].gate!];
    expect([m.w, m.h, m.name, m.settle]).toEqual([96, 100, 'SALLOW CARR', true]);
    expect([m.hero, m.exit]).toEqual([{ x: 48, y: 97 }, { ...OUT }]);
    expect(m.exit!.y).toBe(0);
    expect(p.zones.map((z) => [z.name, z.kind, z.stretch])).toEqual([['THE WILLOW HOLT', 'scape', 0], ['THE SLUICE HOUSE', 'zone', 1]]);
    expect([g.kind, g.x + g.w / 2, g.y + g.h / 2]).toEqual(['gate', HOLT_SPOTS.gate.x, HOLT_SPOTS.gate.y]);
    expect(st.map((s) => [s.name, s.packs, s.keep])).toEqual([['THE WILLOW HOLT', [420], []], ['THE SLUICE HOUSE', [421, 422, 423, 424], []]]);
    expect(st[1].gate).toBeUndefined();
    for (const n of [...st[0].packs!, ...st[1].packs!]) expect(p.foes.some((f) => f.pack === n), `pack ${n}`).toBe(true);
  });

  it('has thirteen goblins and the spiders, nobody named, archers on the lip either side of the flight', () => {
    for (const day of [3, 41, 77]) {
      const p = plan(day), gob = p.foes.filter((f) => f.kind === 'scrapper');
      expect(p.foes.filter((f) => f.name)).toEqual([]);
      expect(gob.length).toBe(13);
      expect(gob.filter((f) => f.pack === 420).length).toBe(4), expect(gob.filter((f) => f.pack === 420 && f.bow).length).toBe(1);
      expect(gob.filter((f) => f.pack! >= 421).length).toBe(9);
      expect(p.foes.filter((f) => f.kind === 'spider').length).toBe(3), expect(p.foes.filter((f) => f.kind === 'nest').length).toBe(1);
      const lip = p.foes.filter((f) => f.pack === 421);
      for (const f of lip) expect([f.z, f.bow, f.y < FACE && f.y > FACE - 2.5]).toEqual([1, true, true]);
      expect(lip.some((f) => f.x < FLIGHT.x) && lip.some((f) => f.x > FLIGHT.x + FLIGHT.w)).toBe(true);
      expect(p.foes.filter((f) => f.task?.k === 'haul').length).toBe(3), expect(p.foes.filter((f) => f.haul?.sack).length).toBe(1);
      for (const f of p.foes) expect(f.z ?? 0).toBe(levelAt(p.map, f.x, f.y));
      for (const f of p.foes) expect(Math.hypot(f.x - p.map.hero.x, f.y - p.map.hero.y)).toBeGreaterThanOrEqual(14);
      for (const f of p.foes.filter((f) => f.pack && f.pack < 421)) expect(f.y).toBeGreaterThan(FACE + 8);
    }
  });

  it('has exactly one den, up on the bank against the hut, with oil within 4 tiles of it', () => {
    const p = plan(), d = dens(p);
    expect(d.length).toBe(1);
    const c = { x: d[0].x + d[0].w / 2, y: d[0].y + d[0].h / 2 };
    expect(c).toEqual(HOLT_SPOTS.den), expect(levelAt(p.map, c.x, c.y)).toBe(1);
    const oil = p.props.filter((q) => q.kind === 'oil');
    expect(oil.length).toBeGreaterThanOrEqual(6);
    expect(oil.some((q) => Math.hypot(q.x - c.x, q.y - c.y) <= 4)).toBe(true);
    expect(oil.filter((q) => Math.hypot(q.x - HOLT_SPOTS.hoard.x, q.y - HOLT_SPOTS.hoard.y) <= 4).length).toBeGreaterThanOrEqual(5);
  });

  it('keeps the raised-area rules: one bank a level up to the top edge, narrow flights, the low ground south, water low', () => {
    const m = plan().map, l = m.ledges!;
    expect(l.length).toBe(1);
    expect([l[0].lv, l[0].kind, l[0].y, l[0].x, l[0].w, l[0].h, l[0].ramps.length]).toEqual([1, 'crag', 0, 0, 96, BANK.h, 2]);
    for (const q of l[0].ramps) expect(Math.min(q.w, q.h)).toBeLessThanOrEqual(3), expect(Math.max(q.w, q.h)).toBeLessThanOrEqual(6);
    expect(Math.min(STEPS.w, STEPS.h)).toBeLessThanOrEqual(3), expect(Math.max(...l.map((x) => x.lv ?? 1))).toBe(1);
    for (const x of [6, 30, 48, 70, 90]) expect([levelAt(m, x, FACE - 3), levelAt(m, x, FACE + 4), levelAt(m, x, 2)]).toEqual([1, 0, 1]);
    for (const w of m.water ?? []) for (const [x, y] of [[w.x, w.y], [w.x + w.w, w.y + w.h], [w.x + w.w / 2, w.y + w.h / 2]]) expect(levelAt(m, x, y)).toBe(0);
  });

  it('holds its fixed spots over seeds 1 to 5, the hut`s door and the web chest clear of anything solid', () => {
    const first = plan(1);
    for (const day of [1, 2, 3, 4, 5]) {
      const p = plan(day);
      expect(fixed(p)).toEqual(fixed(first));
      useMap(p.map);
      for (const name of ['hut', 'webChest'] as const) {
        const s = HOLT_SPOTS[name], q = { x: s.x, y: s.y, z: levelAt(p.map, s.x, s.y) };
        collide(q, R);
        expect(Math.hypot(q.x - s.x, q.y - s.y), `${name} day ${day}`).toBeLessThan(0.05);
      }
    }
  });

  it('stands nothing inside something solid or in deep water, and nothing solid in the gate`s gathering ground', () => {
    for (const day of [3, 41]) {
      const p = open(plan(day)), m = p.map;
      useMap(m);
      for (const s of [...p.foes, ...p.chests, ...p.props]) {
        const q = { x: s.x, y: s.y, z: levelAt(m, s.x, s.y) };
        collide(q, R);
        expect(Math.hypot(q.x - s.x, q.y - s.y), `${s.x.toFixed(1)},${s.y.toFixed(1)} day ${day}`).toBeLessThan(0.05);
      }
      const a = m.stretches![0].at!, stops = [...m.blocks.filter((b) => b.kind !== 'gate' && solid(b)), ...m.rounds.map((r) => ({ x: r.x - r.r, y: r.y - r.r, w: r.r * 2, h: r.r * 2 }))];
      expect(stops.filter((b) => b.x < a.x + a.w && a.x < b.x + b.w && b.y < a.y + a.h && a.y < b.y + b.h)).toEqual([]);
    }
  });

  it('is dense: things to find in every place, so it can never go plain', () => {
    const p = plan(9), m = p.map, things = [...m.rounds, ...m.blocks.map((b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 })), ...m.marks!.map((q) => ({ x: q.x + q.w / 2, y: q.y + q.h / 2 })), ...p.props];
    const n = (name: string) => things.filter((q) => inBox(zone(p, name), q.x, q.y)).length;
    expect(n('THE WILLOW HOLT')).toBeGreaterThanOrEqual(400);
    expect(n('THE SLUICE HOUSE')).toBeGreaterThanOrEqual(150);
  });
});

describe('THE WILLOW HOLT, walked', () => {
  it('walks to every pack, the web chest, the den and the exit; onto the bank only once the gate is open', () => {
    for (const day of [3, 41]) {
      const p = open(plan(day)), w = walk(p.map, p.map.hero);
      for (const f of p.foes) expect(w.near(f.x, f.y), `foe ${f.kind} ${f.pack} at ${f.x.toFixed(1)},${f.y.toFixed(1)}`).toBe(true);
      for (const c of [...p.chests, HOLT_SPOTS.hut, HOLT_SPOTS.webChest]) expect(w.near(c.x, c.y), `${c.x},${c.y}`).toBe(true);
      expect(w.near(HOLT_SPOTS.den.x, HOLT_SPOTS.den.y, 2.6)).toBe(true);
      expect(w.cells.some((c) => inArea(p.map.exit!, c.x, c.y))).toBe(true);
    }
    const shut = plan(), w = walk(shut.map, shut.map.hero);
    expect(w.cells.filter((c) => c.y < GATE.y)).toEqual([]);
    for (const f of shut.foes.filter((f) => f.y > FACE + 8)) expect(w.near(f.x, f.y), `foe ${f.kind} ${f.pack}`).toBe(true);
  });

  it('stops a hero in the deep water off the boards', () => {
    for (const dx of [-1, 1]) {
      const h = stroll(48, 84, dx, 0, 2);
      expect(Math.abs(h.x - 48), `toward ${dx}`).toBeLessThan(1.2);
    }
    const h = stroll(45, 46, -1, 0, 2);
    expect(h.x).toBeGreaterThan(43.5);
  });

  it('stops a hero walking north into the face everywhere but the two flights', () => {
    for (const x of [8, 24, 38, 56, 66, 80, 92]) {
      const h = stroll(x, FACE + 4.5, 0, -1, 3);
      expect(h.y, `x ${x}`).toBeGreaterThan(FACE + FACE_FOOT + HERO.radius - 0.05);
      expect(h.z ?? 0).toBe(0);
    }
  });

  it('takes a hero up both flights onto the bank', () => {
    for (const f of [FLIGHT, STEPS]) {
      const h = stroll(f.x + f.w / 2, FACE + 4.5, 0, -1, 4);
      expect(h.z ?? 0).toBe(1);
      expect(h.y).toBeLessThan(f.y);
    }
  });

  it('builds as a room: the hero joins at the way in, nobody named, the goal counts the one den', () => {
    const run = newRun(landJob('sallow', 3));
    run.index = 1;
    const room = runRoom(run), h = room.join('me');
    room.setIntent(h.id, NO_INTENT);
    for (let i = 0; i < 30; i++) room.step();
    expect(room.map.name).toBe('SALLOW CARR');
    expect(Math.hypot(h.x - 48, h.y - 97)).toBeLessThan(1.5);
    expect(room.allEnemies.some((e) => e.name)).toBe(false);
    expect(room.map.blocks.filter((b) => b.kind === 'den').length).toBe(1);
  });
});
