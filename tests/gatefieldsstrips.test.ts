/** The common strips' small stories (shared/gatefieldsstrips.ts): laid for each seed, in the strips, and the same twice. */
import { describe, expect, it } from 'vitest';
import { landJob, territoryPlan } from '../src/shared/territory';

const map = (d: number) => territoryPlan(landJob('gatefields', d)).map;

describe('the common strips', () => {
  it('lays most of its stories for each seed, inside the strips, and the same twice', () => {
    for (const d of [3, 17, 41]) {
      const m = map(d), at = (q: { x: number; y: number }) => q.y > 87 && q.y < 116;
      const told = [m.blocks.filter((b) => b.kind === 'plough'), m.marks!.filter((q) => q.kind === 'ruts'), m.marks!.filter((q) => q.kind === 'rug'), m.grim!.filter((q) => q.kind === 'hung' && q.y > 87), m.marks!.filter((q) => q.kind === 'fallenpost')];
      expect(told.filter((l) => l.length > 0).length, `seed ${d}`).toBeGreaterThanOrEqual(3);
      for (const l of told) for (const q of l) expect(at(q)).toBe(true);
      expect(m.marks!.filter((q) => q.kind === 'flowers' && at(q)).length).toBeGreaterThanOrEqual(3);
    }
    expect(map(3)).toEqual(map(3));
  });
});
