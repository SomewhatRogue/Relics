import { describe, expect, it } from 'vitest';
import { CHAINS, CLASS_CHAINS, PERKS, classPerks, fitPerks, newProfile, nextStep, perkOffer, perkText, type PerkId } from '../src/shared/progress';
import { CLASS_DODGES, CLASS_GUARD, CLASS_KITS, CLASS_ORDER, MODS, TIER_ORDER, modFits, reroll, rollGear, rollHungry, rollTier, traitText, traitsFor, type HeroClass, type Item, type ModId } from '../src/shared/tuning';
import { trainerRows } from '../src/shared/trainrows';
import { treasure } from '../src/shared/treasure';
import { board } from '../src/shared/jobs';
import { jobXp } from '../src/shared/pace';
import { Rng } from '../src/shared/rng';

const guard = (c: HeroClass) => CLASS_GUARD[c], dodges = (c: HeroClass) => CLASS_DODGES[c];
/** Words that name a move: a class without it must never read them on anything offered. */
const PARRY = /parry|counter|riposte/i, BLOCK = /block/i, DODGE = /dodge|sidestep/i;
function wordsFit(text: string, c: HeroClass): void {
  if (guard(c) === 'none') expect(text, `${c}: ${text}`).not.toMatch(PARRY);
  if (guard(c) !== 'full') expect(text, `${c}: ${text}`).not.toMatch(BLOCK);
  if (!dodges(c)) expect(text, `${c}: ${text}`).not.toMatch(DODGE);
}
/** What each knack asks of the hero, by what it moves. */
function perkFits(id: PerkId, c: HeroClass): boolean {
  const fx = PERKS[id].fx;
  if (fx.parry || fx.counter) return guard(c) !== 'none' && (!fx.counter || guard(c) === 'full');
  if (fx.block) return guard(c) === 'full';
  if (fx.dodge) return dodges(c);
  if (fx.bless || fx.mending) return c === 'HEALER';
  if (fx.rear) return c === 'ROGUE';
  return true;
}

describe('the knacks tree', () => {
  it('walks every class through every offer: two chains, each its next step, nothing it cannot do', () => {
    for (const c of CLASS_ORDER) for (let path = 0; path < 40; path++) {
      const p = newProfile(c), rng = new Rng(path + 1);
      for (let lv = 2; lv <= 13; lv++) {
        p.level = lv;
        p.picks = 1;
        const offer = perkOffer(p);
        if (!offer.length) break;
        const chains = offer.map((id) => CLASS_CHAINS[c].find((ch) => CHAINS[ch].steps[nextStep(ch, p.perks)] === id));
        expect(chains.every(Boolean)).toBe(true);
        expect(new Set(chains).size).toBe(offer.length);
        for (const id of offer) {
          expect(perkFits(id, c), `${c} offered ${id}`).toBe(true);
          wordsFit(perkText(id, c) + ' ' + perkText(id, c, 'gain'), c);
        }
        p.perks.push(offer[Math.floor(rng.next() * offer.length)]);
      }
      expect(p.perks.length).toBe(12);
    }
  });

  it('each class has four chains of three, with no knack twice', () => {
    for (const c of CLASS_ORDER) {
      expect(CLASS_CHAINS[c]).toHaveLength(4);
      expect(classPerks(c)).toHaveLength(12);
    }
  });

  it("an old hero keeps their knacks; one their class can't use comes back as a pick", () => {
    const p = newProfile('ROGUE');
    Object.assign(p, { perks: ['tough', 'guard', 'footwork'], picks: 0 });
    fitPerks(p);
    expect(p.perks).toEqual(['tough', 'footwork']);
    expect(p.picks).toBe(1);
    const w = newProfile('WARRIOR');
    Object.assign(w, { perks: ['secondwind', 'ironhide'], picks: 0 });
    fitPerks(w);
    expect(w.perks).toEqual(['secondwind', 'ironhide']);
    // Step two without step one: the first step is still the next on offer.
    expect(nextStep('body', w.perks)).toBe(0);
  });
});

describe('class-true gear', () => {
  const fits = (it: Item, c: HeroClass) => {
    for (const m of it.mods ?? []) expect(modFits(m.id, c), `${c} rolled ${m.id}`).toBe(true);
    for (const t of it.traits) wordsFit(traitText(t, c), c);
  };
  it('weapons, armor and rings only roll what the class can use', () => {
    const rng = new Rng(7);
    for (const c of CLASS_ORDER) for (let i = 0; i < 300; i++) {
      const tier = TIER_ORDER[i % 4], slot = (['weapon', 'armor', 'ring'] as const)[i % 3];
      const it = rollGear(rng, c, tier, slot);
      fits(it, c);
      if (it.mods?.length) fits(reroll(rng, it, 0, c), c);
      fits(rollHungry(rng, c), c);
    }
  });
  it('no kit rolls a trait its class cannot use', () => {
    for (const c of CLASS_ORDER) for (const k of CLASS_KITS[c]) for (const t of traitsFor(k)) wordsFit(traitText(t, c), c);
  });
  it('treasure is rolled class-true too', () => {
    for (const c of CLASS_ORDER) for (let d = 1; d < 15; d++) for (const job of board(d)) for (const it of treasure(job, c, 'h' + c, d, 3)) fits(it, c);
  });
  it("the trainer's words fit the class", () => {
    for (const c of CLASS_ORDER) {
      const p = newProfile(c);
      p.level = 10;
      for (const r of trainerRows(p)) wordsFit([r.name, r.text, r.gain, r.now, r.next].join(' '), c);
    }
  });
  it('every modifier fits at least the class it was made for', () => {
    expect((Object.keys(MODS) as ModId[]).filter((m) => !CLASS_ORDER.some((c) => modFits(m, c)))).toEqual([]);
  });
});

describe('pace', () => {
  it('a party earns more than alone, but not a multiple', () => {
    const solo = jobXp(300, true, 1), three = jobXp(300 * 2.2, true, 3);
    expect(three).toBeGreaterThan(solo);
    expect(three / solo).toBeLessThan(1.5);
  });
  it('danger lifts a roll only as far as Forged: Tolmouth is found, never lifted into', () => {
    const rng = new Rng(3);
    let purple = 0;
    for (let i = 0; i < 2000; i++) if (rollTier(rng, 'chest', 3) === 'tolmouth') purple++;
    expect(purple / 2000).toBeLessThan(0.04);
  });
});
