/**
 * The shops and item stats rework (Kyle, 2026-11-05): seeded vendor stock, the pawn, mods that fit, light
 * against heavy, the seven tiers, and old saves.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  ARMOR_MODS, CLASS_KITS, CLASS_ORDER, MODS, PRICE, RARE, RING_MODS, TIERS, TIER_ORDER, WEAPONS, WEAPON_ORDER, budget, frame, gearStats, guardOf,
  itemPoints, modFits, priceOf, rollGear, rollTier, sellValue, weaponMods, type HeroClass, type Item, type ModId, type Tier,
} from '../src/shared/tuning';
import { STOCK, STOCK_MS, buyStock, cantBuy, stockFor, stockLeft, stockWindow, type Shopper, type VendorId } from '../src/shared/vendors';
import { BAG, pawn } from '../src/shared/bags';
import { rollHungry } from '../src/shared/hungry';
import { Rng } from '../src/shared/rng';
import { fromJson } from '../src/client/save';
import { newProfile } from '../src/shared/progress';
import { newWorld } from '../src/shared/story';

const WINDOWS = 4000;
const shopper = (cls: HeroClass, gold = 1e6): Shopper => ({ cls, gold, bag: [], steel: 0, runs: 0, bagSize: 24 });

describe('vendor stock', () => {
  it('is the same for everyone within a ten minute window, and different across windows', () => {
    const t = Date.UTC(2026, 10, 5, 14, 3), win = stockWindow(t);
    expect(stockWindow(t + 6 * 60000)).toBe(win);
    expect(stockWindow(t + 7 * 60000)).toBe(win + 1);
    expect(stockLeft(t)).toBe(7 * 60000);
    for (const v of [...CLASS_ORDER, 'pawn'] as VendorId[]) {
      // Two players (two devices) asking in the same window get the same pieces, mods and all.
      expect(JSON.stringify(stockFor(v, win))).toBe(JSON.stringify(stockFor(v, stockWindow(t + 5 * 60000))));
      expect(JSON.stringify(stockFor(v, win))).not.toBe(JSON.stringify(stockFor(v, win + 1)));
    }
    // And the vendors differ from each other in one window.
    expect(JSON.stringify(stockFor('MAGE', win))).not.toBe(JSON.stringify(stockFor('ROGUE', win)));
    expect(STOCK_MS).toBe(600000);
  });

  it("is class-appropriate: a class vendor's weapons are its class's kits, and every modifier fits the class", () => {
    for (const c of CLASS_ORDER) for (let w = 0; w < 300; w++) {
      const s = stockFor(c, w);
      expect(s.length).toBe(STOCK.class.count);
      expect(s.slice(0, 3).every((it) => it.slot === 'weapon' && CLASS_KITS[c].includes(it.kit!))).toBe(true);
      expect([s[3].slot, s[4].slot]).toEqual(['armor', 'ring']);
      for (const it of s) for (const m of it.mods ?? []) expect(modFits(m.id, c, it.kit), `${c} ${m.id}`).toBe(true);
      expect(s.some((it) => it.quality === 'hungry')).toBe(false);
    }
  });

  it('now and then has something really good, priced to match', () => {
    const count: Partial<Record<Tier, number>> = {};
    let strongBest = 0, weakBest = Infinity;
    for (let w = 0; w < WINDOWS; w++) for (const it of stockFor('WARRIOR', w)) {
      count[it.quality] = (count[it.quality] ?? 0) + 1;
      if (it.quality === 'tolmouth' && it.slot === 'weapon') (strongBest = Math.max(strongBest, priceOf(it))), (weakBest = Math.min(weakBest, priceOf(it)));
    }
    const n = WINDOWS * STOCK.class.count, share = (t: Tier) => (count[t] ?? 0) / n;
    // Rare, each rarer than the last, and never hungry.
    expect(share('touched')).toBeGreaterThan(0.01);
    expect(share('touched')).toBeLessThan(0.04);
    expect(share('turning')).toBeGreaterThan(0.002);
    expect(share('turning')).toBeLessThan(share('touched'));
    expect(count.hungry ?? 0).toBe(0);
    // A strong roll costs a good deal more than a weak one of the same tier.
    expect(strongBest).toBeGreaterThan(weakBest * 1.6);
    // Prices climb with the tier; a TURNING piece costs about as much as the biggest pack.
    const order = TIER_ORDER.filter((t) => t !== 'hungry');
    for (let i = 1; i < order.length; i++) expect(PRICE[order[i]]).toBeGreaterThan(PRICE[order[i - 1]] * 2);
    const turning = rollGear(new Rng(3), 'WARRIOR', 'turning', 'weapon', 'sword');
    expect(priceOf(turning)).toBeGreaterThan(BAG.gold[3]);
    expect(priceOf(rollHungry(new Rng(3), 'WARRIOR'))).toBe(0);
  });

  it('buying takes the gold, puts it in your pack, and it is gone for you until the stock turns', () => {
    const p = shopper('MAGE'), win = 77, i = stockFor('MAGE', win).findIndex((it) => it.slot === 'weapon');
    const it = buyStock(p, 'MAGE', win, i)!;
    expect(p.bag).toEqual([it]);
    expect(p.gold).toBe(1e6 - priceOf(it));
    expect(cantBuy(p, 'MAGE', win, i)).toBe('gone');
    expect(cantBuy(p, 'MAGE', win + 1, i)).not.toBe('gone');
    // Another class's weapon can't be bought; a poor hero can't buy at all.
    expect(cantBuy(shopper('ROGUE'), 'MAGE', win, i)).toBe('class');
    expect(cantBuy(shopper('MAGE', 0), 'MAGE', win, i)).toBe('gold');
  });
});

describe("Tobin's stall", () => {
  it('sells a random spread of any class, mostly plain to forged, now and then better', () => {
    const kits = new Set<string>(), tiers: Partial<Record<Tier, number>> = {};
    for (let w = 0; w < WINDOWS; w++) for (const it of stockFor('pawn', w)) {
      if (it.kit) kits.add(it.kit);
      tiers[it.quality] = (tiers[it.quality] ?? 0) + 1;
    }
    expect(kits.size).toBe(WEAPON_ORDER.length);
    const n = WINDOWS * STOCK.pawn.count, low = ((tiers.plain ?? 0) + (tiers.fine ?? 0) + (tiers.forged ?? 0)) / n;
    expect(low).toBeGreaterThan(0.9);
    expect(tiers.tolmouth).toBeGreaterThan(0);
    // Never the rare three: he won't touch them (Kyle, 2026-11-05).
    for (const t of RARE) expect(tiers[t] ?? 0, t).toBe(0);
  });

  it('buys anything but the rare three at a fair cut of its worth (fence.test.ts has the rest)', () => {
    const rng = new Rng(4);
    for (const t of TIER_ORDER.filter((x) => !RARE.includes(x))) for (const slot of ['weapon', 'armor', 'ring'] as const) {
      const it = rollGear(rng, 'RANGER', t, slot), p = { ...shopper('RANGER', 0), bag: [it] };
      const v = sellValue(it);
      expect(v, `${t} ${slot}`).toBeGreaterThan(0);
      expect(v).toBeLessThanOrEqual(Math.round(priceOf(it) * 0.35) + 1);
      expect(pawn(p, 0)).toBe(v);
      expect(p.gold).toBe(v);
    }
    expect(sellValue(rollHungry(rng, 'RANGER'))).toBe(0);
  });

  it('sells the bigger packs, steep: 4, 8, 14 and 24 jobs of copper', () => {
    expect(BAG.gold).toEqual([0, 600, 1200, 2100, 3600]);
    const src = (f: string) => readFileSync(new URL(`../src/client/${f}`, import.meta.url), 'utf8');
    const stores = src('stores.ts'), merchant = stores.slice(stores.indexOf('function merchant'), stores.indexOf('function forge'));
    expect(merchant).toContain('growBag(');
    expect(merchant).toContain('stockGoods(g, \'pawn\'');
    // Nowhere else sells a pack.
    for (const f of ['shops.ts', 'vendorui.ts', 'shopgoods.ts', 'townui.ts']) expect(src(f)).not.toContain('growBag');
  });
});

describe('modifiers that make sense', () => {
  it('a weapon only rolls what its own kit uses: no PARRY at all (it is gone), no BLOCK without a held block, no flat DAMAGE', () => {
    const rng = new Rng(11);
    for (const kit of WEAPON_ORDER) for (const t of TIER_ORDER) for (let i = 0; i < 20; i++) {
      const it = t === 'hungry' ? null : rollGear(rng, null, t, 'weapon', kit);
      for (const m of it?.mods ?? []) {
        expect(weaponMods(kit)).toContain(m.id);
        expect(m.id as string).not.toBe('parry');
        if (m.id === 'guard') expect(guardOf(WEAPONS[kit])).toBe('full');
        expect(m.id).not.toBe('damage');
      }
    }
    // Each kit's list is its job: knives backstab, a Mage casts, a Healer heals; nobody parries.
    for (const k of CLASS_KITS.ROGUE) expect(weaponMods(k)).toEqual(expect.arrayContaining(['backstab', 'crit']));
    for (const k of WEAPON_ORDER) expect(weaponMods(k) as string[]).not.toContain('parry');
    expect(weaponMods('spellblade')).toEqual(expect.arrayContaining(['spell', 'thrift']));
    expect(weaponMods('greatsword')).toContain('guard');
    expect(weaponMods('spellblade')).not.toContain('guard');
    for (const k of CLASS_KITS.HEALER) expect(weaponMods(k)).toContain('mending');
  });

  it('armor rolls its weight (never PARRY); rolled for a class, only what it can use; rolled for nobody, rings only what anyone can', () => {
    const rng = new Rng(12);
    for (const t of TIER_ORDER.slice(1, 6)) for (let i = 0; i < 200; i++) {
      const kind = (['light', 'medium', 'heavy'] as const)[i % 3], free = rollGear(rng, null, t, 'armor', undefined, kind);
      for (const m of free.mods!) expect(ARMOR_MODS[kind]).toContain(m.id);
      expect(free.mods!.some((m) => (m.id as string) === 'parry')).toBe(false);
      for (const c of CLASS_ORDER) for (const m of rollGear(rng, c, t, 'armor', undefined, kind).mods!) expect(modFits(m.id, c), `${c} ${kind} ${m.id}`).toBe(true);
      for (const m of rollGear(rng, null, t, 'ring').mods!) expect(RING_MODS).toContain(m.id);
    }
    // The rule in one line each: a Rogue's plate never rolls BLOCK; a Warrior's leathers never roll DODGE.
    expect(modFits('guard', 'ROGUE')).toBe(false);
    expect(modFits('dodge', 'WARRIOR')).toBe(false);
    expect(modFits('guard', 'MAGE', 'wand')).toBe(false);
  });
});

describe('light against heavy', () => {
  /** A weight's average worth at a tier: its frame and its modifiers, over many rolls (costs left out: they're the same for each). */
  const worth = (t: Tier, kind: 'light' | 'medium' | 'heavy') => {
    const rng = new Rng(21);
    let sum = 0;
    for (let i = 0; i < 600; i++) {
      const it = rollGear(rng, null, t, 'armor', undefined, kind);
      sum += itemPoints({ ...it, cost: undefined });
    }
    return sum / 600;
  };
  it('add up the same at every tier from Fine up; plain plate is the better plain piece', () => {
    const rows: string[] = [];
    for (const t of TIER_ORDER.slice(1, 6)) {
      const l = worth(t, 'light'), m = worth(t, 'medium'), h = worth(t, 'heavy');
      rows.push(`${TIERS[t].name.padEnd(8)} light ${l.toFixed(1)}  medium ${m.toFixed(1)}  heavy ${h.toFixed(1)}  (budget ${budget(t, 'armor', 'heavy') + frame('heavy')})`);
      expect(Math.abs(l - h) / h, `${t} light ${l} heavy ${h}`).toBeLessThan(0.05);
      expect(Math.abs(m - h) / h).toBeLessThan(0.05);
    }
    console.log('armor worth by tier (points):\n' + rows.join('\n'));
    expect(frame('heavy')).toBeGreaterThan(frame('light'));
    // Spent differently: heavy on BLOCK, TOUGHNESS and HEALTH; light on DODGE, STAMINA, SPEED and CRIT.
    expect(ARMOR_MODS.heavy).toEqual(['guard', 'tough', 'health']);
    expect(ARMOR_MODS.light).toEqual(['dodge', 'breath', 'foot', 'crit']);
  });
});

describe('the seven tiers', () => {
  it('sort white to red, each its own colour, the rare three last with red on top', () => {
    expect(TIER_ORDER).toEqual(['plain', 'fine', 'forged', 'tolmouth', 'touched', 'turning', 'hungry']);
    expect(TIER_ORDER.map((t) => TIERS[t].name)).toEqual(['PLAIN', 'FINE', 'FORGED', 'PRE-WAR', 'TOUCHED', 'TURNING', 'HUNGRY']);
    expect(new Set(TIER_ORDER.map((t) => TIERS[t].col)).size).toBe(7);
    expect(TIER_ORDER.map((t) => TIERS[t].step)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(RARE).toEqual(['touched', 'turning', 'hungry']);
    // Yellow, orange, red: the hue falls from yellow to red.
    const hue = (c: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      return mx === r ? (60 * ((g - b) / (mx - mn)) + 360) % 360 : 0;
    };
    expect(hue(TIERS.touched.col)).toBeGreaterThan(hue(TIERS.turning.col));
    expect(hue(TIERS.turning.col)).toBeGreaterThan(hue(TIERS.hungry.col));
  });

  it('each rare tier is stronger than the one below it and carries a cost; each is rarer in drops', () => {
    const rng = new Rng(31), net = (t: Tier) => {
      let s = 0;
      for (let i = 0; i < 300; i++) s += itemPoints(rollGear(rng, 'WARRIOR', t, 'weapon', 'sword'));
      return s / 300;
    };
    expect(net('touched')).toBeGreaterThan(net('tolmouth'));
    expect(net('turning')).toBeGreaterThan(net('touched'));
    for (const t of ['touched', 'turning'] as const) expect(rollGear(rng, 'WARRIOR', t).cost).toBeTruthy();
    expect(rollGear(rng, 'WARRIOR', 'tolmouth').cost).toBeUndefined();
    const n: Partial<Record<Tier, number>> = {};
    for (let i = 0; i < 40000; i++) { const t = rollTier(rng, 'named'); n[t] = (n[t] ?? 0) + 1; }
    expect(n.touched!).toBeGreaterThan(n.turning!);
    expect(n.turning!).toBeGreaterThan(n.hungry!);
    // Danger never lifts a roll into them.
    for (let i = 0; i < 2000; i++) expect(RARE).not.toContain(rollTier(rng, 'scrapper', 5));
  });

  it("a cost is felt in the fight's numbers", () => {
    const plate: Item = { slot: 'armor', armor: 'heavy', quality: 'turning', traits: [], mods: [], level: 0, cost: { id: 'taken', v: 0.14 } };
    expect(gearStats(undefined, plate).taken).toBeCloseTo(0.75 * 1.14);
    expect(gearStats(undefined, { ...plate, cost: { id: 'slow', v: 0.1 } }).speed).toBeCloseTo(0.88 * 0.9);
    expect(gearStats(undefined, { ...plate, cost: { id: 'frail', v: 12 } }).health).toBe(-12);
  });
});

describe('old saves', () => {
  it('load with their gear as it was: PRE-WAR, hungry and old modifiers all still count', () => {
    const old = {
      ...newProfile('WARRIOR', 'OLD'),
      arms: { sword: { slot: 'weapon', kit: 'sword', quality: 'tolmouth', traits: ['riposte'], mods: [{ id: 'damage', v: 0.15 }, { id: 'quick', v: 0.12 }], level: 2 } },
      armor: { slot: 'armor', armor: 'heavy', quality: 'forged', traits: [], mods: [{ id: 'dodge', v: 0.12 }, { id: 'tough', v: 0.05 }], level: 0 },
      bag: [{ kit: 'spear', quality: 'plain', traits: ['crushing'] }, rollHungry(new Rng(2), 'WARRIOR')],
    } as Record<string, unknown>;
    delete old.bought;
    const s = fromJson(JSON.parse(JSON.stringify({ heroes: [old], current: 0, world: newWorld() })))!, h = s.heroes[0];
    expect(h.arms.sword!.quality).toBe('tolmouth');
    expect(TIERS[h.arms.sword!.quality].name).toBe('PRE-WAR');
    expect(h.bag[0].quality).toBe('tolmouth');
    expect(h.bag[1].quality).toBe('hungry');
    const g = gearStats(h.arms.sword, h.armor);
    expect(g.damage).toBeCloseTo(0.15 * (1 + 2 / 10) + 0.2);
    expect(g.dodge).toBeCloseTo(0.12);
    expect(sellValue(h.arms.sword!)).toBeGreaterThan(0);
    for (const m of [...h.arms.sword!.mods!, ...h.armor!.mods!]) expect(MODS[m.id as ModId]).toBeTruthy();
  });
});
