/** Walking pace by class (Kyle: Rogue and Ranger quick; Warrior, Mage and Cleric "all the same slow speed",
 *  2026-11-16: "they gotta be slow", no knack for speed, only a little from gear). */
import { describe, expect, it } from 'vitest';
import { ARMOR, CLASS_ARMOR } from '../src/shared/budget';
import { CAPS } from '../src/shared/mods';
import { PERKS } from '../src/shared/perks';
import { WEAPONS, type HeroClass } from '../src/shared/tuning';

const pace = (cls: HeroClass) => Object.values(WEAPONS).filter((w) => w.cls === cls).map((w) => +(w.speed * ARMOR[CLASS_ARMOR[cls]].speed).toFixed(2));

describe('walking pace', () => {
  it('the Warrior, Mage and Cleric walk the same, in their own armour; the Rogue and Ranger well quicker', () => {
    const slow = [...pace('WARRIOR'), ...pace('MAGE'), ...pace('HEALER')];
    expect(Math.max(...slow) - Math.min(...slow)).toBeLessThanOrEqual(0.01);
    for (const q of [...pace('ROGUE'), ...pace('RANGER')]) expect(q).toBeGreaterThan(Math.max(...slow) * 1.4);
  });

  it('no knack makes you faster, and gear only a little', () => {
    expect(Object.values(PERKS).filter((p) => 'foot' in (p.fx ?? {}))).toEqual([]);
    expect(CAPS.foot).toBeLessThanOrEqual(0.1);
  });
});
