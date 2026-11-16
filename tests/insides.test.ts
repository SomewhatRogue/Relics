import { afterEach, describe, expect, it } from 'vitest';
import { collide, useMap, type GameMap } from '../src/shared/arena';
import { townInterior } from '../src/shared/interiors';
import { hall, infirmary } from '../src/shared/townhalls';
import { bigSeat } from '../src/shared/bighalls';
import { ARM_TABLE, KNIFE_LINE, ANVIL } from '../src/shared/pastimes';
import { LAYOUT } from '../src/shared/town';
import { newWorld } from '../src/shared/story';
import { inArea } from '../src/shared/arena';
import { runInterior } from '../src/shared/interiors';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { walkable as walkPlan } from './walk';

const DOORS = ['church', 'hall', 'townhall', 'tavern', 'forge', 'infirmary'];
const world = () => ({ ...newWorld(), rescued: 3 });
const big = (door: string) => {
  LAYOUT.on = true;
  const m = townInterior(door, world());
  LAYOUT.on = false;
  return m;
};
const old = (door: string) => hall(door) ?? infirmary(['AMOS', 'LETTY', 'CORIN'], 3);
const who = (m: GameMap) => (m.npcs ?? []).filter((n) => !n.mute).map((n) => [n.name, n.talk, n.look, n.arg ?? null, n.reach ?? null].join('|')).sort();

/** Where a body can walk to from where you come in, on a quarter-tile grid. */
function walkable(m: GameMap) {
  useMap(m);
  const C = 0.25, cols = Math.ceil(m.w / C), rows = Math.ceil(m.h / C), ok = new Uint8Array(cols * rows);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = (i + 0.5) * C, y = (j + 0.5) * C, p = { x, y };
    collide(p, 0.32);
    if (Math.hypot(p.x - x, p.y - y) < 0.02) ok[j * cols + i] = 1;
  }
  const seen = new Uint8Array(cols * rows), at = (x: number, y: number) => Math.floor(y / C) * cols + Math.floor(x / C), q = [at(m.hero.x, m.hero.y)];
  seen[q[0]] = 1;
  for (let h = 0; h < q.length; h++) {
    const c = q[h], i = c % cols, j = (c / cols) | 0;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = (j + dj) * cols + i + di;
      if (i + di < 0 || j + dj < 0 || i + di >= cols || j + dj >= rows || seen[k] || !ok[k]) continue;
      seen[k] = 1, q.push(k);
    }
  }
  return (x: number, y: number, r: number) => {
    for (let j = Math.floor((y - r) / C); j <= Math.floor((y + r) / C); j++) for (let i = Math.floor((x - r) / C); i <= Math.floor((x + r) / C); i++)
      if (i >= 0 && j >= 0 && i < cols && j < rows && seen[j * cols + i] && Math.hypot((i + 0.5) * C - x, (j + 0.5) * C - y) <= r) return true;
    return false;
  };
}

describe('the new look\'s insides', () => {
  afterEach(() => void (LAYOUT.on = false));

  it('are today\'s rooms until a screen asks for the new town', () => {
    for (const d of DOORS) expect(townInterior(d, world()).w).toBe(old(d).w);
  });

  it('are bigger, with tall walls, and keep every person with their words, looks and trades', () => {
    for (const d of DOORS) {
      const m = big(d), o = old(d);
      expect(m.name).toBe(o.name);
      expect(m.w * m.h).toBeGreaterThan(o.w * o.h * 2.5);
      expect(m.wallH).toBeGreaterThanOrEqual(5);
      expect(who(m)).toEqual(who(o));
    }
  });

  it('let you reach everyone and the way out from the door', () => {
    for (const d of DOORS) {
      const m = big(d), near = walkable(m);
      for (const n of m.npcs ?? []) if (!n.mute) expect(near(n.x, n.y, 1.1 + (n.reach ?? 0)), `${m.name}: ${n.name}`).toBe(true);
      expect(near(m.exit!.x + m.exit!.w / 2, m.exit!.y, 0.6), m.name).toBe(true);
    }
  });

  it('move the pastimes\' seats with their tables, and keep them free to sit at', () => {
    for (const [door, id, seat] of [['tavern', 'arm', ARM_TABLE.seat], ['tavern', 'knives', KNIFE_LINE.seat], ['forge', 'anvil', ANVIL.seat]] as const) {
      const m = big(door), [x, y] = bigSeat(id, seat), near = walkable(m);
      expect(near(x, y, 0.3), `${id} at ${x}, ${y}`).toBe(true);
    }
    const rat = big('tavern'), table = rat.blocks.find((b) => b.kind === 'armtable')!, [sx, sy] = bigSeat('arm', ARM_TABLE.seat);
    expect([+(sx - table.x).toFixed(2), +(sy - table.y).toFixed(2)]).toEqual([+(ARM_TABLE.seat[0] - ARM_TABLE.table.x).toFixed(2), +(ARM_TABLE.seat[1] - ARM_TABLE.table.y).toFixed(2)]);
  });
});

const job = (seed: number, objective: Job['objective'], ruin: number): Job =>
  ({ ...board(1)[0], layout: undefined, rooms: 3, place: { ...PLACES.find((p) => p.kind === 'farm')!, ruin }, objective, seed });

describe('houses on a job, in the new look', () => {
  afterEach(() => void (LAYOUT.on = false));

  it('grow, rise, and still let you get at everyone and everything in them from the door', () => {
    const seen = new Set<string>();
    for (let s = 1; s <= 120; s++) for (const door of ['cottage', 'barn']) {
      const j = job(s * 7 + 3, s % 5 ? 'hunt' : 'rescue', s % 4);
      LAYOUT.on = false;
      const before = runInterior(j, s % 3, s % 4, door).map;
      LAYOUT.on = true;
      const plan = runInterior(j, s % 3, s % 4, door), m = plan.map, w = walkPlan(plan), where = `${door} seed ${j.seed}: ${m.name}`;
      seen.add(m.name);
      expect(m.w, where).toBeCloseTo(before.w * (before.w > 15 ? 1.35 : 1.6));
      expect(m.w, where).toBeLessThanOrEqual(30);
      expect(m.wallH, where).toBeGreaterThanOrEqual(4.5);
      expect(w.open(m.hero.x, m.hero.y), where).toBe(true);
      expect(inArea(m.exit, m.w / 2, m.h - 0.3), where).toBe(true);
      expect(w.reached / w.all, where).toBeGreaterThan(0.85);
      for (const f of plan.foes) expect(w.reach(f.x, f.y, 0.9), `${where}: ${f.kind}`).toBe(true);
      for (const q of plan.props.filter((q) => q.kind === 'cage')) expect(w.reach(q.x, q.y, 1.2), `${where}: cage`).toBe(true);
      for (const q of plan.chests) expect(w.reach(q.x, q.y, 1.2), `${where}: chest`).toBe(true);
      for (const n of m.npcs ?? []) expect(w.reach(n.x, n.y, 1), `${where}: body`).toBe(true);
      for (const t of m.torches) expect(m.blocks.some((q) => q.kind === 'hearth' && q.look === 2 && inArea(q, t.x, t.y)), where).toBe(true);
    }
    expect(seen.size).toBeGreaterThan(6);
  });
});
