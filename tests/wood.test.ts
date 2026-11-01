import { beforeEach, describe, expect, it } from 'vitest';
import { GATES, LESSONS, lessonsFor } from '../src/shared/wood';
import { kill } from '../src/sim/damage';
import { NO_INTENT, type FightEvent } from '../src/sim/types';
import { Game } from '../src/client/game';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
beforeEach(() => store.clear());

/** Past the waking: on your feet, the move card dismissed. */
function wake(g: Game): void {
  Object.assign(g.wood!, { wake: -1, hold: null, from: null });
  Object.assign(g.hero, { act: 'idle', actT: 0, lying: false });
}
/** Walk the hero into lesson `i`'s area, let the wood notice, and dismiss its card. */
function enter(g: Game, i: number): void {
  const a = [[8, 33], [32, 36], [32, 18], [53, 20], [52, 10]][i];
  Object.assign(g.hero, { x: a[0], y: a[1] });
  g.step(0.05, NO_INTENT);
  if (g.wood!.hold) g.wood!.hold = null;
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
  w.praised = 99;
  g.step(0.05, NO_INTENT);
  w.hold = null;
}

describe('the prologue wood', () => {
  it('opens with you down and still; Hew walks over, talks, hauls you up; then a card to walk', () => {
    const g = new Game();
    g.create('ROGUE', 'stray');
    expect(g.hero.act).toBe('down');
    expect(g.taught()).toEqual([]);
    const x = g.hero.x;
    for (let i = 0; i < 60; i++) g.step(0.1, { ...NO_INTENT, mx: 1 });
    expect(g.hero.x).toBeCloseTo(x);
    // He talks; each line waits for a tap, and the world with it.
    for (let i = 0; i < 80 && !g.wood!.hold; i++) g.step(0.1, NO_INTENT);
    expect(g.wood!.hold?.kind).toBe('talk');
    const held = g.room.time;
    g.step(0.5, NO_INTENT);
    expect(g.room.time).toBe(held);
    for (let i = 0; i < 20 && g.wood!.wake >= 0; i++) {
      if (g.wood!.hold?.kind === 'talk') g.continueHold();
      g.step(0.1, NO_INTENT);
    }
    expect(g.hero.act).toBe('idle');
    expect(g.wood!.hold?.need).toBe('move');
    // The world waits for you to walk.
    const t = g.room.time;
    g.step(0.1, NO_INTENT);
    g.step(0.5, NO_INTENT);
    expect(g.room.time).toBe(t);
    g.step(0.1, { ...NO_INTENT, mx: 1 });
    expect(g.wood!.hold).toBeNull();
  });

  it('a lesson card holds the world until dismissed; the first blows freeze until you answer', () => {
    const g = new Game();
    g.create('WARRIOR', 'stray');
    wake(g);
    Object.assign(g.wood!, { stage: 1, entered: false });
    Object.assign(g.hero, { x: 32, y: 36 });
    g.step(0.05, NO_INTENT);
    expect(g.wood!.hold?.kind).toBe('card');
    const t = g.room.time;
    g.step(0.7, NO_INTENT);
    expect(g.room.time).toBe(t);
    g.continueHold();
    g.step(0.05, NO_INTENT);
    expect(g.wood!.hold).toBeNull();
    // A lunger comes and winds up: the world stops just before the stab, until you roll.
    const l = g.room.enemies.find((e) => e.variant === 'lunger' && e.alert)!;
    Object.assign(l, { x: g.hero.x + 2, y: g.hero.y, fx: -1, fy: 0, cooldown: 0 });
    for (let i = 0; i < 80 && !g.wood!.hold; i++) g.step(0.05, NO_INTENT);
    expect(g.wood!.hold?.need).toBe('roll');
    g.step(0.3, NO_INTENT);
    expect(g.wood!.hold?.need).toBe('roll');
    const ev = g.step(0.05, { ...NO_INTENT, rollSeq: 1, mx: 0, my: 1 });
    expect(g.wood!.hold).toBeNull();
    expect(g.hero.act).toBe('roll');
    expect(ev).toBeDefined();
  });

  it('a new hero starts in the wood; only attack is taught at first; a gate stands across each way on', () => {
    const g = new Game();
    g.create('WARRIOR', 'stray');
    expect(g.mode).toBe('wood');
    wake(g);
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
    wake(g);
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

  it('each class has its own way through: guard and parry for the heavy kits, behind and full shots and the last second for the light', () => {
    for (const c of ['ROGUE', 'RANGER', 'MAGE'] as const) {
      const ls = lessonsFor(c);
      expect(ls.slice(0, 4).every((l) => !l.moves.includes('block'))).toBe(true);
      expect(ls[3].count).toBe('slip');
    }
    expect(lessonsFor('ROGUE')[2].count).toBe('backstab');
    expect(lessonsFor('RANGER')[2].count).toBe('heavy');
    expect(lessonsFor('WARRIOR')[2].count).toBe('block');
    expect(lessonsFor('HEALER')[3].count).toBe('parry');
    // The rogue's third lesson counts blows from behind, and nothing else.
    const g = new Game();
    g.create('ROGUE', 'stray');
    wake(g);
    Object.assign(g.wood!, { stage: 2, entered: false });
    enter(g, 2);
    expect(g.wood!.entered).toBe(true);
    const step = (ev: FightEvent[]) => (g as unknown as { stepWoodFrame(h: unknown, ev: FightEvent[], dt: number): void }).stepWoodFrame(g.hero, ev, 0.05);
    g.wood!.hold = null;
    step([{ k: 'hit', x: 0, y: 0, n: 5, heavy: false, on: 'enemy' }]);
    expect(g.wood!.count).toBe(0);
    g.wood!.hold = null;
    step([{ k: 'hit', x: 0, y: 0, n: 5, heavy: false, on: 'enemy', backstab: true }]);
    expect(g.wood!.count).toBe(1);
  });

  it('the hut: the cutscene kills Hew; the Stoker gives up the javelin; the road leads to Wickhold with the tally stick', () => {
    const g = new Game();
    g.create('MAGE', 'stray');
    wake(g);
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
