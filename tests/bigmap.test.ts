import { describe, expect, it } from 'vitest';
import { bigPlan } from '../src/shared/bigmap';
import { collide, useMap } from '../src/shared/arena';
import { SLEEP } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { nearPairs } from '../src/sim/pairgrid';
import { Rng } from '../src/shared/rng';
import { NO_INTENT } from '../src/sim/types';
import { walkable } from './walk';

describe('the big map (load test)', () => {
  it('one seed gives the same map and goblins twice; another seed a different one', () => {
    const a = bigPlan(3, 300), b = bigPlan(3, 300), c = bigPlan(4, 300);
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    expect(JSON.stringify(c.map)).not.toBe(JSON.stringify(a.map));
    expect(a.map.w * a.map.h).toBeGreaterThan(8 * 28 * 24);
    expect(a.foes).toHaveLength(300);
    expect(a.kinds).toContain('camp');
  });

  it('can be walked from the way in to every goblin', () => {
    const p = bigPlan(3, 120), w = walkable({ map: p.map, foes: p.foes, props: [], chests: [] });
    expect(p.foes.filter((f) => !w.reach(f.x, f.y, 1.2))).toEqual([]);
  });

  it('keeps bodies out of walls the same with the near-only lookup as checking the lot', () => {
    const p = bigPlan(5, 0), rng = new Rng(9);
    useMap(p.map);
    for (let i = 0; i < 400; i++) {
      const at = { x: rng.range(0, p.map.w), y: rng.range(0, p.map.h) }, q = { ...at }, r = { ...at };
      collide(q, 0.4);
      brute(p.map, r, 0.4);
      expect([q.x, q.y]).toEqual([r.x, r.y]);
    }
  });

  it('finds the same near pairs as checking every pair', () => {
    const rng = new Rng(2), n = 300, xs = new Float64Array(n), ys = new Float64Array(n);
    for (let i = 0; i < n; i++) (xs[i] = rng.range(0, 40)), (ys[i] = rng.range(0, 30));
    const got: string[] = [], want: string[] = [];
    nearPairs(xs, ys, n, 2.5, (i, j) => Math.hypot(xs[i] - xs[j], ys[i] - ys[j]) < 2.4 && got.push(i + ':' + j));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.hypot(xs[i] - xs[j], ys[i] - ys[j]) < 2.4) want.push(i + ':' + j);
    expect(got).toEqual(want);
  });

  it('far goblins doze where they stand, and wake when a hero comes near', () => {
    const p = bigPlan(3, 0);
    p.map.rounds = [];
    p.map.blocks = [];
    const far = { kind: 'scrapper' as const, x: p.map.hero.x, y: p.map.hero.y - SLEEP.doze - 6 };
    const room = new ArenaRoom(1, { map: p.map, foes: [far, { kind: 'scrapper', x: p.map.hero.x + 3, y: p.map.hero.y - 3 }], sleep: true });
    const h = room.join('a');
    room.setIntent('a', NO_INTENT);
    for (let i = 0; i < 90; i++) room.step();
    const [g, near] = room.enemies;
    expect(g.dozing).toBe(true);
    expect([g.x, g.y]).toEqual([far.x, far.y]);
    // The near one saw the hero and came on.
    expect(near.dozing).toBe(false);
    expect(near.alert).toBe(true);
    // Walk up to it (put the hero just inside its sight): it wakes, sees, and comes.
    Object.assign(h, { x: g.x, y: g.y + 4 });
    for (let i = 0; i < 30; i++) room.step();
    expect(g.dozing).toBe(false);
    expect(g.alert).toBe(true);
    expect(Math.hypot(g.x - far.x, g.y - far.y)).toBeGreaterThan(0.3);
    // The hero goes far off again: it holds where it got to.
    Object.assign(h, { x: p.map.hero.x, y: p.map.hero.y });
    room.step();
    const at = [g.x, g.y];
    for (let i = 0; i < 30; i++) room.step();
    expect(g.dozing).toBe(true);
    expect([g.x, g.y]).toEqual(at);
    // The room keeps its goblins in their order through all of it.
    expect(room.enemies.map((e) => e.id)).toEqual([1, 2]);
  });
});

/** Every round and block, in the map's order, as collide did before the lookup. */
function brute(m: ReturnType<typeof bigPlan>['map'], p: { x: number; y: number }, r: number): void {
  p.x = Math.max(r, Math.min(m.w - r, p.x));
  p.y = Math.max(r * 0.6, Math.min(m.h - r, p.y));
  for (const c of [...m.rounds, ...m.braziers]) {
    const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy), min = c.r + r;
    if (d < min && d > 1e-6) (p.x = c.x + (dx / d) * min), (p.y = c.y + (dy / d) * min);
  }
  for (const b of m.blocks) {
    if (b.ruined) continue;
    const nx = Math.max(b.x, Math.min(b.x + b.w, p.x)), ny = Math.max(b.y, Math.min(b.y + b.h, p.y));
    const dx = p.x - nx, dy = p.y - ny, d = Math.hypot(dx, dy);
    if (d >= r) continue;
    if (d > 1e-6) (p.x = nx + (dx / d) * r), (p.y = ny + (dy / d) * r);
    else {
      const left = p.x - b.x, right = b.x + b.w - p.x, top = p.y - b.y, bottom = b.y + b.h - p.y, k = Math.min(left, right, top, bottom);
      if (k === left) p.x = b.x - r;
      else if (k === right) p.x = b.x + b.w + r;
      else if (k === top) p.y = b.y - r;
      else p.y = b.y + b.h + r;
    }
  }
}
