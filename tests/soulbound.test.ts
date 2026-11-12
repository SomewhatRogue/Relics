/** SOULBOUND (Kyle, 2026-11-12): another class's piece can be taken and sold, never traded (sim/loot.ts, shared/trade.ts). */
import { describe, expect, it } from 'vitest';
import { Game } from '../src/client/game';
import { takeLoot } from '../src/sim/loot';
import { NO_INTENT } from '../src/sim/types';
import { cleanItem, tradeable } from '../src/shared/trade';
import { sellValue } from '../src/shared/prices';
import type { Item } from '../src/shared/loot';
import { openCut } from '../src/shared/instances';
import { newRun, runRoom } from '../src/sim/run';
import { uniqueDrops } from '../src/sim/uniquedrop';
import { Rng } from '../src/shared/rng';
import { WEAPONS } from '../src/shared/tuning';

const piece = (kit: Item['kit']): Item => ({ slot: 'weapon', kit, quality: 'forged', traits: [], mods: [] });

describe('SOULBOUND', () => {
  it('a piece for another class goes in the pack SOULBOUND; your own class`s as ever', () => {
    const g = new Game();
    g.create('WARRIOR', 'stray');
    g.skipWood();
    const h = g.hero;
    h.bag = [];
    const drops = [{ id: 1, x: h.x, y: h.y, item: piece('longbow'), life: 30 }, { id: 2, x: h.x, y: h.y, item: piece('greatsword'), life: 30 }];
    takeLoot(h, { ...NO_INTENT, take: 1, takeSeq: (h.seen.take ?? 0) + 1 }, drops, []);
    takeLoot(h, { ...NO_INTENT, take: 2, takeSeq: (h.seen.take ?? 0) + 1 }, drops, []);
    expect(drops.length).toBe(0);
    expect(h.bag.map((i) => [i.kit, !!i.bound])).toEqual([['longbow', true], ['greatsword', false]]);
  });

  it('sells, but never trades', () => {
    const b: Item = { ...piece('longbow'), bound: true, ledger: 'abcdefgh12' };
    expect(sellValue(b)).toBeGreaterThan(0);
    expect(tradeable(b)).toBe(false);
    expect(cleanItem(b)).toBeNull();
    expect(tradeable({ ...b, bound: undefined })).toBe(true);
  });

  it('an instance boss`s drop is a piece someone there can use, where its pool has one', () => {
    for (const weapon of ['longbow', 'greatsword'] as const) {
      const kits = new Set<string>();
      let n = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const run = newRun(openCut(12));
        Object.assign(run, { index: 1, way: 0, party: 1 });
        const room = runRoom(run), h = room.join('me'), e = room.enemies.find((x) => x.boss?.who === 'haulier')!;
        h.weapon = weapon;
        uniqueDrops(room, [e], new Rng(seed));
        n += room.drops.length;
        for (const d of room.drops) if (d.item.kit) kits.add(WEAPONS[d.item.kit].cls);
      }
      expect(n).toBeGreaterThan(5);
      expect([...kits].every((c) => c === WEAPONS[weapon].cls)).toBe(true);
    }
  });
});
