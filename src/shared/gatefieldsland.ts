/**
 * The Gate Fields' ground (docs/design/outside-the-gate.md, "The land's first map"): the road, the field paths, the
 * hedges, the strips and the stooks, the barn's ring, the pasture's pond, the wood's trees. Laid in order south to
 * north. 84 by 144 since Kyle's "each zone can be even bigger" (2026-11-25): every zone half again each way, the road
 * winding longer, more of each stretch's cover. The seed bends the road and shuffles the cover; it never moves the way
 * in, the exit, the barn, the den or the zones. Pure.
 */
import { along, block, claim, mark, offLine, patch, round, scatter, spotIn, type Kit, type Line } from './expedkit.js';
import { layRoad, road, wall } from './terrkit.js';

export const GATE_FIELDS = { w: 84, h: 144 };
/** The way station: the barn's ring (its centre, and how far its safe ground reaches). */
export const BARN = { x: 60, y: 80.25, r: 4.5 };
/** The second shelter: the charcoal burners' clearing beside the road into the wood (east verge, a walk from the barn). */
export const HUT = { x: 49.5, y: 33.75, r: 4.5 };
/** The wolves' open country's den: the ring of bushes against the west hedge, its centre and how wide. */
export const DEN = { x: 7, y: 54, r: 2.3 };
/** The open east bank (a view is drawn there later): between these y, nothing solid, a river closes it. */
export const BANK = { y0: 51, y1: 75, x: 81.4 };
/** The pond's middle (the pasture's west side). */
export const POND = { x: 14, y: 68.5 };
/** The exit's middle at the top edge, and the gap in the top hedge round it. */
export const OUT_X = 40;
const C = (k: Kit, x: number, y: number, r: number) => claim(k, x, y, r);

/** A hedge along y from x0 to x1, with gaps to walk through. */
function hrow(k: Kit, y: number, x0: number, x1: number, gaps: [number, number][]): void {
  let x = x0;
  for (const [a, b] of [...gaps, [x1, x1] as [number, number]]) (a > x && wall(k, { x, y }, { x: a, y })), (x = b);
}

/** The road, the field paths, the edges, the grass, and what must stay clear (the way in, the exit, the road, the barn).
 *  The road first in `k.roads` (the pasture's cover reads it); the field paths after it, narrower. */
export function layRoadAndEdges(k: Kit): Line[] {
  const { w, h } = GATE_FIELDS;
  const pts = [[42, 142], [42, 127], [35, 115], [38, 103], [45, 93], [41, 84], [34, 74], [37, 64], [44, 56], [39, 46], [38, 38], [41, 28], [45, 20], [37, 11], [OUT_X, 1]];
  const line = road(k, pts.map(([x, y]) => ({ x, y })), [0.8, 1.6, 1.6, 1.4, 1.2, 1.4, 1.4, 1.4, 1.4, 1.2, 1.4, 1.6, 1.4, 0.8]);
  // Field paths off it: to the barn's gap, to the hut's fire, and a drove track west through the strips to the scarecrow.
  const paths = [road(k, [{ x: 39.6, y: 82.6 }, { x: 47, y: 81.6 }, { x: 54.6, y: 80.3 }], [0.8, 0.5]),
    road(k, [{ x: 39.4, y: 33.6 }, { x: 45.2, y: 34.4 }], [0.4]),
    road(k, [{ x: 37.6, y: 106 }, { x: 30, y: 104.6 }, { x: 24.4, y: 101.6 }, { x: 21.4, y: 98.4 }], [0.8, 0.8, 0.6])];
  for (const l of [line, ...paths]) for (const p of along(l, 2)) C(k, p.x, p.y, 2.2);
  C(k, 42, 139.5, 2.2), C(k, OUT_X, 1.8, 2.2);
  // Closed both sides by hedge, but the east bank between BANK.y0 and BANK.y1 (a river there).
  wall(k, { x: 2.4, y: 0.4 }, { x: 2.4, y: h - 0.4 });
  wall(k, { x: w - 2.4, y: 0.4 }, { x: w - 2.4, y: BANK.y0 - 1 }), wall(k, { x: w - 2.4, y: BANK.y1 + 1 }, { x: w - 2.4, y: h - 0.4 });
  wall(k, { x: 2.4, y: 0.8 }, { x: OUT_X - 1.9, y: 0.8 }), wall(k, { x: OUT_X + 1.9, y: 0.8 }, { x: w - 2.4, y: 0.8 });
  // The town behind you: its wall along the south edge, a 5 tile gap centred on the gate you came out of.
  for (const [a, b] of [[2.4, 39.5], [44.5, w - 2.4]]) for (let x = a; x < b - 0.01; x += 4) block(k, 'wall', x, h - 1.6, Math.min(4, b - x), 0.8);
  k.water.push({ x: BANK.x, y: BANK.y0 - 0.5, w: w - BANK.x, h: BANK.y1 - BANK.y0 + 1, deep: true });
  patch(k, 'grass', 0, 0, w, h, false);
  C(k, BARN.x, BARN.y, 6), C(k, DEN.x, DEN.y, 3.6), C(k, POND.x + 0.6, POND.y - 0.2, 6.5);
  return [line, ...paths];
}

/** 1. The gate road, and 2. the common strips: unploughed, gone back, thin barley coming up in small broken patches; overgrown hedges with gaps, the scarecrow. */
export function layFarmland(k: Kit): void {
  for (const [x, y, w, h] of [[9, 120.6, 5.4, 3.3], [17.1, 122.4, 6.6, 3.6], [60, 121.2, 6.3, 3.6], [69, 123.6, 5.4, 3.3], [61.5, 126.3, 4.5, 2.7], [6, 129, 5, 2.6], [70, 136, 4.6, 2.4]]) patch(k, 'crop', x, y, w, h, true);
  for (const [x, y] of [[19.5, 132.75], [27, 126], [57, 123], [67.5, 132.75], [70.5, 126.9], [10, 126], [76, 130]]) round(k, 'hay', x + k.rng.range(-0.4, 0.4), y + k.rng.range(-0.4, 0.4), 0.5);
  block(k, 'cart', 49.5, 120, 2.4, 1.2), mark(k, 'trample', 34, 138, 6, 0.8);
  scatter(k, 7, ['hay', 'bush', 'bush'], 4, 118, 80, 130, [0.4, 0.55]);
  // West and east strips, a hedge between each pair with two gaps, a way through at the road's side.
  for (const [x, y, w, h] of [[7.5, 90, 6.9, 4.2], [15.6, 92.1, 6.3, 4.5], [23.4, 90.3, 5.7, 5.1], [10.5, 96, 6.6, 3.3], [55.5, 92.1, 6, 3.9], [64.5, 93.9, 7.5, 4.2], [71.1, 97.5, 4.5, 2.7],
    [9, 103.5, 6, 3.75], [18, 105.9, 7.5, 4.2], [12, 109.5, 5.25, 3.3], [55.5, 103.5, 6.75, 3.9], [66, 106.5, 6, 4.2], [60, 111, 5.25, 3], [26, 108.6, 5, 3], [6, 115, 5, 2.5], [66, 115.4, 6, 2.6],
    [31.5, 92.5, 5, 3], [47.5, 88.5, 5, 3], [41.5, 110, 4.6, 2.6], [46, 95.5, 4.4, 2.6], [29.5, 115.2, 4.6, 1.8]]) patch(k, 'crop', x, y, w, h, true);
  // (More strips where the seed puts them, kept off the paths.)
  for (let i = 0; i < 10; i++) {
    const s = spotIn(k, 4, 88, 80, 116, 2.4, 2.4, false);
    if (s) patch(k, 'crop', s.x - 2.2, s.y - 1.3, k.rng.range(3.6, 6), k.rng.range(2.2, 3.4), true);
  }
  hrow(k, 100.5, 3.4, 31, [[12, 15.3], [22.5, 25.8]]), hrow(k, 100.5, 49, 80.6, [[58.5, 61.8], [70.5, 73.8]]);
  hrow(k, 114, 3.4, 30, [[13.5, 16.8]]), hrow(k, 114, 44, 80.6, [[66, 69.3]]);
  // (The hedges have gone wild: a few bushes stand out of line.)
  for (const [x, y] of [[8.25, 98.7], [30.5, 98.8], [18.9, 99], [54.75, 102.6], [76.5, 99], [66.9, 98.85], [9, 115.5], [25.5, 112.8], [55.5, 115.5], [75, 112.5], [47, 98.6], [6.5, 111.6]]) round(k, 'bush', x, y, 0.38);
  scatter(k, 8, ['bush', 'bush', 'hay'], 4, 88, 80, 116, [0.38, 0.5]);
  for (const [x, y] of [[57, 93.9], [66.9, 95.7], [61.5, 105.6], [21, 106.8], [13.5, 111]]) round(k, 'crows', x, y, 0.15);
  round(k, 'scarecrow', 18, 94.5, 0.4), block(k, 'cart', 64.5, 107.25, 2.6, 1.3, { ruined: true });
  for (const [x, y] of [[9, 105.75], [27, 108.75], [55.5, 108.75], [75, 105.75], [72, 91], [28, 112]]) round(k, 'hay', x, y, 0.5);
  mark(k, 'debris', 65.1, 109.8, 1.6, 0.6);
  // The broken mill's echoes (docs/design/biome-sets.md): a cart of grain stopped where its team was cut loose, sacks split open.
  block(k, 'cart', 47.5, 104.5, 2.4, 1.2), round(k, 'hay', 50.6, 105.1, 0.5);
  round(k, 'sacks', 46.8, 106.6, 0.34), round(k, 'sacks', 48.2, 107, 0.34), mark(k, 'debris', 45.6, 107.4, 2, 0.6);
}

/** 3. The field barn: a palisade ring with a gap west toward the road, a barn inside, a fire, straw underfoot. */
export function layBarn(k: Kit): void {
  const x0 = BARN.x - 5, x1 = BARN.x + 5, y0 = BARN.y - 3.1, y1 = BARN.y + 3.1;
  patch(k, 'straw', x0 - 0.6, y0 - 0.4, 11.2, 7.2, true);
  block(k, 'fence', x0, y0, 10, 0.35), block(k, 'fence', x0, y1, 10, 0.35), block(k, 'fence', x1 - 0.35, y0, 0.35, 6.45);
  block(k, 'fence', x0, y0, 0.35, 2.2), block(k, 'fence', x0, BARN.y + 1.1, 0.35, y1 - BARN.y - 1.1);
  block(k, 'barn', BARN.x + 0.6, y0 + 0.8, 3.6, 2.6);
  k.braziers.push({ x: BARN.x - 2.4, y: BARN.y + 0.9, r: 0.35, wild: true });
  C(k, BARN.x, BARN.y, 6);
}

/** 4. The rough pasture: rocks, the pond with reeds, loose clumps of bushes, the den's ring against the west hedge. */
export function layPasture(k: Kit): void {
  // The pond: six shallow rectangles stepped into a rough oval, reeds on its north and east sides, mud on the south bank.
  for (let i = 0; i < 6; i++) {
    const dy = -2.5 + i, half = 4.6 * Math.sqrt(1 - (dy / 3.4) ** 2), cx = POND.x + 0.4 * Math.sin(dy);
    k.water.push({ x: Math.round((cx - half) * 10) / 10, y: POND.y + dy - 0.7, w: Math.round(half * 20) / 10, h: 1.4 });
  }
  for (const [x, y] of [[-3, -3.1], [-0.8, -3.5], [1.4, -3.3], [3.6, -2.7], [5, -1.3], [5.2, 0.5], [4.4, 1.9]]) round(k, 'reed', POND.x + x, POND.y + y, 0.3);
  patch(k, 'mud', POND.x - 4.4, POND.y + 2.5, 9.5, 1.8, true);
  // The den: a tight ring, open a hand's width on its east side so they break out at you as you pass.
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    if (Math.abs(a - 0) < 0.4 || a > Math.PI * 2 - 0.4) continue;
    round(k, 'bush', DEN.x + Math.cos(a) * DEN.r, DEN.y + Math.sin(a) * DEN.r, 0.45);
  }
  mark(k, 'trample', DEN.x - 1.4, DEN.y - 0.4, 2.8, 1);
  scatter(k, 28, ['rock'], 4, 43.5, 78, 73.5, [0.35, 0.55]);
  for (let c = 0; c < 15; c++) {
    const s = spotIn(k, 4, 45, 78, 72, 1.6, 2.4);
    for (let i = 0; s && i < 3; i++) {
      const x = s.x + k.rng.range(-1.2, 1.2), y = s.y + k.rng.range(-1, 1);
      if (offLine(k.roads[0], x, y) > 2.4) round(k, 'bush', x, y, k.rng.range(0.4, 0.6));
    }
  }
  // (Between the pasture and the strips, west of the barn: rough ground going back to scrub.)
  scatter(k, 9, ['bush', 'bush', 'rock', 'tree'], 4, 76, 46, 86, [0.4, 0.6]);
}

/** 5. The wood's edge: trees thin at y 42, thick by y 12, shade under the thick, stumps; clear 2.5 either side of the road. */
export function layWood(k: Kit): void {
  patch(k, 'shade', 4.5, 6, 30, 18, true), patch(k, 'shade', 48, 7.5, 30, 18, true), patch(k, 'shade', 6, 24, 21, 10.5, true), patch(k, 'shade', 57, 25.5, 18, 9, true);
  for (let b = 0; b < 6; b++) {
    const y1 = 42 - b * 6, n = Math.round((3 + b * 4) * 2.1);
    scatter(k, n, ['tree', 'tree', 'tree', 'pine', 'pine', 'deadtree', 'bush'], 3, y1 - 6, 81, y1, [0.5, 0.8]);
    scatter(k, 2 * (1 + (b >> 1)), ['stump'], 3, y1 - 6, 81, y1, [0.35, 0.45]);
  }
  mark(k, 'debris', 54, 21, 1.4, 0.6), mark(k, 'debris', 22, 16, 1.6, 0.6);
}

/** The road and the field paths, laid on top of the ground (the road a little wider). */
export const layGate = (k: Kit, lines: Line[]) => lines.forEach((l, i) => layRoad(k, l, i ? 0.6 : 0.9));
