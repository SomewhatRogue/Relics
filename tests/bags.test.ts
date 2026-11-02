import { beforeEach, describe, expect, it } from 'vitest';
import { BAG, VAULT, bagSize, fitStores, growBag, growVault, melt, pawn, pawns, redeem, stow, unstow, upgraded, vaultSize, type Stores } from '../src/shared/bags';
import { rollGear, sellValue, STEEL } from '../src/shared/gear';
import { rollHungry } from '../src/shared/hungry';
import { Rng } from '../src/shared/rng';
import { fromJson } from '../src/client/save';
import { newProfile } from '../src/shared/progress';
import { newWorld } from '../src/shared/story';
import { Game } from '../src/client/game';
import { takeLoot } from '../src/sim/loot';
import { NO_INTENT } from '../src/sim/types';
import { GEAR, applyGear } from '../src/sim/pack';
import { moveOf } from '../src/client/packmoves';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
beforeEach(() => store.clear());

const rng = new Rng(9);
const piece = (tier: 'plain' | 'fine' | 'forged' = 'fine') => rollGear(rng, 'WARRIOR', tier, 'weapon', 'sword');
const hungry = () => rollHungry(rng, 'WARRIOR');
const hero = (n: number, gold = 0): Stores => ({ bag: Array.from({ length: n }, () => piece()), gold, steel: 0, runs: 3 });

describe('the pack and the vault', () => {
  it('a new pack holds 8; bigger packs cost gold, a step at a time, up to 24', () => {
    const p = hero(0, 10000);
    expect(bagSize(p)).toBe(BAG.start);
    expect(growBag({ ...hero(0, 50) })).toBe(false);
    for (const size of BAG.sizes.slice(1)) expect(growBag(p) && bagSize(p)).toBe(size);
    expect(growBag(p)).toBe(false);
    expect(p.gold).toBe(10000 - BAG.gold.reduce((a, b) => a + b, 0));
  });

  it('pieces go into the vault and back; never past its shelves or a full pack; never hungry gear', () => {
    const p = hero(BAG.start);
    expect(stow(p, 0)).toBe(true);
    expect([p.bag.length, p.stash!.length]).toEqual([7, 1]);
    expect(unstow(p, 0)).toBe(true);
    expect(unstow(p, 0)).toBe(false);
    p.stash = Array.from({ length: VAULT.start }, () => piece());
    expect(stow(p, 0)).toBe(false);
    expect(unstow(p, 0)).toBe(false); // the pack is full
    p.gold = 1000;
    expect(growVault(p) && vaultSize(p)).toBe(24);
    expect(stow(p, 0)).toBe(true);
    p.bag.push(hungry());
    expect(stow(p, p.bag.length - 1)).toBe(false);
  });

  it('the vault survives a save and a load', () => {
    const p = { ...newProfile('WARRIOR', 'X'), stash: [piece('forged')], stashSize: 24 };
    const back = fromJson(JSON.parse(JSON.stringify({ heroes: [p], current: 0, world: newWorld() })))!;
    expect(back.heroes[0].stash![0].quality).toBe('forged');
    expect(back.heroes[0].stashSize).toBe(24);
  });
});

describe("Tobin's buyback", () => {
  it('sells for sellValue and buys back at the same price until the next job comes home', () => {
    const p = hero(3), it = p.bag[1], price = sellValue(it);
    expect(pawn(p, 1)).toBe(price);
    expect(p.gold).toBe(price);
    expect(pawns(p)[0].item).toBe(it);
    expect(redeem(p, 0)).toBe(true);
    expect(p.gold).toBe(0);
    expect(p.bag).toContain(it);
    pawn(p, 0);
    p.runs++;
    expect(pawns(p)).toEqual([]);
    expect(redeem(p, 0)).toBe(false);
  });

  it('keeps the newest eight; never buys hungry gear', () => {
    const p = hero(10);
    for (let i = 0; i < 10; i++) pawn(p, 0);
    expect(pawns(p).length).toBe(8);
    p.bag.push(hungry());
    expect(pawn(p, 0)).toBe(0);
    expect(p.bag.length).toBe(1);
  });
});

describe("Halvard's anvil", () => {
  it('melts a packed piece for its steel, and a level costs gold and steel', () => {
    const p = hero(1), it = p.bag[0];
    expect(melt(p, 0)).toBe(STEEL[it.quality]);
    expect(p.bag.length).toBe(0);
    Object.assign(p, { gold: 30, steel: 2 });
    const up = upgraded(p, piece())!;
    expect(up.level).toBe(1);
    expect([p.gold, p.steel]).toEqual([0, 0]);
    expect(upgraded(p, piece())).toBeNull();
  });

  it('hungry gear is never melted or upgraded', () => {
    const p = { ...hero(0, 9999), steel: 999 };
    p.bag.push(hungry());
    expect(melt(p, 0)).toBe(0);
    expect(upgraded(p, p.bag[0])).toBeNull();
  });
});

describe('older saves', () => {
  it('keep every piece: the pack sized to fit, the rest in the vault', () => {
    const a = hero(6);
    fitStores(a);
    expect([bagSize(a), a.stash!.length]).toEqual([8, 0]);
    const b = hero(10);
    fitStores(b);
    expect([bagSize(b), b.bag.length]).toEqual([12, 10]);
    const c = hero(30);
    fitStores(c);
    expect([bagSize(c), c.bag.length, c.stash!.length]).toEqual([24, 24, 6]);
  });

  it('an old hero loads with an 8-cell pack and an empty vault', () => {
    const old = { ...newProfile('RANGER', 'OLD'), bag: [piece()] } as Record<string, unknown>;
    delete old.bagSize, delete old.stash, delete old.stashSize, delete old.buyback;
    const s = fromJson(JSON.parse(JSON.stringify({ heroes: [old], current: 0, world: newWorld() })))!;
    expect([s.heroes[0].bagSize, s.heroes[0].stash, s.heroes[0].stashSize, s.heroes[0].bag.length]).toEqual([8, [], 16, 1]);
  });
});

describe('a full pack on a job', () => {
  it("can't take loot, or take a ring off into it; a bigger pack can", () => {
    const g = new Game();
    g.create('WARRIOR', 'stray');
    g.skipWood();
    const h = g.hero;
    h.bag = Array.from({ length: 8 }, () => piece());
    const drops = [{ id: 1, x: h.x, y: h.y, item: piece('forged'), life: 30 }];
    const take = () => takeLoot(h, { ...NO_INTENT, take: 1, takeSeq: (h.seen.take ?? 0) + 1 }, drops, []);
    take();
    expect(drops.length).toBe(1);
    h.rings = [rollGear(rng, 'WARRIOR', 'fine', 'ring')];
    applyGear(h, GEAR.off, 0, []);
    expect(h.rings.length).toBe(1);
    h.bagSize = 12;
    take();
    expect(drops.length).toBe(0);
    expect(h.bag.length).toBe(9);
  });

  it('nothing is dropped on the street in town', () => {
    const g = new Game();
    g.create('WARRIOR', 'stray');
    g.skipWood();
    g.hero.bag = [piece()];
    expect(moveOf(g.hero, 'bag:0', 'drop')).toEqual([GEAR.drop, 0]);
    expect(moveOf(g.hero, 'bag:0', 'drop', true)).toBeNull();
  });
});
