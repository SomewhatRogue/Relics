// Lights.place gives the pool to the same lights, in the same order, as the old sort did (ties included).
import { describe, expect, it } from 'vitest';
import { Lights, type L3 } from '../src/client/three/lights3d';

/** A small seeded stream, so the lists are the same every run. */
const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

describe('Lights.place', () => {
  it('orders lights as the old comparator did', () => {
    const r = rng(7), N = 24, lights = new Lights(N, 0);
    for (let run = 0; run < 300; run++) {
      // Few distinct spots, reaches and strengths, so ties are common; some too dim to count.
      const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
      const list: L3[] = Array.from({ length: Math.floor(r() * 40) }, (_, k) => ({
        x: pick([0, 1, 3, -2]), y: 1, z: pick([0, 2, -1]), r: pick([2, 3, 4]), i: pick([0, 0.005, 0.5, 1, 1.5]), c: [k / 40, 0.5, 0.2] as [number, number, number],
      }));
      const cx = pick([0, 0.5, 2]), cz = pick([0, 1]);
      const score = (l: L3) => (Math.hypot(l.x - cx, l.z - cz) - l.r) / (0.5 + l.i);
      const best = list.filter((l) => l.i > 0.01).sort((a, b) => score(a) - score(b));
      lights.place(list, cx, cz, 1.5);
      const pool = lights.group.children.filter((o) => (o as { isPointLight?: boolean }).isPointLight) as unknown as { color: { r: number }; intensity: number }[];
      expect(pool.length).toBe(N);
      pool.forEach((p, k) => {
        const l = best[k];
        if (!l) return expect(p.intensity).toBe(0);
        expect(p.color.r).toBeCloseTo(l.c[0], 9);
      });
    }
  });
});
