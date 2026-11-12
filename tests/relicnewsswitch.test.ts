import { beforeEach, describe, expect, it } from 'vitest';
import { Game } from '../src/client/game';
import { makeRelic } from '../src/shared/relicitems';
import { Rng } from '../src/shared/rng';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
beforeEach(() => store.clear());

describe('relic moments stay with their hero', () => {
  it("a brand-new hero is never told of another hero's relics", () => {
    const g = new Game();
    g.create('MAGE', 'old');
    const item = makeRelic(new Rng(3), 'lodestone');
    g.relicNews.push({ item, carried: false, tip: false, sound: false });
    g.create('WARRIOR', 'new');
    expect(g.mode).toBe('wood');
    expect(g.relicNews).toEqual([]);
    expect(g.profile.relics).toEqual([]);
  });
});
