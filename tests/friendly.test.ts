import { describe, expect, it } from 'vitest';
import { newEnemy, stepEnemy } from '../src/sim/enemies';
import { newHero } from '../src/sim/hero';
import { Rng } from '../src/shared/rng';
import { ARCHER } from '../src/shared/tuning';
import type { FightEvent } from '../src/sim/types';

describe('goblins in the way of their own', () => {
  it("an arrow that misses you takes the goblin in its line", () => {
    const archer = newEnemy(1, 'scrapper', 2, 5), mate = newEnemy(2, 'scrapper', 6, 5);
    Object.assign(archer, { bow: true, act: 'attack' });
    archer.attack = { kind: 'shot', t: ARCHER.shot.windup - 0.001, windup: ARCHER.shot.windup, active: 0.1, recover: 0.5, dmg: 10, knock: 2, unblockable: false, dx: 1, dy: 0, ox: 2, oy: 5, range: 12, arc: 0, cx: 2, cy: 5, radius: 0, done: false };
    const h = newHero('me', 9, 9);
    const ev: FightEvent[] = [];
    stepEnemy(archer, [h], new Rng(1), 3, 0.05, ev, [archer, mate]);
    expect(h.hp).toBe(h.maxHp);
    expect(mate.hp).toBeLessThan(mate.maxHp);
  });
});
