/**
 * The Open Cut, area 3: THE WASHING FLOOR. Where the ore was washed: shallow pools you wade through slowly,
 * and across the middle the sluice, deep, crossed only at a ford at either side. Below it, a pack wading
 * the pools and a shield pair holding the west ford with a hexer behind them (go round by the east ford,
 * or through them); above it, archers over the east ford, a kept cage, and
 * THE SLUICER and THE RAKER by the upper pool, the gate up behind them (kill both).
 *
 * Fixed by hand; the seed only places the clutter.
 */
import type { Water } from './arena.js';
import { mark, newKit, patch, prop, round } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { RoomPlan } from './terrain.js';
import { areaPlan, keeper, pack } from './cutkit.js';
import { CUT_AREAS, CUT_NAMES } from './opencutwords.js';

export const WASHING = { w: 24, h: 42 };
export const WASHING_AT = {
  /** The sluice across the middle, and the two fords over it (shallow). */
  sluice: { y: 20.6, h: 2 }, fords: [{ x: 3, w: 3 }, { x: 18, w: 3 }],
  pools: [{ x: 2, y: 30, w: 7.5, h: 4 }, { x: 14, y: 8.6, w: 7, h: 3.4 }],
  waders: { x: 5.8, y: 32 }, westFord: { x: 4.5, y: 24.6 }, eastFord: { x: 19.5, y: 18 }, cage: { x: 11.4, y: 15.6 }, sluicer: { x: 14.6, y: 6.4 }, raker: { x: 9.4, y: 5.4 }, chest: { x: 21.6, y: 2.8 },
};

/** The sluice in pieces: deep everywhere but the fords. */
export function sluice(w: number): Water[] {
  const S = WASHING_AT.sluice, out: Water[] = [];
  let x = 0;
  for (const f of WASHING_AT.fords) {
    if (f.x > x) out.push({ x, y: S.y, w: f.x - x, h: S.h, deep: true });
    out.push({ x: f.x, y: S.y, w: f.w, h: S.h });
    x = f.x + f.w;
  }
  if (x < w) out.push({ x, y: S.y, w: w - x, h: S.h, deep: true });
  return out;
}

export function washingPlan(job: Job): RoomPlan {
  const { w, h } = WASHING, A = WASHING_AT, k = newKit(new Rng(job.seed * 6151 + 37));
  patch(k, 'mud', 0, 0, w, h, false), patch(k, 'wet', 0, A.sluice.y - 1.2, w, A.sluice.h + 2.4, false);
  k.water.push(...sluice(w), ...A.pools);
  // Washing boards along the sluice's banks, spoil heaps, the old sluice-gate posts.
  for (const x of [8, 11, 14]) mark(k, 'planks', x, A.sluice.y - 1.1, 2, 0.6);
  for (const [x, y] of [[1.2, 39.6], [22.4, 37], [22.6, 27.4], [1, 14], [7.4, 2.2]] as [number, number][]) round(k, 'rock', x, y, 0.5 + k.rng.range(0, 0.3));
  for (const x of [A.fords[0].x - 0.3, A.fords[0].x + A.fords[0].w + 0.3, A.fords[1].x - 0.3, A.fords[1].x + A.fords[1].w + 0.3]) round(k, 'post', x, A.sluice.y - 0.3, 0.2);
  k.braziers.push({ x: 21.8, y: 32, r: 0.3, wild: true }, { x: 2, y: 11.6, r: 0.3, wild: true }, { x: 12, y: 38.6, r: 0.3, wild: true });

  // 1. Wading the lower pool.
  pack(k, 1, A.waders, ['fodder', 'fodder', 'lunger'], 1.5);
  // 2. The west ford held: two shields in front, the hexer behind them.
  pack(k, 2, A.westFord, ['shield', 'shield'], 0.8);
  pack(k, 2, { x: A.westFord.x, y: A.westFord.y - 2.6 }, ['hexer'], 0);
  // 3. Archers over the east ford.
  pack(k, 3, A.eastFord, ['archer', 'archer', 'fodder'], 1.2);
  // 4. A cage kept on the upper floor.
  prop(k, 'cage', A.cage.x, A.cage.y);
  pack(k, 4, { x: A.cage.x + 1.4, y: A.cage.y - 0.4 }, ['netter', 'fodder'], 0.9);
  // 5. THE SLUICER by the upper pool and THE RAKER beside it, a few of their own between.
  keeper(k, 5, A.sluicer, 'ironhide', CUT_NAMES.sluicer, 300), keeper(k, 5, A.raker, 'heavy', CUT_NAMES.raker, 300);
  pack(k, 5, { x: 12, y: 7.2 }, ['fodder', 'fodder', 'lunger'], 1.4);
  k.chests.push({ ...A.chest });
  return areaPlan(k, job, { name: CUT_AREAS[2], w, h, kind: 'mine', torches: [6, w - 6] });
}
