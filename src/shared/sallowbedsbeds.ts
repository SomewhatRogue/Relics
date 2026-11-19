/**
 * THE OSIER BEDS (shared/sallowbeds.ts), from the drove's end up to the cut.
 *
 *   The drove comes in on its raised track between two black ditches, the willows standing in them, and opens on
 *   the beds: rows of osier stools on dry ground between two ditches, some cut to the knuckle, the far ones let go
 *   to bush. The hungry are cropping them. On the east side they cut and carry withies up to the stack on the ditch
 *   bank by their first den, its oil barrel beside it; on the west, in the middle bed, they are weaving the rods into
 *   hurdles for a pen, three sides done. Two walk the bank. Across the cut, the first sluice in its frame.
 */
import { block, claim, patch, type Kit, type P } from './expedkit.js';
import { wooden } from './sitekit.js';
import { CROSS, DITCHES, SLUICE1 } from './sallowbedsland.js';
import { markAt, put, sprinkle, stools } from './sallowbedskit.js';

/** The first den on the ditch bank (its top-left corner), its oil, the withy stack, the half-woven pen, the cutting. */
export const DEN1: P = { x: 67.6, y: 67.3 };
export const OIL1: P = { x: 65.4, y: 70.2 };
export const STACK: P = { x: 60.6, y: 72.6 };
export const PEN: P = { x: 27.4, y: 84.2 };
export const CUTTING: P = { x: 71, y: 85 };
/** Where the bank patrol walks, west to east along the ditch bank. */
export const BANK: [number, number][] = [[24, 70.6], [58, 70.8]];

/** The drove's end: the raised track, its gatepost long down, a cart's ruts, a dropped withy. Quiet. */
function droveEnd(k: Kit): void {
  patch(k, 'earth', 45, 99, 6, 13, false), patch(k, 'mud', 44, 95.6, 8, 4);
  for (const [x, y] of [[47.4, 106], [48.6, 101.4]] as const) markAt(k, 'ruts', x, y, 1.6, 2.6);
  markAt(k, 'puddle', 49.4, 104, 1.3, 0.6), markAt(k, 'puddle', 46.6, 99.4, 1.4, 0.7), markAt(k, 'fallenpost', 45.8, 103, 1.6, 0.5);
  markAt(k, 'weeds', 45.6, 108, 1, 1.8), markAt(k, 'weeds', 50.4, 106.4, 1, 1.8), markAt(k, 'debris', 49, 98.2, 1.2, 0.4);
  put(k, 'post', 45.6, 100.6, 0.16, 0, 0.6);
}

/** The beds: the stools in rows between the ditches (cut nearest the work, grown out at the far edges). */
function rows(k: Kit): void {
  // South bed (the first you see): grown out at its ends, cut in the middle.
  for (const y of [91.6, 93.8]) stools(k, y, 16, 80, 0.5);
  stools(k, 95.6, 22, 43, 0.3), stools(k, 95.6, 53, 74, 0.3);
  // Middle bed: the pen's ground left open on the west, the cutting on the east cut almost bare.
  for (const y of [81.6, 83.8, 86.2]) stools(k, y, 35, 62, 0.6), stools(k, y, 64, 82, 0.85);
  // North bed: cut on the west; the east is the stack's ground and the den's.
  for (const y of [72.6, 74.8, 77]) stools(k, y, 18, 54, 0.75);
  // A few old standard willows left in the beds (cover, and the roof starting).
  for (const [x, y, r] of [[38.6, 92.6, 0.8], [60.4, 93, 0.75], [20.4, 79.6, 0.8], [77, 76.6, 0.8], [56.4, 83.2, 0.7], [33.6, 74.4, 0.7]] as const) put(k, 'tree', x, y, r, 0, 0.6);
  // Cut rods lying where they fell, bundles not yet carried.
  sprinkle(k, 'straw', 12, 62, 80.6, 81, 87.6, 1.3, 0.5), sprinkle(k, 'debris', 10, 18, 71.6, 54, 78, 1, 0.4);
  sprinkle(k, 'weeds', 16, 16, 90.6, 80, 97, 1.5, 0.7), sprinkle(k, 'mud', 8, 18, 71, 78, 96, 1.6, 0.8);
}

/** The ditches: boards where the drove crosses each, the banks trodden to mud, a few reeds standing in them. */
function ditches(k: Kit): void {
  for (const d of DITCHES) {
    block(k, 'boards', CROSS.x0, d.y0 - 0.2, CROSS.x1 - CROSS.x0, d.y1 - d.y0 + 0.4, { deck: true });
    markAt(k, 'mud', 48, d.y0 - 0.6, 4.6, 0.8), markAt(k, 'mud', 48, d.y1 + 0.6, 4.6, 0.8);
    for (let x = 14; x < 82; x += k.rng.range(1.6, 3.4)) if (x < 44 || x > 52) put(k, 'reed', x, (d.y0 + d.y1) / 2 + k.rng.range(-0.2, 0.2), 0.26, 1, 0.4);
  }
  // The banks nobody has cut since: sedge and reed standing along both sides of each ditch, pollards leaning over
  // it here and there, so the black water runs between green walls and you see where it can be crossed.
  for (const d of DITCHES) for (const [y, n] of [[d.y0 - 0.5, 0], [d.y1 + 0.5, 1]] as const) {
    for (let x = 13 + n * 1.3; x < 83; x += k.rng.range(2, 3.2)) {
      if (x > CROSS.x0 - 1.6 && x < CROSS.x1 + 1.6) continue;
      const willow = k.rng.next() < 0.12;
      put(k, willow ? 'tree' : 'reed', x, y + k.rng.range(-0.15, 0.15), willow ? k.rng.range(0.42, 0.6) : k.rng.range(0.22, 0.3), 0, 1.6);
    }
  }
}

/** The half-woven pen: three sides of hurdles up, the fourth's rods stacked to weave, the stakes driven for it. */
function pen(k: Kit): void {
  const P0 = PEN;
  patch(k, 'mud', P0.x - 5, P0.y - 3, 10, 6.4), markAt(k, 'straw', P0.x + 3.4, P0.y + 1.4, 2.2, 1);
  for (let x = P0.x - 4.4; x < P0.x + 2.2; x += 2.2) block(k, 'hurdle', x, P0.y - 2.4, 2.2, 0.45);
  block(k, 'hurdle', P0.x - 4.8, P0.y - 2.2, 0.45, 2.2), block(k, 'hurdle', P0.x - 4.8, P0.y + 0.1, 0.45, 2.2);
  block(k, 'hurdle', P0.x - 4.4, P0.y + 2.2, 2.2, 0.45);
  // The east side not begun: its rods in bundles, a hurdle half woven lying flat, the knife left on the block.
  put(k, 'woodpile', P0.x + 4.4, P0.y - 1.6, 0.5), put(k, 'woodpile', P0.x + 4.6, P0.y + 0.2, 0.46), put(k, 'chopblock', P0.x + 3.2, P0.y + 2.8, 0.28);
  markAt(k, 'planks', P0.x + 0.6, P0.y + 3.4, 2.2, 0.7), markAt(k, 'debris', P0.x + 2.4, P0.y - 0.4, 1.4, 0.5), markAt(k, 'debris', P0.x - 1.4, P0.y + 0.6, 1, 0.4);
  claim(k, P0.x - 1, P0.y, 2.2), claim(k, P0.x + 2.2, P0.y + 1, 1.2);
}

/** The bank: the first den, its oil, the withy stack carried up to it, the sluice's frame posts in the cut. */
function bank(k: Kit): void {
  patch(k, 'earth', 16, 66.4, 64, 4.2, false), patch(k, 'mud', DEN1.x - 3, DEN1.y - 0.4, 8, 4.4);
  k.blocks.push(wooden({ kind: 'den', x: DEN1.x, y: DEN1.y, w: 2.6, h: 1.6 })), claim(k, DEN1.x + 1.3, DEN1.y + 0.8, 1.9);
  k.props.push({ kind: 'oil', ...OIL1 }), claim(k, OIL1.x, OIL1.y, 0.6);
  markAt(k, 'scorch', OIL1.x + 0.3, OIL1.y + 0.7, 0.9, 0.4), put(k, 'barrels', DEN1.x + 3.6, DEN1.y + 0.9, 0.4, 0, 0.4);
  // The stack: bundles of withies piled by the den, more lying ready to go on it.
  for (const [x, y, r] of [[0, 0, 0.55], [1.3, -0.3, 0.5], [0.5, 1.1, 0.5], [-1.2, 0.6, 0.46]] as const) put(k, 'woodpile', STACK.x + x, STACK.y + y, r, 0, 0.4);
  markAt(k, 'straw', STACK.x + 0.4, STACK.y + 2.2, 2.8, 0.9), put(k, 'sacks', STACK.x - 2.6, STACK.y - 0.6, 0.36, 0, 0.4);
  // The way they carry: a trodden path from the cutting, across the ditch, to the stack.
  k.marks.push({ kind: 'path', x: STACK.x + 1.4, y: STACK.y + 2, w: CUTTING.x - 2.4 - STACK.x, h: CUTTING.y - 3.6 - STACK.y });
  // The sluice: its frame posts standing in the cut either side, the winding post on the bank.
  put(k, 'support', SLUICE1.x - 0.9, SLUICE1.y + 0.8, 0.26, 2, 0), put(k, 'support', SLUICE1.x + SLUICE1.w + 0.9, SLUICE1.y + 0.8, 0.26, 2, 0);
  markAt(k, 'planks', 48, 66.9, 4, 0.6), markAt(k, 'mud', 48, 68.6, 5, 1.2);
  sprinkle(k, 'weeds', 8, 17, 66.6, 44, 70.4, 1.4, 0.6);
}

export function layBeds(k: Kit): void {
  claim(k, PEN.x + 0.4, PEN.y + 0.4, 1.4), claim(k, CUTTING.x, CUTTING.y, 1.8);
  droveEnd(k), ditches(k), pen(k), bank(k);
}

/** What the seed lays round the set pieces and the goblins: the rows themselves. */
export const layBedRows = rows;
