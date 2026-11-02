import { describe, expect, it } from 'vitest';
import { collide, useMap, type GameMap } from '../src/shared/arena';
import { townInterior } from '../src/shared/interiors';
import { newWorld } from '../src/shared/story';
import { SPOT_REACH, townMap } from '../src/shared/town';

/** Every spot you can stand on, walking from where you come in (a grid flood, the hero's size). */
function walkable(m: GameMap): [number, number][] {
  useMap(m);
  const step = 0.25, seen = new Set<string>(), out: [number, number][] = [], todo: [number, number][] = [[m.hero.x, m.hero.y]];
  const free = (x: number, y: number) => {
    const p = { x, y };
    collide(p, 0.32);
    return Math.hypot(p.x - x, p.y - y) < 0.01;
  };
  while (todo.length) {
    const [x, y] = todo.pop()!, k = `${Math.round(x / step)},${Math.round(y / step)}`;
    if (seen.has(k) || x < 0 || y < 0 || x > m.w || y > m.h || !free(x, y)) continue;
    seen.add(k), out.push([x, y]);
    todo.push([x + step, y], [x - step, y], [x, y + step], [x, y - step]);
  }
  return out;
}

describe("Wickhold's halls", () => {
  const w = { ...newWorld(), rescued: 8, flags: { 'north-fields': 'farm' } };
  const doors = townMap(w).blocks.filter((b) => b.door && !b.locked).map((b) => b.door!);

  it('from the door you can walk to everyone inside and back out', () => {
    for (const d of doors) {
      const m = townInterior(d, w), at = walkable(m);
      expect(at.length, d).toBeGreaterThan(20);
      for (const n of m.npcs!) expect(at.some(([x, y]) => Math.hypot(x - n.x, y - n.y) < SPOT_REACH - 0.1), `${d}: ${n.name}`).toBe(true);
      const e = m.exit!;
      expect(at.some(([x, y]) => x > e.x && x < e.x + e.w && y > e.y - 0.6), `${d}: the way out`).toBe(true);
    }
  });

  it('every hall is laid out the same every time, and each has something only it has', () => {
    for (const d of doors) expect(JSON.stringify(townInterior(d, w))).toBe(JSON.stringify(townInterior(d, w)));
    const has = (d: string, k: string) => {
      const m = townInterior(d, w);
      return [...m.blocks.map((b) => b.kind), ...m.rounds.map((r) => r.kind), ...(m.marks ?? []).map((x) => x.kind), ...(m.hangs ?? []).map((x) => x.kind)].includes(k as never);
    };
    expect(has('tower', 'stair') && has('tower', 'witchfire') && has('tower', 'chalk') && has('tower', 'stars')).toBe(true);
    expect(has('hall', 'bunk') && has('hall', 'dummy') && has('hall', 'maptable')).toBe(true);
    expect(has('lodge', 'skinbench') && has('lodge', 'antlers') && has('lodge', 'bowls')).toBe(true);
    expect(has('church', 'candles') && has('church', 'window')).toBe(true);
    expect(has('tavern', 'booth') && has('tavern', 'dicetable') && has('tavern', 'casks')).toBe(true);
    expect(has('forge', 'bellows') && has('forge', 'tub')).toBe(true);
    expect(has('townhall', 'map') && has('infirmary', 'herbs')).toBe(true);
  });
});
