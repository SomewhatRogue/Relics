/** The three bows against each other (Kyle, 2026-11-23): the shortbow the least, for hit and run; the crossbow a lot
 *  more; the longbow a little more again. Paper damage a second on one goblin, every shot full. */
import { describe, expect, it } from 'vitest';
import { WEAPONS, type WeaponId } from '../src/shared/tuning';
import { XBOW } from '../src/shared/ranger';

const perSecond = (id: WeaponId) => {
  const w = WEAPONS[id], h = w.heavy;
  return (h.dmgFull ?? h.dmg) / ((w.draw ?? 1) + h.windup + h.active + h.recover + (w.reloads ? XBOW.reload : 0));
};

describe('the bows', () => {
  it('shortbow least, crossbow a lot more, longbow a little more again', () => {
    const [s, x, l] = (['shortbow', 'crossbow', 'longbow'] as const).map(perSecond);
    expect(x).toBeGreaterThan(s * 1.7);
    expect(l).toBeGreaterThan(x);
    expect(l).toBeLessThan(x * 1.3);
  });
  it('the shortbow, safe at range and on the move, does less a second than the daggers head on', () => {
    const d = WEAPONS.daggers, t = d.combo.reduce((a, s) => a + s.windup + s.active + s.recover, 0);
    expect(perSecond('shortbow')).toBeLessThan((d.combo.reduce((a, s) => a + s.dmg, 0) * d.front!) / t);
  });
});

import { tiredBy } from '../src/sim/hero';

describe('the longbow draw (Kyle, 2026-11-24: part draws hit too hard; held long it should weaken)', () => {
  const w = WEAPONS.longbow, h = w.heavy, at = (k: number) => Math.round(h.dmg + (h.dmgFull! - h.dmg) * k);
  it('a half draw is well under a full one; only the flash gets the most', () => {
    expect(at(0.5 ** w.ease!)).toBeLessThan(40);
    expect(at(0.9 ** w.ease!)).toBeLessThan(h.dmgFull! - 8);
  });
  it('held past the flash: steady for two seconds, then it tires down to 60% of the full draw', () => {
    expect(tiredBy(w, 1.9)).toBe(1);
    expect(tiredBy(w, 3)).toBeCloseTo(0.8);
    expect(tiredBy(w, 9)).toBe(0.6);
    expect(tiredBy(WEAPONS.shortbow, 9)).toBe(1);
  });
});
