/**
 * Who buys the rare three (Kyle, 2026-11-05, shared/fence.ts): Tobin won't touch TOUCHED, TURNING or
 * HUNGRY gear and never stocks it; a hero carrying hungry gear gets nothing from him but his panic; Nettle
 * quietly buys touched and turning gear at a cut, never hungry.
 */
import { describe, expect, it } from 'vitest';
import { RARE, TIER_ORDER, priceOf, rollGear, sellValue, type Item } from '../src/shared/tuning';
import { carriesHungry, fence, fenceValue, nettleTakes, tobinWont } from '../src/shared/fence';
import { pawn, pawns, redeem, stow } from '../src/shared/bags';
import { STOCK, stockFor } from '../src/shared/vendors';
import { rollHungry } from '../src/shared/hungry';
import { newProfile, type Profile } from '../src/shared/progress';
import { Rng } from '../src/shared/rng';

const g = globalThis as unknown as Record<string, unknown>;
g.window ??= globalThis;
g.document ??= { querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ getContext: () => null, toDataURL: () => '' }) };
g.matchMedia ??= () => ({ matches: true, addEventListener: () => undefined });

const rng = new Rng(21);
const gear = (t: Item['quality'], slot: 'weapon' | 'armor' | 'ring' = 'weapon') => (t === 'hungry' ? rollHungry(rng, 'WARRIOR') : rollGear(rng, 'WARRIOR', t, slot));
const hero = (...bag: Item[]): Profile => ({ ...newProfile('WARRIOR'), gold: 0, bag });

/** What Tobin's stall shows this hero (stores.ts merchant), as html, with no page round it. */
async function tobin(pr: Profile): Promise<string> {
  const { openStore } = await import('../src/client/stores');
  let html = '';
  openStore('merchant', { profile: pr, hero: pr } as never, { show: (_t: string, h: string) => void (html = h) } as never);
  return html;
}

describe("Tobin won't touch the rare three", () => {
  it('refuses TOUCHED, TURNING and HUNGRY, and buys every tier below them', () => {
    for (const t of TIER_ORDER) for (const slot of ['weapon', 'armor', 'ring'] as const) {
      if (t === 'hungry' && slot !== 'weapon') continue;
      const it = gear(t, slot), p = hero(it), rare = RARE.includes(t);
      expect(tobinWont(p, it), `${t} ${slot}`).toBe(rare ? (t === 'hungry' ? 'panic' : 'rare') : '');
      expect(pawn(p, 0) > 0, `${t} ${slot}`).toBe(!rare);
      expect(p.bag.length).toBe(rare ? 1 : 0);
    }
  });

  it('never stocks them, in any window', () => {
    expect(STOCK.pawn.odds.map(([t]) => t).filter((t) => RARE.includes(t))).toEqual([]);
    for (let w = 0; w < 5000; w++) for (const it of stockFor('pawn', w)) expect(RARE.includes(it.quality), `window ${w}`).toBe(false);
  });
});

describe('a hungry piece on you', () => {
  const plain = () => gear('fine');
  const places: [string, (p: Profile, h: Item) => void][] = [
    ['in the pack', (p, h) => p.bag.push(h)],
    ['in hand', (p, h) => (p.arms.greatsword = h, p.weapon = 'greatsword')],
    ['in another hand (not held)', (p, h) => void (p.arms.greatsword = h)],
    ['worn as armor', (p, h) => void (p.armor = h)],
    ['on a finger', (p, h) => void p.rings.push(h)],
  ];
  for (const [where, put] of places) it(`${where}: Tobin buys nothing and sells nothing back, and panics`, async () => {
    const p = hero(plain(), plain()), it = p.bag[1];
    p.gold = 5000;
    expect(pawn(p, 1)).toBeGreaterThan(0);
    put(p, rollHungry(rng, 'WARRIOR'));
    expect(carriesHungry(p)).toBe(true);
    expect(tobinWont(p, p.bag[0])).toBe('panic');
    expect(pawn(p, 0)).toBe(0);
    expect(redeem(p, 0)).toBe(false);
    expect(pawns(p)[0].item).toBe(it);
    const { PAWN } = await import('../src/client/storewords');
    const html = await tobin(p);
    expect(html).toContain(PAWN.panic.slice(0, 30));
    expect(html).toContain(PAWN.panicRule);
    expect(html).not.toContain(PAWN.greet.slice(0, 20));
    expect(html).not.toContain('data-good');
    expect(html).not.toContain('data-src');
  });

  it('in the vault, it is off you: Tobin trades again', async () => {
    const p = hero(gear('fine'), rollHungry(rng, 'WARRIOR'));
    expect(carriesHungry(p)).toBe(true);
    expect(stow(p, 1)).toBe(true);
    expect(carriesHungry(p)).toBe(false);
    expect(pawn(p, 0)).toBe(sellValue(p.buyback![0].item));
    const { PAWN } = await import('../src/client/storewords');
    const html = await tobin({ ...p, bag: [gear('fine'), gear('touched')] });
    expect(html).not.toContain(PAWN.panicRule);
    expect(html).toContain(PAWN.greet.slice(0, 20));
    // On the SELL tab, the touched piece sits dim in his grid, with the reason under it.
    const { pawnTabTo } = await import('../src/client/stores');
    pawnTabTo('sell');
    const sell = await tobin({ ...p, bag: [gear('fine'), gear('touched')] });
    pawnTabTo('buy');
    expect(sell).toContain('tile dim');
    expect(sell).toContain(PAWN.wont);
  });

  it('given to the church, it is gone: Tobin trades again', async () => {
    const { Game } = await import('../src/client/game');
    const p = hero(gear('fine')), h = rollHungry(rng, 'WARRIOR');
    p.arms.greatsword = h;
    p.weapon = 'greatsword';
    p.want = 40;
    expect(pawn(p, 0)).toBe(0);
    // The church step's own button (townui.ts): Game.giveUp, which takes it out of wherever it is.
    (Game.prototype as unknown as { giveUp: (it: Item) => void }).giveUp.call({ profile: p, hero: {}, save: {}, equip: () => undefined }, h);
    expect(p.want).toBe(10);
    expect(carriesHungry(p)).toBe(false);
    expect(pawn(p, 0)).toBeGreaterThan(0);
  });
});

describe('Nettle, under the table', () => {
  it('buys TOUCHED and TURNING at a cut, below what the piece is worth and below what Tobin pays for anything', () => {
    for (const t of ['touched', 'turning'] as const) for (const slot of ['weapon', 'armor', 'ring'] as const) {
      const it = gear(t, slot), p = hero(it), v = fenceValue(it);
      expect(nettleTakes(it)).toBe(true);
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(priceOf(it) * 0.25);
      expect(v).toBeLessThan(sellValue(it));
      expect(fence(p, 0)).toBe(v);
      expect([p.gold, p.bag.length]).toEqual([v, 0]);
      // Gone for good: nothing waits in a buyback.
      expect(p.buyback ?? []).toEqual([]);
    }
  });

  it('buys nothing else: not the common tiers (Tobin buys those), and never hungry gear (the church only)', () => {
    for (const t of TIER_ORDER.filter((x) => x !== 'touched' && x !== 'turning')) {
      const it = gear(t), p = hero(it);
      expect(fenceValue(it), t).toBe(0);
      expect(fence(p, 0)).toBe(0);
      expect(p.bag).toEqual([it]);
    }
  });

  it('still trades with a hero carrying hungry gear (only Tobin panics)', () => {
    const p = hero(gear('turning'), rollHungry(rng, 'WARRIOR'));
    expect(fence(p, 0)).toBeGreaterThan(0);
  });
});

describe("the lore keeper's fixes (2026-11-05)", () => {
  it('names and words', async () => {
    const { MODS, MOD_TEXT, costText } = await import('../src/shared/tuning');
    expect([MODS.draw.name, MOD_TEXT.draw]).toEqual(['QUICK HOLD', 'held attacks and bow draws build faster']);
    expect([MODS.thrift.name, MOD_TEXT.thrift]).toEqual(['CHEAPER SPELLS', 'held spells cost less magic']);
    expect(MOD_TEXT.crit).toBe('chance a hit does 50% more damage');
    expect(costText({ id: 'winded', v: 0.12 }, 'MAGE')).toBe('Magic refills 12% slower.');
    expect(costText({ id: 'winded', v: 0.12 }, 'RANGER')).toBe('Stamina refills 12% slower.');
    expect(costText({ id: 'slow', v: 0.08 })).toBe('You move 8% slower.');
    const { VENDOR_PLACES } = await import('../src/client/vendorwords');
    expect([VENDOR_PLACES.WARRIOR.keeper, VENDOR_PLACES.WARRIOR.who]).toEqual(['QUARTERMASTER PRUE', 'Prue']);
  });
});
