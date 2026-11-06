/**
 * Gambling stays trade (docs/lore/story-bible.md, "Who sells what"; Kyle 2026-11-06): Moll's dice and
 * the Rat's bets move gold and nothing else. The Want grows only at a job's end (hungry gear, the
 * tiers worn) and falls with gold given at the Lantern and gear given up: no bet, won or lost, feeds it.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { Game } from '../src/client/game';
import { settleStake, takeStake } from '../src/shared/stakes';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k),
} as Storage;
beforeEach(() => store.clear());

function hero() {
  const g = new Game();
  g.create('ROGUE', 'MOLLY');
  Object.assign(g.profile, { gold: 5000, want: 7 });
  return g;
}

describe('gambling never touches the Want', () => {
  it("Moll's dice: a hundred throws, wins and losses both, the Want as it was", () => {
    const g = hero();
    let won = 0, lost = 0;
    for (let i = 0; i < 100; i++) g.dice(25)!.won ? won++ : lost++;
    expect(won).toBeGreaterThan(0);
    expect(lost).toBeGreaterThan(0);
    expect(g.profile.want).toBe(7);
  });

  it("the Rat's stakes: put down, won and lost, at the table and the knife board, the Want as it was", () => {
    const p = hero().profile;
    for (let n = 0; n < 40; n++) {
      const game = n % 2 ? 'arm' : 'knives';
      expect(takeStake(p, game, n, 50)).toBe(true);
      settleStake(p, game, n, n % 3 === 0);
    }
    expect(p.want).toBe(7);
  });
});
