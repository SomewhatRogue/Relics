/** Routed jobs (docs/terrain-nodes.md slice 1): different rooms on the way to a heart that stays itself. */
import { describe, expect, it } from 'vitest';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { LANDMARK_KINDS, signatureOf } from '../src/shared/nodes';
import { routeOf } from '../src/shared/route';
import { planRoom } from '../src/shared/terrain';
import { weatherIn } from '../src/shared/weather';

const job = (place: (typeof PLACES)[number], seed: number, rooms = 5, o: Partial<Job> = {}): Job => ({ ...board(1)[1], place, rooms, seed, objective: 'hunt', layout: 2, ...o });
const fnv = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
};
const marksIn = (m: ReturnType<typeof planRoom>['map']) => m.rounds.filter((r) => LANDMARK_KINDS.includes(r.kind));

describe('the route', () => {
  it('keeps its rules over many jobs: no node twice running, no sub-layout or set piece or landmark twice, a palette step, the way on moving', () => {
    const steps = (a: object, b: object) => (['floor', 'back', 'soil', 'light'] as const).filter((k) => (a as never)[k] !== (b as never)[k]).length;
    for (const place of PLACES) for (let s = 1; s <= 60; s++) for (const rooms of [2, 3, 5]) {
      const r = routeOf(job(place, s * 13 + 1, rooms)), where = `${place.name} ${s} ${rooms}`;
      expect(r).toHaveLength(rooms);
      expect(r[rooms - 1].heart, where).toBe(true);
      const ap = r.slice(0, -1);
      for (let i = 1; i < ap.length; i++) expect(ap[i].node, where).not.toBe(ap[i - 1].node);
      expect(new Set(ap.map((x) => `${x.node}/${x.layout}`)).size, where).toBe(ap.length);
      expect(new Set(r.map((x) => x.piece)).size, where).toBe(rooms);
      const lm = ap.map((x) => x.landmark).filter(Boolean);
      expect(new Set(lm).size, where).toBe(lm.length);
      for (const l of lm) expect(signatureOf(place), where).not.toContain(l);
      for (let i = 1; i < r.length; i++) expect(steps(r[i].palette, r[i - 1].palette), `${where} room ${i}`).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < ap.length; i++) if (!(rooms >= 3 && i === rooms - 2)) expect(ap[i].outX, where).not.toBe(ap[i - 1].outX);
      for (let i = 1; i < r.length; i++) expect(r[i].inX, where).toBe(r[i - 1].outX);
    }
  });

  it('lays each approach room out as its spec says: one landmark at most, its own, its floor and wall, its way out', () => {
    for (const place of PLACES) for (let s = 1; s <= 6; s++) {
      const j = job(place, s * 101 + 5), r = routeOf(j);
      for (let i = 0; i < j.rooms - 1; i++) {
        const m = planRoom(j, i).map, spec = r[i], lm = marksIn(m), where = `${place.name} ${s} room ${i}`;
        expect(lm.length, where).toBeLessThanOrEqual(1);
        if (lm.length) expect(lm[0].kind, where).toBe(spec.landmark);
        expect(m.theme.floor, where).toBe(spec.palette.floor);
        expect(m.theme.back, where).toBe(spec.palette.back);
        expect(m.hero.x, where).toBe(spec.inX);
        if (m.exit) expect(m.exit.x + m.exit.w / 2, where).toBe(spec.outX);
      }
    }
  });

  it("the next day's job to the same place goes by different rooms", () => {
    for (const place of PLACES) {
      const a = routeOf(job(place, 101)).slice(0, -1).map((x) => `${x.node}/${x.layout}`).join(), b = routeOf(job(place, 202)).slice(0, -1).map((x) => `${x.node}/${x.layout}`).join();
      expect(a, place.name).not.toBe(b);
    }
  });
});

describe('the heart', () => {
  it('has its signature landmarks where they always are, whatever the job, the road or the objective', () => {
    const objectives: Job['objective'][] = ['hunt', 'rescue', 'larder', 'burn'];
    for (const place of PLACES) {
      const seen = new Set<string>();
      for (let s = 1; s <= 16; s++) {
        const j = job(place, s * 7 + 3, 3, { objective: objectives[s % 4] }), m = planRoom(j, 2, s % 2 ? 'high' : 'low').map;
        const sign = signatureOf(place);
        seen.add(JSON.stringify([...m.rounds.filter((q) => sign.includes(q.kind)).map((q) => [q.kind, q.x.toFixed(2), q.y.toFixed(2)]), ...m.blocks.filter((b) => sign.includes(b.kind)).map((b) => [b.kind, b.x, b.y])].sort()));
      }
      expect(seen.size, place.name).toBe(1);
    }
    const green = planRoom(job(PLACES[0], 5, 3), 2, 'low').map;
    expect(green.rounds.some((r) => r.kind === 'well') && green.rounds.some((r) => r.kind === 'shrine')).toBe(true);
    expect(planRoom(job(PLACES.find((p) => p.name === "Hangman's Wood")!, 5, 3), 2, 'low').map.blocks.some((b) => b.kind === 'gallows')).toBe(true);
  });

  it('has sub-layouts: what moves differs between them, and only the heart has the place signature', () => {
    for (const place of PLACES) {
      const layouts = new Map<string, string>();
      for (let s = 1; s <= 30 && layouts.size < 3; s++) {
        const j = job(place, s, 2), spec = routeOf(j)[1], m = planRoom(j, 1).map;
        layouts.set(spec.layout, JSON.stringify([m.blocks.map((b) => [b.kind, b.x, b.y]), m.rounds.map((r) => [r.kind, r.x, r.y])]));
      }
      expect(layouts.size, place.name).toBe(3);
      expect(new Set(layouts.values()).size, place.name).toBeGreaterThan(1);
      for (let s = 1; s <= 10; s++) {
        const j = job(place, s * 3), sign = signatureOf(place);
        for (let i = 0; i < 4; i++) {
          const m = planRoom(j, i).map;
          expect(m.rounds.filter((r) => sign.includes(r.kind)).length + m.blocks.filter((b) => sign.includes(b.kind)).length, `${place.name} ${s} room ${i}`).toBe(0);
        }
      }
    }
  });
});

describe('seeds', () => {
  it('the same job gives the same rooms on every screen; another road, another heart way in', () => {
    const j = job(PLACES[0], 77);
    for (let i = 0; i < 5; i++) expect(JSON.stringify(planRoom(j, i, i === 4 ? 'high' : undefined))).toBe(JSON.stringify(planRoom({ ...j }, i, i === 4 ? 'high' : undefined)));
    expect(planRoom(j, 4, 'high').map.hero.x).not.toBe(planRoom(j, 4, 'low').map.hero.x);
  });

  it("an old saved job (no layout) keeps today's rooms exactly", () => {
    let all = 0;
    for (const day of [1, 2, 3, 4]) for (const j0 of board(day)) {
      const j: Job = { ...j0, layout: undefined };
      for (let i = 0; i < j.rooms; i++) for (const road of i === j.rooms - 1 && j.rooms >= 3 ? (['high', 'low'] as const) : [undefined]) all = fnv(all + ':' + fnv(JSON.stringify(planRoom(j, i, road))));
    }
    for (const p of PLACES) {
      const j: Job = { ...board(1)[2], place: p, rooms: 5, seed: 77, layout: undefined };
      for (let i = 0; i < 5; i++) all = fnv(all + ':' + fnv(JSON.stringify(planRoom(j, i))));
    }
    // Taken from the rooms as they were before routed jobs (2026-11-04).
    expect(all).toBe(3385864003);
  });

  it('weather: one pattern a job; fog only ever creeps in, never more than a step a room; none underground', () => {
    const kinds = new Set<string>();
    for (const place of PLACES) for (let s = 1; s <= 40; s++) {
      const j = job(place, s * 17), w = Array.from({ length: 5 }, (_, i) => weatherIn(j, i));
      for (let i = 1; i < 5; i++) expect(w[i].fog - w[i - 1].fog, place.name).toBeLessThanOrEqual(0.2);
      for (const x of w) if (x.fog) kinds.add('fog'), expect(x.rain).toBe(0);
      if (w.some((x) => x.storm)) kinds.add('storm');
      if (w.some((x) => x.rain && !x.storm)) kinds.add('rain');
      if (place.kind === 'mine') expect(w[4]).toEqual({ rain: 0, storm: 0, fog: 0 });
    }
    expect(kinds).toEqual(new Set(['fog', 'storm', 'rain']));
  });
});
