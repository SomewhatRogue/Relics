/** The Mage's techniques (shared/techniques.ts, sim/techmage.ts): PRIMED SPELLS, ATTUNED, SPELLTHIEF firing, and not without them. */
import { describe, expect, it } from 'vitest';
import { BURN, CHANNEL, FROST, SPELL, type WeaponId } from '../src/shared/tuning';
import { ATTUNED, PRIMED, SPELLTHIEF } from '../src/shared/techniques';
import { newEnemy } from '../src/sim/enemies';
import { newHero } from '../src/sim/hero';
import { afflict, chill, type World } from '../src/sim/elements';
import { spendPrimed } from '../src/sim/channel';
import { paySpell } from '../src/sim/spells';
import { ICICLE_SHARE, wetMult } from '../src/sim/techmage';
import type { Enemy, FightEvent, Hero } from '../src/sim/types';

const mage = (weapon: WeaponId, rank: number): Hero => Object.assign(newHero('me', 9, 9), { weapon, drills: { technique: rank } });
const goblin = (): Enemy => Object.assign(newEnemy(1, 'scrapper', 9, 7), { hp: 400, maxHp: 400, lastBy: 'me', respawns: false });
const world = (h: Hero, e: Enemy, now = 10): World => ({ heroes: [h], enemies: [e], javelins: [], props: [], now, ev: [] });

describe("the Mage's techniques", () => {
  it('PRIMED SPELLS: a primed spell does 80% more, not 50%', () => {
    for (const rank of [0, 1]) {
      const h = Object.assign(mage('wand', rank), { primed: true, primeLeft: 1 });
      expect(spendPrimed(h)).toBeCloseTo(CHANNEL.primed + (rank ? PRIMED.more : 0));
      expect(h.primed).toBe(false);
    }
    expect(CHANNEL.primed + PRIMED.more).toBeCloseTo(1.8);
  });

  it('ATTUNED fire: a Mage sets goblins burning half again as long', () => {
    for (const rank of [1, 2]) {
      const h = mage('staff', rank), e = goblin(), w = world(h, e);
      afflict(w, e, 'fire', 5);
      expect(e.burnUntil).toBeCloseTo(10 + BURN.time * (rank === 2 ? ATTUNED.burn : 1));
      expect(w.ev.some((x) => x.k === 'attuned')).toBe(rank === 2);
    }
  });

  it('ATTUNED frost: three chilling hits in a row freeze (a wand tap of three icicles is one)', () => {
    for (const rank of [1, 2]) {
      const h = mage('spellblade', rank), e = goblin(), w = world(h, e);
      for (let i = 0; i < 3; i++) (w.now += 0.4), chill(w, e);
      expect(e.frozenUntil > w.now).toBe(rank === 2);
      expect(e.chillUntil > w.now).toBe(rank === 1);
    }
    const h = mage('wand', 2), e = goblin(), w = world(h, e);
    // Two taps' icicles: not yet; the third tap's: frozen.
    for (let t = 0; t < 2; t++) for (let i = 0; i < 3; i++) chill(w, e, ICICLE_SHARE);
    expect(e.frozenUntil > w.now).toBe(false);
    for (let i = 0; i < 3; i++) chill(w, e, ICICLE_SHARE);
    expect(e.frozenUntil).toBeCloseTo(w.now + FROST.freeze * FROST.small); // (a small one: frozen longer)
    // Let the chill lapse and it starts over.
    const f = goblin(), v = world(h, f);
    chill(v, f), chill(v, f);
    v.now += FROST.chill + 0.1;
    chill(v, f);
    expect(f.frozenUntil > v.now).toBe(false);
  });

  it("ATTUNED storm: the wet bonus is bigger (the hook the wet rule reads)", () => {
    expect(wetMult(mage('wand', 2), 1.5)).toBe(ATTUNED.wet);
    expect(wetMult(mage('wand', 1), 1.5)).toBe(1.5);
    expect(wetMult(Object.assign(newHero('w', 0, 0), { weapon: 'sword' as WeaponId, drills: { technique: 3 } }), 1.5)).toBe(1.5);
  });

  it('SPELLTHIEF: a PERFECT hold gives back half its magic; a plain one nothing', () => {
    for (const rank of [2, 3])
      for (const perfect of [false, true]) {
        const h = Object.assign(mage('wand', rank), { stamina: 100, perfect, heavy: true }), ev: FightEvent[] = [];
        expect(paySpell(h, 10, ev)).toBe(true);
        const back = rank === 3 && perfect ? Math.round(SPELL.wand * SPELLTHIEF.back) : 0;
        expect(h.stamina).toBe(100 - SPELL.wand + back);
        expect(ev.some((x) => x.k === 'spellthief')).toBe(back > 0);
      }
    // A spellblade's perfect is free already: it gives back half of what the hold would have cost.
    const b = Object.assign(mage('spellblade', 3), { stamina: 50, perfect: true }), ev: FightEvent[] = [];
    paySpell(b, 10, ev);
    expect(b.stamina).toBe(50 + Math.round(SPELL.spellblade * SPELLTHIEF.back));
  });
});
