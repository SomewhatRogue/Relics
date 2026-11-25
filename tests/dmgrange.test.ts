/** Damage ranges: every hero hit rolls inside its weapon's spread (docs/design/damage-ranges.md). */
import { describe, expect, it } from 'vitest';
import { WEAPONS, SPREAD } from '../src/shared/tuning';
import { rangeOf, rollDmg, spreadOf } from '../src/shared/dmgrange';
import { ArenaRoom } from '../src/sim/room';
import { hitEnemy, rollCrit } from '../src/sim/combat';

const hero = (id: string, weapon = 'sword') => ({ id, weapon, dmgSeed: undefined as number | undefined });

describe('damage ranges', () => {
  it('spread by weapon, and the range from a base hit', () => {
    for (const k of ['daggers', 'wand', 'staff']) expect(spreadOf(k)).toBe(0.1);
    for (const k of ['greatsword', 'mace']) expect(spreadOf(k)).toBe(0.25);
    for (const k of ['sword', 'spear', 'longbow', 'crossbow', 'rapier']) expect(spreadOf(k)).toBe(SPREAD.default);
    expect(rangeOf(10, 'sword')).toEqual([9, 12]);
    expect(rangeOf(20, 'greatsword')).toEqual([15, 25]);
    expect(rangeOf(10, 'daggers')).toEqual([9, 11]);
  });
  it('a roll stays inside its spread, averages one, and is the hero\'s own', () => {
    for (const k of ['sword', 'daggers', 'mace']) {
      const h = hero('me', k), s = spreadOf(k), rolls = Array.from({ length: 4000 }, () => rollDmg(h));
      expect(Math.min(...rolls)).toBeGreaterThanOrEqual(1 - s);
      expect(Math.max(...rolls)).toBeLessThanOrEqual(1 + s);
      expect(Math.min(...rolls)).toBeLessThan(1 - s * 0.9);
      expect(Math.max(...rolls)).toBeGreaterThan(1 + s * 0.9);
      expect(Math.abs(rolls.reduce((a, b) => a + b, 0) / rolls.length - 1)).toBeLessThan(0.02);
    }
    const a = hero('me'), b = hero('me'), c = hero('you');
    const ra = Array.from({ length: 20 }, () => rollDmg(a)), rb = Array.from({ length: 20 }, () => rollDmg(b)), rc = Array.from({ length: 20 }, () => rollDmg(c));
    expect(ra).toEqual(rb);
    expect(ra).not.toEqual(rc);
  });
  it('a hero\'s hits on a dummy vary, inside the range; the crit dice never move', () => {
    const run = (roll: boolean) => {
      const room = new ArenaRoom(3, { scrappers: false }), h = room.join('me');
      h.drills = { crit: 5 };
      const crits: boolean[] = [], hits: number[] = [];
      for (let i = 0; i < 200; i++) {
        if (!roll) h.dmgSeed = undefined;
        crits.push(rollCrit(h));
        if (roll) hits.push(rollDmg(h));
      }
      return { crits, hits };
    };
    const a = run(true), b = run(false);
    expect(a.crits).toEqual(b.crits);
    // No crit chance: a sword's first hit lands inside rangeOf (the dummy takes it whole).
    const room = new ArenaRoom(3, { scrappers: false }), h = room.join('me'), e = room.enemies.find((x) => x.kind === 'dummy')!, s = WEAPONS[h.weapon].combo[0];
    Object.assign(h, { x: e.x, y: e.y + 1.1, fx: 0, fy: -1 });
    const [lo, hi] = rangeOf(s.dmg, h.weapon), seen = new Set<number>();
    for (let i = 0; i < 100; i++) (h.hitIds.length = 0, seen.add(hitEnemy(h, s, e, room.time, [])));
    expect(seen.size).toBeGreaterThan(1);
    for (const n of seen) (expect(n).toBeGreaterThanOrEqual(lo - 1), expect(n).toBeLessThanOrEqual(hi + 1));
  });
});
