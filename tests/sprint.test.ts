import { describe, expect, it } from 'vitest';
import { WEAPONS, dodgeName } from '../src/shared/weapons';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT } from '../src/sim/types';

describe("the shortbow's SPRINT (2026-11-12)", () => {
  it('a press runs you faster for a while, for stamina, and never makes you untouchable', () => {
    expect(dodgeName('RANGER', WEAPONS.shortbow)).toBe('SPRINT');
    expect(dodgeName('RANGER', WEAPONS.longbow)).toBe('JUMP');
    const walk = (sprint: boolean) => {
      const r = new ArenaRoom(1, {});
      const h = r.join('a');
      Object.assign(h, { weapon: 'shortbow', x: 10, y: 10 });
      r.enemies.length = 0;
      const x0 = h.x, st0 = h.stamina;
      r.setIntent('a', { ...NO_INTENT, mx: 1, rollSeq: sprint ? 1 : 0 });
      r.advance(1);
      return { dx: h.x - x0, spent: st0 - h.stamina, act: h.act };
    };
    const plain = walk(false), fast = walk(true);
    expect(fast.dx).toBeGreaterThan(plain.dx * 1.35);
    expect(fast.spent).toBeGreaterThan(10);
    expect(fast.act).not.toBe('roll');
  });
});
