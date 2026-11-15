/** Modifiers that fit the class, in plain words (docs/design/gear-levels.md section 5). */
import { describe, expect, it } from 'vitest';
import { CLASS_KITS, HELD_KITS, MODS, MOD_TEXT, WEAPONS, guardOf, modFits, modPool, rollGear, weaponMods, type ArmorKind, type HeroClass, type ModId, type Tier } from '../src/shared/tuning';
import { barWords } from '../src/shared/barword';
import { Rng } from '../src/shared/rng';

const CLASSES = Object.keys(CLASS_KITS) as HeroClass[];
const swung = (kit: keyof typeof WEAPONS) => WEAPONS[kit].combo.some((s) => !s.thrust && !s.shot && s.arc >= 100);

describe('gear modifiers', () => {
  it('lets a weapon roll only what improves its own job', () => {
    for (const cls of CLASSES) for (const kit of CLASS_KITS[cls]) {
      const k = WEAPONS[kit], pool = weaponMods(kit);
      for (const id of pool) expect(modFits(id, cls, kit), `${kit} ${id}`).toBe(true);
      expect(pool.includes('draw'), `${kit} CHARGE SPEED`).toBe(HELD_KITS.includes(kit));
      expect(pool.includes('arc'), `${kit} SWEEP`).toBe(cls !== 'RANGER' && swung(kit));
      expect(pool.includes('finisher')).toBe(k.combo.length >= 2);
      expect(pool.includes('guard')).toBe(guardOf(k) === 'full');
      expect(pool.includes('backstab')).toBe(!!k.backstab);
      expect(pool.includes('spell') || pool.includes('thrift')).toBe(cls === 'MAGE');
      expect(pool.includes('mending')).toBe(cls === 'HEALER');
      expect(pool).not.toContain('damage');
    }
  });

  it('never rolls a modifier for a class where it changes nothing, on any kit, slot or weight', () => {
    const rng = new Rng(11), tiers: Tier[] = ['fine', 'forged', 'tolmouth', 'touched', 'turning'];
    for (const cls of CLASSES) {
      for (const kit of CLASS_KITS[cls]) for (let n = 0; n < 60; n++) {
        const it = rollGear(rng, cls, tiers[n % tiers.length], 'weapon', kit);
        for (const m of it.mods!) expect(weaponMods(kit), `${kit} ${m.id}`).toContain(m.id);
      }
      for (const slot of ['armor', 'ring'] as const) for (const w of ['light', 'medium', 'heavy'] as ArmorKind[]) for (let n = 0; n < 60; n++) {
        const it = rollGear(rng, cls, tiers[n % tiers.length], slot, undefined, w);
        for (const m of it.mods!) {
          expect(modFits(m.id, cls), `${cls} ${slot} ${w} ${m.id}`).toBe(true);
          expect(modPool(slot, cls, undefined, w)).toContain(m.id);
        }
      }
    }
  });

  it('gives every modifier a name and one short line, under 45 characters for every class', () => {
    for (const id of Object.keys(MODS) as ModId[]) {
      expect(MOD_TEXT[id], id).toBeTruthy();
      for (const cls of CLASSES) expect(barWords(MOD_TEXT[id], cls).length, `${id} ${cls}`).toBeLessThanOrEqual(45);
    }
    expect(MODS.draw.name).toBe('CHARGE SPEED');
    expect(MODS.spell.name).toBe('SPELL POWER');
  });
});
