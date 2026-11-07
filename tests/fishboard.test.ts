import { describe, expect, it } from 'vitest';
import { cast, newFishing, seedOf } from '../src/shared/fishing';
import { cleanFishClaim, fishClaimCatch } from '../src/shared/fishboard';
import { contribute } from '../src/shared/worldsync';
import { newWorld } from '../src/shared/story';
import { clean, memoryWorldStore } from '../api/_world';

describe('the millpond on the town board', () => {
  it('a claim rolls the very fish the cast hooked, from the hero, the cast and how far out', () => {
    for (let n = 0; n < 40; n++) for (const reach of [0, 0.37, 0.81, 1]) {
      const s = newFishing();
      cast(s, reach, seedOf('hpond001', n));
      expect(fishClaimCatch('hpond001', { n, reach: s.reach })).toEqual({ sp: s.fish!.sp, oz: s.fish!.oz });
    }
  });

  it('the board keeps each hero once, at their biggest, and takes no weight typed in', () => {
    const w = newWorld(), hero = { id: 'hpond002', name: 'WREN', cls: 'RANGER' as const };
    const fishes = Array.from({ length: 30 }, (_, n) => ({ n, reach: 0.9, ...fishClaimCatch(hero.id, { n, reach: 0.9 }) }));
    for (const f of fishes) contribute(w, { hero, fish: { n: f.n, reach: f.reach } });
    const big = Math.max(...fishes.map((f) => f.oz));
    expect(w.fish).toHaveLength(1);
    expect(w.fish![0].n).toBe(big);
    expect(w.fish![0].sp).toBe(fishes.find((f) => f.oz === big)!.sp);
    // A weight or a species on the claim is not a claim: only which cast and how far.
    expect(cleanFishClaim({ n: 1, reach: 0.5, oz: 9999 })).toEqual({ n: 1, reach: 0.5 });
    for (const bad of [{ n: -1, reach: 0.5 }, { n: 1.5, reach: 0.5 }, { n: 1, reach: 2 }, { n: 1, reach: 'far' }, null]) expect(cleanFishClaim(bad)).toBeNull();
  });

  it('through the world server: the cheap write, and the fish on the board', async () => {
    const s = memoryWorldStore(), c = clean({ hero: { id: 'hpond003', name: 'tam', cls: 'MAGE' }, fish: { n: 3, reach: 0.6 } })!;
    expect(c.stats).toEqual({});
    const v = await s.apply('pond', c);
    expect(v.world.fish![0]).toMatchObject({ id: 'hpond003', n: fishClaimCatch('hpond003', { n: 3, reach: 0.6 }).oz });
  });
});
