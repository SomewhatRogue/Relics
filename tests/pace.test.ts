/** Walking pace by class (Kyle: Rogue and Ranger quick; Warrior, Mage and Cleric "all the same slow speed",
 *  2026-11-16: "they gotta be slow", no knack for speed, only a little from gear). */
import { describe, expect, it } from 'vitest';
import { ARMOR, CLASS_ARMOR } from '../src/shared/budget';
import { CAPS } from '../src/shared/mods';
import { PERKS } from '../src/shared/perks';
import { MAGE_PACE, WEAPONS, type HeroClass } from '../src/shared/tuning';
import { statsOf } from '../src/sim/gearstats';
import { newHero } from '../src/sim/hero';
import type { Hero } from '../src/sim/types';

const pace = (cls: HeroClass) => Object.values(WEAPONS).filter((w) => w.cls === cls).map((w) => +(w.speed * ARMOR[CLASS_ARMOR[cls]].speed).toFixed(2));

describe('walking pace', () => {
  it('the Warrior, Mage and Cleric walk the same, in their own armour; the Rogue and Ranger well quicker', () => {
    const slow = [...pace('WARRIOR'), ...pace('MAGE'), ...pace('HEALER')];
    expect(Math.max(...slow) - Math.min(...slow)).toBeLessThanOrEqual(0.01);
    for (const q of [...pace('ROGUE'), ...pace('RANGER')]) expect(q).toBeGreaterThan(Math.max(...slow) * 1.4);
  });

  it('a Mage stays slow: no knack of theirs makes them faster, and everything together at most MAGE_PACE.most (the rest may)', () => {
    expect(Object.entries(PERKS).filter(([id, p]) => id.startsWith('m_') && 'foot' in (p.fx ?? {}))).toEqual([]);
    const h: Hero = Object.assign(newHero('me', 0, 0), { weapon: 'wand' as const, drills: { speed: 3 }, streakStep: 4 });
    expect(statsOf(h).speed).toBeLessThanOrEqual(1 + MAGE_PACE.most + 1e-9);
    expect(CAPS.foot).toBeGreaterThan(MAGE_PACE.most);
  });
});
