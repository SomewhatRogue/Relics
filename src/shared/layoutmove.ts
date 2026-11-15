/**
 * Everyone else's things into the new town (docs/design/town-layout.md): today's Wickhold cut into districts, each
 * moved to where it now stands, so the smith stays at his anvil before the forge, the pots by the church door, Judd's
 * crew in the square, whatever their own files say (townlife.ts, pastimes.ts, publicworks.ts, mend.ts, siege.ts...).
 * The Drowned Rat's district is turned about (its front now looks north). What falls in no district is left out;
 * a few things are set by hand where their district can't carry them (OVERRIDES), and the walkers whose rounds
 * crossed the old town get new ones (ROUNDS). Pure.
 */
import type { Area } from './arena.js';

interface District { name: string; from: Area; d: [number, number]; /** Turned about: (x, y) mirrored through `o`, then moved by d. */ o?: [number, number] }

/** First match wins. */
export const DISTRICTS: District[] = [
  // The rubble in the east wall and its digger (before the butts, which overlap it).
  { name: 'rubble', from: { x: 50, y: 16.5, w: 5, h: 6.5 }, d: [2, 3] },
  { name: 'butts', from: { x: 41.5, y: 18.5, w: 8.5, h: 6.5 }, d: [0, 10.6] },
  { name: 'forge', from: { x: 29.5, y: 6.8, w: 11, h: 4 }, d: [-16.75, 13.5] },
  { name: 'church', from: { x: 0, y: 0, w: 14.5, h: 12 }, d: [22.5, 1] },
  { name: 'hall', from: { x: 14.5, y: 2, w: 7.5, h: 8.5 }, d: [19.25, 11.5] },
  { name: 'gate', from: { x: 22, y: 0, w: 11, h: 11 }, d: [18.75, 0] },
  { name: 'garden', from: { x: 11, y: 17.5, w: 9.5, h: 8.5 }, d: [-9, -13.6] },
  { name: 'square', from: { x: 19.5, y: 11, w: 22.5, h: 17 }, d: [1.5, 7.2] },
  { name: 'pond', from: { x: 47, y: 28.5, w: 7, h: 9.5 }, d: [-34.4, 10.6] },
  { name: 'wash', from: { x: 33, y: 36, w: 10, h: 3.5 }, d: [8.5, 13.2] },
  { name: 'rescue', from: { x: 31, y: 27.5, w: 16, h: 12 }, d: [8.5, 12] },
  { name: 'rat', from: { x: 10, y: 29.5, w: 17, h: 8 }, d: [12.5, 5.5], o: [17, 34] },
  { name: 'oldquarter', from: { x: 54.5, y: 0, w: 8, h: 40 }, d: [2, 6] },
];

const inside = (a: Area, x: number, y: number) => x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h;
export const districtOf = (x: number, y: number) => DISTRICTS.find((q) => inside(q.from, x, y)) ?? null;

/** Where a point of today's town stands in the new one, or null (left out). */
export function movePoint(x: number, y: number): [number, number] | null {
  const q = districtOf(x, y);
  if (!q) return null;
  const [mx, my] = q.o ? [2 * q.o[0] - x, 2 * q.o[1] - y] : [x, y];
  return [mx + q.d[0], my + q.d[1]];
}

/** A box (a stall, a bench, a mark) moved by its middle; turned about, it keeps its size. */
export function moveBox<T extends Area>(b: T): T | null {
  const c = movePoint(b.x + b.w / 2, b.y + b.h / 2);
  return c ? { ...b, x: c[0] - b.w / 2, y: c[1] - b.h / 2 } : null;
}

/** Things set by hand: a round's kind and where it stood today, and where it stands now (null: left out). */
export const OVERRIDES: { kind: string; at: [number, number]; to: [number, number] | null }[] = [
  { kind: 'woodpile', at: [11.5, 5.5], to: [34.55, 6.6] },
  { kind: 'post', at: [19.6, 12.2], to: null }, { kind: 'post', at: [20, 26.5], to: null },
  { kind: 'barrels', at: [2.4, 17.7], to: [2.4, 15.6] },
  { kind: 'pots', at: [4.7, 33], to: [9.4, 30.7] }, { kind: 'pots', at: [8.3, 33], to: [9.4, 34.3] },
  { kind: 'statue', at: [58.5, 19.5], to: [60, 28.5] },
  { kind: 'tree', at: [10, 38], to: null }, { kind: 'tree', at: [13, 5], to: null }, { kind: 'bush', at: [19, 37], to: [18.6, 38.9] },
  { kind: 'smoke', at: [45, 0.2], to: [30, 0.2] },
  { kind: 'hurdle', at: [31.5, 2.925], to: [41.5, 5.2] },
  { kind: 'barrel', at: [21.7, 32.6], to: [24.2, 41.4] },
];
export const overrideOf = (kind: string, x: number, y: number) => OVERRIDES.find((o) => o.kind === kind && Math.hypot(o.at[0] - x, o.at[1] - y) < 0.05);

/** New rounds for those who walked across today's town, by name. */
export const ROUNDS: Record<string, { path: [number, number][]; stops?: number[] }> = {
  'SERGEANT DUNN': { path: [[24, 21.6], [42.2, 21.6], [42.2, 33.6], [24, 33.6]] },
  'WATCHMAN HOB': { path: [[10.6, 21.6], [22.6, 21.6]] },
  'WATCHMAN PIKE': { path: [[14.8, 37.6], [54, 37.6]] },
  'ORLA OF THE WATCH': { path: [[43, 21.6], [54, 21.6], [46.75, 21.6], [46.75, 4], [46.75, 21.6]] },
  'A CARTER': { path: [[15, 37.9], [52, 37.9]], stops: [6, 6] },
  'A WASHERWOMAN': { path: [[22, 44], [24, 47.8], [36, 48.6], [47.95, 50.5], [50.2, 50.15], [36, 49.6], [24, 48.2]], stops: [4, 0, 0, 8, 5, 0, 0] },
  'A DIGGER': { path: [[54.3, 21.2], [53, 22.6], [51.6, 21.4]], stops: [7, 0, 3] },
  'OLD MERREN': { path: [[58.6, 27]] },
  'RECRUIT WAT': { path: [[10.9, 25.2]] },
};
/** The ducks' file out of the millpond and back. */
export const DUCKS: [number, number][] = [[21.4, 46.2], [23, 47.6], [23.6, 49.6], [21, 50.2], [18.8, 48.6], [20.6, 47.2]];
