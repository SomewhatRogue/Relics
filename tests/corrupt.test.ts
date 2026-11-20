// The Want's bands and who is corrupt (docs/design/holy-and-hungry.md sections 1 and 2), and the two bites that
// reach outside the hero's stats.
import { describe, expect, it } from 'vitest';
import { CORRUPT_AT, WANT_BANDS, bandOf, isCorrupt, wearsHungry } from '../src/shared/corrupt';
import { BITE_ORDER, type FedItem } from '../src/shared/hunger';
import { rollHungry } from '../src/shared/hungry';
import { Rng } from '../src/shared/rng';
import { gearStats, type Item } from '../src/shared/tuning';
import { goldKeep, othersHeal, seenBy, withBites } from '../src/sim/bites';
import { heals } from '../src/sim/hungry';
import { BITEW } from '../src/client/bitewords';
import type { Hero } from '../src/sim/types';

const plain: Item = { slot: 'armor', armor: 'light', quality: 'forged', traits: [], mods: [{ id: 'tough', v: 0.05 }], level: 0 };
const hungry = (bites?: FedItem['bites'], worn = 0): FedItem => ({ ...rollHungry(new Rng(5), 'ROGUE'), slot: 'ring', ...(bites ? { bites, worn } : {}) });
const hero = (want: number, rings: Item[] = []) => ({ id: 'h', weapon: 'daggers', arms: {}, armor: plain, legs: null, rings, want, baseHp: 100 }) as unknown as Hero;

describe('the Want bands', () => {
  it('bands at 15, 30 and 60, the gift growing 10, 20, 35%', () => {
    expect(bandOf(0)).toBe(WANT_BANDS[0]);
    expect(bandOf(14.9).gift).toBe(0);
    expect(bandOf(15).gift).toBe(0.1);
    expect(bandOf(30).gift).toBe(0.2);
    expect(bandOf(60).gift).toBe(0.35);
    expect(bandOf(undefined)).toBe(WANT_BANDS[0]);
  });
  it('corrupt in hungry gear, or at a Want of 30', () => {
    expect(isCorrupt(hero(0))).toBe(false);
    expect(isCorrupt(hero(CORRUPT_AT))).toBe(true);
    expect(isCorrupt(hero(0, [hungry()]))).toBe(true);
    expect(wearsHungry(hero(40))).toBe(false);
    const p = { weapon: 'daggers', arms: { daggers: hungry() }, armor: null, rings: [], want: 0 };
    expect(isCorrupt(p)).toBe(true);
  });
  it('a higher Want lifts hungry pieces\' modifiers, not the rest', () => {
    const ring = hungry(['frail'], 0), s0 = gearStats(undefined, plain, [ring]), s1 = gearStats(undefined, plain, [ring]);
    withBites(s0, hero(0, [ring]));
    withBites(s1, hero(60, [ring]));
    const m = ring.mods![0];
    expect(s1[m.id] - s0[m.id]).toBeCloseTo(m.v * 0.35);
    expect(s1.tough - s0.tough).toBeCloseTo(m.id === 'tough' ? m.v * 0.35 : 0);
  });
  it('goblins see you further off from 15, more with a NOTICED bite', () => {
    expect(seenBy(hero(0))).toBe(1);
    expect(seenBy(hero(20))).toBeCloseTo(1.15);
    expect(seenBy(hero(0, [hungry(['noticed'], 12)]))).toBeCloseTo(1.5);
  });
  it('a GREEDY bite eats its share of coin', () => {
    expect(goldKeep(hero(0))).toBe(1);
    expect(goldKeep(hero(0, [hungry(['greedy'], 12)]))).toBeCloseTo(0.5);
  });
  it('at 60, heals from others do half; your own are whole', () => {
    const h = hero(60), friend = { ...hero(0), id: 'f' } as Hero;
    expect(othersHeal(h)).toBe(0.5);
    expect(heals(h, friend, 10)).toBe(5);
    expect(heals(h, h, 10)).toBe(10);
    expect(heals(hero(59), friend, 10)).toBe(10);
  });
  it('every bite has its words', () => {
    for (const b of BITE_ORDER) expect(BITEW.text[b](10)).toContain('10%');
  });
});
