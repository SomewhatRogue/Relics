/**
 * The Gate Fields' ground (docs/design/outside-the-gate.md, "The land's first map"): the road, the hedges, the strips
 * and the stooks, the barn's ring, the pasture's pond, the wood's trees. Laid in order south to north. The seed bends
 * the road and shuffles the cover; it never moves the way in, the exit, the barn, the den or the zones. Pure.
 */
import { along, block, claim, mark, offLine, patch, round, scatter, spotIn, type Kit, type Line } from './expedkit.js';
import { layRoad, road, wall } from './terrkit.js';

export const GATE_FIELDS = { w: 56, h: 96 };
/** The way station: the barn's ring (its centre, and how far its safe ground reaches). */
export const BARN = { x: 40, y: 53.5, r: 4.5 };
/** The wolves' open country's den: the ring of bushes against the west hedge, its centre and how wide. */
export const DEN = { x: 6.6, y: 36, r: 2.3 };
/** The open east bank (a view is drawn there later): between these y, nothing solid, a river closes it. */
export const BANK = { y0: 34, y1: 50, x: 53.4 };
const C = (k: Kit, x: number, y: number, r: number) => claim(k, x, y, r);

/** A hedge along y from x0 to x1, with gaps to walk through. */
function hrow(k: Kit, y: number, x0: number, x1: number, gaps: [number, number][]): void {
  let x = x0;
  for (const [a, b] of [...gaps, [x1, x1] as [number, number]]) (a > x && wall(k, { x, y }, { x: a, y })), (x = b);
}

/** The road, the edges, the grass, and what must stay clear (the way in, the exit, the road, the barn). */
export function layRoadAndEdges(k: Kit): Line {
  const { w, h } = GATE_FIELDS;
  const line = road(k, [{ x: 28, y: 94 }, { x: 28, y: 84 }, { x: 24, y: 72 }, { x: 28, y: 60 }, { x: 25, y: 48 }, { x: 28, y: 36 }, { x: 24, y: 24 }, { x: 28, y: 12 }, { x: 26.5, y: 1 }], [0.8, 1.2, 1.2, 1, 1, 1.2, 1.2, 0.8]);
  for (const p of along(line, 2)) C(k, p.x, p.y, 2.2);
  C(k, 28, 92.5, 2.2), C(k, 26.5, 1.8, 2.2);
  // Closed both sides by hedge, but the east bank between BANK.y0 and BANK.y1 (a river there).
  wall(k, { x: 2.4, y: 0.4 }, { x: 2.4, y: h - 0.4 });
  wall(k, { x: w - 2.4, y: 0.4 }, { x: w - 2.4, y: BANK.y0 - 1 }), wall(k, { x: w - 2.4, y: BANK.y1 + 1 }, { x: w - 2.4, y: h - 0.4 });
  wall(k, { x: 2.4, y: 0.8 }, { x: 24.6, y: 0.8 }), wall(k, { x: 28.4, y: 0.8 }, { x: w - 2.4, y: 0.8 });
  // The town behind you: its wall along the south edge, a 5 tile gap centred on the gate you came out of.
  for (const [a, b] of [[2.4, 25.5], [30.5, w - 2.4]]) for (let x = a; x < b - 0.01; x += 4) block(k, 'wall', x, h - 1.6, Math.min(4, b - x), 0.8);
  k.water.push({ x: BANK.x, y: BANK.y0 - 0.5, w: w - BANK.x, h: BANK.y1 - BANK.y0 + 1, deep: true });
  patch(k, 'grass', 0, 0, w, h, false);
  C(k, BARN.x, BARN.y, 6), C(k, DEN.x, DEN.y, 3.6), C(k, 10, 45.5, 6.5);
  return line;
}

/** 1. The gate road, and 2. the common strips: unploughed, gone back, thin barley coming up in small broken patches; overgrown hedges with gaps, the scarecrow. */
export function layFarmland(k: Kit): void {
  for (const [x, y, w, h] of [[6, 80.4, 3.6, 2.2], [11.4, 81.6, 4.4, 2.4], [40, 80.8, 4.2, 2.4], [46, 82.4, 3.6, 2.2], [41, 84.2, 3, 1.8]]) patch(k, 'crop', x, y, w, h, true);
  for (const [x, y] of [[13, 88.5], [18, 84], [38, 82], [45, 88.5], [47, 84.6]]) round(k, 'hay', x + k.rng.range(-0.4, 0.4), y + k.rng.range(-0.4, 0.4), 0.5);
  block(k, 'cart', 33, 80, 2.4, 1.2), mark(k, 'trample', 20, 90, 6, 0.8);
  // West and east strips, a hedge between each pair with two gaps, a way through at the road's side.
  for (const [x, y, w, h] of [[5, 60, 4.6, 2.8], [10.4, 61.4, 4.2, 3], [15.6, 60.2, 3.8, 3.4], [7, 64, 4.4, 2.2], [37, 61.4, 4, 2.6], [43, 62.6, 5, 2.8], [47.4, 65, 3, 1.8],
    [6, 69, 4, 2.5], [12, 70.6, 5, 2.8], [8, 73, 3.5, 2.2], [37, 69, 4.5, 2.6], [44, 71, 4, 2.8], [40, 74, 3.5, 2]]) patch(k, 'crop', x, y, w, h, true);
  hrow(k, 67, 3.4, 20.5, [[8, 10.2], [15, 17.2]]), hrow(k, 67, 34.5, 52.6, [[39, 41.2], [47, 49.2]]);
  hrow(k, 76, 3.4, 20.5, [[9, 11.2]]), hrow(k, 76, 34.5, 52.6, [[44, 46.2]]);
  // (The hedges have gone wild: a few bushes stand out of line.)
  for (const [x, y] of [[5.5, 65.8], [18.8, 68.4], [12.6, 66], [36.5, 68.4], [51, 66], [44.6, 65.9], [6, 77], [17, 75.2], [37, 77], [50, 75]]) round(k, 'bush', x, y, 0.38);
  for (const [x, y] of [[38, 62.6], [44.6, 63.8], [41, 70.4], [14, 71.2], [9, 74]]) round(k, 'crows', x, y, 0.15);
  round(k, 'scarecrow', 12, 63, 0.4), block(k, 'cart', 43, 71.5, 2.6, 1.3, { ruined: true });
  for (const [x, y] of [[6, 70.5], [18, 72.5], [37, 72.5], [50, 70.5]]) round(k, 'hay', x, y, 0.5);
  mark(k, 'debris', 43.4, 73.2, 1.6, 0.6);
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
    const dy = -2.5 + i, half = 4.6 * Math.sqrt(1 - (dy / 3.4) ** 2), cx = 9.4 + 0.4 * Math.sin(dy);
    k.water.push({ x: Math.round((cx - half) * 10) / 10, y: 45.7 + dy - 0.7, w: Math.round(half * 20) / 10, h: 1.4 });
  }
  for (const [x, y] of [[6.4, 42.6], [8.6, 42.2], [10.8, 42.4], [13, 43], [14.4, 44.4], [14.6, 46.2], [13.8, 47.6]]) round(k, 'reed', x, y, 0.3);
  patch(k, 'mud', 5, 48.2, 9.5, 1.8, true);
  // The den: a tight ring, open a hand's width on its east side so they break out at you as you pass.
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    if (Math.abs(a - 0) < 0.4 || a > Math.PI * 2 - 0.4) continue;
    round(k, 'bush', DEN.x + Math.cos(a) * DEN.r, DEN.y + Math.sin(a) * DEN.r, 0.45);
  }
  mark(k, 'trample', DEN.x - 1.4, DEN.y - 0.4, 2.8, 1);
  scatter(k, 9, ['rock'], 4, 29, 50, 49, [0.35, 0.55]);
  for (let c = 0; c < 5; c++) {
    const s = spotIn(k, 4, 30, 50, 48, 1.6, 2.4);
    for (let i = 0; s && i < 3; i++) {
      const x = s.x + k.rng.range(-1.2, 1.2), y = s.y + k.rng.range(-1, 1);
      if (offLine(k.roads[0], x, y) > 2.4) round(k, 'bush', x, y, k.rng.range(0.4, 0.6));
    }
  }
}

/** 5. The wood's edge: trees thin at y 28, thick by y 8, shade under the thick, stumps; clear 2.5 either side of the road. */
export function layWood(k: Kit): void {
  patch(k, 'shade', 3, 4, 20, 12, true), patch(k, 'shade', 32, 5, 20, 12, true), patch(k, 'shade', 4, 16, 14, 7, true), patch(k, 'shade', 38, 17, 12, 6, true);
  for (let b = 0; b < 6; b++) {
    const y1 = 28 - b * 4, n = 3 + b * 4;
    scatter(k, n, ['tree', 'tree', 'tree', 'pine', 'pine', 'deadtree', 'bush'], 3, y1 - 4, 53, y1, [0.5, 0.8]);
    scatter(k, 1 + (b >> 1), ['stump'], 3, y1 - 4, 53, y1, [0.35, 0.45]);
  }
  mark(k, 'debris', 36, 14, 1.4, 0.6);
}

export const layGate = (k: Kit, line: Line) => layRoad(k, line, 0.9);
