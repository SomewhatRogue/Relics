/** The Cleric's bar is FAITH (Kyle, 2026-11-08): it comes back later and slower, not while the shield is up or a smite is called, and the smite costs it. */
import { describe, expect, it } from 'vitest';
import { ArenaRoom } from '../src/sim/room';
import { CHARGE, FAITH, HERO, TICK, type WeaponId } from '../src/shared/tuning';
import { NO_INTENT } from '../src/sim/types';

/** One hero with `w` in an empty yard, half their stamina spent just now; their stamina after `s` seconds. */
function after(w: WeaponId, s: number): number {
  const room = new ArenaRoom(3, { scrappers: false, props: false });
  const h = room.join('me');
  room.enemies.length = 0;
  h.weapon = w;
  h.stamina = 50, (h.staminaAt = room.time);
  for (let i = 0; i < Math.round(s / TICK); i++) room.step();
  return h.stamina;
}

describe("a Cleric's breath", () => {
  it('waits longer before it starts back than a Warrior\'s', () => {
    const t = (HERO.regenDelay + FAITH.delay) / 2;
    expect(after('sword', t)).toBeGreaterThan(50);
    expect(after('mace', t)).toBe(50);
  });
  it('and comes back slower once it does', () => {
    const cleric = after('mace', FAITH.delay + 1) - 50, warrior = after('sword', HERO.regenDelay + 1) - 50;
    expect(cleric).toBeCloseTo(FAITH.regen, 0);
    expect(cleric).toBeLessThan(warrior * 0.5);
  });
});

describe('the flail on the move (Kyle, 2026-11-07)', () => {
  it('a Cleric walks while swinging it and while spinning it up, slower than walking', () => {
    for (const hold of [false, true]) {
      const room = new ArenaRoom(3, { scrappers: false, props: false });
      const h = room.join('me');
      room.enemies.length = 0;
      h.weapon = 'flail';
      const x0 = h.x;
      for (let i = 0; i < Math.round(0.6 / TICK); i++) {
        room.setIntent('me', { ...NO_INTENT, mx: 1, my: 0, attack: hold || i < 3, attackSeq: 1 });
        room.step();
      }
      expect(hold ? h.act : 'x').toBe(hold ? 'charge' : 'x');
      expect(h.x - x0).toBeGreaterThan(0.6);
    }
  });
});

describe('faith (Kyle, 2026-11-08)', () => {
  const cleric = () => {
    const room = new ArenaRoom(3, { scrappers: false, props: false });
    const h = room.join('me');
    room.enemies.length = 0;
    h.weapon = 'mace';
    return { room, h, run: (s: number, i: Partial<typeof NO_INTENT>) => { for (let k = 0; k < Math.round(s / TICK); k++) room.setIntent('me', { ...NO_INTENT, ...i }), room.step(); } };
  };
  it("doesn't come back while the shield of light is up", () => {
    const { h, room, run } = cleric();
    h.stamina = 40, (h.staminaAt = room.time - 9);
    run(2, { block: true });
    expect(h.stamina).toBe(40);
    run(1, {});
    expect(h.stamina).toBeGreaterThan(40);
  });
  it('calling a smite down drains it, and running dry loses the smite', () => {
    const { h, run } = cleric();
    h.stamina = 100;
    run(CHARGE.start + 0.8, { attack: true, attackSeq: 1 });
    expect(h.act).toBe('charge');
    expect(h.stamina).toBeLessThan(100 - FAITH.smite * 0.6);
    const dry = cleric();
    dry.h.stamina = 8;
    dry.run(CHARGE.start + 0.8, { attack: true, attackSeq: 1 });
    expect(dry.h.act).not.toBe('charge');
    expect(dry.h.stamina).toBe(0);
  });
});
