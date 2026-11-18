import { beforeEach, describe, expect, it } from 'vitest';
import { lessonsFor } from '../src/shared/wood';
import { isDead } from '../src/sim/damage';
import { NO_INTENT } from '../src/sim/types';
import { DRILL } from '../src/sim/wood';
import { Game } from '../src/client/game';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
beforeEach(() => store.clear());

/** Into a lesson's area, its card dismissed, its goblins out. */
function lesson(cls: 'WARRIOR' | 'ROGUE', stage: number, x: number, y: number): Game {
  const g = new Game();
  g.create(cls, 'stray');
  Object.assign(g.wood!, { wake: -1, hold: null, from: null, stage, entered: false, bitter: 'done' });
  Object.assign(g.hero, { act: 'idle', actT: 0, lying: false, x, y });
  g.step(0.05, NO_INTENT);
  expect(g.wood!.hold?.kind).toBe('card');
  g.continueHold();
  g.step(0.05, NO_INTENT);
  return g;
}

describe("the wood's pace (Kyle, 2026-11-17)", () => {
  it('the prompt comes up as the blow is drawn back and is gone as it lands', () => {
    const g = lesson('WARRIOR', 2, 32, 22);
    const e = g.room.enemies.find((x) => g.wood!.ids.includes(x.id))!;
    Object.assign(e, { x: g.hero.x + 1, y: g.hero.y, fx: -1, fy: 0, cooldown: 0 });
    let up = -1, landed = -1, windup = 0;
    for (let i = 0; i < 200 && landed < 0; i++) {
      g.step(0.02, NO_INTENT);
      const a = g.room.enemies.find((x) => x.attack && g.wood!.ids.includes(x.id))?.attack;
      if (a && up < 0 && g.wood!.caption?.text === 'NOW: HOLD BLOCK') (up = a.t), (windup = a.windup);
      if (up >= 0 && g.hero.hp < g.hero.maxHp) landed = g.room.time;
    }
    // Up within the first tenth of a second of the wind-up, not the last.
    expect(up).toBeGreaterThanOrEqual(0);
    expect(up).toBeLessThan(0.12);
    expect(windup).toBeGreaterThan(0.5);
    // And down within a quarter of a second of the blow landing.
    expect(landed).toBeGreaterThan(0);
    expect(g.wood!.caption!.until).toBeLessThan(landed + 0.25);
  });

  it('only the first blows of a lesson are prompted', () => {
    expect(DRILL.wheels).toBe(2);
    const g = lesson('WARRIOR', 2, 32, 22);
    let prompts = 0, last = -1;
    for (let i = 0; i < 1500; i++) {
      g.step(0.02, NO_INTENT);
      g.hero.hp = g.hero.maxHp;
      const c = g.wood!.caption;
      if (c?.text === 'NOW: HOLD BLOCK' && c.until !== last) prompts++, (last = c.until);
    }
    expect(prompts).toBe(2);
  });

  it('killing the goblins opens the way on, the count done or not: they never come again', () => {
    for (const [cls, stage, x, y] of [['ROGUE', 1, 32, 36], ['WARRIOR', 2, 32, 22]] as const) {
      const g = lesson(cls, stage, x, y);
      expect(lessonsFor(cls)[stage].need).toBeGreaterThan(0);
      expect(g.wood!.count).toBe(0);
      const n = g.room.enemies.length;
      for (const e of g.room.enemies) if (g.wood!.ids.includes(e.id)) Object.assign(e, { hp: 0, act: 'dead', actT: 0, actDur: 1e9 });
      for (let i = 0; i < 10; i++) g.step(0.05, NO_INTENT);
      expect(g.wood!.stage).toBe(stage + 1);
      expect(g.room.enemies.length).toBe(n);
      expect(g.room.enemies.filter((e) => g.wood!.ids.includes(e.id) && !isDead(e)).length).toBe(0);
    }
  });

  it('a block is asked for twice, not three times', () => {
    expect(lessonsFor('WARRIOR')[2].need).toBe(2);
    expect(lessonsFor('HEALER')[2].need).toBe(2);
  });
});
