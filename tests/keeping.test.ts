// The Keeping Room (docs/design/holy-and-hungry.md section 7): only the corrupt find it; relics fed, pieces kept.
import { describe, expect, it } from 'vitest';
import { KEEPING, chargesOf, dorcasPays, feedRelic, findsRoom, giveToDorcas, packVowed, piecesToFill } from '../src/shared/keeping';
import { rollVowed } from '../src/shared/vowed';
import { GROW, grownBy } from '../src/shared/vowgrow';
import { makeRelic, relicMax } from '../src/shared/relicitems';
import { Rng } from '../src/shared/rng';
import type { Item } from '../src/shared/tuning';
import { KEEPW } from '../src/client/keepingwords';

const vowed = (seed: number, grownTo = 0) => { const it = rollVowed(new Rng(seed), 'WARRIOR', 'ring')!; return grownTo ? grownBy(it, grownTo * GROW.span) : it; };
const hero = (want = 40) => {
  const relic = { ...makeRelic(new Rng(1), 'javelin'), charge: 0 };
  return { weapon: 'sword', arms: {}, armor: null, legs: null, rings: [] as Item[], bag: [vowed(1), vowed(2, 0.9), vowed(3)] as Item[], want, gold: 0, relics: [relic] };
};

describe('the Keeping Room', () => {
  it('a clean hero sees brick', () => {
    expect(findsRoom(hero(0))).toBe(false);
    expect(findsRoom(hero(40))).toBe(true);
  });
  it('a grown piece fills more; least grown go first', () => {
    const p = hero();
    expect(chargesOf(p.bag[0])).toBe(KEEPING.charges);
    expect(chargesOf(p.bag[1])).toBe(KEEPING.charges + 1);
    expect(packVowed(p).at(-1)).toBe(p.bag[1]);
  });
  it('feeding fills the relic from the pack, eats the pieces, grows the Want', () => {
    const p = hero(), r = p.relics[0], need = piecesToFill(p, r);
    const n = feedRelic(p, r.id);
    expect(n).toBe(need);
    expect(r.charge).toBe(Math.min(relicMax(r), KEEPING.charges * 2 + KEEPING.charges + 1));
    expect(p.bag).toHaveLength(3 - n);
    expect(p.want).toBe(40 + n * KEEPING.feedWant);
  });
  it('an elemental relic, or a clean hero, gets nothing', () => {
    const p = hero();
    p.relics = [{ ...makeRelic(new Rng(2), 'javelin', 'fire'), charge: 0 }];
    expect(feedRelic(p, p.relics[0].id)).toBe(0);
    const q = hero(0);
    expect(feedRelic(q, q.relics[0].id)).toBe(0);
    expect(q.bag).toHaveLength(3);
  });
  it('Dorcas pays coin for a vowed piece, and the Want grows', () => {
    const p = hero(), it = p.bag[0], pay = dorcasPays(it);
    expect(giveToDorcas(p, it)).toBe(true);
    expect(p.gold).toBe(pay);
    expect(p.want).toBe(40 + KEEPING.giveWant);
    expect(p.bag).not.toContain(it);
    expect(giveToDorcas(p, it)).toBe(false);
  });
  it('her words never say holy, the Lantern or why', () => {
    for (const v of Object.values(KEEPW)) {
      const t = typeof v === 'function' ? (v as (...a: unknown[]) => string)(2, true) : v;
      expect(t).not.toMatch(/holy|lantern|prayer|altar|—/i);
    }
  });
});
