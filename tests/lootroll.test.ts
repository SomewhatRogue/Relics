/** Boss loot in the sim: unique drops in the Deep, and the group's NEED / GREED / PASS roll. */
import { describe, expect, it } from 'vitest';
import { DEEP_BANDS } from '../src/shared/deepbands';
import { Rng } from '../src/shared/rng';
import { uniqueItem, UNIQUES } from '../src/shared/uniques';
import { fits } from '../src/sim/lootroll';
import { newEnemy } from '../src/sim/enemies';
import { ArenaRoom } from '../src/sim/room';
import { uniqueDrops } from '../src/sim/uniquedrop';
import { NO_INTENT, type Enemy, type FightEvent, type LootPick } from '../src/sim/types';

const deep = (n = 3, party = 1) => {
  const r = new ArenaRoom(5, { scrappers: false });
  r.floor = n;
  r.join('a').weapon = 'sword';
  if (party > 1) r.join('b').weapon = 'staff';
  return r;
};
const fall = (r: ArenaRoom, patch: Partial<Enemy>) => {
  const e = Object.assign(newEnemy(900 + r.enemies.length, 'butcher', 4, 4), { act: 'dead' as const, hp: 0 }, patch);
  r.enemies.push(e);
  return e;
};
const kill = (r: ArenaRoom, e: Enemy, rng = new Rng(1)) => uniqueDrops(r, [e], rng);
const say = (r: ArenaRoom, who: string, id: number, p: LootPick) => r.setIntent(who, { ...NO_INTENT, loot: { [id]: p } });
const play = (r: ArenaRoom, secs = 0.2) => { const ev: FightEvent[] = []; for (let i = 0; i < secs * 30; i++) (r.step(), ev.push(...r.events)); return ev; };

describe('unique drops', () => {
  it('none outside the Deep', () => {
    const r = deep(0);
    const e = fall(r, { name: 'SKARN' });
    r.enemies = [e];
    r.step();
    expect(r.drops).toHaveLength(0);
    expect(r.rolls).toHaveLength(0);
  });

  it('a named butcher alone in the Deep leaves a floor piece of its pool', () => {
    const r = deep();
    kill(r, fall(r, { name: 'SKARN' }));
    expect(r.rolls).toHaveLength(0);
    expect(r.drops).toHaveLength(1);
    expect(UNIQUES[r.drops[0].item.unique as keyof typeof UNIQUES].pool).toBe('skarn');
    expect(r.drops[0].item.unique).toBeTruthy();
  });

  it('the Doorkeepers drop once for the pair', () => {
    const r = deep(10, 2);
    const mk = (who: 'latch' | 'hasp', alive: boolean) => Object.assign(newEnemy(800 + r.enemies.length, 'butcher', 3, 3), { boss: { who } as never, act: alive ? ('idle' as const) : ('dead' as const) });
    const a = mk('latch', false), b = mk('hasp', true);
    r.enemies.push(a, b);
    kill(r, a);
    expect(r.rolls).toHaveLength(0);
    Object.assign(b, { act: 'dead' });
    kill(r, b);
    kill(r, a);
    expect(r.rolls).toHaveLength(1);
    expect(r.rolls[0].item.unique && UNIQUES[r.rolls[0].item.unique as keyof typeof UNIQUES].pool).toBe('doorkeepers');
  });

  it('BIG ONEs drop by the floor band', () => {
    DEEP_BANDS.forEach((b, i) => {
      const r = deep(b.from), rng = new Rng(11);
      let n = 0;
      const N = 400;
      for (let k = 0; k < N; k++) {
        r.drops = [];
        kill(r, fall(r, { big: true, role: 'heavy' as never }), rng);
        n += r.drops.length;
      }
      const want = [0.3, 0.4, 0.5, 0.6][i];
      expect(Math.abs(n / N - want)).toBeLessThan(0.08);
    });
    const r = deep(3);
    kill(r, fall(r, { big: true, variant: 'ironhide' }), new Rng(2));
    kill(r, fall(r, { big: true, variant: 'ironhide' }), new Rng(3));
    kill(r, fall(r, { big: true, variant: 'ironhide' }), new Rng(4));
    for (const d of r.drops) expect(UNIQUES[d.item.unique as keyof typeof UNIQUES].pool).toBe('iron');
  });
});

describe('the roll', () => {
  const open = (item = uniqueItem('keepersring')) => {
    const r = deep(3, 2);
    kill(r, fall(r, { name: 'SKARN' }), new Rng(1));
    r.rolls.length = 0;
    r.rollSeq = 0;
    r.events = [];
    return Object.assign(r, { _item: item });
  };
  const start = (item = uniqueItem('keepersring')) => {
    const r = deep(3, 2);
    // a roll opens by a kill in a party of two
    kill(r, fall(r, { name: 'SKARN' }), new Rng(1));
    expect(r.rolls).toHaveLength(1);
    r.rolls[0].item = item;
    return r;
  };
  void open;

  it('opens in a party and tells the screens', () => {
    const r = start();
    expect(r.drops).toHaveLength(0);
    expect(r.events.some((e) => e.k === 'lootroll' && e.what === 'open' && e.id === r.rolls[0].id)).toBe(true);
  });

  it('NEED beats GREED, and the winner gets it in the bag', () => {
    const r = start();
    const id = r.rolls[0].id;
    say(r, 'a', id, 'greed');
    r.setIntent('b', { ...NO_INTENT, loot: { [id]: 'need' } });
    const bag = r.heroes.find((h) => h.id === 'b')!.bag.length;
    const ev = play(r);
    expect(r.rolls[0].winner).toBe('b');
    expect(r.heroes.find((h) => h.id === 'b')!.bag).toHaveLength(bag + 1);
    expect(ev.some((e) => e.k === 'lootroll' && e.what === 'done' && e.winner === 'b')).toBe(true);
    expect(r.drops).toHaveLength(0);
  });

  it('an invalid NEED counts as GREED', () => {
    const r = start(uniqueItem('haulpick'));
    const id = r.rolls[0].id;
    expect(fits(r.heroes.find((h) => h.id === 'b')!, r.rolls[0].item)).toBe(false);
    say(r, 'a', id, 'greed');
    r.setIntent('b', { ...NO_INTENT, loot: { [id]: 'need' } });
    play(r);
    expect(r.rolls[0].rolls!.every(([, k]) => k === 'greed')).toBe(true);
    expect([...new Set(r.rolls[0].rolls!.map(([w]) => w))].sort()).toEqual(['a', 'b']);
  });

  it('ties roll again', () => {
    const r = start();
    const id = r.rolls[0].id;
    let tied = 0;
    for (let s = 1; s < 400 && !tied; s++) {
      const q = start();
      Object.assign(q, {});
      const rng = new Rng(s);
      (q as unknown as { lootRng: Rng }).lootRng = rng;
      q.rolls[0].picks = { a: 'need', b: 'need' };
      play(q, 0.1);
      const v = q.rolls[0].rolls!;
      if (v.length > 2 && v[0][2] === v[1][2]) tied = v.length;
    }
    expect(tied).toBeGreaterThan(2);
    void id;
  });

  it('no answer by the deadline is PASS, and all PASS leaves it on the floor', () => {
    const r = start();
    play(r, 1);
    expect(r.rolls[0].winner).toBeUndefined();
    play(r, 20);
    expect(r.rolls[0]).toMatchObject({ winner: null, rolls: [] });
    expect(r.drops).toHaveLength(1);
    const r2 = start();
    const id = r2.rolls[0].id;
    say(r2, 'a', id, 'pass');
    r2.setIntent('b', { ...NO_INTENT, loot: { [id]: 'pass' } });
    play(r2);
    expect(r2.rolls[0].winner).toBeNull();
    expect(r2.drops).toHaveLength(1);
    expect(r2.drops[0].owner).toBeUndefined();
    play(r2, 7);
    expect(r2.rolls).toHaveLength(0);
  });

  it('a full bag leaves the piece on the floor for the winner alone', () => {
    const r = start();
    const id = r.rolls[0].id, b = r.heroes.find((h) => h.id === 'b')!;
    while (b.bag.length < (b.bagSize || 99)) b.bag.push(uniqueItem('cartlink'));
    say(r, 'a', id, 'pass');
    r.setIntent('b', { ...NO_INTENT, loot: { [id]: 'need' } });
    play(r);
    expect(r.drops[0]).toMatchObject({ owner: 'b' });
  });
});
