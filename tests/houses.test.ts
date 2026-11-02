import { describe, expect, it } from 'vitest';
import { collide, inArea, useMap, type GameMap } from '../src/shared/arena';
import { house, houseSeed } from '../src/shared/houses';
import { runInterior } from '../src/shared/interiors';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { PROPS } from '../src/shared/props';
import { planRoom, type RoomPlan } from '../src/shared/terrain';
import { HERO } from '../src/shared/tuning';

const job = (seed: number, kind: Job['place']['kind'] = 'farm', objective: Job['objective'] = 'hunt', ruin = 1): Job =>
  ({ ...board(1)[0], rooms: 3, place: { ...PLACES.find((p) => p.kind === kind)!, ruin }, objective, seed });
const layout = (p: RoomPlan) => JSON.stringify({ w: p.map.w, h: p.map.h, f: p.map.theme.floor, b: p.map.blocks, r: p.map.rounds, p: p.props });

/**
 * Where a hero can walk from the door: a flood over a fine grid, a cell open if the map's own collision
 * leaves a hero standing there untouched and no heavy furniture (a table, a barrel, a cage) is in the way.
 */
function walkable(plan: RoomPlan) {
  const m: GameMap = plan.map, r = HERO.radius, step = 0.2;
  useMap(m);
  const heavy = plan.props.filter((q) => q.kind !== 'plank' && q.kind !== 'stave');
  const open = (x: number, y: number) => {
    const q = { x, y };
    collide(q, r);
    return Math.hypot(q.x - x, q.y - y) < 1e-6 && heavy.every((h) => Math.hypot(h.x - x, h.y - y) >= PROPS[h.kind].radius + r);
  };
  const cols = Math.floor(m.w / step), rows = Math.floor(m.h / step), seen = new Set<number>(), cell = (i: number, j: number) => ({ x: (i + 0.5) * step, y: (j + 0.5) * step });
  let all = 0;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) if (open(cell(i, j).x, cell(i, j).y)) all++;
  const start = [Math.floor(m.hero.x / step), Math.floor(m.hero.y / step)], todo = [start];
  seen.add(start[0] * 1000 + start[1]);
  while (todo.length) {
    const [i, j] = todo.pop()!;
    for (const [a, c] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      if (a < 0 || c < 0 || a >= cols || c >= rows || seen.has(a * 1000 + c)) continue;
      const at = cell(a, c);
      if (open(at.x, at.y)) seen.add(a * 1000 + c), todo.push([a, c]);
    }
  }
  const reach = (x: number, y: number, d: number) => [...seen].some((k) => {
    const at = cell(Math.floor(k / 1000), k % 1000);
    return Math.hypot(at.x - x, at.y - y) <= d;
  });
  return { all, reached: seen.size, reach, open };
}

describe('houses on a job', () => {
  it('differ from seed to seed, inside and out, and the same seed makes the same house', () => {
    expect(layout(runInterior(job(11), 0, 2, 'cottage'))).not.toBe(layout(runInterior(job(12), 0, 2, 'cottage')));
    expect(layout(runInterior(job(11), 0, 2, 'cottage'))).toBe(layout(runInterior(job(11), 0, 2, 'cottage')));
    const kinds = new Set<string>(), barns = new Set<string>(), looks = new Set<string>(), floors = new Set<string>(), names = new Set<string>();
    for (let s = 1; s <= 80; s++) {
      kinds.add(house(s, 'cottage').kind), barns.add(house(s, 'barn').kind);
      const h = house(s, 'cottage');
      looks.add(`${h.roof}${h.thatch}${h.leanTo}${h.broken}`);
      const p = runInterior(job(s), 1, 3, 'cottage');
      floors.add(p.map.theme.floor), names.add(p.map.name);
    }
    expect(kinds.size).toBe(6);
    expect(barns.size).toBe(2);
    expect(looks.size).toBeGreaterThan(12);
    expect(floors).toEqual(new Set(['planks', 'dirt', 'flagstone']));
    expect(names.size).toBeGreaterThanOrEqual(4);
  });

  it('look outside like what they are inside: the street tags each door with the seed its inside uses', () => {
    for (const s of [3, 41, 97]) {
      const j = job(s, 'village'), plan = planRoom(j, 1);
      const doors = plan.map.blocks.map((b, i) => [b, i] as const).filter(([b]) => b.door);
      expect(doors.length).toBeGreaterThan(0);
      for (const [b, i] of doors) {
        expect(b.look).toBe(houseSeed(j, 1, i));
        expect([b.w, b.h]).toEqual([3.5, 2]);
        const inside = runInterior(j, 1, i, b.door!), home = house(b.look!, b.door!);
        // A lit house outside has its fire going inside.
        expect(inside.map.torches.length > 0).toBe(home.lit && !!inside.map.blocks.some((q) => q.kind === 'hearth'));
      }
    }
  });

  it('every layout leaves the door clear and a way to everyone and everything in it', () => {
    let sleepers = 0, feeders = 0, empty = 0, butchers = 0;
    for (let s = 1; s <= 120; s++) for (const door of ['cottage', 'barn']) {
      const j = job(s * 7 + 3, 'farm', s % 5 ? 'hunt' : 'rescue', s % 4), plan = runInterior(j, s % 3, s % 4, door), m = plan.map;
      const w = walkable(plan), where = `${door} seed ${j.seed}: ${house(houseSeed(j, s % 3, s % 4), door).kind}`;
      // The way in and out: you stand clear in the doorway, and the exit is right there.
      expect(w.open(m.hero.x, m.hero.y), where).toBe(true);
      expect(inArea(m.exit, m.w / 2, m.h - 0.3), where).toBe(true);
      expect(w.reach(m.w / 2, m.h - 0.8, 0.3), where).toBe(true);
      // Most of the floor is one walkable space (no shut-off rooms).
      expect(w.reached / w.all, where).toBeGreaterThan(0.85);
      // Every goblin, every cage, every body can be got at.
      for (const f of plan.foes) expect(w.reach(f.x, f.y, 0.9), `${where}: ${f.kind} at ${f.x.toFixed(1)},${f.y.toFixed(1)}`).toBe(true);
      for (const q of plan.props.filter((q) => q.kind === 'cage')) expect(w.reach(q.x, q.y, 1.2), `${where}: cage`).toBe(true);
      for (const n of m.npcs ?? []) expect(w.reach(n.x, n.y, 1), `${where}: body`).toBe(true);
      // The fire, if lit, is in a hearth.
      for (const t of m.torches) expect(m.blocks.some((q) => q.kind === 'hearth' && q.look === 2 && inArea(q, t.x, t.y)), where).toBe(true);
      sleepers += m.sleepers?.length ?? 0;
      feeders += plan.foes.filter((f) => f.feeding && !m.sleepers?.some((q) => q.x === f.x && q.y === f.y)).length;
      butchers += plan.foes.filter((f) => f.kind === 'butcher').length;
      if (!plan.foes.length) empty++;
    }
    expect(sleepers).toBeGreaterThan(10);
    expect(feeders).toBeGreaterThan(5);
    expect(empty).toBeGreaterThan(10);
    expect(butchers).toBeGreaterThan(0);
  });
});
