import { beforeEach, describe, expect, it } from 'vitest';
import { Game } from '../src/client/game';
import { POTION_DROPS, POTION_ORDER } from '../src/shared/potions';
import { NO_INTENT } from '../src/sim/types';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
beforeEach(() => store.clear());

describe('the Bitter in the wood', () => {
  it('your first hit: Hew stops the world with a Bitter; POTION drinks it; then two more', () => {
    const g = new Game();
    g.create('WARRIOR', 'stray');
    Object.assign(g.wood!, { wake: -1, hold: null, from: null });
    Object.assign(g.hero, { act: 'idle', actT: 0, lying: false });
    g.step(0.05, NO_INTENT);
    Object.assign(g.wood!, { hold: null });
    expect(g.taught()).not.toContain('potion');
    g.hero.hp -= 20;
    g.step(0.05, NO_INTENT);
    expect(g.wood!.hold?.need).toBe('potion');
    expect(g.hero.belt).toEqual(['bitter']);
    expect(g.taught()).toContain('potion');
    const t = g.room.time;
    g.step(0.5, NO_INTENT);
    expect(g.room.time).toBe(t);
    g.step(0.05, { ...NO_INTENT, potionSeq: 1 });
    expect(g.wood!.hold).toBeNull();
    for (let i = 0; i < 10; i++) g.step(0.05, { ...NO_INTENT, potionSeq: 1 });
    expect(g.hero.belt).toEqual(['bitter', 'bitter']);
    expect(g.wood!.caption?.who).toBe('HEW');
    for (let i = 0; i < 60; i++) g.step(0.05, { ...NO_INTENT, potionSeq: 1 });
    expect(g.hero.hp).toBeGreaterThan(g.hero.maxHp - 10);
  });

  it('only the Bitter is had for now (Kyle, 2026-11-12)', () => {
    expect(POTION_ORDER).toEqual(['bitter']);
    expect(POTION_DROPS.weights.brandy).toBe(0);
  });
});
