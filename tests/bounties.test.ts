/** Bounties (shared/bounties.ts): n is what the north fields place, the day's two, the count, the pay, the save. */
import { describe, expect, it } from 'vitest';
import { BOUNTIES, countDeath, fitBounties, handIn, isDone, postedOn, take } from '../src/shared/bounties';
import { newProfile } from '../src/shared/progress';
import { landJob, territoryPlan } from '../src/shared/territory';

const fresh = () => newProfile('WARRIOR');

describe('bounties', () => {
  it('each n is what the map places', () => {
    for (const day of [1, 2, 3]) {
      const foes = territoryPlan(landJob('gatefields', day)).foes;
      for (const b of BOUNTIES) expect(foes.filter((f) => f.pack !== undefined && b.packs.includes(f.pack) && (!b.kinds || b.kinds.includes(f.kind))).length, b.id).toBe(b.n);
    }
  });
  it('posts two a day, the same each time, and varies', () => {
    for (let d = 0; d < 30; d++) {
      const a = postedOn(d);
      expect(a.length).toBe(2), expect(a[0].id).not.toBe(a[1].id), expect(postedOn(d)).toEqual(a);
    }
    expect(new Set(Array.from({ length: 30 }, (_, d) => postedOn(d).map((b) => b.id).join())).size).toBeGreaterThan(2);
  });
  it('takes at most two and none twice', () => {
    const p = fresh(), [a, b] = postedOn(5), c = BOUNTIES.find((x) => x !== a && x !== b)!;
    expect(take(p, a.id, 5)).toBe(true), expect(take(p, a.id, 5)).toBe(false), expect(take(p, b.id, 5)).toBe(true);
    expect(take(p, c.id, 5)).toBe(false), expect(p.bounties!.length).toBe(2);
  });
  it('counts the right pack and kind, not past n', () => {
    const p = fresh();
    p.bounties = [{ id: 'nest', day: 1, got: 0 }, { id: 'den', day: 1, got: 0 }];
    expect(countDeath(p, 407, 'spider')).toBe(false), expect(countDeath(p, 405, 'scrapper')).toBe(false), expect(countDeath(p, undefined, 'scrapper')).toBe(false);
    expect(countDeath(p, 407, 'nest')).toBe(true), expect(countDeath(p, 407, 'nest')).toBe(false);
    for (let i = 0; i < 6; i++) countDeath(p, 406, 'scrapper');
    expect(p.bounties.map((h) => h.got)).toEqual([1, 4]);
  });
  it('pays once, and only when done', () => {
    const p = fresh(), g = p.gold, xp = p.xp;
    p.bounties = [{ id: 'snarers', day: 1, got: 3 }];
    expect(handIn(p, 'snarers')).toBeNull();
    countDeath(p, 408, 'scrapper'), expect(isDone(p.bounties![0])).toBe(true);
    expect(handIn(p, 'snarers')).toEqual({ pay: 40, xp: 60 }), expect(p.gold).toBe(g + 40), expect(p.xp).toBe(xp + 60);
    expect(handIn(p, 'snarers')).toBeNull(), expect(p.bounties).toBeUndefined();
  });
  it('fits a saved list', () => {
    expect(fitBounties(undefined)).toBeUndefined(), expect(fitBounties([{ id: 'nope', day: 1, got: 0 }, 'x', null])).toBeUndefined();
    expect(fitBounties([{ id: 'den', day: 2, got: 99 }, { id: 'den', day: 2, got: 1 }, { id: 'wolves', day: 'a', got: 1 }, { id: 'snarers', day: 3, got: 1 }])).toEqual([{ id: 'den', day: 2, got: 4 }, { id: 'snarers', day: 3, got: 1 }]);
  });
});
