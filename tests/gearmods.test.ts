/** Modifiers that fit the class, in plain words (docs/design/gear-levels.md section 5). */
import { describe, expect, it } from 'vitest';
import { HERO, LEGS_THREAT, growAt, raise, CLASS_KITS, HELD_KITS, LEGS_MODS, LEGS_SHARE, MOD_COUNT, PER_MOD, budget, gearStats, MODS, MOD_TEXT, WEAPONS, guardOf, modFits, modPool, rollGear, weaponMods, type ArmorKind, type HeroClass, type ModId, type Tier } from '../src/shared/tuning';
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
      for (const slot of ['armor', 'legs', 'ring'] as const) for (const w of ['light', 'medium', 'heavy'] as ArmorKind[]) for (let n = 0; n < 60; n++) {
        const it = rollGear(rng, cls, tiers[n % tiers.length], slot, undefined, w);
        for (const m of it.mods!) {
          expect(modFits(m.id, cls), `${cls} ${slot} ${w} ${m.id}`).toBe(true);
          expect(modPool(slot, cls, undefined, w)).toContain(m.id);
        }
      }
    }
  });

  it('rolls legs for movement and staying up only, at half a chest piece', () => {
    const rng = new Rng(5);
    for (const w of ['light', 'medium', 'heavy'] as ArmorKind[]) {
      expect(LEGS_MODS[w].some((id) => ['crit', 'guard', 'damage', 'quick', 'reach'].includes(id))).toBe(false);
      for (let n = 0; n < 40; n++) {
        const it = rollGear(rng, 'ROGUE', 'tolmouth', 'legs', undefined, w);
        expect(it.slot).toBe('legs');
        for (const m of it.mods!) expect(LEGS_MODS[w]).toContain(m.id);
      }
    }
    expect(budget('touched', 'legs')).toBeCloseTo(MOD_COUNT.touched * PER_MOD.touched * LEGS_SHARE);
    // Worn legs add their modifiers and never the weight: plate legs on a hero in leathers leave the leathers' speed.
    const legs = { slot: 'legs', armor: 'heavy', quality: 'forged', traits: [], mods: [{ id: 'tough', v: 0.05 }], ilvl: 1 } as const;
    const g = gearStats(undefined, null, [], { ...legs, traits: [], mods: [...legs.mods] });
    expect([g.tough, g.speed]).toEqual([0.05, 1]);
  });

  it('measures what legs add, and goblins hit that much harder (threat.ts LEGS_THREAT)', () => {
    const rng = new Rng(3), g0 = gearStats(undefined, null, []);
    for (const lv of [1, 5, 10]) {
      let s = 0, n = 0;
      for (const cls of Object.keys(CLASS_KITS) as HeroClass[]) for (const w of ['light', 'medium', 'heavy'] as ArmorKind[]) for (let k = 0; k < 60; k++) {
        const g = gearStats(undefined, null, [], raise(rollGear(rng, cls, 'forged', 'legs', undefined, w), lv));
        s += (HERO.hp + g.health) / g.taken / ((HERO.hp + g0.health) / g0.taken) - 1, n++;
      }
      // Within a fifth of the measure: a FORGED pair at your level keeps you up this much longer.
      expect(s / n / (LEGS_THREAT * growAt(lv))).toBeGreaterThan(0.8);
      expect(s / n / (LEGS_THREAT * growAt(lv))).toBeLessThan(1.2);
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
