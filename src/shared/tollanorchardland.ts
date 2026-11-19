/**
 * THE HOME GROUND's ground (shared/tollanorchard.ts; docs/design/territories.md, "2. Tollan's Farm"): the lane's end
 * between its hedges, the orchard's drystone walls with the gateway in the south one and the door in the north one,
 * the hedges down both sides of the paddocks, the road and the soil. All fixed by hand: the seed only bends the road
 * a little between its fixed points. Flat: nothing here is raised (docs/design/elevation.md, "Raised areas").
 */
import type { Area, Stretch } from './arena.js';
import { claim, patch, round, type Kit, type Line, type P } from './expedkit.js';
import { markAt, stoneAcross, stoneDown } from './tollanorchardkit.js';
import { gateIn, road, wall } from './terrkit.js';

export const HOME = { w: 96, h: 108 };
/** What the places need from the ground. */
export interface HomeLand { road: Line; stretches: Stretch[] }

/** The road's fixed points, bottom to top, and how far the seed may bend it between each pair. */
export const ROAD: P[] = [
  { x: 48, y: 107 }, { x: 48, y: 98 }, { x: 48, y: 92 }, { x: 46.6, y: 84 }, { x: 49.4, y: 74 }, { x: 47, y: 64 }, { x: 48, y: 58.6 },
  { x: 48, y: 52.4 }, { x: 47.4, y: 45 }, { x: 48, y: 38 }, { x: 49.4, y: 28 }, { x: 48.6, y: 18 }, { x: 48, y: 8 }, { x: 48, y: 1 },
];
const BENDS = [0, 0, 0.6, 0.8, 0.8, 0, 0, 0.4, 0.3, 0.5, 0.5, 0.3, 0];

/** The door in the orchard's north wall (the gate), and the gateway in its south wall the lane comes in by. */
export const GATE: Area = { x: 46.4, y: 55, w: 3.2, h: 1.4 };
export const GATEWAY = { x0: 45, x1: 51, y: 92.6 };
/** The orchard's walls: west and east faces, the south wall's line, the north (gate) wall's line. */
export const WALLS = { x0: 5.2, x1: 90.2, south: 92.6, north: GATE.y + 0.4 - 0.085 };
/** The milk stand at the lane's end, on the lane's east side. */
export const MILK: P = { x: 53.4, y: 99.2 };
/** Where a farm dog would sit on the orchard's south wall, just west of the gateway (watching the lane). */
export const DOG_WALL: P = { x: 41.6, y: 92.9 };

function walls(k: Kit): void {
  const W = WALLS;
  stoneDown(k, W.x0, W.north, W.south + 0.62), stoneDown(k, W.x1, W.north, W.south + 0.62);
  stoneAcross(k, W.south, W.x0, GATEWAY.x0), stoneAcross(k, W.south, GATEWAY.x1, W.x1 + 0.62);
  stoneAcross(k, W.north, 0.6, GATE.x), stoneAcross(k, W.north, GATE.x + GATE.w, 95.4);
  // The gateway's two posts, the stones knocked off its top lying in the grass.
  round(k, 'rock', GATEWAY.x0 - 0.3, W.south + 1.1, 0.32), round(k, 'rock', GATEWAY.x1 + 0.4, W.south + 1.2, 0.28);
}

/** Hedges nothing gets through: the lane's end funnelling to the gateway, both sides of the paddocks. */
function hedges(k: Kit): void {
  for (const o of [0, 0.62]) {
    wall(k, { x: 44.6 - o, y: 93.6 }, { x: 38.4 - o, y: 99.6 }), wall(k, { x: 38.4 - o, y: 99.6 }, { x: 36.4 - o, y: 107.8 });
    wall(k, { x: 51.4 + o, y: 93.6 }, { x: 57.6 + o, y: 99.6 }), wall(k, { x: 57.6 + o, y: 99.6 }, { x: 59.6 + o, y: 107.8 });
    wall(k, { x: 5.4 - o, y: 0.3 }, { x: 5.4 - o, y: WALLS.north - 0.2 }), wall(k, { x: 90.6 + o, y: 0.3 }, { x: 90.6 + o, y: WALLS.north - 0.2 });
  }
  // Hedgerow trees in the lane's hedges and the field elms beyond (nobody's ground: just the view).
  for (const [x, y, r] of [[40.6, 97.4, 1], [37.4, 104, 0.95], [55.6, 97.6, 0.95], [59, 104.4, 1.05], [28, 99, 1.1], [18, 102, 1], [70, 100, 1.1], [82, 103, 1]] as const) round(k, 'tree', x, y, r);
  for (const [x, y] of [[24, 96], [12, 97], [32, 105], [66, 96], [76, 97], [88, 99], [64, 106], [8, 105]] as const) round(k, 'bush', x, y, 0.5);
}

/** The soil under everything (fixed shapes; the places add their own over it). */
function ground(k: Kit): void {
  patch(k, 'grass', -1, -1, HOME.w + 2, HOME.h + 2, false);
  patch(k, 'earth', 44, 100, 8, 8), patch(k, 'mud', 45, 91, 6, 4), patch(k, 'earth', 44, 50, 8, 9);
}

/** The lane's end: the milk stand with its churns still on it, a dog's worn place on the wall. Quiet. */
function laneEnd(k: Kit): void {
  round(k, 'crates', MILK.x, MILK.y, 0.5), round(k, 'pots', MILK.x + 0.9, MILK.y + 0.3, 0.3), round(k, 'pots', MILK.x + 0.4, MILK.y + 0.9, 0.28);
  markAt(k, 'straw', MILK.x - 0.2, MILK.y + 1.3, 1.4, 0.6);
  markAt(k, 'weeds', DOG_WALL.x, DOG_WALL.y + 0.9, 1.6, 0.6), markAt(k, 'weeds', 50, 95.6, 1.4, 0.7), markAt(k, 'weeds', 45.4, 101.2, 1.2, 0.6);
  for (const [x, y] of [[47.2, 102.6], [48.8, 97.4], [47.6, 94.6]] as const) markAt(k, 'ruts', x, y, 1.6, 2.4);
  markAt(k, 'puddle', 49.4, 100.4, 1.4, 0.7);
}

export function layLand(k: Kit): HomeLand {
  const line = road(k, ROAD, BENDS);
  // Kept clear: the way in and out, the gateway, the gate's gathering ground and its checkpoint, the dog's place.
  for (const [x, y, r] of [[48, 104.4, 2.6], [48, 1.8, 2.2], [48, 93.4, 1.6], [48, 57.8, 2.6], [48, 53.1, 2], [DOG_WALL.x, DOG_WALL.y + 1, 0.8]]) claim(k, x, y, r);
  ground(k), walls(k), hedges(k), laneEnd(k);
  const s0 = gateIn(k, GATE, 'THE HOME ORCHARD', [301, 302, 303, 304]);
  const s1: Stretch = { name: 'THE PADDOCKS', keep: [], packs: [] };
  return { road: line, stretches: [s0, s1] };
}
