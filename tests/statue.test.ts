import { describe, expect, it } from 'vitest';
import { clean, memoryWorldStore, realGiven, type WorldStore } from '../api/_world';
import { newWorld, type WorldState } from '../src/shared/story';
import { bidOutcome, bidRange, placeBid, settleBid, startBid, STATUE, statuePrice, type Purse } from '../src/shared/statue';
import type { Contribution } from '../src/shared/worldsync';
import { STATUE_GIVEN } from '../src/shared/tuning';
import { giveMore } from '../src/shared/statue';
import { townMap } from '../src/shared/town';
import { Game } from '../src/client/game';
import { commission, onStatueNews } from '../src/client/statuebuy';
import type { WorldLink } from '../src/client/worldlink';

const look = { w: 'sword' as const, l: 1 };
const hero = (id: string, name = 'A') => ({ id, name });
/** Give the town `n` gold as hero `id`, the way a gift at the works reaches the world. */
const give = (s: WorldStore, g: string, id: string, n: number) => s.apply(g, { hero: { id, name: 'A', cls: 'WARRIOR' }, stats: { given: n } } as Contribution);
const bid = (over: number, pay: number, given = STATUE_GIVEN) => ({ over, pay, ...look, given });

describe('the statue: its price', () => {
  it('the first is 1000 exactly; then from the price + 1 to the price + 1000; the price becomes what was paid', () => {
    const w = newWorld();
    expect(statuePrice(w)).toBe(0);
    expect(bidRange(w)).toEqual([1000, 1000]);
    expect(placeBid(w, hero('ha'), bid(0, 999))).toBe(false);
    expect(placeBid(w, hero('ha'), bid(0, 1001))).toBe(false);
    expect(placeBid(w, hero('ha'), bid(0, 1000))).toBe(true);
    expect(statuePrice(w)).toBe(1000);
    expect(bidRange(w)).toEqual([1001, 2000]);
    expect(placeBid(w, hero('hb'), bid(1000, 1000))).toBe(false);
    expect(placeBid(w, hero('hb'), bid(1000, 2001))).toBe(false);
    expect(placeBid(w, hero('hb'), bid(1000, 1000.5))).toBe(false);
    expect(placeBid(w, hero('hb'), bid(1000, 1001))).toBe(true);
    expect(bidRange(w)).toEqual([1002, 2001]);
    expect(placeBid(w, hero('hc'), bid(1001, 2001))).toBe(true);
    // Cumulative: it ratchets on what was paid.
    expect([w.statue!.price, w.statue!.n, w.statue!.by.id, w.statue!.past]).toEqual([2001, 3, 'hc', [{ n: 2, id: 'hb' }, { n: 1, id: 'ha' }]]);
    expect(STATUE.most).toBe(1000);
  });

  it('a bid takes the gold once, and one at a time', () => {
    const w = newWorld(), p = { id: 'ha', gold: 2500, stats: { given: 1000 } };
    expect(startBid(p, w, 999, look)).toBeNull();
    expect(startBid(p, w, 1000, look)).not.toBeNull();
    expect(p.gold).toBe(1500);
    expect(startBid(p, w, 1000, look)).toBeNull();
    expect(p.gold).toBe(1500);
    expect(startBid({ id: 'hb', gold: 900, stats: { given: 1000 } }, w, 1000, look)).toBeNull();
  });
});

describe('the world decides', () => {
  it('two heroes bidding over the same price at once: one wins, the other is paid back', async () => {
    const s = memoryWorldStore(), g = 'race', a: Purse = { id: 'haaaaaaa', gold: 3000, stats: { given: 1200 } }, b: Purse = { id: 'hbbbbbbb', gold: 3000, stats: { given: 5000 } };
    await give(s, g, a.id, 1200), await give(s, g, b.id, 5000);
    const w0 = (await s.load(g)).world;
    const na = startBid(a, w0, 1000, look)!, nb = startBid(b, w0, 1000, look)!;
    const send = (id: string, n: typeof na) => s.apply(g, clean({ hero: { id, name: id.toUpperCase(), cls: 'WARRIOR' }, statue: { over: n.over, pay: n.pay, w: n.w, l: n.l, given: n.given } })!);
    const [va, vb] = await Promise.all([send(a.id, na), send(b.id, nb)]);
    const last = (await s.load(g)).world;
    expect(last.statue!.by.id).toBe(a.id);
    expect(last.statue!.n).toBe(1);
    expect(settleBid(a, va.world)).toBe('won');
    expect(settleBid(b, vb.world)).toBe('lost');
    expect([a.gold, b.gold, a.statueBid, b.statueBid]).toEqual([2000, 3000, undefined, undefined]);
  });

  it('a bid not in yet stays out; one lost out of sight is never paid back twice', () => {
    const w: WorldState = newWorld(), note = { over: 0, pay: 1000, n: 0, given: 1000, ...look };
    expect(bidOutcome(w, note, 'ha')).toBe('open');
    placeBid(w, hero('ha'), bid(0, 1000));
    expect(bidOutcome(w, note, 'ha')).toBe('won');
    for (let i = 0; i < 4; i++) placeBid(w, hero('h' + i), bid(w.statue!.price, w.statue!.price + 1));
    expect(bidOutcome(w, note, 'ha')).toBe('won');
    expect(bidOutcome(w, note, 'hz')).toBe('lost');
  });

  it('turns away a forged or low bid', async () => {
    const s = memoryWorldStore(), g = 'forge', who = { id: 'hforger1', name: 'X', cls: 'ROGUE' };
    await give(s, g, who.id, 1000), await give(s, g, 'hhonest1', 1000);
    // Not a bid at all.
    for (const st of [{ over: 0, pay: -5, w: 'sword', l: 0, given: 1000 }, { over: 0, pay: 1000.5, w: 'sword', l: 0, given: 1000 }, { over: 0, pay: 1000, w: 'laser', l: 0, given: 1000 }, { over: 0, pay: 1000, w: 'sword', l: 7, given: 1000 }, { over: '0', pay: 1000, w: 'sword', l: 0, given: 1000 }, { over: 0, pay: 1000, w: 'sword', l: 0 }])
      expect(clean({ hero: who, statue: st })).toBeNull();
    // Too little, too much, over a made-up price, or the first not at 1000: the plinth doesn't change.
    for (const st of [{ over: 0, pay: 1 }, { over: 0, pay: 5000 }, { over: 500, pay: 1000 }]) {
      const v = await s.apply(g, clean({ hero: who, statue: { ...st, w: 'sword', l: 0, given: 1000 } })!);
      expect(v.world.statue).toBeUndefined();
    }
    await s.apply(g, clean({ hero: { ...who, id: 'hhonest1' }, statue: { over: 0, pay: 1000, w: 'mace', l: 2, given: 1000 } })!);
    for (const st of [{ over: 1000, pay: 1000 }, { over: 1000, pay: 2001 }, { over: 0, pay: 1500 }, { over: 999, pay: 1500 }]) {
      const v = await s.apply(g, clean({ hero: who, statue: { ...st, w: 'sword', l: 0, given: 1000 } })!);
      expect([v.world.statue!.by.id, v.world.statue!.price]).toEqual(['hhonest1', 1000]);
    }
    // A bid carries no stats, so it takes the world's cheap write (api/_world.ts).
    expect(clean({ hero: who, statue: { over: 0, pay: 1000, w: 'sword', l: 0, given: 1000 } })!.stats).toEqual({});
  });
});

describe('the town checks the giving', () => {
  it("a save that says it gave 1000 is taken at the Roll's word, not its own", async () => {
    const s = memoryWorldStore(), g = 'books', who = { id: 'hboaster', name: 'BOAST', cls: 'ROGUE' as const };
    const bid1 = () => s.apply(g, clean({ hero: who, statue: { over: 0, pay: 1000, w: 'sword', l: 0, given: 1000 } })!);
    // Nothing on the Roll: turned away, the plinth empty.
    expect((await bid1()).world.statue).toBeUndefined();
    // 600 given in town: still short.
    await give(s, g, who.id, 600);
    expect((await bid1()).world.statue).toBeUndefined();
    // 400 more: now it's taken, even with the save saying less.
    await give(s, g, who.id, 400);
    const v = await s.apply(g, clean({ hero: who, statue: { over: 0, pay: 1000, w: 'sword', l: 0, given: 1000 } })!);
    expect(v.world.statue?.by.id).toBe(who.id);
  });

  it('realGiven puts the Roll\'s count, and any given in the same write, on the bid', () => {
    const c = { hero: { id: 'hx', name: 'X', cls: 'MAGE' as const }, statue: { over: 0, pay: 1000, w: 'staff' as const, l: 0, given: 99999 }, stats: { given: 50 } };
    expect(realGiven(c as never, 900).statue!.given).toBe(950);
    expect(realGiven({ hero: c.hero } as never, 900)).toEqual({ hero: c.hero });
  });
});

describe('in the square', () => {
  it('the plinth shows whoever paid last, by name and look; empty before anyone has', () => {
    const w = newWorld(), plinth = () => townMap(w).rounds.find((r) => r.kind === 'plinth')!;
    expect(plinth().hero).toBeUndefined();
    placeBid(w, hero('hmaeve01', 'MAEVE'), { over: 0, pay: 1000, w: 'longbow', l: 2, given: 1000 });
    expect(plinth().hero).toEqual({ id: 'hmaeve01', name: 'MAEVE', w: 'longbow', l: 2 });
    placeBid(w, hero('hcole001', 'COLE'), { over: 1000, pay: 1100, w: 'greatsword', l: 0, given: 1000 });
    expect(plinth().hero).toEqual({ id: 'hcole001', name: 'COLE', w: 'greatsword', l: 0 });
  });

  it("stands clear of the square's people and things", () => {
    const m = townMap(newWorld()), p = m.rounds.find((r) => r.kind === 'plinth')!;
    for (const n of m.npcs ?? []) for (const [x, y] of [[n.x, n.y], ...(n.path ?? [])]) expect(Math.hypot(x - p.x, y - p.y), n.name).toBeGreaterThan(1.6);
    for (const r of m.rounds) if (r !== p) expect(Math.hypot(r.x - p.x, r.y - p.y) - r.r).toBeGreaterThan(1.4);
    for (const b of m.blocks) expect(p.x + 1.3 < b.x || p.x - 1.3 > b.x + b.w || p.y + 1 < b.y || p.y - 1 > b.y + b.h, b.kind).toBe(true);
  });
});

describe('paying for it', () => {
  it('solo: the gold is spent, the statue is yours, and it stays in the save', () => {
    const g = new Game();
    g.create('RANGER', 'WREN');
    g.skipWood();
    g.profile.gold = 1500;
    g.profile.stats.given = STATUE_GIVEN;
    expect(commission(g, 1001)).toBe(false);
    expect(commission(g, 1000)).toBe(true);
    expect(g.profile.gold).toBe(500);
    expect(g.profile.statueBid).toBeUndefined();
    expect(g.save.world.statue!.by).toMatchObject({ id: g.profile.id, name: 'WREN', w: g.profile.weapon });
    expect(g.room.map.rounds.find((r) => r.kind === 'plinth')!.hero!.name).toBe('WREN');
  });

  it('online: two screens bid at once; the world takes one and the other gets the gold back and a word', async () => {
    const s = memoryWorldStore(), said: string[] = [];
    onStatueNews((x) => said.push(x));
    const player = (cls: 'WARRIOR' | 'MAGE', name: string) => {
      const g = new Game();
      g.create(cls, name);
      g.skipWood();
      g.profile.gold = 1200;
      g.profile.stats.given = STATUE_GIVEN;
      g.link = { online: true, send: async (c: Contribution) => (g.syncWorld((await s.apply('wickhold', c)).world), 'ok') } as unknown as WorldLink;
      return g;
    };
    const a = player('WARRIOR', 'BRAN'), b = player('MAGE', 'ISOLT');
    // What they gave reached the world (the Roll), as it would have when they gave it.
    for (const h of [a, b]) await give(s, 'wickhold', h.profile.id, STATUE_GIVEN);
    expect(commission(a, 1000) && commission(b, 1000)).toBe(true);
    expect([a.profile.gold, b.profile.gold]).toEqual([200, 200]);
    await new Promise((r) => setTimeout(r, 10));
    expect((await s.load('wickhold')).world.statue!.by.name).toBe('BRAN');
    expect([a.profile.gold, b.profile.gold, a.profile.statueBid, b.profile.statueBid]).toEqual([200, 1200, undefined, undefined]);
    expect(b.world.statue!.by.name).toBe('BRAN');
    expect(said.some((x) => /before ISOLT/.test(x))).toBe(true);
  });
});

describe('only a hero who has given the town enough', () => {
  it(`needs ${1000} gold given (tuning STATUE_GIVEN); short of it, nothing is taken`, () => {
    expect(STATUE_GIVEN).toBe(1000);
    expect([giveMore(0), giveMore(400), giveMore(999), giveMore(1000), giveMore(5000)]).toEqual([1000, 600, 1, 0, 0]);
    const w = newWorld(), p: Purse = { id: 'ha', gold: 5000, stats: { given: 999 } };
    expect(startBid(p, w, 1000, look)).toBeNull();
    expect([p.gold, p.statueBid]).toEqual([5000, undefined]);
    p.stats!.given = 1000;
    expect(startBid(p, w, 1000, look)).not.toBeNull();
  });

  it('the world checks it too: a bid short of it is no bid, and never goes on the plinth', async () => {
    const w = newWorld();
    expect(placeBid(w, hero('ha'), bid(0, 1000, 999))).toBe(false);
    expect(w.statue).toBeUndefined();
    const who = { id: 'hstingy1', name: 'S', cls: 'ROGUE' };
    expect(clean({ hero: who, statue: { over: 0, pay: 1000, w: 'sword', l: 0, given: 999 } })).toBeNull();
    expect(clean({ hero: who, statue: { over: 0, pay: 1000, w: 'sword', l: 0, given: 1000 } })).not.toBeNull();
  });

  it('a Game: the gold given counts what went to the works and the Lantern', () => {
    const g = new Game();
    g.create('WARRIOR', 'ODO');
    g.skipWood();
    g.profile.gold = 2500;
    expect(commission(g, 1000)).toBe(false);
    expect(g.profile.gold).toBe(2500);
    expect(g.donate(900)).toBe(true);
    expect(g.fund('watch', 100)).toBe(true);
    expect(g.profile.stats.given).toBe(1000);
    expect(commission(g, 1000)).toBe(true);
    expect([g.profile.gold, g.world.statue!.by.name]).toEqual([500, 'ODO']);
  });
});
