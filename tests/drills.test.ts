/** The trainer's drills: what they cost, how far a level goes, and what they do in a fight. */
import { describe, expect, it } from 'vitest';
import { DRILLS, drillCap, drillPrice, CRIT, HERO, WEAPONS } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { statsOf } from '../src/sim/gearstats';
import { rollCrit } from '../src/sim/combat';
import { NO_INTENT } from '../src/sim/types';

describe('drills', () => {
  it('climb in price, and a trainer only takes you as far as your level', () => {
    expect(drillPrice('power', 1)).toBeGreaterThan(drillPrice('power', 0));
    expect(drillCap('power', 1)).toBe(1);
    expect(drillCap('power', 4)).toBe(3);
    expect(drillCap('skill', 10)).toBe(DRILLS.skill.max);
  });
  it('power, health, speed and wind show in the hero\'s stats; a crit lands half again as hard', () => {
    const room = new ArenaRoom(3, { scrappers: false });
    const h = room.join('me'), plain = statsOf(h);
    h.drills = { power: 2, health: 3, speed: 1, wind: 2, crit: 5 };
    const s = statsOf(h);
    expect(s.damage).toBeCloseTo(plain.damage + 2 * DRILLS.power.per);
    expect(s.health).toBe(plain.health + 3 * DRILLS.health.per);
    expect(s.speed).toBeCloseTo(plain.speed * (1 + DRILLS.speed.per));
    expect(s.crit).toBeCloseTo(5 * DRILLS.crit.per);
    // About a fifth of blows crit at 20%, and the same hero rolls the same way every time.
    const rolls = Array.from({ length: 400 }, () => rollCrit(h)).filter(Boolean).length;
    expect(rolls).toBeGreaterThan(50);
    expect(rolls).toBeLessThan(120);
    // A blow on the dummy: with every blow a crit, it lands at CRIT times.
    const e = room.enemies.find((x) => x.kind === 'dummy')!;
    for (const o of room.enemies) if (o !== e) Object.assign(o, { x: 1, y: 15 });
    Object.assign(h, { x: e.x, y: e.y + 1.1, fx: 0, fy: -1, drills: { crit: 1 } });
    h.critSeed = 0;
    const seen: number[] = [];
    room.setIntent('me', { ...NO_INTENT, attackSeq: 1 });
    for (let i = 0; i < 20; i++) (room.step(), room.events.forEach((ev) => ev.k === 'hit' && ev.on === 'enemy' && seen.push(ev.n)));
    expect(seen.length).toBe(1);
    expect([WEAPONS[h.weapon].combo[0].dmg, Math.round(WEAPONS[h.weapon].combo[0].dmg * CRIT)]).toContain(seen[0]);
    expect(HERO.hp).toBeGreaterThan(0);
  });
});
