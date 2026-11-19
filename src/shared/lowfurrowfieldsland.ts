/**
 * THE FIELDS' ground (shared/lowfurrowfields.ts): the side hedges the whole length, wandering a tile or two,
 * with field trees behind them and a fallen elm across one gap; the green lane in from the Wickhold road and
 * its stile; the headland hedge with the field gate; the drain with its bridge; the far bank; the road and the
 * mown rides; the soil. The ground is flat but for one raised area, the bank behind the near hay cart (MOUND). All fixed but the road's small
 * bends, the trees behind the hedges and the jitter of the soil. Pure.
 */
import { levelAt, type Area, type GameMap, type Ledge, type Stretch } from './arena.js';
import { block, claim, mark, patch, path, round, unclaimed, type Kit, type Line, type P } from './expedkit.js';
import { gateIn, layRoad, road, thickHedge } from './terrkit.js';
import { hedgeLine, xAt, type FieldsLand } from './lowfurrowfieldskit.js';

export const FIELDS = { w: 96, h: 112 };

/** The side hedges, top to bottom: where each runs (it wanders a tile or two). */
export const WEST: P[] = [{ x: 5.2, y: -0.5 }, { x: 6.4, y: 14 }, { x: 5.0, y: 30 }, { x: 6.8, y: 46 }, { x: 5.4, y: 60 }, { x: 5.3, y: 72 }, { x: 6.6, y: 90 }, { x: 5.4, y: 112.5 }];
export const EAST: P[] = [{ x: 90.6, y: -0.5 }, { x: 89.4, y: 16 }, { x: 91.0, y: 34 }, { x: 89.2, y: 50 }, { x: 90.4, y: 64 }, { x: 89.0, y: 82 }, { x: 90.2, y: 98 }, { x: 89.6, y: 112.5 }];
/** The fallen elm lies along the west hedge here, filling the gap it tore in it. */
export const ELM = { x: 4.7, y: 64.6, w: 1.25, h: 5.6 };

/** The road's fixed points, bottom to top (through the stile, the field gate and the bridge), and the seed's bend between each pair. */
const ROAD: P[] = [{ x: 48, y: 111.5 }, { x: 48, y: 104 }, { x: 47.2, y: 97 }, { x: 48, y: 88 }, { x: 48, y: 79 }, { x: 48, y: 75 }, { x: 46.6, y: 67 }, { x: 49, y: 56 }, { x: 48, y: 46 }, { x: 47, y: 38 }, { x: 48.6, y: 28 }, { x: 47.6, y: 18 }, { x: 48, y: 12 }, { x: 48, y: 8.7 }, { x: 48, y: 4 }, { x: 48, y: 0.6 }];
const BENDS = [0, 0.6, 0.8, 0, 0, 0.7, 0.9, 0.8, 0.6, 0.8, 0.8, 0, 0, 0, 0];

/** The mown rides through the long strips (the ways a hero can take besides the road), up and across. */
export const RIDES: Line[] = [
  [{ x: 17, y: 77.5 }, { x: 16.4, y: 66 }, { x: 18.6, y: 59.4 }],
  [{ x: 28, y: 77.5 }, { x: 29, y: 64 }, { x: 27.6, y: 52 }, { x: 28.6, y: 41 }],
  [{ x: 38, y: 77.5 }, { x: 37, y: 66 }, { x: 39, y: 50 }, { x: 38, y: 41 }],
  [{ x: 58, y: 77.5 }, { x: 59, y: 62 }, { x: 57.6, y: 48 }, { x: 58, y: 41 }],
  [{ x: 68, y: 77.5 }, { x: 67, y: 70 }, { x: 68.6, y: 58 }, { x: 68, y: 41 }],
  [{ x: 79, y: 77.5 }, { x: 80, y: 60 }, { x: 78.6, y: 41 }],
  [{ x: 9.5, y: 71.6 }, { x: 28, y: 70.8 }, { x: 46.5, y: 71.2 }],
  [{ x: 49.5, y: 63.2 }, { x: 70, y: 63.8 }, { x: 86.5, y: 63.2 }],
  [{ x: 25, y: 48.8 }, { x: 46.5, y: 48.2 }],
  [{ x: 49.5, y: 46.6 }, { x: 70, y: 45.8 }, { x: 86.5, y: 46.4 }],
];
/** The strips between the rides (x from, x to), west to east, and what each is gone to. */
export const STRIPS: { x0: number; x1: number; is: 'rye' | 'oat' | 'fallow' | 'rough' }[] = [
  { x0: 9, x1: 16, is: 'rye' }, { x0: 18, x1: 27, is: 'rye' }, { x0: 29, x1: 37, is: 'rye' }, { x0: 39, x1: 46.5, is: 'oat' },
  { x0: 49.5, x1: 57, is: 'fallow' }, { x0: 59, x1: 67, is: 'rye' }, { x0: 69, x1: 78, is: 'rough' }, { x0: 80, x1: 87, is: 'rye' },
];

/** The pond in the willows off to the west (shallow), the pocket. */
// (An oval in fourteen bands half a tile deep, its middle pushed a little east: one box with two caps read as a tank.)
export const POND = Array.from({ length: 14 }, (_, i) => {
  const dy = -3.25 + i * 0.5, half = 4.7 * Math.sqrt(1 - (dy / 3.6) ** 2), cx = 19.1 + 0.5 * Math.sin(dy * 0.9);
  return { x: Math.round((cx - half) * 10) / 10, y: 53.15 + dy, w: Math.round(half * 20) / 10, h: 0.5 };
});

/**
 * The one raised area (docs/design/elevation.md, "Raised areas"; the land is flat but for it): the old headland bank
 * behind the near hay cart, a level up, its face to the cart and the road. The stooks' archer stands on its lip over
 * the loading. Log steps up its face at the west end and up its east end; a hedge along its back, so nothing drops
 * away to the north.
 */
export const MOUND = { x: 34, y: 18.2, w: 10, h: 4.6, lv: 1 };
export const MOUND_STEPS: Area[] = [{ x: MOUND.x + 0.5, y: MOUND.y + MOUND.h - 1.3, w: 1.8, h: 2.8 }, { x: MOUND.x + MOUND.w - 1.3, y: MOUND.y + 1.6, w: 2.8, h: 1.8 }];

export function heights(): Ledge[] {
  return [{ x: MOUND.x, y: MOUND.y, w: MOUND.w, h: MOUND.h, lv: MOUND.lv, ramps: MOUND_STEPS.map((q) => ({ ...q })), kind: 'earth' }];
}

/** The side hedges, the field trees behind them, the fallen elm across its gap, brambles in front. */
function sides(k: Kit): void {
  const gap = (p: P) => p.y > ELM.y + 0.6 && p.y < ELM.y + ELM.h - 0.6;
  hedgeLine(k, WEST, gap), hedgeLine(k, EAST);
  block(k, 'log', ELM.x, ELM.y, ELM.w, ELM.h);
  for (let y = 0.8; y < FIELDS.h - 0.5; y += 1.7) {
    for (const [x0, x1] of [[0.6, xAt(WEST, y) - 1.4], [xAt(EAST, y) + 1.4, FIELDS.w - 0.6]]) {
      const r = k.rng.range(0.6, 0.95), x = k.rng.range(x0, Math.max(x0, x1));
      k.rounds.push({ kind: k.rng.pick(['tree', 'tree', 'tree', 'bush', 'pine'] as const), x, y: y + k.rng.range(-0.6, 0.6), r });
    }
  }
}

/** The green lane in: hedges either side from the road to the stile, trees thick behind them; the stile. */
function lane(k: Kit): void {
  hedgeLine(k, [{ x: 43.3, y: 103.6 }, { x: 42.2, y: 108 }, { x: 41, y: 112.5 }]);
  hedgeLine(k, [{ x: 52.7, y: 103.6 }, { x: 53.8, y: 108 }, { x: 55, y: 112.5 }]);
  // The headland hedge at the field's foot, from the sides to the stile.
  thickHedge(k, 104, 4.6, 43.6), thickHedge(k, 104, 52.4, 91.4);
  block(k, 'fence', 43.6, 103.4, 3, 0.35), block(k, 'fence', 49.4, 103.4, 3, 0.35);
  block(k, 'fence', 46.4, 103.25, 0.3, 0.6), block(k, 'fence', 49.3, 103.25, 0.3, 0.6);
  // Behind the lane's hedges: an old orchard gone to scrub on the west, thorn and elm on the east.
  for (let t = 0; t < 160; t++) {
    const x = k.rng.range(7, 89), y = k.rng.range(105.2, 111.8), r = k.rng.range(0.5, 0.85);
    if ((x > 39.6 && x < 56.4) || !unclaimed(k, x, y, r)) continue;
    round(k, x < 48 ? k.rng.pick(['apple', 'apple', 'bush'] as const) : k.rng.pick(['tree', 'bush', 'bush'] as const), x, y, r);
  }
}

/** The soil: grass under everything, the lane, stubble on the headland, the strips, the cut strip, the drain's mud. */
function soil(k: Kit): void {
  patch(k, 'grass', 0, 0, FIELDS.w, FIELDS.h, false);
  // The headland: the stubble they'd begun to glean, trodden earth round the camp.
  for (const [x, y, w, h] of [[10, 81, 30, 10], [36, 86, 30, 9], [58, 81, 28, 12], [14, 93, 24, 9], [62, 94, 22, 9]]) patch(k, 'straw', x, y, w, h);
  patch(k, 'earth', 33, 89, 12, 6), patch(k, 'earth', 46, 92, 14, 8), patch(k, 'earth', 64, 85, 12, 7);
  // The long strips, ridge and furrow: each strip its crop, its edges in furrow.
  for (const s of STRIPS) {
    const mat = s.is === 'fallow' ? 'furrow' : s.is === 'rough' ? 'grass' : 'crop';
    patch(k, mat, s.x0, 40, s.x1 - s.x0, 38, false);
    if (s.is !== 'rough') patch(k, 'furrow', s.x0 - 0.2, 40, 0.9, 38, false), patch(k, 'furrow', s.x1 - 0.7, 40, 0.9, 38, false);
  }
  patch(k, 'grass', 9, 46, 17, 15), patch(k, 'mud', 13.4, 48.8, 11.6, 9.4);
  patch(k, 'grass', 68, 43, 12, 10);
  // The stooks: the cut strip in stubble, the rye still standing at its ends, the rick's straw.
  patch(k, 'crop', 12, 12, 72, 28, false);
  patch(k, 'straw', 17, 14, 62, 22), patch(k, 'straw', 22, 19, 52, 19), patch(k, 'straw', 56, 17, 14, 10);
  // The stubble was one flat sheet. Where the reaping stopped that morning: the swathes still show as bare lines
  // between the cut rows, the east end is cut in steps (each reaper's last reach) with rye standing past them, a
  // tongue of rye was left round a nest in the middle, and the carts' wheels have worn two ways to the rick.
  for (const y of [16.4, 19.6, 24.4, 27.6, 30.8, 34]) patch(k, 'earth', 19 + (y * 7) % 5, y, 50 - (y * 3) % 9, 0.35, false);
  for (const [x, y, w, h] of [[72, 14, 8, 4.4], [74.4, 18.4, 5.6, 4.6], [70.6, 23, 9.4, 4], [76, 27, 4, 5], [73, 32, 7, 4.4], [17, 30.4, 5.4, 5.8], [17, 14, 3.6, 5]]) patch(k, 'crop', x, y, w, h, false);
  patch(k, 'crop', 47.4, 29.6, 4.6, 2.6), patch(k, 'grass', 48.6, 30.2, 1.8, 1.2);
  for (const [x, y, w, h] of [[40.2, 26.8, 21, 0.4], [58.4, 22.2, 0.4, 5], [46.4, 36, 0.4, 5]]) k.marks.push({ kind: 'ruts', x, y, w, h });
  // The drain's banks, the far bank.
  patch(k, 'mud', 0, 6.4, FIELDS.w, 4.6, false), patch(k, 'grass', 0, 0, FIELDS.w, 6.4, false);
}

/** The drain, deep, but for the bridge whose planks the hungry pulled off; its gate in the gap. */
function drain(k: Kit): Stretch {
  k.water.push({ x: 0, y: 8, w: 46.4, h: 1.4, deep: true }, { x: 49.6, y: 8, w: 46.4, h: 1.4, deep: true });
  mark(k, 'planks', 46.4, 8, 3.2, 1.4);
  return gateIn(k, { x: 46.4, y: 8, w: 3.2, h: 1.4 }, 'THE STOOKS', [103, 104], { x: 46.1, y: 9.4, w: 3.8, h: 2.6 }, { x: 48, y: 6.1 });
}

/** Lay the road's soil and the rides' last (after every scene's soil, so they're drawn on top). */
export function layWays(k: Kit, line: Line): void {
  for (const r of RIDES) path(k, 'grass', r, 1.05);
  layRoad(k, line, 0.95);
}

export interface FieldsGround extends FieldsLand { stretches: Stretch[] }

export function layGround(k: Kit): FieldsGround {
  const ledges = heights(), lv = (x: number, y: number) => levelAt({ ledges } as unknown as GameMap, x, y);
  const line = road(k, ROAD, BENDS);
  for (const r of RIDES) k.roads.push(r);
  // Kept clear: the way in and out, each gate's gathering ground and checkpoint, where the road meets each slope.
  for (const [x, y, r] of [[48, 109, 2.4], [48, 1.8, 2], [48, 81, 2.4], [48, 76.4, 1.9], [48, 10.7, 2.4], [48, 6.1, 1.9], [47.6, 60, 2.2], [48, 4.4, 2]]) claim(k, x, y, r);
  soil(k);
  sides(k), lane(k);
  // The headland hedge across the field with the field gate in it.
  thickHedge(k, 79, 4.2, 46.02), thickHedge(k, 79, 49.98, 91.6);
  const s0 = gateIn(k, { x: 46.4, y: 78.3, w: 3.2, h: 1.4 }, 'THE HEADLAND', [101, 102]);
  for (const w of POND) k.water.push({ ...w });
  const s1 = drain(k), s2: Stretch = { name: 'THE FAR BANK', keep: [], packs: [] };
  return { ledges, lv, road: line, rides: RIDES, stretches: [s0, s1, s2] };
}
