/** Pack rushes (sim/packrush.ts, sim/rushguard.ts): called, gathered in front, landing together; one guard answers all. */
import { describe, expect, it } from 'vitest';
import { GUARD, RUSH, TICK, WEAPONS, type Swing } from '../src/shared/tuning';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';
import { hitEnemy } from '../src/sim/combat';
import { rushNow } from '../src/sim/packrush';
import { field, run } from './foeyard';

/** Three goblins of one pack a few tiles in front of a hero facing up the field. */
function setup(weapon = 'sword', foes = [[14, 11], [15, 10.8], [16, 11]]) {
  const f = field(foes.map(([x, y]) => ({ kind: 'scrapper' as const, x, y, pack: 1 })));
  f.h.weapon = weapon as typeof f.h.weapon;
  f.room.setIntent(f.h.id, { ...NO_INTENT, ay: -1 });
  rushNow(f.room.rushes, 1);
  return f;
}

/** Step until the rush winds up; its members, its land time and the events so far. */
function windup(room: ReturnType<typeof setup>['room']) {
  const ev = run(room, 4, () => room.enemies.some((e) => e.attack?.rush));
  const members = room.enemies.filter((e) => e.attack?.rush);
  return { ev, members, land: members[0].attack!.land! };
}

/** Step until just past `t`, setting `intent` at `at` (room time). Every event, by tick. */
function until(room: ReturnType<typeof setup>['room'], id: string, t: number, at?: number, intent?: Intent) {
  const ticks: FightEvent[][] = [];
  while (room.time < t + 0.1) {
    if (at !== undefined && intent && room.time + TICK >= at && room.time < at) room.setIntent(id, intent);
    room.step();
    ticks.push(room.events);
  }
  return ticks;
}

describe('pack rushes', () => {
  it('two or three join the caller, step into the hero\'s front, and every blow lands in the same instant', () => {
    const { room, h } = setup();
    const { ev, members } = windup(room);
    expect(members.length).toBeGreaterThanOrEqual(1 + RUSH.join[0]);
    expect(ev.some((e) => e.k === 'rush')).toBe(true);
    // All in front of the hero, the same wind-up, the same instant, longer than a small goblin's.
    for (const e of members) expect((e.y - h.y) / Math.hypot(e.x - h.x, e.y - h.y)).toBeLessThan(-RUSH.front);
    expect(new Set(members.map((e) => e.attack!.land)).size).toBe(1);
    expect(members[0].attack!.windup).toBeGreaterThan(1);
    const hp = h.hp, ticks = until(room, h.id, members[0].attack!.land!);
    const landed = ticks.map((t) => t.filter((e) => e.k === 'impact').length).filter((n) => n > 0);
    expect(landed).toEqual([members.length]);
    expect(hp - h.hp).toBeGreaterThan(RUSH.blow.dmg * (members.length - 1));
  });

  it('one held block takes every blow, for one blow\'s stamina', () => {
    const { room, h } = setup();
    room.setIntent(h.id, { ...NO_INTENT, ay: -1, block: true, blockSeq: 1 });
    const { members, land } = windup(room);
    while (room.time + TICK < land) room.step();
    const hp = h.hp, st = h.stamina;
    room.step();
    const blocks = room.events.filter((e) => e.k === 'block');
    expect(blocks.length).toBe(members.length);
    expect(h.hp).toBe(hp);
    expect(st - h.stamina).toBeCloseTo(RUSH.blow.dmg * GUARD.staminaPerDmg * WEAPONS.sword.guardCost, 0);
  });

  it('a block raised at the last moment is just the one block (no parry): none stunned, the counter open', () => {
    const { room, h } = setup();
    const { members, land } = windup(room);
    const ticks = until(room, h.id, land, land - 0.12, { ...NO_INTENT, ay: -1, block: true, blockSeq: 1 });
    const all = ticks.flat();
    expect(all.filter((e) => e.k === 'block').length).toBe(members.length);
    expect(all.some((e) => (e.k as string) === 'parry' || (e.k as string) === 'rushparried')).toBe(false);
    expect(h.hp).toBe(100);
    expect(h.counterUntil).toBeGreaterThan(room.time);
    for (const e of members) expect(e.act).not.toBe('stunned');
  });

  it('a dodge through it gets out of all of it: a Rogue\'s dash, a Mage\'s blink', () => {
    for (const weapon of ['daggers', 'wand']) {
      const { room, h } = setup(weapon);
      const { members, land } = windup(room);
      const ticks = until(room, h.id, land, land - 0.06, { ...NO_INTENT, ay: -1, my: 1, rollSeq: 1 });
      expect(h.hp).toBe(100);
      expect(ticks.flat().filter((e) => e.k === 'dodge').length).toBe(members.length);
    }
  });

  it('a quick blow doesn\'t break a rush wind-up; a charged one breaks the one it hits, and the rest still come', () => {
    const { room, h } = setup();
    const { members } = windup(room);
    const swing: Swing = { ...WEAPONS.sword.combo[0], range: 9, arc: 360 };
    const [a, b] = members;
    hitEnemy(h, swing, a, room.time, room.events);
    expect(a.attack?.rush).toBeDefined();
    h.hitIds = [];
    h.heavy = true;
    hitEnemy(h, swing, b, room.time, room.events);
    h.heavy = false;
    expect(b.attack).toBeNull();
    expect(members.filter((e) => e.attack?.rush).length).toBe(members.length - 1);
  });

  it('never from behind: a hero facing away isn\'t rushed, and every rush winds up in front of its hero', () => {
    const { room, h } = setup();
    room.setIntent(h.id, { ...NO_INTENT, ay: 1 });
    run(room, 0.5);
    expect(room.rushes.live).toEqual([]);
    expect(room.enemies.some((e) => e.rushTo || e.attack?.rush)).toBe(false);
    // A long fight, the hero turning about: each rush's middle is in front of the hero it's on.
    const f = field([[12, 10], [13, 10.5], [14, 10], [16, 10], [17, 10.5], [18, 10]].map(([x, y]) => ({ kind: 'scrapper' as const, x, y, pack: 1 })));
    let n = 0;
    for (let i = 0; i < 30 / TICK; i++) {
      const a = Math.floor(i * TICK / 2.5) * 1.3;
      f.room.setIntent(f.h.id, { ...NO_INTENT, ax: Math.cos(a), ay: Math.sin(a) });
      f.h.hp = 100;
      f.room.step();
      for (const e of f.room.events) if (e.k === 'rush') {
        n++;
        const dx = e.x - f.h.x, dy = e.y - f.h.y;
        expect((dx * f.h.fx + dy * f.h.fy) / Math.hypot(dx, dy)).toBeGreaterThan(RUSH.front);
      }
    }
    expect(n).toBeGreaterThan(0);
  });

  it('spreads over a party: two packs in front of both go after different heroes', () => {
    const foes = [[13, 10], [14, 10.2], [15, 10], [15.5, 9.6], [16.5, 9.8], [17.5, 9.6]].map(([x, y], i) => ({ kind: 'scrapper' as const, x, y, pack: i < 3 ? 1 : 2 }));
    const { room, hs } = field(foes, [['a', 14.6, 13], ['b', 15.6, 13]]);
    for (const h of hs) room.setIntent(h.id, { ...NO_INTENT, ay: -1 });
    rushNow(room.rushes, 1);
    rushNow(room.rushes, 2);
    run(room, 0.1);
    expect(room.rushes.live.length).toBe(2);
    expect(new Set(room.rushes.live.map((r) => r.hero)).size).toBe(2);
  });

  it('plays the same way twice (seeded)', () => {
    const play = () => {
      const f = field([[12, 10], [13, 10.5], [14, 10], [16, 10], [17, 10.5], [18, 10], [15, 8]].map(([x, y], i) => ({ kind: 'scrapper' as const, x, y, pack: 1, ...(i === 6 ? { variant: 'ironhide' as const } : {}) })));
      const log: string[] = [];
      for (let i = 0; i < 40 / TICK; i++) {
        f.room.setIntent(f.h.id, { ...NO_INTENT, ay: -1, block: i % 50 > 30, blockSeq: Math.floor(i / 50), attackSeq: Math.floor(i / 90) });
        f.h.hp = 100;
        f.room.step();
        for (const e of f.room.events) if (e.k === 'rush' || e.k === 'block' || e.k === 'impact') log.push(`${i}:${e.k}`);
      }
      return { log, foes: JSON.stringify(f.room.enemies.map((e) => [e.x, e.y, e.hp, e.act])) };
    };
    const a = play(), b = play();
    expect(a.log.filter((x) => x.endsWith('rush')).length).toBeGreaterThan(0);
    expect(a).toEqual(b);
  });
});
