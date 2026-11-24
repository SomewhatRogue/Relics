/**
 * The Gate Fields (shared/gatefields.ts; docs/design/outside-the-gate.md): the plan is the seed's alone, the shape is as
 * specced, a hero walks in to out by the game's own collide(), each foe kind holds its stretch, the barn is safe ground
 * and the east bank is open but shut by water.
 */
import { describe, expect, it } from 'vitest';
import { collide, useMap, type GameMap } from '../src/shared/arena';
import { GATE_FIELDS } from '../src/shared/gatefields';
import { knownLand, landJob, territoryPlan, type TerrPlan } from '../src/shared/territory';

const plan = (day = 3): TerrPlan => territoryPlan(landJob('gatefields', day));
const ys = (p: TerrPlan, f: (r: string | undefined) => boolean) => p.foes.filter((o) => f(o.role ?? o.kind)).map((o) => o.y);
const C = 0.5, R = 0.45;
const EXIT = { x: 26.5, w: 3 };

/** Flood a half-tile grid from `from` with collide() itself; true when the exit's box is reached. */
function reaches(m: GameMap, from: { x: number; y: number }): boolean {
  useMap(m);
  const cols = Math.ceil(m.w / C), rows = Math.ceil(m.h / C), seen = new Set<number>(), q: number[] = [];
  const start = Math.floor(from.y / C) * cols + Math.floor(from.x / C);
  seen.add(start), q.push(start);
  for (let h = 0; h < q.length; h++) {
    const s = q[h], i = s % cols, j = (s - i) / cols;
    if ((j + 0.5) * C < 1 && (i + 0.5) * C > EXIT.x && (i + 0.5) * C < EXIT.x + EXIT.w) return true;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj, n = nj * cols + ni;
      if (ni < 0 || nj < 0 || ni >= cols || nj >= rows || seen.has(n)) continue;
      const x = (ni + 0.5) * C, y = (nj + 0.5) * C, p = { x, y };
      collide(p, R);
      if (Math.hypot(p.x - x, p.y - y) > 0.02) continue;
      seen.add(n), q.push(n);
    }
  }
  return false;
}

describe('the Gate Fields', () => {
  it('builds for three seeds and is the same twice for one', () => {
    for (const d of [3, 17, 41]) expect(plan(d).foes.length).toBeGreaterThan(20);
    expect(plan(3)).toEqual(plan(3));
    expect(plan(3).map.soil).not.toEqual(plan(41).map.soil);
    expect(knownLand('gatefields')).toBe(true);
  });

  it('is 56 by 96, one stretch, no gate, five zones south to north', () => {
    const m = plan().map, z = plan().zones;
    expect([m.w, m.h]).toEqual([GATE_FIELDS.w, GATE_FIELDS.h]);
    expect(m.stretches).toHaveLength(1);
    expect(m.blocks.some((b) => b.kind === 'gate') || m.stretches![0].gate !== undefined).toBe(false);
    expect(z.map((o) => o.name)).toEqual(['THE GATE ROAD', 'THE COMMON STRIPS', 'THE FIELD BARN', 'THE ROUGH PASTURE', "THE WOOD'S EDGE"]);
    expect(z.map((o) => o.y)).toEqual([...z.map((o) => o.y)].sort((a, b) => b - a));
  });

  it('can be walked from the way in to the exit, for each seed', () => {
    for (const d of [3, 17, 41]) {
      const p = plan(d);
      expect(reaches(p.map, p.map.hero)).toBe(true);
    }
  });

  it('keeps each kind of foe to its stretch', () => {
    const p = plan(), all = p.foes, roles = new Set(all.map((o) => o.role ?? o.kind));
    for (const r of ['wolf', 'keeper', 'spider', 'nest', 'pouncer', 'forker', 'swingle', 'archer', 'snarer', 'netter']) expect(roles.has(r as never), r).toBe(true);
    for (const y of ys(p, (r) => ['forker', 'swingle', 'thief', 'archer'].includes(r!))) expect(y > 58 && y < 68).toBe(true);
    for (const y of ys(p, (r) => ['wolf', 'keeper', 'pouncer'].includes(r!))) expect(y > 28 && y < 50).toBe(true);
    for (const y of ys(p, (r) => ['spider', 'nest', 'snarer', 'netter'].includes(r!))) expect(y).toBeLessThan(28);
    expect(new Set(all.map((o) => o.pack)).size).toBe(8);
    for (const f of all) expect(f.y, `${f.role ?? f.kind}`).toBeLessThan(68);
    const feeding = all.filter((f) => f.feeding);
    expect(feeding).toHaveLength(2);
    for (const f of feeding) expect(f.y > 28 && f.y < 50).toBe(true);
  });

  it('keeps the way station clear of foes', () => {
    const p = plan(), s = p.map.stations![0];
    expect(s.name).toBe('THE FIELD BARN');
    expect(p.map.braziers.some((b) => Math.hypot(b.x - s.x, b.y - s.y) < s.r && b.wild)).toBe(true);
    for (const f of p.foes) expect(Math.hypot(f.x - s.x, f.y - s.y), `${f.role ?? f.kind}`).toBeGreaterThan(9);
  });

  it('leaves the east bank open between y 34 and 50, shut by deep water', () => {
    const m = plan().map;
    for (const o of [...m.rounds, ...m.blocks]) {
      const y = o.y + ('h' in o ? o.h / 2 : 0), right = 'r' in o ? o.x + o.r : o.x + o.w;
      if (y > 34 && y < 50) expect(right).toBeLessThan(m.w - 2);
    }
    expect(m.water!.some((w) => w.deep && w.x <= 53.4 && w.x + w.w >= m.w && w.y <= 34 && w.y + w.h >= 50)).toBe(true);
  });

  it('draws each stretch its own country, and the barn has its keeper', () => {
    const m = plan().map, s = m.stations![0];
    expect(m.grounds!.map((g) => [g.look, g.y, g.h])).toEqual([['harvest', 58, 38], ['fallow', 28, 30], ['mossy', 0, 28]]);
    for (const g of m.grounds!) expect([g.x, g.w]).toEqual([0, 56]);
    const kp = m.npcs!.find((n) => n.talk === 'station:fieldbarn')!;
    expect(kp.name).toBe('');
    expect(Math.hypot(kp.x - s.x, kp.y - s.y)).toBeLessThan(s.r);
  });

  it('has the town wall along the south with its gap at the way in, and enough to look at', () => {
    const m = plan().map, walls = m.blocks.filter((b) => b.kind === 'wall');
    expect(walls.length).toBeGreaterThan(8);
    for (const b of walls) expect(b.x + b.w <= 25.51 || b.x >= 30.49).toBe(true);
    expect(walls.some((b) => b.x + b.w > 25) && walls.some((b) => b.x < 31 && b.x >= 30.4)).toBe(true);
    const kinds = new Set(['cross', 'stone', 'well', 'crows', 'sacks', 'scarecrow', 'stump', 'deadtree']);
    const n = m.rounds.filter((r) => kinds.has(r.kind)).length + m.blocks.filter((b) => b.kind === 'cart' || b.kind === 'log').length + m.marks!.length;
    expect(n).toBeGreaterThanOrEqual(14);
  });

  it('is the north fields, with a quiet refugee camp on the gate road and no ploughing', () => {
    const m = plan().map;
    expect(m.name).toBe('THE NORTH FIELDS');
    expect(m.stretches![0].name).toBe('THE NORTH FIELDS');
    const onRoad = (y: number) => y > 78 && y < 96;
    const folk = m.npcs!.filter((n) => n.talk !== 'station:fieldbarn' && onRoad(n.y));
    expect(folk.length).toBeGreaterThanOrEqual(5);
    // Not on the road line (it runs from the way in, x 28, up): at least 1.5 tiles from where the road is laid.
    const line = (m.soil ?? []).filter((q) => q.line && q.mat === 'earth' && onRoad(q.y) || q.line && q.mat === 'earth' && onRoad(q.y + q.h));
    for (const n of folk) {
      expect(Math.hypot(n.x - m.hero.x, n.y - m.hero.y)).toBeGreaterThan(1.5);
      for (const q of line) {
        const dx = q.w, dy = q.h, t = Math.max(0, Math.min(1, ((n.x - q.x) * dx + (n.y - q.y) * dy) / (dx * dx + dy * dy || 1)));
        expect(Math.hypot(q.x + dx * t - n.x, q.y + dy * t - n.y)).toBeGreaterThan(1.5);
      }
    }
    expect(m.blocks.filter((b) => b.kind === 'cart' && onRoad(b.y)).length).toBeGreaterThanOrEqual(4);
    expect(m.blocks.filter((b) => b.kind === 'tent').length).toBeGreaterThanOrEqual(2);
    expect(m.braziers.filter((b) => onRoad(b.y) && b.wild).length).toBeGreaterThanOrEqual(2);
    expect(m.soil!.some((q) => q.mat === 'furrow')).toBe(false);
    expect(m.soil!.filter((q) => q.mat === 'crop').length).toBeGreaterThan(8);
  });
});
