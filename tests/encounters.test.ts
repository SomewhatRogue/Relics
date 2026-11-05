/** Encounters: a routed room's goblins as packs, one template each, under a cap on specials. */
import { describe, expect, it } from 'vitest';
import { board } from '../src/shared/jobs';
import { planRoom, type Foe } from '../src/shared/terrain';
import { ENCOUNTER, ROOF } from '../src/shared/tuning';
import { isSpecial } from '../src/shared/encounter';
import { scaleFoes } from '../src/sim/party';
import { ArenaRoom } from '../src/sim/room';
import { TICK } from '../src/shared/tuning';

const jobs = Array.from({ length: 120 }, (_, d) => board(d + 1)).flat();
const rooms = jobs.flatMap((j) => Array.from({ length: j.rooms }, (_, i) => ({ j, i, foes: planRoom(j, i).foes })));
const packsOf = (fs: Foe[]) => [...new Set(fs.filter((f) => f.pack !== undefined && f.pack < 90).map((f) => f.pack!))].map((p) => fs.filter((f) => f.pack === p));
const kindOf = (f: Foe) => (f.kind === 'butcher' ? 'butcher' : f.role ?? 'fodder');

describe('packs', () => {
  it('a room never holds more specials than its cap', () => {
    for (const r of rooms) {
      const at = Math.min(r.i, ENCOUNTER.specials.length - 1), cap = ENCOUNTER.specials[at] + (r.j.deep || r.j.place.ruin >= 3 ? ENCOUNTER.deep : 0);
      expect(r.foes.filter((f) => isSpecial(f) && !f.name).length).toBeLessThanOrEqual(cap);
    }
  });

  it('each pack is one fight: at most two kinds of special, a centrepiece at most of one kind, and small ones with it', () => {
    let withCentre = 0, all = 0;
    for (const r of rooms) for (const p of packsOf(r.foes)) {
      all++;
      const kinds = new Set(p.filter(isSpecial).map(kindOf));
      expect(kinds.size).toBeLessThanOrEqual(2);
      expect(p.filter((f) => !isSpecial(f)).length).toBeGreaterThan(0);
      if (p.some((f) => isSpecial(f) && !f.bow)) withCentre++;
    }
    // Most fights have a threat at their heart; some are just a swarm to splatter.
    expect(withCentre / all).toBeGreaterThan(0.4);
    expect(withCentre / all).toBeLessThan(0.9);
  });

  it('every new sort turns up somewhere, each only where it belongs', () => {
    const all = rooms.flatMap((r) => r.foes.map((f) => ({ f, r })));
    for (const v of ['banner', 'netter', 'thief', 'log', 'roofer', 'keeper', 'wolf', 'oiler', 'torch', 'sapper', 'blind'] as const) expect(all.some(({ f }) => f.variant === v)).toBe(true);
    for (const { f, r } of all) {
      if (f.variant === 'blind') expect(r.j.place.kind).toBe('mine');
      if (f.variant === 'wolf') expect(['field', 'farm', 'forest', 'river', 'marsh']).toContain(r.j.place.kind);
      if (f.variant === 'roofer') expect(f.z).toBe(ROOF.z);
      if (f.variant === 'torch') expect(r.foes.some((o) => o.variant === 'oiler' && o.pack === f.pack)).toBe(true);
      if (f.variant === 'wolf') expect(r.foes.some((o) => o.variant === 'keeper' && o.pack === f.pack)).toBe(true);
    }
  });

  it('the first room opens gently: no butcher, no log-carriers, no banner', () => {
    for (const r of rooms.filter((x) => x.i === 0)) expect(r.foes.some((f) => f.kind === 'butcher' || f.variant === 'log' || f.variant === 'banner')).toBe(false);
  });

  it('the same job, the same fights; the same party, the same extra', () => {
    const j = jobs[11];
    expect(planRoom(j, 1).foes).toEqual(planRoom(j, 1).foes);
    expect(scaleFoes(planRoom(j, 1).foes, 3, 9)).toEqual(scaleFoes(planRoom(j, 1).foes, 3, 9));
  });
});

describe('a bigger party', () => {
  it('meets more small ones and a tougher centrepiece, never more specials but the one `more` from three', () => {
    for (const r of rooms.slice(0, 200)) {
      const base = r.foes.filter((f) => isSpecial(f)).length;
      const two = scaleFoes(r.foes.map((f) => ({ ...f })), 2, 7), four = scaleFoes(r.foes.map((f) => ({ ...f })), 4, 7);
      expect(two.filter(isSpecial).length).toBe(base);
      expect(four.filter(isSpecial).length).toBeLessThanOrEqual(base + packsOf(r.foes).length);
      expect(four.length).toBeGreaterThanOrEqual(two.length);
    }
  });
});

describe('one fight at a time', () => {
  it("a pack's shout wakes only its own: the next fight waits until it sees you", () => {
    const foes: Foe[] = [
      { kind: 'scrapper', x: 10, y: 8, pack: 1 }, { kind: 'scrapper', x: 11, y: 8, pack: 1 },
      { kind: 'scrapper', x: 15.5, y: 6.5, pack: 2 }, { kind: 'scrapper', x: 16.5, y: 6.5, pack: 2 },
    ];
    const room = new ArenaRoom(3, { foes, map: { ...planRoom(jobs[0], 0).map, rounds: [], blocks: [] }, furniture: [] });
    const h = room.join('me');
    Object.assign(h, { x: 10, y: 10.5, fx: 0, fy: -1, safeT: 0 });
    for (const e of room.enemies) (e.fx = 0), (e.fy = 1);
    for (let i = 0; i < 0.3 / TICK; i++) room.step();
    expect(room.enemies[0].alert && room.enemies[1].alert).toBe(true);
    expect(room.enemies[2].alert || room.enemies[3].alert).toBe(false);
  });
});
