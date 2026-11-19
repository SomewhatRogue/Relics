/**
 * Lowfurrow Fields, map 1: THE FIELDS (shared/lowfurrowfields.ts; docs/design/territories.md, "1. Lowfurrow
 * Fields"; heights by docs/design/elevation.md). Fixed where the spec fixes it, the packs where they belong,
 * the heights all slopes, walked by the game's own collide rules (the walk is tests/territory.test.ts's), the
 * density floors, and the map in a real room.
 */
import { MOUND } from '../src/shared/lowfurrowfieldsland';
import { describe, expect, it } from 'vitest';
import { collide, inArea, levelAt, solid, useMap, type GameMap } from '../src/shared/arena';
import { FIELDS_SPOTS, fieldsPlan, type FieldsPlan } from '../src/shared/lowfurrowfields';
import { landJob, territoryPlan } from '../src/shared/territory';
import { WEST, EAST } from '../src/shared/lowfurrowfieldsland';
import { xAt } from '../src/shared/lowfurrowfieldskit';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';

const R = 0.3, C = 0.5;
const plan = (day = 3) => territoryPlan(landJob('lowfurrow', day), 0) as FieldsPlan;
const zone = (p: FieldsPlan, name: string) => p.zones.find((z) => z.name === name)!;
const inBox = (b: { x: number; y: number; w: number; h: number }, x: number, y: number) => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
const fixed = (p: FieldsPlan) => ({
  hero: p.map.hero, exit: p.map.exit, zones: p.zones, ledges: p.map.ledges, water: p.map.water, name: p.map.name,
  gates: p.map.blocks.filter((b) => b.kind === 'gate'), stretches: p.map.stretches, cages: p.props.filter((q) => q.kind === 'cage'),
  carts: p.map.blocks.filter((b) => b.kind === 'cart' || b.kind === 'haystack'),
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
  /** Reached within a tile of (x, y), at any level. */
  const near = (x: number, y: number, r = 1) => cells.some((c) => Math.hypot(c.x - x, c.y - y) <= r);
  return { cells, minY: Math.min(...cells.map((c) => c.y)), near };
}
const open = (p: FieldsPlan, ...which: number[]) => {
  for (const n of which) p.map.blocks[p.map.stretches![n].gate!].ruined = true;
  return p;
};

describe('THE FIELDS, the plan', () => {
  it('is the same from the same seed, and the seed moves nothing fixed', () => {
    expect(plan(3)).toEqual(plan(3));
    const a = plan(3), b = plan(41);
    expect(fixed(a)).toEqual(fixed(b));
    expect(a.map.rounds).not.toEqual(b.map.rounds);
    expect(fieldsPlan(landJob('lowfurrow', 3)).map.name).toBe('LOWFURROW FIELDS');
    expect(FIELDS_SPOTS).toEqual({ giver: { x: 37.6, y: 90.9 }, ryeGround: { x: 30, y: 52, r: 6 }, hiding: { x: 13, y: 53 }, cage: { x: 66, y: 24 } });
  });

  it('is 96 by 112 in three stretches, both gates gate blocks, the last stretch none', () => {
    const p = plan(), m = p.map, st = m.stretches!;
    expect([m.w, m.h, st.length]).toEqual([96, 112, 3]);
    expect(m.hero).toEqual({ x: 48, y: 109 });
    expect(m.exit).toEqual({ x: 46.5, y: 0, w: 3, h: 0.9 });
    for (const s of st.slice(0, 2)) {
      const g = m.blocks[s.gate!];
      expect(g.kind).toBe('gate');
      expect(s.at!.y).toBeGreaterThanOrEqual(g.y + g.h - 0.01);
      expect(s.check!.y).toBeLessThan(g.y);
    }
    expect(st[2].gate).toBeUndefined();
    expect(st.map((s) => s.packs)).toEqual([[101, 102], [103, 104], []]);
    expect(p.zones.map((z) => [z.name, z.kind, z.stretch])).toEqual([['THE HEADLAND', 'zone', 0], ['THE LONG STRIPS', 'scape', 1], ['THE STOOKS', 'zone', 1], ['THE FAR BANK', 'scape', 2]]);
  });

  it('keeps each pack where it belongs, nobody near the way in, one cage at the rick', () => {
    for (const day of [3, 41]) {
      const p = plan(day), pack = (n: number) => p.foes.filter((f) => f.pack === n);
      for (const [n, name] of [[101, 'THE HEADLAND'], [102, 'THE HEADLAND'], [103, 'THE STOOKS'], [104, 'THE STOOKS']] as const) {
        expect(pack(n).length).toBeGreaterThanOrEqual(2);
        for (const f of pack(n)) expect(inBox(zone(p, name), f.x, f.y)).toBe(true);
      }
      for (const n of [110, 111]) expect(pack(n).length === 2 && pack(n).every((f) => inBox(zone(p, 'THE LONG STRIPS'), f.x, f.y))).toBe(true);
      expect(pack(103).filter((f) => f.bow).length).toBe(1);
      for (const f of p.foes) expect(Math.hypot(f.x - 48, f.y - 109)).toBeGreaterThan(14);
      expect(p.foes.length).toBeGreaterThanOrEqual(18);
      const cages = p.props.filter((q) => q.kind === 'cage');
      expect(cages).toEqual([{ kind: 'cage', x: 66, y: 24 }]);
    }
  });

  it('walks to the exit only through open gates, never past the side hedges, and reaches everything', () => {
    const p = open(plan(), 0, 1), all = walk(p.map, p.map.hero);
    expect(all.cells.some((c) => inArea(p.map.exit!, c.x, c.y))).toBe(true);
    expect(all.cells.every((c) => c.x > xAt(WEST, c.y) - 0.2 && c.x < xAt(EAST, c.y) + 0.2)).toBe(true);
    for (const f of p.foes) expect(all.near(f.x, f.y), `foe ${f.pack} at ${f.x},${f.y}`).toBe(true);
    for (const c of [...p.props.filter((q) => q.kind === 'cage'), ...p.chests]) expect(all.near(c.x, c.y, 1.3), `${c.x},${c.y}`).toBe(true);
    for (const s of [FIELDS_SPOTS.ryeGround, FIELDS_SPOTS.hiding]) expect(all.near(s.x, s.y, 0.6), `${s.x},${s.y}`).toBe(true);
    // The woman behind the cart stands on her spot now (lowfurrowminis.ts): you walk up to her, well inside talking reach.
    expect(all.near(FIELDS_SPOTS.giver.x, FIELDS_SPOTS.giver.y, 1.2), 'the giver').toBe(true);
    expect(walk(plan().map, plan().map.hero).minY).toBeGreaterThan(79);
    expect(walk(open(plan(), 0).map, plan().map.hero).minY).toBeGreaterThan(9.3);
  });

  it('is flat but for one raised area: the bank behind the near hay cart, the archer on its lip', () => {
    const p = plan(), m = p.map, at = (x: number, y: number) => levelAt(m, x, y);
    expect(m.ledges!.length).toBe(1);
    const l = m.ledges![0];
    expect([l.kind, l.lv]).toEqual(['earth', 1]);
    // Ways up are steps (narrow), never a slope along an edge; lower ground is south and east of it.
    for (const q of l.ramps) expect(Math.min(q.w, q.h)).toBeLessThanOrEqual(3);
    expect([at(48, 109), at(30, 90), at(20, 70), at(40, 30), at(66, 24), at(48, 6), at(48, 2)]).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(at(MOUND.x + MOUND.w / 2, MOUND.y + MOUND.h / 2)).toBe(1);
    expect(at(MOUND.x + MOUND.w / 2, MOUND.y + MOUND.h + 1)).toBe(0);
    // Everyone stands on the ground but the one archer of the pack at the cart, who is up on the lip over it.
    const up = p.foes.filter((f) => (f.z ?? 0) > 0);
    expect(up.length).toBe(1);
    expect(up[0].pack).toBe(103), expect(up[0].bow).toBe(true);
    expect(up[0].y).toBeGreaterThan(MOUND.y + MOUND.h - 2);
    // Its back is hedged: bushes along the north edge on top.
    expect(m.rounds.filter((o) => o.x > MOUND.x && o.x < MOUND.x + MOUND.w && Math.abs(o.y - (MOUND.y + 0.5)) < 0.3).length).toBeGreaterThan(8);
  });



  it('keeps the road, the gates and the checkpoints clear', () => {
    for (const day of [3, 41, 77]) {
      const p = open(plan(day), 0, 1), m = p.map;
      useMap(m);
      for (let i = 1; i < p.road.length; i++) {
        const a = p.road[i - 1], b = p.road[i], n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 0.25);
        for (let j = 0; j <= n; j++) {
          const x = a.x + ((b.x - a.x) * j) / n, y = a.y + ((b.y - a.y) * j) / n, q = { x, y, z: levelAt(m, x, y) };
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

  it('is dense: the floors by zone box, and it builds quickly', () => {
    const t0 = performance.now();
    fieldsPlan(landJob('lowfurrow', 1234));
    expect(performance.now() - t0).toBeLessThan(300);
    const p = plan(), m = p.map, things = [...m.rounds, ...m.blocks.map((b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 })), ...m.marks!.map((q) => ({ x: q.x + q.w / 2, y: q.y + q.h / 2 })), ...p.props];
    const n = (name: string) => things.filter((t) => inBox(zone(p, name), t.x, t.y)).length;
    expect(n('THE HEADLAND')).toBeGreaterThanOrEqual(60);
    expect(n('THE STOOKS')).toBeGreaterThanOrEqual(60);
    expect(n('THE LONG STRIPS')).toBeGreaterThanOrEqual(120);
  });
});

describe('THE FIELDS in a room', () => {
  it('builds, the hero joins at the way in, and the cage stays put', () => {
    const run = newRun(landJob('lowfurrow', 3));
    run.party = 1;
    const room = runRoom(run), h = room.join('me');
    room.setIntent(h.id, NO_INTENT);
    expect(room.map.name).toBe('LOWFURROW FIELDS');
    expect(Math.hypot(h.x - 48, h.y - 109)).toBeLessThan(1.5);
    for (let i = 0; i < 30; i++) room.step();
    const cage = room.props.find((q) => q.kind === 'cage')!;
    expect(Math.hypot(cage.x - 66, cage.y - 24)).toBeLessThan(0.3);
  });
});
