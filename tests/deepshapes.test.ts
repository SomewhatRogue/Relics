// Deep floors differ floor to floor: their own size and their own layout (shared/deepshapes.ts).
import { describe, expect, it } from 'vitest';
import { deepFloor } from '../src/shared/deep';
import { DEEP_SHAPES, shapeOf } from '../src/shared/deepshapes';
import { newRun, runRoom } from '../src/sim/run';

describe('Deep floor shapes', () => {
  it('never the same shape two floors running, and every shape turns up', () => {
    for (const seed of [1, 3, 77, 4242, 99991]) {
      const seen = new Set<string>();
      for (let n = 2; n <= 60; n++) {
        expect(shapeOf(seed, n).id, `seed ${seed} floor ${n}`).not.toBe(shapeOf(seed, n - 1).id);
        seen.add(shapeOf(seed, n).id);
      }
      expect(seen.size).toBe(DEEP_SHAPES.length);
    }
  });

  it('the room is built to its shape, with the hero and the way out inside it, and more goblins in a bigger one', () => {
    for (const seed of [3, 77]) {
      const per: Record<string, number[]> = {};
      for (let n = 1; n <= 40; n++) {
        if (n % 5 === 0) continue;
        const job = deepFloor(n, seed, 'x'), run = newRun(job), r = runRoom(run), m = r.map;
        expect([m.w, m.h], `floor ${n}`).toEqual([job.hall!.w, job.hall!.h]);
        for (const h of r.heroes ?? []) expect(h.x > 0 && h.x < m.w && h.y > 0 && h.y < m.h, `hero on floor ${n}`).toBe(true);
        const id = DEEP_SHAPES.find((s) => s.w === m.w && s.h === m.h)!.id;
        (per[id] ??= []).push(r.enemies.length);
      }
      const avg = (k: string) => (per[k] ? per[k].reduce((a, b) => a + b, 0) / per[k].length : NaN);
      if (per.tight && per.great) expect(avg('great')).toBeGreaterThan(avg('tight'));
    }
  });

  it('two floors of one layer, same shape, are laid out differently', () => {
    const seed = 77, by: Record<string, number[]> = {};
    for (let n = 1; n <= 40; n++) if (n % 5) (by[`${Math.ceil(n / 5)}-${shapeOf(seed, n).id}`] ??= []).push(n);
    const pair = Object.values(by).find((v) => v.length > 1);
    if (!pair) return;
    const lay = (n: number) => JSON.stringify(runRoom(newRun(deepFloor(n, seed, 'x'))).map.blocks?.slice(0, 20));
    expect(lay(pair[0])).not.toBe(lay(pair[1]));
  });
});
