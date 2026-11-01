import { beforeEach, describe, expect, it } from 'vitest';
import { GATES, LESSONS } from '../src/shared/wood';
import { kill } from '../src/sim/damage';
import { NO_INTENT, type FightEvent } from '../src/sim/types';
import { Game } from '../src/client/game';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
beforeEach(() => store.clear());

/** Walk the hero into lesson `i`'s area and let the wood notice. */
function enter(g: Game, i: number): void {
  const a = [[8, 33], [32, 36], [32, 18], [53, 20], [52, 10]][i];
  Object.assign(g.hero, { x: a[0], y: a[1] });
  g.step(0.05, NO_INTENT);
}
/** Kill everything the lesson brought, counting `n` of its moves. */
function clear(g: Game, n: number, k: FightEvent['k']): void {
  const w = g.wood!;
  for (let i = 0; i < n; i++) (g.room.events as FightEvent[]).push({ k, x: 0, y: 0 } as FightEvent);
  const ev: FightEvent[] = Array.from({ length: n }, () => ({ k, x: 0, y: 0 }) as FightEvent);
  for (const e of g.room.enemies) if (w.ids.includes(e.id)) kill(e, ev, 'burst', 0, 1);
  // Feed the counted moves to the wood through a frame.
  const before = w.count;
  w.count = before + n;
  g.step(0.05, NO_INTENT);
}

describe('the prologue wood', () => {
  it('a new hero starts in the wood; only attack is taught at first; a gate stands across each way on', () => {
    const g = new Game();
    g.create('WARRIOR', 'stray');
    expect(g.mode).toBe('wood');
    expect(g.taught()).toEqual(['attack']);
    for (const gate of GATES) expect(g.room.map.blocks.some((b) => b.x === gate.block.x && b.y === gate.block.y)).toBe(true);
    // A roll press does nothing yet.
    const x = g.hero.x;
    g.step(0.3, { ...NO_INTENT, rollSeq: 1, mx: 0, my: 0 });
    expect(g.hero.act).not.toBe('roll');
    expect(g.hero.x).toBeCloseTo(x);
  });

  it('each lesson opens its gate once done, and teaches the next move; Hew picks you up when you fall', () => {
    const g = new Game();
    g.create('RANGER', 'stray');
    // (Hew gets you up before the first lesson starts.)
    g.room.time = 6;
    enter(g, 0);
    clear(g, 0, 'hit');
    expect(g.wood!.more).toBe(true);
    clear(g, 0, 'hit');
    expect(g.wood!.stage).toBe(1);
    expect(g.room.map.blocks.some((b) => b.x === GATES[0].block.x && b.y === GATES[0].block.y)).toBe(false);
    expect(g.taught()).toContain('roll');
    // Down in the wood: up again at once.
    g.hero.hp = 0;
    g.hero.act = 'down';
    (g as unknown as { stepWoodFrame(h: unknown, ev: FightEvent[], dt: number): void }).stepWoodFrame(g.hero, [{ k: 'down', x: g.hero.x, y: g.hero.y }], 0.05);
    expect(g.hero.act).toBe('idle');
    expect(g.hero.hp).toBe(g.hero.maxHp);
    for (let i = 1; i < 4; i++) {
      enter(g, i);
      clear(g, LESSONS[i].need, 'dodge');
      expect(g.wood!.stage).toBe(i + 1);
    }
    expect(g.taught()).toContain('block');
  });

  it('the hut: the cutscene kills Hew; the Stoker gives up the javelin; the road leads to Wickhold with the tally stick', () => {
    const g = new Game();
    g.create('MAGE', 'stray');
    const w = () => g.wood!;
    Object.assign(w(), { stage: 4, entered: false });
    enter(g, 4);
    expect(w().cut).toBeGreaterThanOrEqual(0);
    expect(g.taught()).toEqual([]);
    for (let i = 0; i < 220 && w().cut >= 0; i++) g.step(0.05, NO_INTENT);
    expect(w().hewAlive).toBe(false);
    expect(g.room.map.npcs?.some((n) => n.talk === 'hew')).toBe(false);
    const s = g.room.enemies.find((e) => e.name === 'THE STOKER')!;
    expect(s.alert).toBe(true);
    kill(s, [], 'burst', 0, 1);
    g.step(0.05, NO_INTENT);
    expect(w().relic).toBe(true);
    expect(g.hero.relics).toEqual(['lodestone', 'javelin']);
    Object.assign(g.hero, { x: 1.6, y: 4 });
    g.step(0.05, NO_INTENT);
    expect(g.mode).toBe('town');
    expect(g.profile).toMatchObject({ prologue: true, tally: true, relic: 'javelin' });
    expect(g.greeting).toBe('orla');
  });

  it('a second hero can skip the wood and still gets the javelin; a Healer comes out with a cold censer', () => {
    const g = new Game();
    g.create('HEALER', 'ivy');
    g.skipWood();
    expect(g.mode).toBe('town');
    expect(g.profile).toMatchObject({ prologue: true, cold: true, relic: 'javelin' });
    expect(g.hero.cold).toBe(true);
  });
});
