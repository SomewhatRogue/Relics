/** Layout 3's routes (docs/terrain-nodes.md slices 2 to 4): turns, forks that rejoin, side ways, countries in order. */
import { describe, expect, it } from 'vitest';
import { homeOf } from '../src/shared/countries';
import { PLACES, SEWERS, board, type Job } from '../src/shared/jobs';
import { signatureOf } from '../src/shared/nodes';
import { JOINS, POOL3, joinOf, portsOk, type RouteNode } from '../src/shared/nodeports';
import { OPP, WIDE, TALL } from '../src/shared/ports';
import { routeOf, type RoomSpec } from '../src/shared/route';
import { planRoom } from '../src/shared/terrain';
import { weatherIn } from '../src/shared/weather';

const ALL = [...PLACES, SEWERS];
const job = (place: (typeof ALL)[number], seed: number, rooms = 5, o: Partial<Job> = {}): Job => ({ ...board(1)[1], place, rooms, seed, objective: 'hunt', layout: 3, ...o });
const steps = (a: RoomSpec['palette'], b: RoomSpec['palette']) => (['floor', 'back', 'soil', 'light'] as const).filter((k) => a[k] !== b[k]).length;
const fnv = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
};

describe('layout 3: the route', () => {
  it('keeps its rules on both roads over many jobs', () => {
    let turns = 0, wide = 0, forks = 0;
    for (const place of ALL) for (let s = 1; s <= 50; s++) for (const rooms of [2, 3, 5]) for (const took of ['h', 'l']) {
      const r = routeOf(job(place, s * 13 + 1, rooms), took), where = `${place.name} ${s} ${rooms} ${took}`, ap = r.slice(0, -1);
      expect(r, where).toHaveLength(rooms);
      expect(r[rooms - 1].heart, where).toBe(true);
      expect(r[rooms - 1].outs, where).toEqual([{ side: 'N', at: 14 }]);
      for (let i = 1; i < ap.length; i++) expect(ap[i].node, where).not.toBe(ap[i - 1].node);
      expect(new Set(ap.map((x) => `${x.node}/${x.layout}`)).size, where).toBe(ap.length);
      expect(new Set(r.map((x) => x.piece)).size, where).toBe(rooms);
      const lm = ap.map((x) => x.landmark).filter(Boolean);
      expect(new Set(lm).size, where).toBe(lm.length);
      for (const l of lm) expect(signatureOf(place), where).not.toContain(l);
      for (let i = 1; i < r.length; i++) expect(steps(r[i].palette, r[i - 1].palette), `${where} room ${i}`).toBeGreaterThanOrEqual(2);
      for (const x of ap) {
        expect(portsOk(x.node as RouteNode, x.in!.side, x.outs!.map((o) => o.side)), `${where} ${x.node} ${x.in!.side}`).toBe(true);
        // Wide only for a leg straight across from side to side (and every such leg but where two roads meet).
        const across = x.in!.side !== 'S' && x.outs!.length === 1 && x.outs![0].side === OPP[x.in!.side];
        expect({ w: x.w, h: x.h }, where).toEqual(x.w === WIDE.w ? WIDE : TALL);
        if (x.w === WIDE.w) expect(across, where).toBe(true), wide++;
      }
      // Each room is come into by the side opposite the way out of the one before (the fork's road taken).
      for (let i = 1; i < r.length; i++) {
        const o = r[i - 1].outs!.find((q) => !q.road || q.road[0] === took)!;
        expect(r[i].in!.side, `${where} room ${i}`).toBe(OPP[o.side]);
      }
      // Never a third room running out by the same side; a medium or longer job turns.
      const outs = ap.map((x) => x.outs!.length === 1 && x.outs![0].side);
      for (let i = 2; i < outs.length; i++) if (outs[i]) expect(outs[i] === outs[i - 1] && outs[i] === outs[i - 2], where).toBe(false);
      if (rooms >= 3) expect(r.some((x) => x.in!.side !== 'S' || x.outs!.some((o) => o.side !== 'N')), where).toBe(true);
      if (r.some((x) => x.in!.side !== 'S' || x.outs!.some((o) => o.side !== 'N'))) turns++;
      if (rooms >= 3) forks += r.filter((x) => x.outs!.length === 2).length;
    }
    expect(turns).toBeGreaterThan(1000);
    expect(wide).toBeGreaterThan(100);
    expect(forks).toBeGreaterThan(500);
  });

  it('a fork: two ways on by different sides, two different roads, and they come back into the same room by different sides', () => {
    let loops = 0;
    for (const place of ALL) for (let s = 1; s <= 40; s++) for (const rooms of [3, 5]) {
      const j = job(place, s * 7 + 2, rooms), hi = routeOf(j, 'h'), lo = routeOf(j, 'l'), f = hi.findIndex((x) => x.outs!.length === 2), where = `${place.name} ${s} ${rooms}`;
      expect(f, where).toBeGreaterThanOrEqual(0);
      expect(lo[f], where).toBe(hi[f]);
      const [a, b] = hi[f].outs!;
      expect(a.side, where).not.toBe(b.side);
      expect(new Set([a.road, b.road]), where).toEqual(new Set(['high', 'low']));
      expect(hi[f + 1].node, where).not.toBe(lo[f + 1].node);
      // Where they meet again: the same room (node, layout, set piece), come into by different sides unless both came up out of the rock.
      const ja = hi[f + 2], jb = lo[f + 2];
      expect([ja.node, ja.layout, ja.piece], where).toEqual([jb.node, jb.layout, jb.piece]);
      if (ja.in!.side !== jb.in!.side) loops++;
      for (let i = f + 3; i < rooms; i++) expect(lo[i].node, where).toBe(hi[i].node);
    }
    expect(loops).toBeGreaterThan(400);
  });

  it('side ways: one or two a job, never at a fork or in the heart, on a side nobody comes or goes by', () => {
    let n = 0;
    for (const place of ALL) for (let s = 1; s <= 40; s++) {
      const r = [...routeOf(job(place, s * 11, 5), 'h'), ...routeOf(job(place, s * 11, 5), 'l')], ways = new Set(r.filter((x) => x.side).map((x) => `${x.index}/${x.node}`));
      expect(ways.size, `${place.name} ${s}`).toBeLessThanOrEqual(3);
      for (const x of r.filter((q) => q.side)) {
        expect(x.heart || x.outs!.length > 1).toBe(false);
        expect([x.in!.side, ...x.outs!.map((o) => o.side)]).not.toContain(x.side!.port.side);
        n++;
      }
    }
    expect(n).toBeGreaterThan(400);
  });

  it('crosses countries in the valley order, a transition at every change, ending in the place own', () => {
    const seen = new Set<string>();
    for (const place of ALL) for (let s = 1; s <= 40; s++) for (const rooms of [2, 3, 5]) for (const took of ['h', 'l']) {
      const r = routeOf(job(place, s * 5 + 3, rooms), took), ap = r.slice(0, -1), where = `${place.name} ${s} ${rooms}`;
      expect(ap[ap.length - 1].country, where).toBe(homeOf(place));
      for (let i = 0; i < ap.length; i++) {
        const x = ap[i], prev = ap[i - 1]?.country;
        if (x.fromCountry) {
          expect(joinOf(x.fromCountry, x.country!)?.nodes, where).toContain(x.node);
          if (prev) expect(prev, where).toBe(x.fromCountry);
          seen.add(x.node);
        } else {
          expect(POOL3[x.country!], where).toContain(x.node);
          if (prev) expect(prev, `${where} room ${i}: ${prev} to ${x.country} with no transition`).toBe(x.country);
        }
      }
      if (rooms === 5) expect(new Set(ap.map((x) => x.country)).size, where).toBeLessThanOrEqual(3);
    }
    // Every transition turns up somewhere.
    expect([...seen].sort()).toEqual([...new Set(JOINS.flatMap((j) => j.nodes))].sort());
  });

  it('the weather carries across the countries: fog creeps in and out a step at a time, none under the ground', () => {
    for (const place of ALL) for (let s = 1; s <= 40; s++) {
      const j = job(place, s * 17), r = routeOf(j), w = r.map((_, i) => weatherIn(j, i));
      const under = r.map((x) => (x.heart ? place.kind === 'mine' : x.country === 'under' && !x.from));
      for (let i = 1; i < 5; i++) if (!under[i] && !under[i - 1]) expect(Math.abs(w[i].fog - w[i - 1].fog), place.name).toBeLessThanOrEqual(0.2);
      // Never thicker coming up out of the ground than a step.
      for (let i = 1; i < 5; i++) if (under[i - 1]) expect(w[i].fog, place.name).toBeLessThanOrEqual(0.2);
      under.forEach((u, i) => u && expect(w[i]).toEqual({ rain: 0, storm: 0, fog: 0 }));
    }
  });
});

describe('layout 3: seeds', () => {
  it('the same job gives the same rooms on every screen, down either road', () => {
    for (const place of [PLACES[0], PLACES[5], PLACES[9]]) {
      const j = job(place, 77), r = routeOf(j), f = r.findIndex((x) => x.outs!.length === 2);
      for (const road of ['high', 'low'] as const) for (let i = 0; i < 5; i++) {
        const taken = i > f ? { [f + 1]: road } : {};
        expect(JSON.stringify(planRoom(j, i, taken[i], taken))).toBe(JSON.stringify(planRoom({ ...j, place: { ...place } }, i, taken[i], { ...taken })));
      }
    }
  });

  it('layout 2 rooms are exactly as they were', () => {
    let all = 0;
    for (const day of [1, 2, 3, 4, 5, 6]) for (const j0 of board(day)) {
      const j: Job = { ...j0, layout: 2 };
      for (let i = 0; i < j.rooms; i++) for (const road of i === j.rooms - 1 && j.rooms >= 3 ? (['high', 'low'] as const) : [undefined]) all = fnv(all + ':' + fnv(JSON.stringify(planRoom(j, i, road))));
    }
    for (const p of PLACES) for (const seed of [7, 77, 707]) {
      const j: Job = { ...board(1)[2], place: p, rooms: 5, seed, layout: 2 };
      for (let i = 0; i < 5; i++) all = fnv(all + ':' + fnv(JSON.stringify(planRoom(j, i, i === 4 ? 'low' : undefined))));
    }
    // Taken before layout 3 (2026-11-04).
    // (Re-pinned 2026-11-04: nests send 2 spiders a wave, not 3; and again for weather as a rule, the theme
    // only: `sky` on it and the new odds, everything but the theme checked unchanged.)
    expect(all).toBe(3813929807);
  }, 120000);
});
