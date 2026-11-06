import { describe, expect, it } from 'vitest';
import { CHAINS, CLASS_CHAINS, PERKS, classPerks, fitPerks, newProfile, nextStep, perkOffer, perkText, resetPerks, takePerk, type PerkId } from '../src/shared/progress';
import { CLASS_DODGES, CLASS_GUARD, CLASS_KITS, CLASS_ORDER, MODS, TIER_ORDER, modFits, reroll, rollGear, rollHungry, rollTier, traitText, traitsFor, type HeroClass, type Item, type ModId } from '../src/shared/tuning';
import { trainerRows } from '../src/shared/trainrows';
import { treasure } from '../src/shared/treasure';
import { board } from '../src/shared/jobs';
import { jobXp } from '../src/shared/pace';
import { Rng } from '../src/shared/rng';

const guard = (c: HeroClass) => CLASS_GUARD[c], dodges = (c: HeroClass) => CLASS_DODGES[c];
/** Words that name a move: a class without it must never read them on anything offered. */
const PARRY = /parry|counter|riposte/i, BLOCK = /block|counterstroke/i, DODGE = /dodge|sidestep/i;
function wordsFit(text: string, c: HeroClass): void {
  // No class can parry now (2026-11-05): nothing offered says it.
  expect(text, `${c}: ${text}`).not.toMatch(/parry|riposte/i);
  if (guard(c) === 'none') expect(text, `${c}: ${text}`).not.toMatch(PARRY);
  if (guard(c) !== 'full') expect(text, `${c}: ${text}`).not.toMatch(BLOCK);
  if (!dodges(c)) expect(text, `${c}: ${text}`).not.toMatch(DODGE);
}
/** What each knack asks of the hero, by what it moves. */
function perkFits(id: PerkId, c: HeroClass): boolean {
  const fx = PERKS[id].fx;
  if (fx.guardArc || fx.counter || fx.counterTime) return guard(c) === 'full';
  if (fx.block) return guard(c) === 'full';
  if (fx.dodge || fx.leap || fx.light || fx.slip) return dodges(c);
  if (fx.bless || fx.blessTime || fx.mending || fx.mercy || fx.mercyReach || fx.smiteStun) return c === 'HEALER';
  if (fx.rear || fx.angle || fx.ambush || fx.quiet) return c === 'ROGUE';
  if (fx.perfect || fx.flash || fx.snareCd || fx.snareHold || fx.snares || fx.houndEvery || fx.houndBite || fx.houndBites) return c === 'RANGER';
  if (fx.primed || fx.clear || fx.twice || fx.burst || fx.image) return c === 'MAGE';
  if (fx.skillFar || fx.skillHold) return c === 'WARRIOR';
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

  it('each class has four chains of three, all its own: no knack twice, none shared with another class', () => {
    const seen = new Set<string>();
    for (const c of CLASS_ORDER) {
      expect(CLASS_CHAINS[c]).toHaveLength(4);
      expect(new Set(classPerks(c)).size).toBe(12);
      for (const id of classPerks(c)) expect(seen.has(id), id).toBe(false), seen.add(id);
    }
    expect(seen.size).toBe(Object.keys(PERKS).length);
  });

  it('a pick is taken only from the two on offer; reset gives every knack back as a pick, free', () => {
    const p = newProfile('ROGUE');
    Object.assign(p, { level: 4, picks: 3, gold: 50 });
    expect(takePerk(p, 'g_ambush')).toBe(false);
    for (let i = 0; i < 3; i++) expect(takePerk(p, perkOffer(p)[0])).toBe(true);
    expect(p.picks).toBe(0);
    expect(takePerk(p, perkOffer(p)[0])).toBe(false);
    resetPerks(p);
    expect(p).toMatchObject({ perks: [], picks: 3, gold: 50 });
  });

  it('old knacks land on the class chains; what has no home comes back as a pick; no level is lost', () => {
    const r = newProfile('ROGUE');
    Object.assign(r, { level: 5, perks: ['tough', 'guard', 'shadowed', 'fleet'], picks: 0 });
    fitPerks(r);
    expect(r.perks).toEqual(['g_rear', 'g_foot']);
    expect(r.picks).toBe(2);
    const w = newProfile('WARRIOR');
    Object.assign(w, { level: 3, perks: ['secondwind', 'ironhide'], picks: 0 });
    fitPerks(w);
    expect(w.perks).toEqual(['w_block']);
    expect(w.picks).toBe(1);
    // Step two without step one: the first step is still the next on offer.
    expect(nextStep('w_guard', w.perks)).toBe(0);
    // Two old knacks onto one step: the second comes back.
    const m = newProfile('MAGE');
    Object.assign(m, { level: 3, perks: ['focus', 'footwork'], picks: 0 });
    fitPerks(m);
    expect([m.perks, m.picks]).toEqual([['m_blink'], 1]);
    // A save that somehow lost picks: taken plus waiting covers every level up.
    const lost = newProfile('HEALER');
    Object.assign(lost, { level: 6, perks: ['h_wide'], picks: 1 });
    fitPerks(lost);
    expect(lost.picks).toBe(4);
    // New knacks of the class stay as they are.
    fitPerks(lost);
    expect([lost.perks, lost.picks]).toEqual([['h_wide'], 4]);
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
