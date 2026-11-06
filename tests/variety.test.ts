/**
 * Layout 4 (Kyle, 2026-11-04: "more scenarios and map elements ... choices between screens, more than
 * just high road, low road"): forks whose two ways are different kinds of room you can tell apart, what
 * each way pays, every room different on a long job and the next day's too, the same rooms on every
 * screen, and the new rooms walkable by every way through them.
 */
import { describe, expect, it } from 'vitest';
import { doorAt } from '../src/shared/arena';
import { PLACES, SEWERS, board, type Job } from '../src/shared/jobs';
import { isNode4 } from '../src/shared/nodes4';
import { routeOf, type RoomSpec } from '../src/shared/route';
import { planRoom, type RoadId, type RoomPlan } from '../src/shared/terrain';
import { WAYS, pickWay } from '../src/shared/ways';
import { wayGot, wayLine } from '../src/shared/waypay';
import { walkable } from './walk';

const ALL = [...PLACES, SEWERS];
const job = (place: (typeof ALL)[number], seed: number, rooms = 5, o: Partial<Job> = {}): Job => ({ ...board(1)[1], place, rooms, seed, objective: 'hunt', layout: 4, ...o });
const fnv = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
};
/** Every room of a job down one road, planned. */
function rooms(j: Job, took: 'h' | 'l'): { plan: RoomPlan; spec: RoomSpec; i: number }[] {
  const r = routeOf(j, took), f = r.findIndex((x) => x.outs!.length === 2), road: RoadId = took === 'l' ? 'low' : 'high';
  return r.map((spec, i) => {
    const taken: Record<number, RoadId> = f >= 0 && i > f ? { [f + 1]: road } : {};
    return { plan: planRoom(j, i, taken[i], taken), spec, i };
  });
}

describe('layout 4: forks you can tell apart', () => {
  it('every fork offers two different kinds of room, each the way it says', () => {
    const seen = new Set<string>();
    for (const place of ALL) for (let s = 1; s <= 30; s++) for (const n of [3, 5]) {
      const j = job(place, s * 13 + 1, n), hi = routeOf(j, 'h'), lo = routeOf(j, 'l'), f = hi.findIndex((x) => x.outs!.length === 2), where = `${place.name} ${s} ${n}`;
      expect(f, where).toBeGreaterThanOrEqual(0);
      const [a, b] = hi[f].outs!;
      expect(a.way && b.way, where).toBeTruthy();
      expect(a.way, where).not.toBe(b.way);
      expect(WAYS[a.way!].piece, where).not.toBe(WAYS[b.way!].piece);
      const ra = (a.road === 'high' ? hi : lo)[f + 1], rb = (b.road === 'high' ? hi : lo)[f + 1];
      expect([ra.way, rb.way], where).toEqual([a.way, b.way]);
      expect(ra.node, where).not.toBe(rb.node);
      for (const [r, w] of [[ra, a.way!], [rb, b.way!]] as const) {
        expect(r.piece, where).toBe(WAYS[w].piece);
        if (WAYS[w].nodes) expect(WAYS[w].nodes, where).toContain(r.node);
        expect(WAYS[w].countries, where).toContain(r.country);
      }
      seen.add(a.way!), seen.add(b.way!);
    }
    expect([...seen].sort()).toEqual(Object.keys(WAYS).sort());
  });

  it("the fork's ways are named over their gaps and told in the goal line", () => {
    const j = job(PLACES[0], 77), r = rooms(j, 'h'), f = r.find((x) => x.spec.outs!.length === 2)!;
    const roads = f.plan.map.roads!;
    expect(roads).toHaveLength(2);
    for (const q of roads) expect(q.label).toBe(WAYS[q.way!].word);
    const line = pickWay(roads.map((q) => q.way!));
    for (const q of roads) expect(line).toContain(WAYS[q.way!].tell);
  });

  it('the way taken changes the pay, the treasure and the recap line', () => {
    let checked = 0;
    for (const place of ALL) for (let s = 1; s <= 20 && checked < 40; s++) {
      const j = job(place, s * 7 + 2), hi = routeOf(j, 'h'), f = hi.findIndex((x) => x.outs!.length === 2);
      const got = (['high', 'low'] as const).map((road) => wayGot(j, { [f + 1]: road }, { [f + 1]: 2 })!);
      const [a, b] = got;
      expect(a.way).not.toBe(b.way);
      for (const g of got) {
        const w = WAYS[g.way];
        expect(g.pay).toBeCloseTo(w.pay + (w.perSaved ?? 0) * 2);
        expect(g.treasure).toBe(w.treasure);
        expect(wayLine(g).startsWith(w.word + ':')).toBe(true);
      }
      expect(wayLine(a)).not.toBe(wayLine(b));
      checked++;
    }
    // No fork taken, or an older job: nothing changes.
    expect(wayGot(job(PLACES[0], 5), {})).toBeNull();
    expect(wayGot({ ...job(PLACES[0], 5), layout: 3 }, { 2: 'high' })).toBeNull();
    // QUIET pays less, DRUMS more and a treasure; SMOKE pays for each one saved.
    expect(wayLine({ way: 'quiet', index: 2, saved: 0, pay: -0.2, treasure: 0 })).toBe('QUIET: -20% pay');
    expect(wayLine({ way: 'drums', index: 2, saved: 0, pay: 0.25, treasure: 1 })).toBe('DRUMS: +25% pay, +1 treasure');
    expect(wayLine({ way: 'smoke', index: 2, saved: 1, pay: 0.15, treasure: 0 })).toBe('SMOKE: 1 saved, +15% pay');
  });
});

describe('layout 4: no repeats', () => {
  it('on a long job no two rooms share a room kind, layout, landmark or scene, down either road', () => {
    for (const place of ALL) for (let s = 1; s <= 40; s++) for (const took of ['h', 'l']) {
      const r = routeOf(job(place, s * 11 + 5), took), ap = r.slice(0, -1), where = `${place.name} ${s} ${took}`;
      expect(new Set(ap.map((x) => x.node)).size, where).toBe(ap.length);
      expect(new Set(ap.map((x) => `${x.node}/${x.layout}`)).size, where).toBe(ap.length);
      const lm = ap.map((x) => x.landmark).filter(Boolean);
      expect(new Set(lm).size, where).toBe(lm.length);
      expect(new Set(r.map((x) => x.piece)).size, where).toBe(r.length);
      // A well's cache is the room's well: never another well as a landmark on the job.
      if (ap.some((x) => x.piece === 'cache')) expect(lm, where).not.toContain('well');
    }
  });

  it("the next day's job to the same place looks different, its heart the same", () => {
    const look = (r: RoomSpec[]) => r.filter((x) => !x.heart).map((x) => `${String(x.node)}/${x.layout}`).join(' ');
    let pairs = 0;
    for (let day = 1; day <= 80; day++) for (const sewers of [false, true]) for (const b of board(day + 1, sewers)) {
      for (const a of board(day, sewers).filter((q) => q.place.name === b.place.name)) {
        for (const took of ['h', 'l']) expect(look(routeOf(b, took)), `${b.id} ${b.place.name} after ${a.id}`).not.toBe(look(routeOf(a, took)));
        expect(routeOf(b)[b.rooms - 1].node).toBe(routeOf(a)[a.rooms - 1].node);
        pairs++;
      }
    }
    expect(pairs).toBeGreaterThan(40);
  });

  it('the new rooms all turn up', () => {
    const seen = new Set<string>();
    for (const place of ALL) for (let s = 1; s <= 60; s++) for (const took of ['h', 'l']) for (const x of routeOf(job(place, s * 3 + 1), took)) if (isNode4(String(x.node))) seen.add(String(x.node));
    expect([...seen].sort()).toEqual(['barrows', 'cave', 'churchyard', 'collapse', 'deepwood', 'flooded', 'glade', 'mill', 'orchard', 'orechamber', 'reedbed', 'stackyard']);
  });
});

describe('layout 4: seeds', () => {
  it('a cloned job plans the same rooms down either road (a party sees the same fork and rooms)', () => {
    for (const place of [PLACES[0], PLACES[4], PLACES[8], SEWERS]) {
      const j = job(place, 91), clone: Job = JSON.parse(JSON.stringify(j));
      for (const took of ['h', 'l'] as const) expect(JSON.stringify(rooms(clone, took).map((x) => x.plan))).toBe(JSON.stringify(rooms(j, took).map((x) => x.plan)));
    }
  });

  it('layout 4 rooms are as pinned', () => {
    let all = 0;
    for (const p of ALL) for (const seed of [7, 707]) for (const took of ['h', 'l'] as const) for (const { plan } of rooms(job(p, seed), took)) all = fnv(all + ':' + fnv(JSON.stringify(plan)));
    // Taken 2026-11-04 when layout 4 came in.
    expect(all).toBe(1004130954 /* re-pinned 2026-11-05: the ironhide and rush templates, and WATER for THE FORD; then the chalker staged at the CRIES tally (foes only, checked) */);
  }, 240000);
});

describe('layout 4: rooms', () => {
  it('every way on and side way of every new room can be walked to, and what it holds can be reached', () => {
    let n = 0;
    for (const place of ALL) for (let s = 1; s <= 5; s++) for (const took of ['h', 'l'] as const) for (const { plan, spec, i } of rooms(job(place, s * 31 + 7), took)) {
      if (!isNode4(String(spec.node)) && spec.piece !== 'fallen' && spec.piece !== 'burning' && spec.piece !== 'drums') continue;
      const m = plan.map, w = walkable(plan), where = `${place.name} ${s} ${took} room ${i} ${spec.node}/${spec.layout} ${spec.piece}`;
      n++;
      expect(w.open(m.hero.x, m.hero.y), where).toBe(true);
      for (const a of m.exit ? [m.exit] : m.roads!.map((q) => q.area)) expect(w.reach(a.x + a.w / 2, a.y + a.h / 2, 1.2), `${where}: way on`).toBe(true);
      for (const b of m.blocks.filter((q) => q.kind === 'sideway')) expect(w.reach(doorAt(b).x, doorAt(b).y, 1), `${where}: side way`).toBe(true);
      for (const f of plan.foes) if (!f.z) expect(w.reach(f.x, f.y, 1.3), `${where}: ${f.kind} ${f.variant ?? ''}`).toBe(true);
      for (const c of plan.chests) expect(w.reach(c.x, c.y, 1.4), `${where}: chest`).toBe(true);
      expect(w.reached / w.all, where).toBeGreaterThan(0.55);
    }
    expect(n).toBeGreaterThan(60);
  }, 300000);
});
