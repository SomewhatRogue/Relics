import { describe, expect, it } from 'vitest';
import { COINS, HERO, POTION, TICK } from '../src/shared/tuning';
import { Rng } from '../src/shared/rng';
import { dropPickups, stepPickups } from '../src/sim/pickups';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';

const intent = (o: Partial<Intent> = {}): Intent => ({ ...NO_INTENT, ...o });
const run = (room: ArenaRoom, s: number) => {
  const out: FightEvent[] = [];
  for (let i = 0; i < Math.round(s / TICK); i++) room.step(), out.push(...room.events);
  return out;
};

describe('gold and potions on the floor', () => {
  it('goblins in a job leave gold (a named butcher always, a lot); training goblins leave nothing', () => {
    const named = newEnemy(1, 'butcher', 5, 5), drill = newEnemy(2, 'scrapper', 5, 5);
    Object.assign(named, { respawns: false, name: 'MAWL' });
    const out: Parameters<typeof dropPickups>[1] = [];
    dropPickups(named, out, new Rng(3));
    dropPickups(drill, out, new Rng(3));
    const gold = out.filter((p) => p.gold);
    expect(gold.length).toBe(1);
    expect(gold[0].gold).toBeGreaterThanOrEqual(COINS.named.min);
    expect(out.some((p) => p.potion)).toBe(true);
  });

  it('gold is split evenly across the party; the picker keeps the odd coin', () => {
    const room = new ArenaRoom(1, { scrappers: false });
    const a = room.join('me'), b = room.join('you');
    Object.assign(b, { x: a.x + 6 });
    const ev: FightEvent[] = [];
    stepPickups([{ id: 1, x: a.x, y: a.y, life: 9, gold: 7 }], room.heroes, ev, TICK);
    const got = Object.fromEntries(ev.filter((e) => e.k === 'gold').map((e) => [(e as { id: string }).id, (e as { n: number }).n]));
    expect(got).toEqual({ me: 4, you: 3 });
  });

  it('a potion goes on the belt of whoever walks over it, if there is room', () => {
    const room = new ArenaRoom(1, { scrappers: false });
    const h = room.join('me');
    h.belt = ['bitter', 'bitter'];
    let left = stepPickups([{ id: 1, x: h.x, y: h.y, life: 9, potion: 'smoke' }], room.heroes, [], TICK);
    expect(h.belt).toEqual(['bitter', 'bitter', 'smoke']);
    left = stepPickups([{ id: 2, x: h.x, y: h.y, life: 9, potion: 'oil' }], room.heroes, [], TICK);
    expect(left.length).toBe(1);
  });
});

describe('the belt', () => {
  it("Sister's Bitter heals 40 over two seconds", () => {
    const room = new ArenaRoom(1, { scrappers: false });
    const h = room.join('me');
    Object.assign(h, { hp: 30, belt: ['bitter', 'brandy'] });
    room.setIntent('me', intent({ potionSeq: 1 }));
    run(room, 1);
    expect(h.hp).toBeGreaterThan(40);
    expect(h.hp).toBeLessThan(70);
    run(room, 1.5);
    expect(Math.round(h.hp)).toBe(70);
  });

  it('Wall Brandy doubles your blows and halves your walk and your breath, for as long as it lasts', () => {
    const blow = (drink: boolean) => {
      const room = new ArenaRoom(1, { scrappers: false });
      const h = room.join('me'), d = room.enemies.find((e) => e.kind === 'dummy')!;
      Object.assign(h, { x: d.x, y: d.y - 1.1, fx: 0, fy: 1, belt: drink ? ['brandy'] : [] });
      if (drink) room.setIntent('me', intent({ potionSeq: 1 })), run(room, POTION.cooldown + 0.1);
      const hp = d.hp;
      room.setIntent('me', intent({ potionSeq: drink ? 1 : 0, attackSeq: 1, ax: 0, ay: 1 }));
      run(room, 0.6);
      return { dealt: hp - d.hp, h, room };
    };
    const sober = blow(false), drunk = blow(true);
    expect(sober.dealt).toBeGreaterThan(0);
    expect(drunk.dealt).toBe(sober.dealt * POTION.brandyDmg);
    // Breath tops out at half; walking covers half the ground.
    const { h, room } = drunk;
    expect(h.stamina).toBeLessThanOrEqual(HERO.stamina * POTION.brandyBreath);
    const walk = (r: ArenaRoom, hero: typeof h) => {
      r.enemies = [];
      Object.assign(hero, { x: 6, y: 6 });
      const x = hero.x;
      r.setIntent('me', intent({ potionSeq: 1, attackSeq: 1, mx: 1 }));
      run(r, 0.3);
      return hero.x - x;
    };
    const slow = walk(room, h), fast = walk(sober.room, sober.h);
    expect(slow / fast).toBeCloseTo(POTION.brandySpeed, 1);
    // Worn off: full breath comes back, and full speed.
    room.setIntent('me', intent({ potionSeq: 1, attackSeq: 1 }));
    run(room, POTION.brandyTime);
    expect(h.stamina).toBeGreaterThan(HERO.stamina * POTION.brandyBreath);
    expect(h.brandyUntil).toBeLessThan(room.time);
    expect(walk(room, h) / fast).toBeCloseTo(1, 1);
  });

  it('lamp oil thrown where you aim sets goblins burning; smoke hides you from them', () => {
    const room = new ArenaRoom(1);
    const h = room.join('me');
    const g = room.enemies.find((e) => e.kind === 'scrapper')!;
    Object.assign(g, { x: h.x, y: h.y - 3, act: 'stunned', actDur: 99, cooldown: 99 });
    h.belt = ['oil'];
    room.setIntent('me', intent({ potionSeq: 1, ax: 0, ay: -3 }));
    run(room, 0.8);
    expect(g.burnUntil).toBeGreaterThan(room.time);
    h.belt = ['smoke'];
    room.setIntent('me', intent({ potionSeq: 2, ax: 0, ay: 0.01 }));
    run(room, 0.8);
    expect(room.smokes.length).toBe(1);
    expect(h.hiddenUntil).toBeGreaterThan(room.time);
  });

  it('a gold pickup in a job is counted for the hero who gets it', async () => {
    const { newRun, tally } = await import('../src/sim/run');
    const r = newRun({ id: 'x', rooms: 3 } as never), room = new ArenaRoom(1);
    tally(r, room, [{ k: 'gold', id: 'me', x: 0, y: 0, n: 9 }, { k: 'gold', id: 'you', x: 0, y: 0, n: 9 }], 'me');
    expect(r.gold).toBe(9);
    expect(POTION.belt).toBe(3);
  });
});
