import { describe, expect, it } from 'vitest';
import { STREAK, STREAK_STEPS, streakBonus, streakStep } from '../src/shared/streak';
import { statsOf } from '../src/sim/gearstats';
import { ArenaRoom } from '../src/sim/room';
import { count, useBoard, type Board } from '../src/sim/score';
import { stepStreaks } from '../src/sim/streak';
import type { FightEvent } from '../src/sim/types';

const hero = () => new ArenaRoom(5, { scrappers: false, props: false }).join('kyle-0001');
/** One room step's counting: `fn` counts, then the streak settles. */
function tick(h: ReturnType<typeof hero>, now: number, fn: () => void = () => undefined): FightEvent[] {
  const b: Board = {}, ev: FightEvent[] = [];
  useBoard(b);
  fn();
  stepStreaks([h], now, ev);
  useBoard(null);
  return ev;
}

describe('the streak (2026-11-14)', () => {
  it('hits, kills, blocks and dodges add while they keep coming; a heavy hit adds more', () => {
    const h = hero();
    tick(h, 0, () => (count(h.id, 'best', 10), count(h.id, 'kills'), count(h.id, 'blocks'), count(h.id, 'dodges')));
    expect(h.streak).toBe(STREAK.hit + STREAK.kill + STREAK.block + STREAK.dodge);
    tick(h, 1, () => count(h.id, 'best', 40));
    expect(h.streak).toBe(4 + STREAK.heavy);
  });
  it('anything that gets through to your health ends it, with a crack once it was worth something', () => {
    const h = hero();
    for (let i = 0; i < 12; i++) tick(h, i * 0.5, () => count(h.id, 'best', 10));
    expect(h.streak).toBe(12);
    const ev = tick(h, 7, () => count(h.id, 'taken', 5));
    expect(h.streak).toBe(0);
    expect(h.streakBest).toBe(12);
    expect(ev.some((e) => e.k === 'streakbreak')).toBe(true);
  });
  it('a quiet spell only halves it, and halves again', () => {
    const h = hero();
    for (let i = 0; i < 12; i++) tick(h, i * 0.5, () => count(h.id, 'best', 10));
    tick(h, 5.5 + STREAK.window);
    expect(h.streak).toBe(6);
    tick(h, 5.5 + 2 * STREAK.window);
    expect(h.streak).toBe(3);
  });
  it('each step makes you a little stronger while it lasts, and the bonus goes when it breaks', () => {
    const h = hero(), base = { ...statsOf(h) };
    for (let i = 0; i < STREAK_STEPS[1].at; i++) tick(h, i * 0.2, () => count(h.id, 'best', 10));
    expect(h.streakStep).toBe(2);
    const b = streakBonus(2);
    expect(statsOf(h).damage).toBeCloseTo(base.damage + b.damage, 5);
    expect(statsOf(h).speed).toBeCloseTo(base.speed * (1 + b.speed), 5);
    tick(h, 99, () => count(h.id, 'taken', 1));
    expect(statsOf(h).damage).toBeCloseTo(base.damage, 5);
    expect(streakStep(9)).toBe(0);
    expect(streakStep(50)).toBe(3);
  });
});
