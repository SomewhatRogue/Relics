/**
 * Halvard's pluses (shared/forgeplus.ts, Kyle 2026-11-06): +0 to +5 on every piece but hungry gear, a
 * steep price climbing by tier, each plus a visible tenth more of the piece's own numbers, every plus
 * struck at the anvil (no plain UPGRADE), a quit after paying keeps the plus, old saves capped at +5.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PLUS, PLUS_CAP, PLUS_GOLD, TIER_ORDER, WEAPONS, gearStats, plusCost, plusOf, type Item, type Tier } from '../src/shared/tuning';
import { plusRows, plusStep } from '../src/shared/plusrows';
import { payFor } from '../src/shared/jobs';
import { newProfile } from '../src/shared/progress';
import { newWorld } from '../src/shared/story';

const store = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
const { Game } = await import('../src/client/game');
const { fromJson } = await import('../src/client/save');
const { FORGE } = await import('../src/client/storewords');

const sword = (quality: Tier = 'forged', level = 0): Item => ({ slot: 'weapon', kit: 'sword', quality, traits: [], mods: [{ id: 'quick', v: 0.08 }, { id: 'reach', v: 0.06 }], level });
const plate = (level = 0): Item => ({ slot: 'armor', armor: 'heavy', quality: 'forged', traits: [], mods: [{ id: 'guard', v: 0.1 }], level });
const ring = (level = 0): Item => ({ slot: 'ring', quality: 'fine', traits: [], mods: [{ id: 'crit', v: 0.05 }], level });
const row = (it: Item, id: string) => plusRows(it).find((r) => r.id === id)!.v;

describe('the price curve', () => {
  it('a Forged piece costs 60, 150, 350, 800 and 1800 gold a plus, steeper every step', () => {
    expect([0, 1, 2, 3, 4].map((l) => plusCost(sword('forged', l))!.gold)).toEqual([60, 150, 350, 800, 1800]);
    for (let l = 2; l <= PLUS_CAP; l++) expect(PLUS_GOLD[l] / PLUS_GOLD[l - 1]).toBeGreaterThanOrEqual(2);
  });

  it('scales by tier, plain cheapest to turning dearest; hungry gear and +5 have no price', () => {
    const tiers = TIER_ORDER.filter((t) => t !== 'hungry'), to5 = (t: Tier) => [0, 1, 2, 3, 4].reduce((n, l) => n + plusCost(sword(t, l))!.gold, 0);
    for (let i = 1; i < tiers.length; i++) expect(to5(tiers[i])).toBeGreaterThan(to5(tiers[i - 1]));
    expect(to5('forged')).toBe(3160);
    expect(plusCost({ ...sword('hungry'), hungry: 'x' })).toBeNull();
    expect(plusCost(sword('forged', 5))).toBeNull();
  });

  it('+5 is a real goal: a Forged piece takes well over ten medium jobs of pay', () => {
    const job = payFor(3, 1, false, 'medium');
    expect(3160 / job).toBeGreaterThan(10);
  });
});

describe('each plus shows on the piece', () => {
  it('a weapon hits 10% of its base harder a plus, and each modifier grows a tenth of itself', () => {
    const base = WEAPONS.sword.combo[0].dmg;
    for (let l = 0; l <= 5; l++) {
      expect(row(sword('forged', l), 'hit')).toBeCloseTo(base * (1 + l * PLUS.damage), 9);
      expect(row(sword('forged', l), 'quick')).toBeCloseTo(0.08 * (1 + l * PLUS.mods), 9);
    }
    expect(plusRows(sword('forged', 3)).find((r) => r.id === 'charge')!.v).toBeCloseTo(WEAPONS.sword.heavy.dmgFull * 1.3, 9);
  });

  it('armor takes 2% less damage a plus (of any weight), its modifiers grow too', () => {
    for (let l = 0; l <= 5; l++) expect(row(plate(l), 'taken')).toBeCloseTo(0.75 * (1 - l * PLUS.tough), 9);
    expect(row(plate(4), 'guard')).toBeCloseTo(0.1 * 1.4, 9);
    const light: Item = { ...plate(5), armor: 'light', mods: [] };
    expect(row(light, 'taken')).toBeCloseTo(1 - 5 * PLUS.tough, 9);
  });

  it('a ring gives 3 more health a plus, and its modifiers grow', () => {
    for (let l = 0; l <= 5; l++) expect(row(ring(l), 'health')).toBe(l * PLUS.health);
    expect(row(ring(2), 'crit')).toBeCloseTo(0.05 * 1.2, 9);
  });

  it('the rows are what the room fights with, and the step after differs in every row', () => {
    const w = sword('forged', 3), g = gearStats(w, plate(2), [ring(1)]);
    expect(g.quick).toBeCloseTo(0.08 * 1.3, 9);
    expect(g.damage).toBeCloseTo(0.3, 9);
    expect(g.health).toBe(3);
    const step = plusStep(sword('forged', 2))!;
    step.now.forEach((r, i) => expect(step.after[i].v).toBeGreaterThan(r.v));
  });
});

describe('the cap', () => {
  it('+5 is the top: no next step, a save at +9 fights as +5', () => {
    expect(plusStep(sword('forged', 5))).toBeNull();
    expect(plusOf(sword('forged', 9))).toBe(5);
    expect(gearStats(sword('forged', 9), null)).toEqual(gearStats(sword('forged', 5), null));
  });
});

describe('at the forge', () => {
  const fresh = () => {
    store.clear();
    const g = new Game();
    g.create('WARRIOR', 'smith');
    g.skipWood();
    Object.assign(g.profile, { gold: 99999, steel: 999 });
    return g;
  };

  it('there is no plain UPGRADE: the only way up is to strike it yourself', () => {
    expect('upgrade' in Game.prototype).toBe(false);
    expect('up' in FORGE).toBe(false);
    const src = readFileSync(new URL('../src/client/stores.ts', import.meta.url), 'utf8');
    const worn = src.slice(src.indexOf('function forge('), src.indexOf("show(panel, PLACES.forge.name"));
    expect(worn).toContain('FORGE.strike(');
    expect(worn).toContain('openAnvil');
    expect(worn).not.toMatch(/g\.upgrade\(|FORGE\.up\(/);
  });

  it('levels to +5 and no further, nothing taken at the top', () => {
    const g = fresh();
    for (let i = 0; i < 5; i++) expect(g.levelUp(g.profile.armor!)).not.toBeNull();
    expect(g.profile.armor!.level).toBe(5);
    const gold = g.profile.gold;
    expect(g.levelUp(g.profile.armor!)).toBeNull();
    expect(g.profile.gold).toBe(gold);
  });

  it('a quit or a refresh at the anvil keeps the plain plus, paid', () => {
    const g = fresh(), cost = plusCost(g.profile.armor!)!;
    g.levelUp(g.profile.armor!);
    // The hammer never comes down: a fresh page loads what was kept.
    const back = new Game();
    back.choose(0);
    expect(back.profile.armor!.level).toBe(1);
    expect(back.profile.gold).toBe(99999 - cost.gold);
    expect(back.profile.armor!.temper).toBeUndefined();
  });
});

describe('old saves', () => {
  it('pieces over +5 come down to +5 everywhere a hero keeps them; temper stays', () => {
    const p = newProfile('WARRIOR', 'Old', 'hsave1'), over = (x: Item): Item => ({ ...x, level: 7, temper: 0.6 });
    Object.assign(p, { arms: { sword: over(sword()) }, armor: over(plate()), rings: [over(ring())], bag: [over(sword())], stash: [over(ring())], buyback: [{ item: over(plate()), price: 10, runs: 0 }] });
    const h = fromJson(JSON.parse(JSON.stringify({ heroes: [p], current: 0, world: newWorld() })))!.heroes[0];
    const all = [h.arms.sword!, h.armor!, ...h.rings, ...h.bag, ...h.stash!, ...h.buyback!.map((b) => b.item)];
    expect(all.map((x) => x.level)).toEqual([5, 5, 5, 5, 5, 5]);
    expect(all.every((x) => x.temper === 0.6)).toBe(true);
    // Up to +5 is left as it was.
    const ok = fromJson(JSON.parse(JSON.stringify({ heroes: [{ ...p, armor: plate(3) }], current: 0, world: newWorld() })))!.heroes[0];
    expect(ok.armor!.level).toBe(3);
  });
});
