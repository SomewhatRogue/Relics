import { describe, expect, it } from 'vitest';
import { WEAPON_ORDER, CLASS_KITS, CLASS_ORDER } from '../src/shared/tuning';
import { KIT, MAGE_KIT, kitLine, kitRows } from '../src/client/kitlines';
import { barWords } from '../src/shared/barword';
import { dodgeOfKit, guardKind, guardRating } from '../src/client/guardarea';
import { CLASSES, CLASS_TAG } from '../src/shared/classes';
import { dropPickups } from '../src/sim/pickups';
import { newEnemy } from '../src/sim/enemies';
import { Rng } from '../src/shared/rng';
import { fromJson } from '../src/client/save';
import { newProfile } from '../src/shared/progress';
import { newWorld } from '../src/shared/story';

describe("Kyle's weapon words: TAP, HOLD, PERFECT", () => {
  it('every weapon has all three, each a few words', () => {
    for (const w of WEAPON_ORDER) {
      const k = KIT[w];
      for (const v of [k.tap, k.hold, k.perfect]) expect(v.split(/\s+/).length, `${w}: ${v}`).toBeLessThanOrEqual(5);
      expect(kitLine(w)).toMatch(/^TAP: .+ {2}HOLD: .+ {2}PERFECT: .+$/);
    }
  });
});

describe('GUARD and DODGE areas, from the numbers', () => {
  it('rates the guards as the kits are built', () => {
    expect([guardRating('sword'), guardKind('sword')]).toEqual(['HIGH', 'BLOCK AND PARRY']);
    expect([guardRating('mace'), guardRating('censer')]).toEqual(['HIGH', 'HIGH']);
    expect([guardRating('spear'), guardRating('flail')]).toEqual(['MED', 'MED']);
    expect([guardRating('greatsword'), guardKind('greatsword')]).toEqual(['LOW', 'PARRY ONLY']);
    expect(guardKind('longbow')).toBe('PARRY ONLY');
    expect(guardKind('spellblade')).toBe('PARRY ONLY');
    expect([guardKind('daggers'), guardKind('wand')]).toEqual(['NONE', 'NONE']);
  });
  it("a Mage's bar is MAGIC on screen; everyone else's is STAMINA", () => {
    for (const w of CLASS_KITS.MAGE) expect(Object.values(KIT[w]).join(' ')).not.toMatch(/stamina/i);
    // A Mage's kit shows what a hold costs in magic, on the card and in each element.
    for (const w of CLASS_KITS.MAGE) for (const el of ['', 'fire', 'frost', 'storm'] as const) expect(kitRows(w, el).find(([l]) => l === 'COST')?.[1]).toMatch(/magic/);
    for (const w of CLASS_KITS.MAGE) for (const el of ['fire', 'frost', 'storm'] as const) for (const v of Object.values(MAGE_KIT[w as 'wand'][el])) expect(v.split(/\s+/).length, v).toBeLessThanOrEqual(5);
    expect(kitLine('wand', 'storm')).toBe('TAP: LIGHTNING STREAM, BUILDS UP  HOLD: LIGHTNING BOLT, IGNORES SHIELDS  PERFECT: WHOLE LINE, INTERRUPTS ANY BLOW');
    // The stream doesn't break blows: the wand's storm says what it does instead.
    expect(kitRows('wand', 'storm').find(([l]) => l === 'ALSO')?.[1]).toBe("Walk slowly while it's on");
    expect(KIT.spellblade.also).toBe('Parry fills the blade');
    expect(barWords('Shorter dodge, costs more stamina', 'MAGE')).toBe('Shorter dodge, costs more magic');
    expect(barWords('STAMINA RECOVERY', 'RANGER')).toBe('STAMINA RECOVERY');
  });
  it('names the dodge, or NONE for a Warrior or a Cleric', () => {
    expect(CLASS_ORDER.map((c) => dodgeOfKit(CLASS_KITS[c][0]))).toEqual(['NONE', 'JUMP', 'DASH', 'BLINK', 'NONE']);
  });
  it('every class has a tagline, a line, a guard line and a skill, and no pitch', () => {
    for (const c of CLASS_ORDER) {
      expect(CLASS_TAG[c].length).toBeGreaterThan(0);
      expect(CLASSES[c].skill).toContain(':');
      expect('pitch' in CLASSES[c] || 'cant' in CLASSES[c]).toBe(false);
    }
  });
});

describe('only Bitter and Brandy (Kyle, 2026-11-04)', () => {
  it('goblins drop nothing else', () => {
    const got = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const e = newEnemy(i, 'butcher', 5, 5);
      Object.assign(e, { respawns: false, name: 'MAWL' });
      const out: Parameters<typeof dropPickups>[1] = [];
      dropPickups(e, out, new Rng(i));
      for (const p of out) if (p.potion) got.add(p.potion);
    }
    expect([...got].sort()).toEqual(['bitter', 'brandy']);
  });
  it('a saved belt with oil, frost or smoke comes back as Bitter', () => {
    const p = { ...newProfile('WARRIOR', 'OLD'), belt: ['oil', 'brandy', 'smoke'] };
    const s = fromJson({ heroes: [p as never], current: 0, world: newWorld() });
    expect(s!.heroes[0].belt).toEqual(['bitter', 'brandy', 'bitter']);
  });
});
