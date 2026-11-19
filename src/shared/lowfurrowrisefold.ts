/**
 * THE RISE: the fold yard on top of the hill, and the brow above it (shared/lowfurrowrise.ts).
 *
 *   Sheep country, and no sheep. The hungry penned what they caught in the big fold before they roped it: the ground
 *   in it is trodden to mud, what was taken off the gleaners lies in the straw, and one is still caged there. The
 *   line went out of the fold's gap and up the road over the brow. The shepherd's hut has its door hanging; three
 *   are eating what was in it. On the brow the old boundary wall, a wind-bent thorn, the cairn, the stile, and the
 *   lane going on north without you.
 */
import { along, block, claim, patch, round, type Kit, type Line, type P } from './expedkit.js';
import { clump, markAt, sprinkle } from './lowfurrowrisekit.js';
import { thickHedge } from './terrkit.js';

export const CAGE: P = { x: 42, y: 35 };
/** The fold: 18 by 12 round (40, 34), its gap on the east side toward the road. */
export const FOLD = { x0: 31, y0: 28, x1: 49, y1: 40, gap: [32.8, 36.2] };
export const HUT = { x: 64.2, y: 22.4, w: 3.6, h: 2.6 };
export const FIRE: P = { x: 62.4, y: 28.4 };
export const POND: P = { x: 26, y: 28 };
const T = 0.45;

/** A run of hurdles from (x0, y) to (x1, y), or down from (x, y0) to (x, y1). */
const across = (k: Kit, y: number, x0: number, x1: number) => { for (let x = x0; x < x1 - 0.01; x += 2.2) block(k, 'hurdle', x, y, Math.min(2.2, x1 - x), T); };
const down = (k: Kit, x: number, y0: number, y1: number) => { for (let y = y0; y < y1 - 0.01; y += 2.2) block(k, 'hurdle', x, y, T, Math.min(2.2, y1 - y)); };

function fold(k: Kit): void {
  const F = FOLD;
  patch(k, 'earth', F.x0 - 2, F.y0 - 2, F.x1 - F.x0 + 4, F.y1 - F.y0 + 4), patch(k, 'mud', F.x0 + 1, F.y0 + 1, F.x1 - F.x0 - 2, F.y1 - F.y0 - 2);
  patch(k, 'straw', 34, 30, 8, 6), patch(k, 'mud', F.x1 - 2, 32, 5, 5);
  across(k, F.y0, F.x0, F.x1 + T), across(k, F.y1 - T, F.x0, F.x1 + T);
  down(k, F.x0, F.y0 + T, F.y1 - T), down(k, F.x1, F.y0 + T, F.gap[0]), down(k, F.x1, F.gap[1], F.y1 - T);
  // Inside: the tethering post, a hay rack, what was taken off them in the straw, the ground trodden to mud.
  round(k, 'post', 37.4, 31.4, 0.24), round(k, 'hay', 33.2, 38.2, 0.5);
  for (const [x, y] of [[36, 33.6], [40.4, 37.6], [44.6, 31.2], [34, 35.6]] as const) markAt(k, 'straw', x, y, 2, 1.1);
  for (const [x, y] of [[38.8, 34.6], [44.8, 36.8], [35.6, 30.4]] as const) markAt(k, 'debris', x, y, 1.3, 0.6);
  sprinkle(k, 'mud', 8, F.x0 + 1, F.y0 + 1, F.x1 - 1, F.y1 - 1, 2.2, 1.2);
  // Spare hurdles stacked outside the west side (cover), the shepherd's handcart left by the south side.
  across(k, 32.2, 26.2, 28.4), across(k, 33, 25.8, 28), round(k, 'handcart', 37, 42.4, 0.5);
}

/** The sorting pens: a race of hurdles that snakes in from the south-east, the dip in its middle lane. */
function pens(k: Kit): void {
  patch(k, 'mud', 57, 39.4, 14, 9.6, false), patch(k, 'wet', 60.6, 42.8, 6.4, 2.4);
  down(k, 57.6, 40, 48.25), down(k, 70, 40, 48.25);
  across(k, 40, 57.6, 70.45), across(k, 42.6, 57.6, 67.6), across(k, 45.2, 60.4, 70.45), across(k, 47.8, 57.6, 67.6);
  // The dip (paint: water on the hill's top would draw as a pit).
  markAt(k, 'puddle', 63.8, 43.9, 5, 1.3);
  for (const [x, y] of [[69, 49.6], [63, 46.5], [59.2, 44]] as const) markAt(k, 'mud', x, y, 2, 1.1);
  markAt(k, 'puddle', 68.8, 50.2, 1.4, 0.7);
}

/** The dewpond: round, shallow, a ring of stones and trodden mud; a sheep path to it from the fold. */
function pond(k: Kit): void {
  const { x, y } = POND;
  patch(k, 'mud', x - 5, y - 4.4, 10, 8.8), patch(k, 'wet', x - 4, y - 3.6, 8, 7.2);
  // (Paint: water on the hill's top would draw as a pit.)
  markAt(k, 'puddle', x, y, 7, 4.6), markAt(k, 'puddle', x - 0.4, y - 0.4, 5, 5.4);
  for (let a = 0.3; a < Math.PI * 2; a += k.rng.range(0.6, 1.1)) {
    const px = x + Math.cos(a) * 4.6, py = y + Math.sin(a) * 3.9;
    round(k, 'rock', px, py, k.rng.range(0.24, 0.4));
  }
  clump(k, ['reed'], x - 3.8, y + 2.6, 3, 0.8, [0.24, 0.3], 0);
  for (const [a, b] of [[[x + 4.6, y + 1], [31, 32]], [[x + 3, y + 4], [31.6, 38.8]]] as const) k.marks.push({ kind: 'path', x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1] });
}

/** The shepherd's hut, its door hanging, a fire outside it with what was in it being eaten. */
function hut(k: Kit): void {
  patch(k, 'earth', HUT.x - 4, HUT.y - 1.6, HUT.w + 8, HUT.h + 8), patch(k, 'ash', FIRE.x - 1, FIRE.y - 0.7, 2, 1.4);
  block(k, 'shack', HUT.x, HUT.y, HUT.w, HUT.h);
  markAt(k, 'planks', HUT.x + 2.7, HUT.y + HUT.h + 0.6, 1.1, 1.3), markAt(k, 'debris', HUT.x + 1.6, HUT.y + HUT.h + 1.8, 1.8, 0.8);
  k.braziers.push({ x: FIRE.x, y: FIRE.y, r: 0.35, wild: true }), claim(k, FIRE.x, FIRE.y, 0.8);
  round(k, 'woodpile', HUT.x - 0.8, HUT.y + 1.2, 0.5), round(k, 'barrels', HUT.x + HUT.w + 0.7, HUT.y + 0.6, 0.42);
  round(k, 'chopblock', HUT.x + HUT.w + 1.3, HUT.y + 3.8, 0.3), round(k, 'sacks', FIRE.x - 1.4, FIRE.y - 0.9, 0.4);
  round(k, 'hay', HUT.x + 0.8, HUT.y - 1.6, 0.55), round(k, 'hay', HUT.x + 3.1, HUT.y - 1.8, 0.5);
}

/** The line's way out: from the fold's gap to the road and up it over the brow, trodden; a heel dragged now and then. */
function lineOut(k: Kit, road: Line): void {
  for (const [x, y] of [[49.6, 34.6], [51, 34]] as const) markAt(k, 'mud', x, y, 2, 1.2);
  along(road, 2.6).filter((p) => p.y < 34).forEach((p, i) => {
    if (k.rng.next() < 0.7) markAt(k, 'mud', p.x + k.rng.range(-0.6, 0.6), p.y, k.rng.range(1.4, 2), k.rng.range(0.8, 1.1));
    if (i === 3) markAt(k, 'drag', p.x + 0.7, p.y, 0.6, 2.1);
  });
  markAt(k, 'debris', 52.6, 4.2, 1, 0.5), markAt(k, 'straw', 50.4, 18.6, 1.4, 0.8);
}

/** The rest of the sheep country: a lambing pen, a trunk down, the winter's hay, boulders and thorn in clumps, hawthorns, long grass. */
function country(k: Kit): void {
  across(k, 43, 18, 24.45), across(k, 47.2, 18, 24.45), down(k, 18, 43.45, 47.2), down(k, 24, 43.45, 44.8);
  round(k, 'hay', 20.4, 45.2, 0.5), markAt(k, 'straw', 21.4, 46, 2, 1);
  // The stub of an older fold's wall between the pen and the gate, tumbled at its end.
  for (const x of [37, 40]) block(k, 'rockwall', x, 45.6, 3, 0.6);
  block(k, 'rubble', 43, 45.6, 2.2, 0.6), markAt(k, 'weeds', 40.6, 46.6, 6, 0.9);
  for (const [x, y] of [[40.6, 50.8], [56, 46.4], [28, 51.2], [62.6, 51.6], [77.6, 50.4]] as const) clump(k, ['bush', 'rock', 'rock'], x, y, 3, 1.3, [0.3, 0.55], 1.6);
  for (const [x, y] of [[74.4, 29.6], [75.8, 31], [73.6, 31.6]] as const) round(k, 'hay', x, y, 0.55);
  for (const [x, y] of [[30.4, 20.6], [56.6, 19.4], [80.4, 40.6], [44.6, 22.2]] as const) clump(k, ['rock'], x, y, 3, 1.3, [0.36, 0.7], 1.6);
  for (const [x, y, r] of [[19.4, 45.8, 1], [77.4, 33.6, 0.95], [16, 20.4, 0.9]] as const) round(k, 'tree', x, y, r);
  for (const [x, y] of [[14.6, 38], [22.6, 50.6], [36.4, 50.4], [70.6, 52.4], [80.6, 45], [79.6, 24.6], [57.6, 30.2], [36.6, 21], [22.4, 34.8], [72.4, 18]] as const) {
    clump(k, ['bush', 'bush', 'rock'], x, y, 3, 1.7, [0.3, 0.55], 1.6);
  }
  sprinkle(k, 'weeds', 18, 12, 17, 84, 53, 2, 1);
  gathering(k);
}

/**
 * The gathering ground between the fold and the gate (it was plain grass): where the flock was brought together
 * before the fold. The shepherd's cart with spare hurdles leant on it, the water tub and the salt barrels, a hay
 * rack's row of sheaves, the corner of a drystone creep, and the sheep's own paths worn from the gate to the fold
 * and to the pens.
 */
function gathering(k: Kit): void {
  block(k, 'cart', 33.4, 48.6, 2.6, 1.3), across(k, 50.4, 33, 37.4), across(k, 47.9, 36.4, 38.6);
  round(k, 'washtub', 44.4, 43.4, 0.42), round(k, 'barrels', 45.6, 42.6, 0.36), markAt(k, 'puddle', 44.2, 44.3, 1.6, 0.7);
  for (const x of [54.2, 56, 57.8]) round(k, 'hay', x + k.rng.range(-0.2, 0.2), 51.2 + k.rng.range(-0.2, 0.2), 0.46);
  markAt(k, 'straw', 56, 52.2, 5, 1.2), markAt(k, 'straw', 34.6, 50.9, 3, 1);
  // The creep: two short walls meeting, a gap a sheep's width, tumbled at one end.
  block(k, 'rockwall', 62.4, 46.6, 3.4, 0.6), block(k, 'rockwall', 66.4, 46.6, 0.6, 2.6), block(k, 'rubble', 60.2, 46.6, 1.8, 0.6);
  // Worn paths: gate to the fold's gap, gate to the pens, the tub to the fold.
  for (const [a, b] of [[[50, 53], [49.6, 41]], [[51.4, 52.4], [58.4, 48.6]], [[44.6, 42.8], [41, 40.6]]] as const) k.marks.push({ kind: 'path', x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1] });
  clump(k, ['reed'], 30.4, 46.4, 4, 1.2, [0.22, 0.3], 1.6), clump(k, ['reed'], 68.6, 43.6, 3, 1, [0.22, 0.3], 1.6);
}

/** The brow: the old boundary wall, the thorn and the cairn, the stile in its hedge, gorse and long grass. */
function brow(k: Kit): void {
  thickHedge(k, 2.2, 0.4, 50.3), thickHedge(k, 2.2, 53.7, 95.6);
  block(k, 'fence', 48.2, 2.1, 2.1, 0.32), block(k, 'fence', 53.7, 2.1, 2.1, 0.32);
  // Where the lane tops the brow: a thorn bent by the wind and the cairn travellers add a stone to (it was a wayside
  // cross, which read as a grave), what the line dropped going over, and the long grass nobody grazed this year.
  round(k, 'tree', 45.6, 6.2, 0.6);
  for (const [dx, dy, r] of [[0, 0, 0.42], [0.6, 0.3, 0.3], [-0.5, 0.4, 0.28], [0.1, 0.7, 0.24]] as const) round(k, 'rock', 56.6 + dx, 7.2 + dy, r);
  round(k, 'sacks', 50.6, 9.6, 0.3), markAt(k, 'debris', 52.4, 11.8, 1.2, 0.6), markAt(k, 'straw', 49.8, 13.4, 1.6, 0.8), markAt(k, 'weeds', 45.8, 7.2, 1.6, 0.7);
  for (const [x, y] of [[26, 9], [34.6, 12.4], [60.4, 12], [68.6, 9.6], [76.4, 13], [18.4, 12.6], [40.6, 5.2], [84, 12]] as const) clump(k, ['reed'], x, y, 4, 1.4, [0.22, 0.32], 1.6);
  // The old boundary along the brow: what is left of a drystone wall, two runs standing and the rest down.
  for (const [x, w, kind] of [[20.6, 2.4, 'rubble'], [24, 7, 'rockwall'], [32.2, 1.8, 'rubble'], [43, 2.2, 'rubble'], [58.6, 2, 'rubble'], [61.2, 8, 'rockwall'], [70.4, 2.6, 'rubble']] as const) block(k, kind, x, 14.6, w, 0.6);
  for (const [x, y, r] of [[30.4, 4.4, 0.85], [72.4, 4, 0.9]] as const) round(k, 'tree', x, y, r);
  for (const [x, y] of [[12, 7.6], [21.6, 5], [37.4, 9.4], [63.4, 7.4], [80.6, 9.4], [86.4, 5], [44, 10.6]] as const) clump(k, ['bush', 'bush', 'rock'], x, y, 3, 1.5, [0.3, 0.5], 1.6);
  sprinkle(k, 'weeds', 6, 8, 4, 88, 12.6, 1.8, 0.9);
  // A dog, somebody's, at the stile with its nose to the way they went.
  k.rounds.push({ kind: 'dog', x: 54.8, y: 3.9, r: 0.01 });
}

export function layFold(k: Kit, road: Line): void {
  claim(k, CAGE.x, CAGE.y, 1.2);
  fold(k), pens(k), pond(k), hut(k), lineOut(k, road), country(k), brow(k);
}
