// A lived-in world, slice 2: a job's ground strewn the same on every screen, never in the way.
import { describe, expect, it } from 'vitest';
import type { GameMap } from '../src/shared/arena';
import { scatterOf, scattered } from '../src/shared/scatter';
import { townMap } from '../src/shared/town';
import { newWorld } from '../src/shared/story';

const field = (): GameMap => ({
  name: 'TEST FIELD', w: 30, h: 20, wallFace: 3, rounds: [{ kind: 'tree', x: 5, y: 5, r: 0.6 }], blocks: [{ x: 12, y: 8, w: 4, h: 3, kind: 'house' }],
  braziers: [], torches: [], water: [{ x: 20, y: 12, w: 4, h: 3 }], hero: { x: 15, y: 17 }, exit: null,
  theme: { floor: 'grass', back: 'trees', ambient: [0.3, 0.3, 0.3] },
} as unknown as GameMap);

describe('the ground scatter', () => {
  it('is the same for the same map, crowded, and keeps out of houses and water', () => {
    const a = scatterOf(field()), b = scatterOf(field());
    expect(a).toEqual(b);
    expect(a.floor.length).toBeGreaterThan(300);
    for (const k of a.floor) {
      expect(k.x > 12 && k.x < 16 && k.y > 8 && k.y < 11).toBe(false);
      expect(k.x > 20 && k.x < 24 && k.y > 12 && k.y < 15).toBe(false);
    }
  });
  it('stands its stumps and snags clear of the hero and of what is there, reeds by the water', () => {
    const m = field(), { stand } = scatterOf(m);
    expect(stand.some((r) => r.kind === 'reed')).toBe(true);
    for (const r of stand) if (r.kind !== 'reed') {
      expect(Math.hypot(r.x - m.hero.x, r.y - m.hero.y)).toBeGreaterThan(3);
      expect(Math.hypot(r.x - 5, r.y - 5)).toBeGreaterThan(1.3);
    }
  });
  it('leaves the town and rooms indoors alone', () => {
    expect(scattered(townMap(newWorld()))).toBe(false);
    expect(scatterOf({ ...field(), theme: { floor: 'planks', back: 'plaster', ambient: [0.3, 0.3, 0.3] } } as GameMap).floor).toHaveLength(0);
  });
});
