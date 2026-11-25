/**
 * Everyone else's things into the new town (docs/design/town-layout.md): today's Wickhold cut into districts, each
 * moved to where it now stands, so the smith stays at his anvil before the forge, the pots by the church door, Judd's
 * crew in the square, whatever their own files say (townlife.ts, pastimes.ts, publicworks.ts, mend.ts, siege.ts...).
 * (A district can be turned about through a point, `o`; none is now.) What falls in no district is left out;
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
  // The town works down by the Drowned Rat, off to the side (Kyle, 2026-11-15: less of the square taken up): the
  // works stall, Judd and his sweeper, their brazier; and their cart beside them.
  { name: 'works', from: { x: 29.2, y: 11.5, w: 5.8, h: 4.9 }, d: [-4, 36.6] },
  { name: 'workscart', from: { x: 34.5, y: 20.5, w: 3, h: 2.2 }, d: [-4.1, 29] },
  // (The job board flush against the square's north edge, so no one stands behind it.)
  { name: 'square', from: { x: 19.5, y: 11, w: 22.5, h: 17 }, d: [1.5, 5.9] },
  { name: 'pond', from: { x: 47, y: 28.5, w: 7, h: 9.5 }, d: [-23.6, 11.1] },
  { name: 'wash', from: { x: 33, y: 36, w: 10, h: 3.5 }, d: [8.5, 13.2] },
  { name: 'rescue', from: { x: 31, y: 27.5, w: 16, h: 12 }, d: [8.5, 12] },
  // The sewer grate and Cobb at the Deep's ladder in the dead end left of the millpond, behind the Drowned Rat (Kyle,
  // 2026-11-16, late: first lost on the brink by the Rat, then right of the pond, now down the dead end). Before the
  // Rat's district, which holds them today.
  { name: 'sewer', from: { x: 22, y: 34.6, w: 4.4, h: 2.4 }, d: [-7.5, 7] },
  { name: 'rat', from: { x: 10, y: 29.5, w: 17, h: 8 }, d: [0.75, 20.5] },
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
  { kind: 'barrel', at: [21.7, 32.6], to: [22.7, 53.4] }, { kind: 'barrels', at: [21.7, 32.6], to: [22.7, 53.4] },
  { kind: 'barrel', at: [12.3, 32.6], to: [23.6, 52.4] }, { kind: 'crate', at: [12.3, 33.7], to: [24.1, 53.5] },
  { kind: 'handcart', at: [11.6, 35.6], to: [13.9, 56.4] },
  // The square kept open (Kyle, 2026-11-15: never hidden behind anything in it): no trees in its middle, the market
  // stalls side by side against the hall and the house on its north edge, the gallows against the tower.
  { kind: 'tree', at: [22.6, 25.3], to: null }, { kind: 'tree', at: [33.6, 25.3], to: null }, { kind: 'post', at: [36.3, 12.2], to: null },
  // (Tobin's pawn stall the one nearer the square, the traders' the far one: Kyle, 2026-11-16.)
  { kind: 'stall', at: [38.5, 12.5], to: [43.5, 19.8] }, { kind: 'stall', at: [38.5, 16.5], to: [39.8, 19.8] },
  // (The tailor's, the other side of the town hall's door from Tobin's: clear of the door and of MARKET ROW's spot.)
  { kind: 'stall', at: [38.9, 20.6], to: [34.3, 19.8] },
  { kind: 'spot', at: [38.5, 14.2], to: [41.65, 22.2] }, { kind: 'crates', at: [42.25, 14.45], to: null },
  // (No boxes on the road from the north gate to the square: Kyle, 2026-11-23, "extremely annoying".)
  { kind: 'crate', at: [40.5, 12.7], to: null }, { kind: 'crate', at: [40.5, 16.6], to: null },
  { kind: 'gallows', at: [37.3, 24.85], to: [51, 17.05] }, { kind: 'rubble', at: [26.2, 31.5], to: [37, 38.3] },
  // (The lanes' tumbled stone that came to rest in the street before the forge, in the way: left out. Kyle, 2026-11-16.)
  { kind: 'rubble', at: [37.2, 8.75], to: null },
];
export const overrideOf = (kind: string, x: number, y: number) => OVERRIDES.find((o) => o.kind === kind && Math.hypot(o.at[0] - x, o.at[1] - y) < 0.05);

/** New rounds for those who walked across today's town, by name. */
export const ROUNDS: Record<string, { path: [number, number][]; stops?: number[] }> = {
  'SERGEANT DUNN': { path: [[24, 22.6], [41.6, 22.6], [41.6, 33.6], [24, 33.6]] },
  'WATCHMAN HOB': { path: [[10.6, 21.6], [22.6, 21.6]] },
  'WATCHMAN PIKE': { path: [[14.8, 37.6], [54, 37.6]] },
  'ORLA OF THE WATCH': { path: [[43, 21.6], [54, 21.6], [46.75, 21.6], [46.75, 4], [46.75, 21.6]] },
  'A WASHERWOMAN': { path: [[32.8, 44.5], [36, 46], [38, 50.2], [47.95, 50.5], [50.2, 50.15], [38, 50.6], [36, 46.4]], stops: [4, 0, 0, 8, 5, 0, 0] },
  'A DIGGER': { path: [[54.3, 21.2], [53, 22.6], [51.6, 21.4]], stops: [7, 0, 3] },
  'OLD MERREN': { path: [[58.6, 27]] },
  // Before the quarter is cleared: on the street side of the rubble (shared/town.ts MERREN_WAITS), the same spot in the new town.
  'OLD MERREN (RUBBLE)': { path: [[52, 22.2]] },
  'RECRUIT WAT': { path: [[24.4, 33.1]] },
  'DESSA THE TRADER': { path: [[43.5, 21.7]] },
  'TOBIN THE PAWNBROKER': { path: [[39.8, 21.7]] },
  'HESTER THE TAILOR': { path: [[34.3, 21.7]] },
};
/** The ducks' file out of the millpond and back (round the south of the handcart and between it and the works board, through neither: 2026-11-20). */
export const DUCKS: [number, number][] = [[32.2, 46.7], [33.8, 48.1], [34.4, 50.1], [34, 51.8], [31, 51.8], [30.2, 50.6], [30.2, 49], [31.4, 47.7]];

/** The new town kept quiet (Kyle, 2026-11-15: "too much happening"): the ambient walkers who aren't at a job of their
 *  own, and the birds, left out. Everyone you can talk to stays, and the folk at their work (the smith, the
 *  washerwoman, the woodcutter, the potboy, the digger, Judd's sweeper). */
export const QUIET = { npcs: new Set(['A CHILD', 'A HAULER', 'A CARTER']), life: new Set(['pigeons']), rounds: new Set(['crows']) };
/** The market's stalls, bigger than today's so a vendor stands in proportion: w, h. */
export const STALL = [3.6, 2.6];
