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
