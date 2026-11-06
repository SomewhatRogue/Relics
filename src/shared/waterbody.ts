/**
 * Bodies of water: which of a room's water boxes (shared/arena.ts `water`, shallow and deep alike) are one
 * stretch of water, touching or overlapping, so lightning in one reaches everyone standing in it (POOL in
 * shared/worldfx.ts). Worked out once a map. Pure, so the room and both views ask the same question.
 */
import { inArea, type GameMap, type Water } from './arena';

const cache = new WeakMap<GameMap, number[]>();
/** Two boxes touch (a hair's gap counts: boxes laid edge to edge). */
const touch = (a: Water, b: Water, e = 0.05) => a.x <= b.x + b.w + e && b.x <= a.x + a.w + e && a.y <= b.y + b.h + e && b.y <= a.y + a.h + e;

/** Each water box's body (the lowest index of the boxes it joins up with). */
export function bodies(m: GameMap): number[] {
  let lab = cache.get(m);
  if (lab) return lab;
  const ws = m.water ?? [];
  lab = ws.map((_, i) => i);
  const root = (i: number): number => (lab![i] === i ? i : (lab![i] = root(lab![i])));
  for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) {
    if (!touch(ws[i], ws[j])) continue;
    const a = root(i), b = root(j);
    if (a !== b) lab[Math.max(a, b)] = Math.min(a, b);
  }
  lab = lab.map((_, i) => root(i));
  cache.set(m, lab);
  return lab;
}

/** The body of water at (x, y), or -1 on dry ground. */
export function bodyAt(m: GameMap, x: number, y: number): number {
  const ws = m.water;
  if (!ws?.length) return -1;
  const lab = bodies(m);
  for (let i = 0; i < ws.length; i++) if (inArea(ws[i], x, y)) return lab[i];
  return -1;
}

/** Shallow water at (x, y): what anyone wades, and what frost can ice. */
export const shallowAt = (m: GameMap, x: number, y: number) => !!m.water?.some((w) => !w.deep && inArea(w, x, y));

const runs = new WeakMap<GameMap, [number, number][]>();
/**
 * Which way the water at (x, y) carries things, in tiles a second ([0, 0] on dry ground or still water):
 * a body much longer one way than the other is a river and runs along its length, east or down the room,
 * at `speed` (the same rule the painted water runs by: client/waterfield.ts). Drifting oil reads it.
 */
export function flowAt(m: GameMap, x: number, y: number, speed: number): [number, number] {
  const ws = m.water;
  if (!ws?.length) return [0, 0];
  let way = runs.get(m);
  if (!way) {
    const lab = bodies(m), box = new Map<number, [number, number, number, number]>();
    ws.forEach((w, i) => {
      const b = box.get(lab[i]) ?? [Infinity, Infinity, -Infinity, -Infinity];
      box.set(lab[i], [Math.min(b[0], w.x), Math.min(b[1], w.y), Math.max(b[2], w.x + w.w), Math.max(b[3], w.y + w.h)]);
    });
    way = ws.map((_, i) => {
      const [x0, y0, x1, y1] = box.get(lab[i])!, bw = x1 - x0, bh = y1 - y0;
      return bw > 8 && bw > bh * 2.5 ? [1, 0] : bh > 8 && bh > bw * 2.5 ? [0, 1] : [0, 0];
    });
    runs.set(m, way);
  }
  for (let i = 0; i < ws.length; i++) if (inArea(ws[i], x, y)) return [way[i][0] * speed, way[i][1] * speed];
  return [0, 0];
}
