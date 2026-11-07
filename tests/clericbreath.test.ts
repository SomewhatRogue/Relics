/** The Cleric's stamina comes back later and slower than other heroes' (Kyle, 2026-11-07: the shield of light was too strong). */
import { describe, expect, it } from 'vitest';
import { ArenaRoom } from '../src/sim/room';
import { HERO, HOLY_GUARD, TICK, type WeaponId } from '../src/shared/tuning';

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
    const t = (HERO.regenDelay + HOLY_GUARD.regenDelay) / 2;
    expect(after('sword', t)).toBeGreaterThan(50);
    expect(after('mace', t)).toBe(50);
  });
  it('and comes back slower once it does', () => {
    const t = HOLY_GUARD.regenDelay + 1;
    const cleric = after('mace', t) - 50, warrior = after('sword', HERO.regenDelay + 1) - 50;
    expect(cleric).toBeLessThan(warrior * 0.7);
    expect(cleric).toBeGreaterThan(warrior * 0.4);
  });
});
