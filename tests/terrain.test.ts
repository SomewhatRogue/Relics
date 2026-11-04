/** Kinds of place and lengths of job: rivers with fords, marsh pools, ruins; short to long, paid to match. */
import { describe, expect, it } from 'vitest';
import { board, payFor, SIZES, type Job } from '../src/shared/jobs';
import { planRoom } from '../src/shared/terrain';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT } from '../src/sim/types';
import { treasure } from '../src/shared/treasure';

const at = (kind: Job['place']['kind'], rooms = 3): Job => ({ ...board(2)[1], layout: undefined, rooms, place: { name: 'Test', kind, region: 'Fenmere', ruin: 2 }, objective: 'rescue', seed: 41 });

describe('rivers and marshes', () => {
  it('a river runs right across, deep but for two fords; a hero wades a ford slowly and is stopped by the deep', () => {
    const plan = planRoom(at('river'), 0), w = plan.map.water!;
    expect(w.filter((x) => !x.deep)).toHaveLength(2);
    expect(w.reduce((s, x) => s + x.w, 0)).toBeCloseTo(plan.map.w, 5);
    const ford = w.find((x) => !x.deep)!, deep = w.find((x) => x.deep && x.w > 3)!;
    const walk = (x: number) => {
      const room = new ArenaRoom(1, { map: plan.map, foes: [] });
      const h = room.join('me');
      Object.assign(h, { x, y: ford.y + ford.h + 1 });
      room.setIntent('me', { ...NO_INTENT, my: -1 });
      for (let i = 0; i < 120; i++) room.step();
      return h.y;
    };
    expect(walk(ford.x + ford.w / 2)).toBeLessThan(ford.y - 0.5);
    expect(walk(deep.x + deep.w / 2)).toBeGreaterThan(deep.y + deep.h - 0.1);
  });
  it('a marsh has bog pools, and ruins have broken walls and pillars', () => {
    expect(planRoom(at('marsh'), 1).map.water?.length).toBeGreaterThan(2);
    const ruins = planRoom(at('ruins'), 1).map;
    expect(ruins.blocks.some((b) => b.kind === 'wall' || b.kind === 'rubble')).toBe(true);
    expect(ruins.rounds.some((r) => r.kind === 'pillar')).toBe(true);
  });
});

describe('the board', () => {
  it('a short, two medium and a long job each day, in different kinds of place, plus the deep one', () => {
    for (const day of [1, 2, 3, 7]) {
      const jobs = board(day), plain = jobs.filter((j) => !j.deep);
      expect(plain.map((j) => j.size)).toEqual(['short', 'medium', 'medium', 'long']);
      expect(new Set(plain.map((j) => j.place.kind)).size).toBe(4);
      expect(plain.map((j) => j.rooms)).toEqual([2, 3, 3, 5].map((n, i) => SIZES[(['short', 'medium', 'medium', 'long'] as const)[i]].rooms));
    }
  });
  it('longer pays more, per room too, and its treasure is more', () => {
    expect(payFor(5, 2, false, 'long') / 5).toBeGreaterThan(payFor(2, 2, false, 'short') / 2);
    expect(treasure({ ...at('forest', 5) }, 'WARRIOR', 'hkyle0000001', 1)).toHaveLength(2);
    expect(treasure({ ...at('forest', 2) }, 'WARRIOR', 'hkyle0000001', 1)).toHaveLength(1);
  });
});
