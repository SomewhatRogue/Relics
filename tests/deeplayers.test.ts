// The Deep's layers (shared/deeplayers.ts): every five floors somewhere else, and every floor of every layer builds.
import { describe, expect, it } from 'vitest';
import { deepFloor } from '../src/shared/deep';
import { DEEP_LAYERS, layerOf } from '../src/shared/deeplayers';
import { homeOf } from '../src/shared/countries';
import { newRun, runRoom } from '../src/sim/run';

describe('the Deep layers', () => {
  it('the drains first, then a new country every five floors, round and round', () => {
    expect(layerOf(1).id).toBe('drains');
    expect(layerOf(5).id).toBe('drains');
    expect(layerOf(6).id).toBe('rock');
    expect(new Set(DEEP_LAYERS.map((l) => homeOf({ name: 'x', ruin: 1, ...l })))).toEqual(new Set(['under', 'rock', 'fen', 'wood', 'village']));
    expect(layerOf(26).id).toBe('rock');
    expect(layerOf(25).id).not.toBe(layerOf(26).id);
  });

  it('every floor down to forty builds, on a few runs, each layer its own ground', () => {
    for (const seed of [3, 77, 4242]) {
      const floors = new Map<string, string>();
      for (let n = 1; n <= 40; n++) {
        const job = deepFloor(n, seed, 'x'), r = runRoom(newRun(job));
        expect(r.enemies.length, `floor ${n} seed ${seed}`).toBeGreaterThan(0);
        if (n % 5) floors.set(layerOf(n).id, `${r.map.theme.floor}/${r.map.theme.back}`);
      }
      expect(new Set(floors.values()).size).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('after a boss', () => {
  it('the floor straight after a boss floor is never a hunt for a named butcher', () => {
    for (const seed of [1, 2, 3, 77, 4242]) for (const n of [6, 11, 16, 21, 26, 31]) expect(deepFloor(n, seed, 'x').objective, `floor ${n}`).not.toBe('hunt');
  });
});
