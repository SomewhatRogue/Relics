/**
 * THE HOME GROUND: the paddocks above the orchard door (shared/tollanorchard.ts).
 *
 *   Small fields kept in hurdles, hedged along the lane, the stock let out the morning they went. The sheep paddock
 *   is empty, its hay rack full. The hay paddock was cut and stooked and half carted. The dewpond still holds. Down
 *   the side lane at the field shelter, one of the nine went lame on the road and was left roped there, and the ones
 *   left to mind him have a fire going. Ahead, past the ploughing and its scarecrow, the lane goes on up to the yard.
 */
import { block, claim, patch, round, type Kit, type P } from './expedkit.js';
import { clump, hurdles, markAt, sprinkle } from './tollanorchardkit.js';
import { thickHedge, wall } from './terrkit.js';

/** The cage at the field shelter (stands in for the man roped to its post), the shelter, its fire. */
export const SHELTER: P = { x: 13.2, y: 34.6 };
export const SHED = { x: 6.4, y: 31.4, w: 4.6, h: 3.2 };
export const FIRE: P = { x: 17.6, y: 33.6 };
/** A spot ahead in the hurdle lane (a farm dog stood there, on the way you want), and the dewpond (real water, level). */
export const DOG_LANE: P = { x: 50.8, y: 41.6 };
export const POND_AT = { x: 70, y: 36.2 };
// (An oval in eleven bands half a tile deep, as THE FIELDS' pond: one box reads as a tank.)
export const POND = Array.from({ length: 11 }, (_, i) => {
  const dy = -2.5 + i * 0.5, half = 4.6 * Math.sqrt(1 - (dy / 2.9) ** 2), cx = POND_AT.x + 0.4 * Math.sin(dy * 0.9);
  return { x: Math.round((cx - half) * 10) / 10, y: POND_AT.y + dy - 0.25, w: Math.round(half * 20) / 10, h: 0.5 };
});
/** The lane's sides and the paddocks' hurdle lines (y). */
export const LANE = { w: 44.2, e: 52.6 };
const Y = { foot: 50, side: 37.6, sideN: 30.6, east: 25.6, top: 8 };

function lines(k: Kit): void {
  for (const o of [0, 0.62]) {
    wall(k, { x: LANE.w - o, y: Y.side + 0.4 }, { x: LANE.w - o, y: Y.foot + 0.3 }), wall(k, { x: LANE.w - o, y: Y.top + 0.4 }, { x: LANE.w - o, y: Y.sideN + 0.3 });
    wall(k, { x: LANE.e + o, y: Y.top + 0.4 }, { x: LANE.e + o, y: 39.6 }), wall(k, { x: LANE.e + o, y: 43.4 }, { x: LANE.e + o, y: Y.foot + 0.3 });
  }
  // West: the sheep paddock (a hurdle down in its front), the side lane between, the hay paddock (a gap off the side lane).
  hurdles(k, Y.foot, 5.8, LANE.w - 0.3, [[19.4, 23.6]]), hurdles(k, Y.side, 5.8, LANE.w - 0.3);
  hurdles(k, Y.sideN, 5.8, LANE.w - 0.3, [[26.2, 30.6]]), hurdles(k, Y.top, 5.8, LANE.w - 0.3);
  // East: the dewpond paddock (its field gate off the lane), the ploughing beyond it.
  hurdles(k, Y.foot, LANE.e + 0.4, 90.4), hurdles(k, Y.east, LANE.e + 0.4, 90.4, [[72, 76.4]]), hurdles(k, Y.top, LANE.e + 0.4, 90.4);
  round(k, 'post', LANE.e + 0.9, 39.4, 0.2), round(k, 'post', LANE.e + 0.9, 43.6, 0.2);
  markAt(k, 'planks', 21.4, Y.foot + 1.4, 2.4, 0.8), markAt(k, 'planks', 74.2, Y.east + 1.5, 2.2, 0.7);
}

/** The field shelter at the side lane's end: its hay, the cage where he's roped, their fire and what they took. */
function shelter(k: Kit): void {
  patch(k, 'earth', 6, Y.sideN + 0.6, 16, 6.4), patch(k, 'straw', SHED.x, SHED.y + SHED.h, 7, 2.4);
  block(k, 'shack', SHED.x, SHED.y, SHED.w, SHED.h);
  round(k, 'hay', SHED.x + SHED.w + 0.8, SHED.y + 0.6, 0.5);
  k.rounds.push({ kind: 'cookfire', x: FIRE.x, y: FIRE.y, r: 0.4 }), claim(k, FIRE.x, FIRE.y, 0.9);
  round(k, 'sacks', FIRE.x + 1.4, FIRE.y - 0.7, 0.38), markAt(k, 'debris', FIRE.x - 0.4, FIRE.y + 1.2, 1.2, 0.5);
  markAt(k, 'mud', 30, 34.2, 1.8, 1), markAt(k, 'mud', 38, 34.6, 1.6, 0.9), markAt(k, 'blood', SHELTER.x + 0.9, SHELTER.y + 0.9, 0.5, 0.3);
}

/** The sheep paddock: empty, its hay rack still full, the trough, the stones in the grass. */
function sheep(k: Kit): void {
  round(k, 'hay', 14, 43, 0.55), round(k, 'hay', 15.4, 44.6, 0.5), round(k, 'washtub', 30.4, 46, 0.42), round(k, 'washtub', 31.6, 45.4, 0.36);
  for (const [x, y] of [[10, 47.4], [24, 40.6], [37, 44], [33, 40.4]] as const) clump(k, ['rock', 'bush'], x, y, 2, 1, [0.3, 0.5]);
  for (const [x, y] of [[16.6, 46.2], [29.4, 47.8], [22.4, 42.6]] as const) markAt(k, 'straw', x, y, 1.6, 0.8);
  round(k, 'tree', 39.6, 41.8, 0.95);
  sprinkle(k, 'weeds', 8, 7, Y.side + 1, LANE.w - 1, Y.foot - 0.6, 1.6, 0.8);
}

/** The hay paddock: cut, stooked in rows, half carted (the handcart left loaded), a few stooks kicked down. */
function hay(k: Kit): void {
  patch(k, 'straw', 6.6, Y.top + 1, LANE.w - 7.6, Y.sideN - Y.top - 1.6, false);
  for (let y = Y.top + 3; y < Y.sideN - 2; y += 3.4) for (let x = 9 + (y % 2); x < LANE.w - 2; x += 3.6) {
    if (x > 30 && y > 16 && y < 24) continue;
    if (k.rng.next() < 0.18) { markAt(k, 'straw', x, y + 0.2, 1.4, 0.8); continue; }
    round(k, 'hay', x + k.rng.range(-0.3, 0.3), y + k.rng.range(-0.2, 0.2), k.rng.range(0.44, 0.54));
  }
  round(k, 'handcart', 34.6, 20, 0.5), round(k, 'hay', 36, 21.4, 0.45), markAt(k, 'ruts', 33, 22.6, 2.4, 1.2), markAt(k, 'ruts', 30, 26, 2, 1.4);
  clump(k, ['crows'], 18, 14, 1, 1, [0.02, 0.02], 0);
}

/** The dewpond paddock and the ploughing: the pond with its stone lip and rushes, the scarecrow over the furrows. */
function east(k: Kit): void {
  const P0 = { x: POND_AT.x - 4.6, y: POND_AT.y - 2.9, w: 9.2, h: 5.8 };
  patch(k, 'mud', P0.x - 1.6, P0.y - 1.2, P0.w + 3.2, P0.h + 2.4), patch(k, 'wet', P0.x - 0.6, P0.y - 0.4, P0.w + 1.2, P0.h + 0.8);
  for (const w of POND) k.water.push({ ...w });
  for (let a = 0.2; a < Math.PI * 2; a += k.rng.range(0.55, 0.9)) {
    const x = POND_AT.x + Math.cos(a) * 6.2, y = POND_AT.y + Math.sin(a) * 4;
    round(k, 'rock', x, y, k.rng.range(0.24, 0.4));
  }
  clump(k, ['reed'], P0.x - 1.6, P0.y + P0.h + 1.6, 3, 0.8, [0.24, 0.3], 0), clump(k, ['reed'], P0.x + P0.w + 1.4, P0.y - 1.4, 3, 0.8, [0.24, 0.3], 0);
  k.marks.push({ kind: 'path', x: LANE.e + 1.4, y: 40.2, w: P0.x - LANE.e - 2, h: 1.2 });
  for (const [x, y] of [[60, 46], [82, 44], [84, 30], [58, 29]] as const) clump(k, ['bush', 'rock', 'bush'], x, y, 3, 1.4, [0.32, 0.5]);
  round(k, 'tree', 86, 47, 1), round(k, 'tree', 61.4, 31.4, 0.9);
  patch(k, 'furrow', LANE.e + 1, Y.top + 1, 90 - LANE.e - 2, Y.east - Y.top - 2, false);
  round(k, 'scarecrow', 70, 16, 0.35), clump(k, ['crows'], 66, 18, 1, 1, [0.02, 0.02], 0), clump(k, ['crows'], 78, 13, 1, 1, [0.02, 0.02], 0);
  for (const [x, y] of [[57, 12], [86, 20], [84, 11]] as const) clump(k, ['rock'], x, y, 3, 1.2, [0.3, 0.5]);
  sprinkle(k, 'weeds', 8, LANE.e + 1, Y.east + 1, 89, Y.foot - 1, 1.6, 0.8);
}

/** The lane and the foot of it: ruts, puddles, a trough by the door; the hedge and the field gate at the top. */
function lane(k: Kit): void {
  for (let y = Y.top + 2; y < Y.foot; y += 4.6) markAt(k, 'ruts', 48 + k.rng.range(-0.5, 0.5), y, 1.6, 2.4);
  for (const [x, y] of [[46.4, 27], [50.2, 15.6], [47, 46.4]] as const) markAt(k, 'puddle', x, y, 1.4, 0.7);
  round(k, 'washtub', 42, 52.6, 0.42), round(k, 'barrels', 58, 53.4, 0.44), round(k, 'woodpile', 70, 53.2, 0.5);
  for (const [x, y] of [[20, 52.6], [32, 53], [80, 52.4], [12, 53.4]] as const) clump(k, ['bush', 'rock'], x, y, 2, 1, [0.3, 0.45]);
  thickHedge(k, 2.2, 0.4, 45.9), thickHedge(k, 2.2, 50.1, 95.6);
  block(k, 'fence', 44, 2.1, 1.8, 0.32), block(k, 'fence', 50.3, 2.1, 1.8, 0.32);
  for (const [x, y] of [[14, 5.4], [28, 5], [64, 5.4], [80, 5]] as const) clump(k, ['bush', 'bush', 'rock'], x, y, 3, 1.4, [0.3, 0.5]);
  sprinkle(k, 'weeds', 10, 7, 3.6, 89, 7.4, 1.6, 0.8);
}

export function layPaddocks(k: Kit): void {
  claim(k, SHELTER.x, SHELTER.y, 1.2), claim(k, DOG_LANE.x, DOG_LANE.y, 0.8);
  // The pocket: a chest left in the hay paddock's far corner, under the last stooks.
  const c = { x: 8.8 + k.rng.range(-0.2, 0.4), y: 10.6 + k.rng.range(-0.2, 0.3) };
  k.chests.push(c), claim(k, c.x, c.y, 0.9);
  lines(k), shelter(k), sheep(k), hay(k), east(k), lane(k);
}
