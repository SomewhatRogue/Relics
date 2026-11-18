/**
 * Height for the eye (docs/design/elevation.md, "You can always read it"). The rules keep whole levels
 * (shared/arena.ts `levelAt`): on a slope you are on one level or the next. Drawing wants the ground itself: inside
 * an earth ledge's ramp it runs evenly from the level just outside the ramp's low edge up to the ledge's level.
 * Pure. Nothing in the fight reads it.
 */
import { raised, inArea, levelAt, type Area, type GameMap, type Ledge } from './arena.js';

/** Whether a map is land (its heights are earth, laid with shared/terrkit.ts), not the town's stone levels. */
export const isLand = (m: GameMap) => !!m.ledges?.some(raised);

/** A ramp's run: the level at its low edge, at its high edge, its axis, and whether its high edge is at its start (north or west). */
export interface Run { lo: number; hi: number; alongY: boolean; hiFirst: boolean }

/** Which way a ramp on ledge `l` climbs: by the ground just outside each of its sides, as layoutledges.ts does. */
export function runOf(m: GameMap, l: Ledge, q: Area): Run {
  const mx = q.x + q.w / 2, my = q.y + q.h / 2, lv = (x: number, y: number) => levelAt(m, x, y);
  const n = lv(mx, q.y - 0.2), s = lv(mx, q.y + q.h + 0.2), w = lv(q.x - 0.2, my), e = lv(q.x + q.w + 0.2, my);
  const alongY = n !== s || w === e, a = alongY ? n : w, b = alongY ? s : e;
  return { lo: Math.min(a, b), hi: l.lv ?? 1, alongY, hiFirst: a > b };
}

/** How far up a ramp (0 at its low edge, 1 at its high edge) a point is. */
export function upRamp(q: Area, r: Run, x: number, y: number): number {
  const f = r.alongY ? (y - q.y) / q.h : (x - q.x) / q.w;
  return Math.min(1, Math.max(0, r.hiFirst ? 1 - f : f));
}

/** The ground's height at a point, in levels: whole on the flat, running smoothly up an earth slope. */
export function heightAt(m: GameMap, x: number, y: number): number {
  let h = -1;
  for (const l of m.ledges ?? []) {
    if (l.kind !== 'earth') continue;
    for (const q of l.ramps) {
      if (!inArea(q, x, y)) continue;
      const r = runOf(m, l, q);
      h = Math.max(h, r.lo + (r.hi - r.lo) * upRamp(q, r, x, y));
    }
  }
  return h >= 0 ? h : levelAt(m, x, y);
}

/** The level the ground is drawn at here: smooth on land, whole elsewhere (the town's steps keep their own). */
export const groundLv = (m: GameMap, x: number, y: number) => (isLand(m) ? heightAt(m, x, y) : levelAt(m, x, y));

/**
 * The level to draw a body or a thing at: on land, anything standing on the ground (its level the ground's, or none
 * given) follows the slope; anything else keeps its own level, as before (off land, `z` or the floor).
 */
export const bodyLv = (m: GameMap, x: number, y: number, z?: number) =>
  isLand(m) && (z === undefined || Math.abs(z - levelAt(m, x, y)) < 0.01) ? heightAt(m, x, y) : (z ?? 0);

/** The highest ground under a circle (its centre and four points on its edge): a flat telegraph laid there is never
 *  buried in a slope. */
export const groundTop = (m: GameMap, x: number, y: number, r: number) =>
  Math.max(...[[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].map(([dx, dy]) => groundLv(m, x + dx, y + dy)));

/**
 * The level a shot is drawn flying at: from the level it left (`hz`), sinking to the ground by the end of its
 * reach, and never under the ground it is over (loosed up at a height, it rises with the bank).
 */
export function shotLv(m: GameMap, b: { x: number; y: number; hz?: number; travelled?: number; range?: number }): number {
  if (!isLand(m)) return 0;
  const left = b.range ? Math.max(0, 1 - (b.travelled ?? 0) / b.range) : 1;
  return Math.max(groundLv(m, b.x, b.y), (b.hz ?? 0) * left);
}

/**
 * The mouse's aim put on the ground. The views read the pointer as if it were on the hero's own level (so a goblin
 * beside you on a height is hit where you click it). A spot on another level is drawn higher or lower on the screen
 * than its place on the map, by `perLevel` tiles north for each level up, so the aim (tiles from the hero) is moved
 * back onto the ground the pointer is really over. Maps whose levels are the ground only.
 */
export function aimOnGround(m: GameMap, h: { x: number; y: number; z?: number }, ax: number, ay: number, perLevel: number): [number, number] {
  if (!m.ledges?.some((l) => l.lv !== undefined) || (!ax && !ay)) return [ax, ay];
  const z = bodyLv(m, h.x, h.y, h.z);
  let y = ay;
  for (let i = 0; i < 3; i++) y = ay + (groundLv(m, h.x + ax, h.y + y) - z) * perLevel;
  return [ax, y];
}

