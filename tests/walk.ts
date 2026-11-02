/** Test helper: where a hero can walk in a room plan, by the map's own collision. */
import { collide, useMap, type GameMap } from '../src/shared/arena';
import { PROPS } from '../src/shared/props';
import type { RoomPlan } from '../src/shared/terrain';
import { HERO } from '../src/shared/tuning';

/**
 * Where a hero can walk from the door: a flood over a fine grid, a cell open if the map's own collision
 * leaves a hero standing there untouched and no heavy furniture (a table, a barrel, a cage) is in the way.
 */
export function walkable(plan: RoomPlan, avoid: { x: number; y: number; w: number; h: number }[] = []) {
  const m: GameMap = plan.map, r = HERO.radius, step = 0.2;
  useMap(m);
  const heavy = plan.props.filter((q) => q.kind !== 'plank' && q.kind !== 'stave');
  const open = (x: number, y: number) => {
    const q = { x, y };
    collide(q, r);
    return Math.hypot(q.x - x, q.y - y) < 1e-6 && heavy.every((h) => Math.hypot(h.x - x, h.y - y) >= PROPS[h.kind].radius + r) &&
      avoid.every((a) => x < a.x - r || x > a.x + a.w + r || y < a.y - r || y > a.y + a.h + r);
  };
  const cols = Math.floor(m.w / step), rows = Math.floor(m.h / step), seen = new Set<number>(), cell = (i: number, j: number) => ({ x: (i + 0.5) * step, y: (j + 0.5) * step });
  let all = 0;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) if (open(cell(i, j).x, cell(i, j).y)) all++;
  const start = [Math.floor(m.hero.x / step), Math.floor(m.hero.y / step)], todo = [start];
  seen.add(start[0] * 1000 + start[1]);
  while (todo.length) {
    const [i, j] = todo.pop()!;
    for (const [a, c] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      if (a < 0 || c < 0 || a >= cols || c >= rows || seen.has(a * 1000 + c)) continue;
      const at = cell(a, c);
      if (open(at.x, at.y)) seen.add(a * 1000 + c), todo.push([a, c]);
    }
  }
  const reach = (x: number, y: number, d: number) => {
    for (let i = Math.floor((x - d) / step); i <= Math.ceil((x + d) / step); i++) for (let j = Math.floor((y - d) / step); j <= Math.ceil((y + d) / step); j++) {
      const at = cell(i, j);
      if (seen.has(i * 1000 + j) && Math.hypot(at.x - x, at.y - y) <= d) return true;
    }
    return false;
  };
  return { all, reached: seen.size, reach, open };
}

