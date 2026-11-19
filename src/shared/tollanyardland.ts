/**
 * THE YARD's ground (shared/tollanyard.ts; docs/design/territories.md, "2. Tollan's Farm"; heights by
 * docs/design/elevation.md, "Raised areas"): the one raised area, the road and the track, the hedges down the close,
 * the soil, and the two stretches. All fixed by hand: the seed only bends the road a little and shuffles the hedge's
 * elms. Pure.
 *
 *   The land is flat but for the yard. Level 0: the home close below. Level 2: the whole north of the map from the
 *   yard's front wall (its face at y 60, toward the camera) to the top edge, a levelled terrace faced in stone, so
 *   nothing ever drops away to the north. Two ways up: a broad flight where the cart road comes up, and narrow steps
 *   at the close's east corner.
 */
import { levelAt, type Area, type GameMap, type Ledge, type Stretch } from './arena.js';
import { claim, patch, type Kit, type Line, type P } from './expedkit.js';
import { gateIn, road } from './terrkit.js';

export const YARD = { w: 96, h: 104 };
/** The terrace: the yard and the barn on it, two levels up, its stone face across the map at y 60. */
export const TERRACE = { x: 0, y: 0, w: 96, h: 60, lv: 2 };
/** The cart road's flight up the face (six wide, three deep), and the narrow steps at the east corner. */
export const FLIGHT: Area = { x: 45, y: 58.5, w: 6, h: 3 };
export const STEPS: Area = { x: 86, y: 58.5, w: 2, h: 3 };
/** The barn's great doors, shut in the mouth of its wagon porch (the bays either side: tollanyardbarn.ts). */
export const DOORS: Area = { x: 34, y: 22.2, w: 4, h: 1.4 };
/** Seconds for one hero to haul the great doors open. */
export const DOOR_HAUL = 4;
/** What the places need from the ground. */
export interface YardLand { ledges: Ledge[]; lv: (x: number, y: number) => number; road: Line; track: Line; stretches: Stretch[] }

/** The cart road's fixed points, from the paddock gate up the flight and across the yard to the barn's doors. */
export const ROAD: P[] = [
  { x: 48, y: 103 }, { x: 48, y: 95 }, { x: 43, y: 86 }, { x: 45, y: 75 }, { x: 48, y: 66 }, { x: 48, y: 61 }, { x: 48, y: 56 },
  { x: 46, y: 46 }, { x: 38, y: 34 }, { x: 36, y: 28 }, { x: 36, y: 24.4 },
];
const BENDS = [0, 0.8, 0.8, 0.6, 0, 0, 0.4, 0.8, 0.3, 0];
/** The track off the road, past the midden and up between the barn and the house to the yard gate. */
export const TRACK: P[] = [{ x: 47, y: 51 }, { x: 56, y: 40 }, { x: 62, y: 31 }, { x: 62.4, y: 14 }, { x: 62, y: 1 }];
const TBENDS = [0.6, 0.6, 0.4, 0];

/** The terrace (fixed): one box to the top edge, its two ways up. */
export function heights(): Ledge[] {
  return [{ ...TERRACE, ramps: [{ ...FLIGHT }, { ...STEPS }], kind: 'crag' }];
}

/** A hedge's x down the close at y (it wanders a little): two touching rows nothing gets through, elms in the line. */
const WEST: [number, number][] = [[60, 4.6], [70, 5.4], [80, 4.6], [90, 5.6], [104, 4.8]];
const EAST: [number, number][] = [[60, 91.4], [70, 90.6], [80, 91.6], [90, 90.8], [104, 91.4]];
function hedgeX(pts: [number, number][], y: number): number {
  for (let i = 1; i < pts.length; i++) if (y <= pts[i][0]) {
    const [y0, x0] = pts[i - 1], [y1, x1] = pts[i];
    return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
  }
  return pts[pts.length - 1][1];
}

function sides(k: Kit): void {
  for (const [pts, out] of [[WEST, -1], [EAST, 1]] as const) {
    for (const off of [0, 0.62]) for (let y = 60.4; y < YARD.h; y += 0.66) {
      const x = hedgeX(pts as [number, number][], y) + off * out;
      k.rounds.push({ kind: 'bush', x, y, r: 0.4 }), claim(k, x, y, 0.4);
    }
    for (let y = 63 + k.rng.range(0, 3); y < YARD.h - 2; y += k.rng.range(6, 9)) {
      const r = k.rng.range(0.85, 1.1), x = hedgeX(pts as [number, number][], y) + out * 0.4;
      k.rounds.push({ kind: 'tree', x, y, r }), claim(k, x, y, r);
    }
    for (let y = 61; y < YARD.h - 0.5; y += 2.2) {
      const h = hedgeX(pts as [number, number][], y), x = out < 0 ? k.rng.range(0.4, h - 1.5) : k.rng.range(h + 1.5, YARD.w - 0.4);
      k.rounds.push({ kind: k.rng.pick(['tree', 'tree', 'bush', 'pine']), x, y: y + k.rng.range(-0.5, 0.5), r: k.rng.range(0.6, 0.9) });
    }
  }
}

/** The soil under everything (fixed; the places add their own over it). */
function ground(k: Kit): void {
  patch(k, 'grass', -1, -1, YARD.w + 2, YARD.h + 2, false);
  // The yard on its terrace: trodden earth, swept by the house, cobbles at the barn's doors.
  patch(k, 'earth', 4, 24, 88, 30), patch(k, 'earth', 20, 24.4, 50, 10, false), patch(k, 'mud', 36, 48, 16, 9), patch(k, 'swept', 64, 26, 22, 12), patch(k, 'flags', 30, 24.4, 12, 4);
  // The close: grass, the paddock's mud at the gate, the trodden ground under the flight.
  patch(k, 'mud', 42, 93, 12, 5), patch(k, 'earth', 40, 60.5, 16, 6), patch(k, 'mud', 44, 63, 8, 3);
}

export function layLand(k: Kit): YardLand {
  const ledges = heights(), lv = (x: number, y: number) => levelAt({ ledges } as unknown as GameMap, x, y);
  const line = road(k, ROAD, BENDS), track = road(k, TRACK, TBENDS);
  // Kept clear: the way in and out, the flight's foot and head, the steps' foot and head, the doors' gathering ground.
  for (const [x, y, r] of [[48, 100.5, 2.6], [62, 1.8, 2.2], [48, 63, 2.6], [48, 56.4, 2.4], [87, 63, 1.8], [87, 56.6, 1.8], [36, 26.6, 2.4]]) claim(k, x, y, r);
  sides(k), ground(k);
  // The doors are the yard's gate; you gather on the cobbles before them and get up again there (behind them is
  // the porch, the way out, and nothing else). The last stretch is the porch itself: nobody in it.
  const s0 = gateIn(k, DOORS, 'THE YARD', [320, 323, 324, 325, 326], undefined, { x: DOORS.x + DOORS.w / 2, y: DOORS.y + DOORS.h + 2 });
  // (Two leaves, hauled: four seconds for one, quicker for two. `look: 2` draws the leaves: client/gatedraw.ts.)
  s0.haul = DOOR_HAUL, (k.blocks[s0.gate!].look = 2);
  const s1: Stretch = { name: 'THE BARN', keep: [], packs: [] };
  return { ledges, lv, road: line, track, stretches: [s0, s1] };
}
