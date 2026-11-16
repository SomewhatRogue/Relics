/** A Mage's blink trap (sim/blinktrap.ts; Kyle, 2026-11-16) and the Rogue's shadow on the dash. */
import { describe, expect, it } from 'vitest';
import { BLINK_TRAP, TICK } from '../src/shared/tuning';
import { burning } from '../src/sim/elements';
import { frozen } from '../src/sim/damage';
import { mageArena } from './magearena';

describe("a Mage's blink trap", () => {
  it('a blink leaves a trap of your element where you stood; a goblin stepping in springs it', () => {
    for (const el of ['fire', 'frost', 'storm'] as const) {
      const a = mageArena('wand', [[9, 2]], el, true);
      a.run(TICK, { rollSeq: 1, mx: 1 });
      const z = a.room.zones.find((q) => q.kind === 'trap');
      expect(z).toMatchObject({ x: 9, y: 9, el, owner: 'me' });
      // The goblin walks over it.
      Object.assign(a.e, { x: 9, y: 9.2, cooldown: 99 });
      a.run(TICK * 2);
      expect(a.room.time).toBeGreaterThanOrEqual(z!.until);
      expect(a.e.hp).toBeLessThan(a.e.maxHp);
      if (el === 'fire') expect(burning(a.e, a.room.time)).toBe(true);
      if (el === 'frost') expect(frozen(a.e, a.room.time)).toBe(true);
      if (el === 'storm') expect(a.e.act).toBe('stunned');
    }
  });

  it('no more than two of one Mage\'s at once, and not one every blink', () => {
    const a = mageArena('wand', [[2, 2]], 'fire');
    let seq = 0;
    for (let i = 0; i < 5; i++) a.run(1.2, { rollSeq: ++seq, mx: i % 2 ? 1 : -1 });
    const mine = a.room.zones.filter((q) => q.kind === 'trap' && a.room.time < q.until);
    expect(mine.length).toBeLessThanOrEqual(BLINK_TRAP.max);
    expect(mine.length).toBeGreaterThan(0);
  });

  it('a Rogue\'s dash leaves a shadow instead, and no trap', () => {
    const a = mageArena('daggers', [[2, 2]]);
    a.run(TICK, { rollSeq: 1, mx: 1 });
    expect(a.h.decoyUntil).toBeGreaterThan(a.room.time);
    expect(a.room.zones.some((q) => q.kind === 'trap')).toBe(false);
  });
});
