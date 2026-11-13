/**
 * The shapes a Deep floor's room comes in (Kyle, 2026-11-13: "screens in a biome are on theme but not different
 * enough screen to screen; can be much bigger or different sizes"). Each floor (not a boss floor: those are
 * arenas) picks one from the run's seed and the floor, never the same twice running, the big ones likelier deeper.
 * The room builder makes its last room this size (shared/routeports.ts heartAfter), its layout seeded by the
 * floor (the place's `vary`, shared/sites.ts placeSeed), and its goblins scale with its area (roombudget.ts).
 */
import { Rng } from './rng.js';

export interface DeepShape { id: string; w: number; h: number; weight: [number, number, number, number] }

/** w and h in tiles; weight by band (floors 1-5, 6-10, 11-15, 16 on). */
export const DEEP_SHAPES: DeepShape[] = [
  { id: 'tight', w: 22, h: 18, weight: [3, 2, 1, 1] },
  { id: 'hall', w: 28, h: 24, weight: [3, 2, 2, 1] },
  { id: 'long', w: 22, h: 40, weight: [1, 2, 2, 2] },
  { id: 'wide', w: 42, h: 22, weight: [1, 2, 2, 2] },
  { id: 'great', w: 40, h: 36, weight: [0, 1, 2, 3] },
];

/** The room budget's base area (a hall), and how far a bigger or smaller room moves it. */
export const SHAPE_AREA = { base: 28 * 24, least: 0.75, most: 1.8, oneMore: 1.35 };
/** (`oneMore`: a room this much bigger than a hall or more holds one fight more: shared/encounter.ts.) */

const band = (n: number) => (n <= 5 ? 0 : n <= 10 ? 1 : n <= 15 ? 2 : 3);

function pick(seed: number, n: number): DeepShape {
  const r = new Rng((seed * 131 + n * 7717) >>> 0), b = band(n), total = DEEP_SHAPES.reduce((s, x) => s + x.weight[b], 0);
  let roll = r.next() * total;
  for (const x of DEEP_SHAPES) if ((roll -= x.weight[b]) < 0) return x;
  return DEEP_SHAPES[1];
}

/** Floor `n`'s shape on the run with `seed`: never the one the floor before had. */
export function shapeOf(seed: number, n: number): DeepShape {
  let last: DeepShape | undefined;
  for (let k = 1; k <= n; k++) {
    const s = pick(seed, k);
    last = last?.id !== s.id ? s : DEEP_SHAPES[(DEEP_SHAPES.indexOf(s) + 1 + (k % (DEEP_SHAPES.length - 1))) % DEEP_SHAPES.length];
  }
  return last!;
}

/** What a room of w by h does to its budget. */
export const areaShare = (w: number, h: number) => Math.max(SHAPE_AREA.least, Math.min(SHAPE_AREA.most, (w * h) / SHAPE_AREA.base));
