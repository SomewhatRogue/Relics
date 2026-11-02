/** A party in a fight: friendly fire, bleeding and picking up, going out, grudges, and scaling. */
import { describe, expect, it } from 'vitest';
import { ArenaRoom } from '../src/sim/room';
import { allOut, allyHit, scaleBosses, scaleFoes, stepParty } from '../src/sim/party';
import { HERO, PARTY, TICK, WEAPONS } from '../src/shared/tuning';
import { NO_INTENT, type FightEvent } from '../src/sim/types';

/** Two players side by side in an empty room, nothing else in it. */
function two() {
  const room = new ArenaRoom(3, { scrappers: false });
  room.enemies.length = 0;
  const a = room.join('kyle-0001'), b = room.join('sam-00001');
  Object.assign(a, { x: 9, y: 8, fx: 1, fy: 0 });
  Object.assign(b, { x: 10, y: 8 });
  return { room, a, b };
}
const ticks = (s: number) => Math.round(s / TICK);

describe('friendly fire', () => {
  it("a teammate in your swing takes half of it, once a swing", () => {
    const { room, a, b } = two();
    room.setIntent(a.id, { ...NO_INTENT, attackSeq: 1 });
    for (let i = 0; i < ticks(0.6); i++) room.step();
    expect(b.hp).toBe(HERO.hp - Math.round(WEAPONS[a.weapon].combo[0].dmg * PARTY.friendly));
  });
  it('alone, there is nobody to hit', () => {
    const room = new ArenaRoom(3, { scrappers: false });
    room.enemies.length = 0;
    const a = room.join('kyle-0001');
    room.setIntent(a.id, { ...NO_INTENT, attackSeq: 1 });
    for (let i = 0; i < ticks(0.6); i++) room.step();
    expect(a.hp).toBe(HERO.hp);
  });
  it('downing the same teammate three times in a job makes a grudge', () => {
    const { b } = two();
    const ev: FightEvent[] = [];
    for (let i = 0; i < PARTY.grudge; i++) (b.hp = 1), Object.assign(b, { act: 'idle' }), allyHit('kyle-0001', b, 10, ev);
    expect(ev.filter((e) => e.k === 'grudge')).toEqual([expect.objectContaining({ id: 'sam-00001', by: 'kyle-0001' })]);
  });
});

describe('going down in a party', () => {
  it('you bleed instead of getting up; a teammate standing over you picks you up', () => {
    const { room, a, b } = two();
    b.hp = 1;
    allyHit(a.id, b, 10, []);
    expect(b.act).toBe('down');
    Object.assign(a, { x: 3, y: 3 });
    for (let i = 0; i < ticks(HERO.respawn + 1); i++) room.step();
    expect(b.act).toBe('down');
    expect(b.bleeding).toBe(true);
    // Kyle stands over Sam long enough.
    Object.assign(a, { x: b.x + 0.5, y: b.y });
    for (let i = 0; i < ticks(PARTY.pickUp + 0.2); i++) room.step();
    expect(b.act).not.toBe('down');
    expect(b.hp).toBe(Math.round(b.maxHp * PARTY.upHp));
  });
  it("nobody comes: you're out, and when everyone's out the job is lost", () => {
    const { room, a, b } = two();
    Object.assign(a, { x: 2, y: 2 });
    b.hp = 1;
    allyHit(a.id, b, 10, []);
    for (let i = 0; i < ticks(PARTY.bleed + 0.5); i++) room.step();
    expect(b.out).toBe(true);
    expect(allOut(room.heroes)).toBe(false);
    // The last one standing goes down too: nobody left to pick anyone up.
    a.hp = 1;
    allyHit(b.id, a, 10, []);
    for (let i = 0; i < ticks(PARTY.bleed + 0.5); i++) room.step();
    expect(allOut(room.heroes)).toBe(true);
  });
  it('the last one left (the rest gone home) gets up the old way', () => {
    const { room, a, b } = two();
    b.hp = 1;
    allyHit(a.id, b, 10, []);
    room.step();
    room.heroes.splice(room.heroes.indexOf(a), 1);
    const ev: FightEvent[] = [];
    stepParty(room.heroes, TICK, ev);
    for (let i = 0; i < ticks(HERO.respawn + 0.3); i++) room.step();
    expect(b.act).not.toBe('down');
  });
});

describe('scaling', () => {
  it('more players, more goblins (named ones once) and tougher named ones', () => {
    const foes = [{ kind: 'scrapper' as const, x: 5, y: 5 }, { kind: 'scrapper' as const, x: 6, y: 5 }, { kind: 'butcher' as const, x: 8, y: 8, name: 'SKARN' }];
    expect(scaleFoes(foes, 1)).toHaveLength(3);
    const three = scaleFoes(foes, 3);
    expect(three.filter((f) => !f.name)).toHaveLength(2 + Math.round(2 * PARTY.foes * 2));
    expect(three.filter((f) => f.name)).toHaveLength(1);
    const room = new ArenaRoom(1, { map: undefined, foes: [foes[2]] });
    const hp = room.enemies[0].maxHp;
    scaleBosses(room.enemies, 3);
    expect(room.enemies[0].maxHp).toBe(Math.round(hp * (1 + PARTY.boss * 2)));
  });
});
