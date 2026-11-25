/**
 * The Gate Fields (shared/gatefields.ts; docs/design/outside-the-gate.md): the plan is the seed's alone, the shape is as
 * specced, a hero walks in to out by the game's own collide(), each foe kind holds its stretch, the barn is safe ground
 * and the east bank is open but shut by water.
 */
import { describe, expect, it } from 'vitest';
import { collide, useMap, type GameMap } from '../src/shared/arena';
import { GATE_FIELDS } from '../src/shared/gatefields';
import { NOOKS, NOOK_PACKS } from '../src/shared/gatefieldsnooks';
import { knownLand, landJob, territoryPlan, type TerrPlan } from '../src/shared/territory';

const plan = (day = 3): TerrPlan => territoryPlan(landJob('gatefields', day));
// (The road's packs; the nooks' mini bosses are off it: gatefieldsnooks.ts.)
const ys = (p: TerrPlan, f: (r: string | undefined) => boolean) => p.foes.filter((o) => !NOOK_PACKS.includes(o.pack!) && f(o.role ?? o.kind)).map((o) => o.y);
const C = 0.5, R = 0.45;
const EXIT = { x: 38.5, w: 3 };

/** Flood a half-tile grid from `from` with collide() itself; true when the exit's box is reached (or `to`, a cell within `near` of it). */
function reaches(m: GameMap, from: { x: number; y: number }, to?: { x: number; y: number; near: number }): boolean {
  useMap(m);
  const cols = Math.ceil(m.w / C), rows = Math.ceil(m.h / C), seen = new Set<number>(), q: number[] = [];
  const start = Math.floor(from.y / C) * cols + Math.floor(from.x / C);
  seen.add(start), q.push(start);
  for (let h = 0; h < q.length; h++) {
    const s = q[h], i = s % cols, j = (s - i) / cols;
    if (to ? Math.hypot((i + 0.5) * C - to.x, (j + 0.5) * C - to.y) < to.near : (j + 0.5) * C < 1 && (i + 0.5) * C > EXIT.x && (i + 0.5) * C < EXIT.x + EXIT.w) return true;
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

  it('is 84 by 144, one stretch, no gate, six zones south to north', () => {
    const m = plan().map, z = plan().zones;
    expect([m.w, m.h]).toEqual([GATE_FIELDS.w, GATE_FIELDS.h]);
    expect(m.stretches).toHaveLength(1);
    expect(m.blocks.some((b) => b.kind === 'gate') || m.stretches![0].gate !== undefined).toBe(false);
    expect(z.map((o) => o.name)).toEqual(['THE GATE ROAD', 'THE COMMON STRIPS', 'THE FIELD BARN', 'THE ROUGH PASTURE', 'THE CHARCOAL HUT', "THE WOOD'S EDGE"]);
    expect(z.map((o) => o.y)).toEqual([...z.map((o) => o.y)].sort((a, b) => b - a));
  });

  it('can be walked from the way in to the exit, for each seed', () => {
    for (const d of [3, 17, 41]) {
      const p = plan(d);
      expect(reaches(p.map, p.map.hero)).toBe(true);
    }
  });

  it('keeps each kind of foe to its stretch', () => {
    const p = plan(), all = p.foes.filter((o) => !NOOK_PACKS.includes(o.pack!)), roles = new Set(all.map((o) => o.role ?? o.kind));
    for (const r of ['wolf', 'keeper', 'spider', 'nest', 'pouncer', 'forker', 'swingle', 'archer', 'snarer', 'netter']) expect(roles.has(r as never), r).toBe(true);
    for (const y of ys(p, (r) => ['forker', 'swingle', 'thief', 'archer'].includes(r!))) expect(y > 87 && y < 117).toBe(true);
    for (const y of ys(p, (r) => ['wolf', 'keeper', 'pouncer'].includes(r!))) expect(y > 42 && y < 75).toBe(true);
    for (const y of ys(p, (r) => ['spider', 'nest', 'snarer', 'netter'].includes(r!))) expect(y).toBeLessThan(42);
    expect(new Set(all.map((o) => o.pack)).size).toBe(13);
    for (const f of p.foes) expect(f.y, `${f.role ?? f.kind}`).toBeLessThan(112);
    const feeding = all.filter((f) => f.feeding);
    expect(feeding).toHaveLength(2);
    for (const f of feeding) expect(f.y > 42 && f.y < 75).toBe(true);
  });

  it('keeps the way station clear of foes', () => {
    const p = plan(), s = p.map.stations![0];
    expect(s.name).toBe('THE FIELD BARN');
    expect(p.map.braziers.some((b) => Math.hypot(b.x - s.x, b.y - s.y) < s.r && b.wild)).toBe(true);
    for (const f of p.foes) expect(Math.hypot(f.x - s.x, f.y - s.y), `${f.role ?? f.kind}`).toBeGreaterThan(9);
  });

  it('has a second shelter, the charcoal hut, with its keeper, fire and clamp, clear of foes and open at its centre', () => {
    const p = plan(), m = p.map, st = m.stations!;
    expect(st.map((s) => s.name)).toEqual(['THE FIELD BARN', 'THE CHARCOAL HUT']);
    const h = st[1];
    expect(m.npcs!.some((n) => n.talk === 'station:charcoalhut' && n.name === 'KEEPER' && !n.mute && Math.hypot(n.x - h.x, n.y - h.y) < h.r)).toBe(true);
    expect(m.braziers.some((b) => b.wild && Math.hypot(b.x - h.x, b.y - h.y) < h.r)).toBe(true);
    for (const k of ['shack', 'clamp']) expect(m.blocks.some((b) => b.kind === k && Math.hypot(b.x + b.w / 2 - h.x, b.y + b.h / 2 - h.y) < h.r), k).toBe(true);
    for (const s of st) for (const f of p.foes) expect(Math.hypot(f.x - s.x, f.y - s.y), `${s.name} ${f.role ?? f.kind}`).toBeGreaterThan(s.r + 1);
    useMap(m);
    const c = { x: h.x, y: h.y };
    collide(c, R);
    expect(Math.hypot(c.x - h.x, c.y - h.y)).toBeLessThan(0.02);
  });

  it('leaves the east bank open between y 51 and 75, shut by deep water', () => {
    const m = plan().map;
    for (const o of [...m.rounds, ...m.blocks]) {
      const y = o.y + ('h' in o ? o.h / 2 : 0), right = 'r' in o ? o.x + o.r : o.x + o.w;
      if (y > 51 && y < 75) expect(right).toBeLessThan(m.w - 2);
    }
    expect(m.water!.some((w) => w.deep && w.x <= 81.4 && w.x + w.w >= m.w && w.y <= 51 && w.y + w.h >= 75)).toBe(true);
  });

  it('draws each stretch its own country, and the barn has its keeper', () => {
    const m = plan().map, s = m.stations![0];
    expect(m.grounds!.map((g) => [g.look, g.y, g.h])).toEqual([['harvest', 87, 57], ['fallow', 42, 45], ['mossy', 0, 42]]);
    for (const g of m.grounds!) expect([g.x, g.w]).toEqual([0, 84]);
    const kp = m.npcs!.find((n) => n.talk === 'station:fieldbarn')!;
    expect(kp.name).toBe('KEEPER');
    expect(kp.mute).toBeFalsy();
    expect(Math.hypot(kp.x - s.x, kp.y - s.y)).toBeLessThan(s.r);
  });

  it('has the town wall along the south with its gap at the way in, and enough to look at', () => {
    const m = plan().map, walls = m.blocks.filter((b) => b.kind === 'wall');
    expect(walls.length).toBeGreaterThan(8);
    for (const b of walls) expect(b.x + b.w <= 39.51 || b.x >= 44.49).toBe(true);
    expect(walls.some((b) => b.x + b.w > 39) && walls.some((b) => b.x < 45 && b.x >= 44.4)).toBe(true);
    const kinds = new Set(['cross', 'stone', 'well', 'crows', 'sacks', 'scarecrow', 'stump', 'deadtree']);
    const n = m.rounds.filter((r) => kinds.has(r.kind)).length + m.blocks.filter((b) => b.kind === 'cart' || b.kind === 'log').length + m.marks!.length;
    expect(n).toBeGreaterThanOrEqual(14);
  });

  it('is the north fields, with a quiet refugee camp on the gate road and no ploughing', () => {
    const m = plan().map;
    expect(m.name).toBe('THE NORTH FIELDS');
    expect(m.stretches![0].name).toBe('THE NORTH FIELDS');
    const onRoad = (y: number) => y > 117 && y < 144;
    const folk = m.npcs!.filter((n) => n.talk !== 'station:fieldbarn' && onRoad(n.y));
    expect(folk.length).toBeGreaterThanOrEqual(5);
    // Not on the road line (it runs from the way in, x 42, up): at least 1.5 tiles from where the road is laid.
    const line = (m.soil ?? []).filter((q) => q.line && q.mat === 'earth' && onRoad(q.y) || q.line && q.mat === 'earth' && onRoad(q.y + q.h));
    for (const n of folk) {
      expect(Math.hypot(n.x - m.hero.x, n.y - m.hero.y)).toBeGreaterThan(1.5);
      for (const q of line) {
        const dx = q.w, dy = q.h, t = Math.max(0, Math.min(1, ((n.x - q.x) * dx + (n.y - q.y) * dy) / (dx * dx + dy * dy || 1)));
        expect(Math.hypot(q.x + dx * t - n.x, q.y + dy * t - n.y)).toBeGreaterThan(1.5);
      }
    }
    expect(m.blocks.filter((b) => b.kind === 'cart' && onRoad(b.y)).length).toBeGreaterThanOrEqual(4);
    // The watch: three posts, each with its guard, clear of the way in and the gate's gap (x 39.5 to 44.5).
    expect(m.guards).toHaveLength(3);
    for (const p of m.guards!) {
      expect(m.npcs!.some((n) => n.x === p.x && n.y === p.y && n.look === 'guard')).toBe(true);
      expect(Math.hypot(p.x - m.hero.x, p.y - m.hero.y)).toBeGreaterThan(1.5);
      expect(p.y > 138 ? p.x < 39.5 || p.x > 44.5 : Math.abs(p.x - m.hero.x) > 1.5).toBe(true);
    }
    expect(m.blocks.filter((b) => b.kind === 'tent').length).toBeGreaterThanOrEqual(2);
    expect(m.braziers.filter((b) => onRoad(b.y) && b.wild).length).toBeGreaterThanOrEqual(2);
    // (Unploughed but for the one dropped plough's three furrows: gatefieldsstrips.ts.)
    expect(m.soil!.filter((q) => q.mat === 'furrow').length).toBeLessThanOrEqual(3);
    expect(m.soil!.filter((q) => q.mat === 'crop').length).toBeGreaterThan(8);
  });

  it('has the struck pine at the wood\'s edge, solid, and five old stumps beside the clearing\'s', () => {
    const m = plan(3).map, pine = m.blocks.find((b) => b.kind === 'struckpine')!;
    expect(pine).toBeDefined();
    expect(pine.y).toBeLessThan(42);
    expect((m.rounds ?? []).filter((r) => r.kind === 'stump').length).toBeGreaterThanOrEqual(5 + 5);
    useMap(m);
    const p = { x: pine.x + pine.w / 2, y: pine.y + pine.h / 2 };
    collide(p, 0.45);
    expect(Math.hypot(p.x - pine.x - pine.w / 2, p.y - pine.y - pine.h / 2)).toBeGreaterThan(0.2);
  });

  it('has five nooks off the paths, each reached from the way in, each mini boss starting inside its own', () => {
    expect(NOOKS).toHaveLength(5);
    expect(NOOK_PACKS).toHaveLength(2);
    for (const d of [3, 17]) {
      const p = plan(d);
      for (const n of NOOKS) {
        expect(reaches(p.map, p.map.hero, { x: n.x, y: n.y, near: n.r - 1.4 }), `${n.name} day ${d}`).toBe(true);
        const roadNear = (p.map.soil ?? []).some((q) => q.line && q.mat === 'earth' && Math.hypot(q.x - n.x, q.y - n.y) < n.r + 1);
        expect(roadNear, `${n.name} off the paths`).toBe(false);
        if (!n.pack) continue;
        const mine = p.foes.filter((f) => f.pack === n.pack);
        expect(mine.length).toBeGreaterThanOrEqual(3);
        expect(mine.some((f) => f.big || f.elite?.length), n.name).toBe(true);
        for (const f of mine) expect(Math.hypot(f.x - n.x, f.y - n.y), `${n.name} ${f.role}`).toBeLessThan(n.r - 0.5);
        expect(p.chests.some((c) => c.chained && Math.hypot(c.x - n.x, c.y - n.y) < n.r), `${n.name} chest`).toBe(true);
      }
    }
  });
});
