/** The mouse's aim put on the ground the pointer is over (shared/heights.ts aimOnGround), on the knoll. */
import { describe, expect, it } from 'vitest';
import { aimOnGround } from '../src/shared/heights';
import { RISE } from '../src/shared/knollmap';
import { landJob, territoryPlan } from '../src/shared/territory';

const m = territoryPlan(landJob('knoll', 3)).map, LIP = RISE.y + RISE.h, K = 0.75;

describe('aiming on raised ground', () => {
  it('on your own level the aim is what you clicked: on the top at someone on the top, on the field at someone on the field', () => {
    expect(aimOnGround(m, { x: 10, y: 15, z: 2 }, 4, -2, K)).toEqual([4, -2]);
    expect(aimOnGround(m, { x: 10, y: 30, z: 0 }, 5, 3, K)).toEqual([5, 3]);
  });

  it('from the top at a goblin on the field: it is drawn lower on the screen than a spot on your level, and the aim allows for it', () => {
    // A goblin 3 east and 5 south of you, two levels down: on the screen it sits 2 * K tiles further down still.
    const [ax, ay] = aimOnGround(m, { x: 12, y: LIP - 1, z: 2 }, 3, 5 + 2 * K, K);
    expect(ax).toBe(3);
    expect(ay).toBeCloseTo(5, 5);
  });

  it('from the field at a goblin on the top: drawn higher, and allowed for the other way', () => {
    const [ax, ay] = aimOnGround(m, { x: 12, y: LIP + 4, z: 0 }, 3, -7 - 2 * K, K);
    expect(ax).toBe(3);
    expect(ay).toBeCloseTo(-7, 5);
  });

  it('does nothing on a map with no raised ground, or with no aim', () => {
    const flat = territoryPlan(landJob('lowfurrow', 3), 0).map;
    expect(aimOnGround(flat, { x: 48, y: 100, z: 0 }, 2, -3, K)).toEqual([2, -3]);
    expect(aimOnGround(m, { x: 10, y: 15, z: 2 }, 0, 0, K)).toEqual([0, 0]);
  });
});
