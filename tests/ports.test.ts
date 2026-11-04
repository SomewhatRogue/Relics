/** Layout 3's rooms (slices 2 to 4): ways on by every side, side ways, the dread's edges, goblins finding their way. */
import { describe, expect, it } from 'vitest';
import { collide, doorAt, useMap, type GameMap } from '../src/shared/arena';
import { runInterior } from '../src/shared/interiors';
import { PLACES, SEWERS, board, type Job } from '../src/shared/jobs';
import { sideOfArea, type Side } from '../src/shared/ports';
import { outOfBounds, reachable } from '../src/shared/reach';
import { routeOf } from '../src/shared/route';
import { planRoom, type RoadId, type RoomPlan } from '../src/shared/terrain';
import { wayTo } from '../src/sim/pathing';
import { walkable } from './walk';

const ALL = [...PLACES, SEWERS];
const job = (place: (typeof ALL)[number], seed: number, o: Partial<Job> = {}): Job => ({ ...board(1)[1], place, rooms: 5, seed, objective: 'hunt', layout: 3, ...o });
const mid = (a: { x: number; y: number; w: number; h: number }) => ({ x: a.x + a.w / 2, y: a.y + a.h / 2 });

/** Every room of a job down one road: the plan, and the road taken into it. */
function rooms(j: Job, took: 'h' | 'l'): { plan: RoomPlan; i: number }[] {
  const r = routeOf(j, took), f = r.findIndex((x) => x.outs!.length === 2), road: RoadId = took === 'l' ? 'low' : 'high';
  return r.map((_, i) => {
    const taken: Record<number, RoadId> = f >= 0 && i > f ? { [f + 1]: road } : {};
    return { plan: planRoom(j, i, taken[i], taken), i };
  });
}

describe('layout 3: rooms', () => {
  it('every way on, by every side, and every side way can be walked to from the way in', () => {
    const sides = new Map<Side, number>(), gaps = new Map<Side, number>();
    for (const place of ALL) for (let s = 1; s <= 4; s++) for (const took of ['h', 'l'] as const) for (const { plan, i } of rooms(job(place, s * 29 + 3), took)) {
      const m = plan.map, w = walkable(plan), where = `${place.name} ${s} ${took} room ${i}`;
      expect(w.open(m.hero.x, m.hero.y), where).toBe(true);
      for (const a of m.exit ? [m.exit] : m.roads!.map((q) => q.area)) {
        const side = sideOfArea(a, m.w, m.h)!;
        sides.set(side, (sides.get(side) ?? 0) + 1);
        expect(w.reach(mid(a).x, mid(a).y, 1.2), `${where}: out by ${side}`).toBe(true);
      }
      for (const b of m.blocks.filter((q) => q.kind === 'sideway')) {
        gaps.set(b.face!, (gaps.get(b.face!) ?? 0) + 1);
        expect(w.reach(doorAt(b).x, doorAt(b).y, 1), `${where}: side way ${b.face}`).toBe(true);
      }
      for (const f of plan.foes) if (!f.z) expect(w.reach(f.x, f.y, 1.2), `${where}: ${f.kind}`).toBe(true);
      for (const c of plan.chests) expect(w.reach(c.x, c.y, 1.3), `${where}: chest`).toBe(true);
      for (const b of m.blocks) if (b.door && b.kind !== 'sideway') expect(w.reach(doorAt(b).x, doorAt(b).y, 1), `${where}: ${b.kind} door`).toBe(true);
      expect(w.reached / w.all, where).toBeGreaterThan(0.6);
    }
    for (const s of ['N', 'E', 'W'] as Side[]) expect(sides.get(s) ?? 0, `out by ${s}`).toBeGreaterThan(20);
    for (const s of ['E', 'W', 'S'] as Side[]) expect(gaps.get(s) ?? 0, `side way ${s}`).toBeGreaterThan(3);
  }, 240000);

  it("the dread's reach: the ways in, on and through are in bounds; just past them, out", () => {
    for (const place of ALL) for (let s = 1; s <= 3; s++) for (const { plan } of rooms(job(place, s * 41), 'l')) {
      const m = plan.map;
      const ways = [...(m.exit ? [m.exit] : m.roads!.map((q) => q.area)), ...m.blocks.filter((b) => b.kind === 'sideway')];
      expect(outOfBounds(m, m.hero.x, m.hero.y), place.name).toBe(false);
      for (const a of ways) {
        const side = sideOfArea(a, m.w, m.h) ?? (a as { face?: Side }).face!, c = mid(a);
        // Standing in the way on (a side way's door spot, in front of its gap), and the edge just past it.
        const at = 'face' in a && a.face ? doorAt(a as never) : side === 'N' ? { x: c.x, y: 0.5 } : side === 'S' ? { x: c.x, y: m.h - 0.5 } : side === 'W' ? { x: 0.5, y: c.y } : { x: m.w - 0.5, y: c.y };
        expect(reachable(m, at.x, at.y), `${place.name} ${side}`).toBe(true);
        expect(outOfBounds(m, at.x, at.y), `${place.name} ${side}`).toBe(false);
        const past = side === 'N' ? { x: c.x, y: -0.2 } : side === 'S' ? { x: c.x, y: m.h + 0.2 } : side === 'W' ? { x: -0.2, y: c.y } : { x: m.w + 0.2, y: c.y };
        expect(outOfBounds(m, past.x, past.y), `${place.name} past ${side}`).toBe(true);
      }
    }
  }, 120000);

  it('a side way leads to its dead end and back: a chest, its one thing, and the way back where you came in', () => {
    const caches = new Set<string>();
    for (const place of ALL) for (let s = 1; s <= 10; s++) for (const { plan, i } of rooms(job(place, s * 13 + 1), 'h')) for (const b of plan.map.blocks.filter((q) => q.kind === 'sideway')) {
      const j = job(place, s * 13 + 1), side = runInterior(j, i, plan.map.blocks.indexOf(b), b.door!), m = side.map, w = walkable(side), where = `${place.name} ${s} room ${i} ${b.door}`;
      caches.add(b.door!.split(':')[3]);
      expect(w.open(m.hero.x, m.hero.y), where).toBe(true);
      expect(w.reach(mid(m.exit!).x, mid(m.exit!).y, 1.2), where).toBe(true);
      // You came in going one way: the way back is on the side facing it.
      expect(sideOfArea(m.exit!, m.w, m.h), where).toBe({ W: 'E', E: 'W', S: 'N', N: 'S' }[b.face!]);
      expect(side.chests.length, where).toBe(1);
      for (const c of side.chests) expect(w.reach(c.x, c.y, 1.4), `${where}: chest`).toBe(true);
      for (const q of side.props.filter((p) => p.kind === 'cage')) expect(w.reach(q.x, q.y, 1.4), `${where}: cage`).toBe(true);
      for (const f of side.foes) expect(w.reach(f.x, f.y, 1.3), `${where}: ${f.kind}`).toBe(true);
      if (b.door!.includes(':captive:')) expect(side.props.some((p) => p.kind === 'cage'), where).toBe(true);
      // The same on every screen.
      expect(JSON.stringify(runInterior(j, i, plan.map.blocks.indexOf(b), b.door!))).toBe(JSON.stringify(side));
    }
    expect([...caches].sort()).toEqual(['captive', 'nest', 'oil', 'shrine']);
  }, 120000);

  it('both roads finish: each comes round into the same place and on to the heart and its way home', () => {
    for (const place of ALL) for (let s = 1; s <= 4; s++) {
      const j = job(place, s * 3 + 1, { objective: 'rescue' }), hi = rooms(j, 'h'), lo = rooms(j, 'l');
      const last = (x: typeof hi) => x[x.length - 1].plan;
      for (const r of [last(hi), last(lo)]) {
        expect(r.map.exit, place.name).toEqual({ x: 13, y: 0, w: 2, h: 0.9 });
        expect(r.props.filter((p) => p.kind === 'cage').length, place.name).toBe(2);
      }
      // The heart's landmarks the same whichever road you came by.
      const sig = (p: RoomPlan) => JSON.stringify(p.map.rounds.filter((q) => ['well', 'shrine', 'gallows', 'fountain', 'statue', 'clamp'].includes(q.kind)));
      expect(sig(last(hi)), place.name).toBe(sig(last(lo)));
    }
  });

  it('goblins find their way to you through the new shapes (round water, banks and corners)', () => {
    let walked = 0;
    for (const place of ALL) for (let s = 1; s <= 3; s++) for (const { plan } of rooms(job(place, s * 61 + 5), s % 2 ? 'h' : 'l')) {
      const m: GameMap = plan.map, goal = m.hero, w = walkable(plan);
      useMap(m);
      for (const f of plan.foes.filter((q) => !q.z && q.kind === 'scrapper').slice(0, 3)) {
        if (!w.reach(f.x, f.y, 0.6)) continue;
        const p = { x: f.x, y: f.y };
        let k = 0;
        for (; k < 400 && Math.hypot(p.x - goal.x, p.y - goal.y) > 1.2; k++) {
          const to = wayTo(p, goal.x, goal.y), d = Math.hypot(to.x - p.x, to.y - p.y) || 1;
          p.x += ((to.x - p.x) / d) * Math.min(0.2, d), p.y += ((to.y - p.y) / d) * Math.min(0.2, d);
          collide(p, 0.38);
        }
        expect(k, `${place.name} ${s}: from ${f.x.toFixed(1)},${f.y.toFixed(1)} to ${goal.x},${goal.y} in ${m.w}x${m.h}`).toBeLessThan(400);
        walked++;
      }
    }
    expect(walked).toBeGreaterThan(200);
  }, 120000);
});
