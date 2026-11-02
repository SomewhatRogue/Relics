import { beforeEach, describe, expect, it } from 'vitest';
import { Game } from '../src/client/game';
import { moveOf } from '../src/client/packmoves';
import { GEAR, applyGear } from '../src/sim/pack';
import { rollGear } from '../src/shared/gear';
import { Rng } from '../src/shared/rng';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
beforeEach(() => store.clear());

describe('the pack by dragging', () => {
  it('a piece goes only where it fits; worn pieces come off into the pack; armor too', () => {
    const g = new Game();
    g.create('WARRIOR', 'stray');
    g.skipWood();
    const h = g.hero, rng = new Rng(4);
    h.bag = [rollGear(rng, 'WARRIOR', 'fine', 'weapon', 'greatsword'), rollGear(rng, 'WARRIOR', 'fine', 'armor', undefined, 'heavy'), rollGear(rng, 'WARRIOR', 'fine', 'ring')];
    expect(moveOf(h, 'bag:0', 'hand')).toEqual([GEAR.equip, 0]);
    expect(moveOf(h, 'bag:0', 'armor')).toBeNull();
    expect(moveOf(h, 'bag:1', 'armor')).toEqual([GEAR.equip, 1]);
    expect(moveOf(h, 'bag:2', 'ring')).toEqual([GEAR.equip, 2]);
    expect(moveOf(h, 'bag:2', 'drop')).toEqual([GEAR.drop, 2]);
    // Wear the armor, then drag it back into the pack.
    applyGear(h, GEAR.equip, 1, []);
    expect(h.armor?.armor).toBe('heavy');
    const m = moveOf(h, 'armor', 'bag')!;
    expect(m).toEqual([GEAR.unarm, 0]);
    applyGear(h, m[0], m[1], []);
    expect(h.armor).toBeNull();
    expect(h.bag.some((i) => i.armor === 'heavy')).toBe(true);
    // A plain weapon in hand has nowhere to go.
    expect(moveOf(h, 'hand', 'bag')).toBeNull();
  });
});
