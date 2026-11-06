/**
 * Fewer doors, bigger insides (docs/plans/atlas.md section 6; shared/doors.ts): on a job's street one house
 * you can go into (the SMOKE scene's burning house besides, it being the room's objective), three a job at
 * most; the rest shut (boarded or burnt out, no door, no woodpile); the one kept is a big one and holds the
 * shut houses' captives and chests, so nothing is lost.
 */
import { describe, expect, it } from 'vitest';
import { board } from '../src/shared/jobs';
import { planRoom } from '../src/shared/terrain';
import { runInterior } from '../src/shared/interiors';
import { baseDoor, mergedOf } from '../src/shared/doors';
import { kindling } from '../src/shared/kindling';
import { expedition } from '../src/shared/expedjob';
import { expedPlan } from '../src/shared/expedmap';
import type { Block } from '../src/shared/arena';

const house = (b: Block) => b.kind === 'house' || b.kind === 'barn';
const enterable = (b: Block) => house(b) && !!b.door && !b.door.startsWith('side:');
const has = (job: Parameters<typeof runInterior>[0], i: number, bi: number, door: string) => {
  const r = runInterior(job, i, bi, door);
  return { cages: r.props.filter((p) => p.kind === 'cage').length, chests: r.chests.length };
};

describe('the doors rule', () => {
  const rooms: { job: ReturnType<typeof board>[number]; i: number; road: 'high' | 'low'; blocks: Block[] }[] = [];
  for (let d = 1; d <= 30; d++) for (const job of board(d)) for (const road of ['high', 'low'] as const) for (let i = 0; i < job.rooms; i++) {
    const taken: Record<number, 'high' | 'low'> = {};
    for (let j = 0; j < i; j++) taken[j] = road;
    rooms.push({ job, i, road, blocks: planRoom(job, i, road, taken).map.blocks });
  }

  it('one house to go into a room (and the burning one with someone in it), three a job', () => {
    let merged = 0;
    const perJob = new Map<string, number>();
    for (const r of rooms) {
      const doors = r.blocks.filter(enterable), own = doors.filter((b) => !b.door!.endsWith(':held'));
      expect(own.length).toBeLessThanOrEqual(1);
      const k = `${r.job.id}:${r.road}`;
      perJob.set(k, (perJob.get(k) ?? 0) + own.length);
      merged += own.filter((b) => mergedOf(b.door!).length).length;
    }
    expect(Math.max(...perJob.values())).toBeLessThanOrEqual(3);
    expect(merged).toBeGreaterThan(20);
  });

  it('the rest are shut: no door, no woodpile, boarded or burnt out', () => {
    let shut = 0;
    const kinds = new Set<string>();
    for (const r of rooms) for (const b of r.blocks) if (b.shut) {
      shut++, kinds.add(b.shut);
      expect(b.door).toBeUndefined();
      expect(kindling(b, { blocks: r.blocks, w: 99, h: 99 })).toBeNull();
    }
    expect(shut).toBeGreaterThan(40);
    expect([...kinds].sort()).toEqual(['boarded', 'burnt']);
  });

  it('the one kept is big and holds every captive and chest the shut ones had', () => {
    let checked = 0, cages = 0;
    for (const r of rooms) r.blocks.forEach((b, bi) => {
      if (!enterable(b) || !mergedOf(b.door!).length) return;
      expect(b.big).toBe(true);
      const want = [[bi, baseDoor(b.door!)] as [number, string], ...mergedOf(b.door!)].map(([i, d]) => has(r.job, r.i, i, d)).reduce((a, c) => ({ cages: a.cages + c.cages, chests: a.chests + c.chests }));
      expect(has(r.job, r.i, bi, b.door!)).toEqual(want);
      for (const [i] of mergedOf(b.door!)) expect(r.blocks[i].shut).toBeDefined();
      checked++, (cages += want.cages);
    });
    expect(checked).toBeGreaterThan(20);
    expect(cages).toBeGreaterThan(10);
  });

  it('a rescue keeps its captives: every house had one, and the big house has them all', () => {
    const r = rooms.find((q) => q.job.objective === 'rescue' && q.i === q.job.rooms - 1 && q.blocks.some((b) => enterable(b) && mergedOf(b.door!).length));
    expect(r).toBeDefined();
    const b = r!.blocks.find((q) => enterable(q) && mergedOf(q.door!).length)!;
    expect(has(r!.job, r!.i, r!.blocks.indexOf(b), b.door!).cages).toBe(1 + mergedOf(b.door!).length);
  });

  it('the Barrowfields hamlet keeps two houses to go into', () => {
    for (const day of [2, 5, 9, 14]) {
      const doors = expedPlan(expedition(day)).map.blocks.filter(enterable);
      expect(doors.length).toBeLessThanOrEqual(2);
      expect(doors.length).toBeGreaterThan(0);
    }
  });
});
