/**
 * THE LONG STRIPS, the scape between the headland and the stooks (shared/lowfurrowfields.ts).
 *
 *   Ridge and furrow gone to rye and wild oat, mown rides between the strips, the first lynchet climbing
 *   across the whole field. The nine were walked straight up the road through it, roped: the rye is trodden
 *   flat either side and things they dropped lie along it. Two of the hungry walk it back and forth; two
 *   more are pulling the coat off the scarecrow. The pond in the willows hides one who ran.
 */
import { block, claim, mark, patch, prop, round, type Kit } from './expedkit.js';
import { STRIPS } from './lowfurrowfieldsland.js';
import { grove, marks, maybe, put, rye, xAt, type FieldsLand } from './lowfurrowfieldskit.js';

export const RYE_GROUND = { x: 30, y: 52, r: 6 };
export const HIDING = { x: 13, y: 53 };

/** The pond: willows round its west and its banks, reeds at its edge, the chest on the north bank, a nook to hide in. */
function pond(k: Kit): void {
  claim(k, HIDING.x, HIDING.y, 1.1);
  for (const [x, y, r] of [[11.2, 50.8, 0.85], [11.4, 55.4, 0.9], [13.6, 57.8, 0.8], [13.8, 48.6, 0.75], [17.2, 58.4, 0.7], [22.4, 58.2, 0.8], [24.8, 49.4, 0.7], [10, 53.2, 0.7]]) round(k, 'tree', x, y, r);
  for (const [x, y, w, h] of [[14.6, 49.4, 1.6, 1], [22.8, 50.4, 1.4, 1.6], [21.6, 55.8, 1.8, 1], [15, 55.6, 1.4, 1.1]]) k.blocks.push({ kind: 'reeds', soft: true, x, y, w, h, look: 300 + Math.round(x * 7) } as never);
  k.chests.push({ x: 19.2 + k.rng.range(-0.6, 0.6), y: 48.7 });
  claim(k, 19.2, 48.7, 1);
  patch(k, 'shade', 9, 48, 6, 11), marks(k, 'mud', 18, 57.4, 2, 2, 0.3, 1.4, 0.6);
  grove(k, 10.6, 58.6, 3, 1.2, ['bush'], [0.34, 0.44], 0.8);
  // Her trodden way in through the rye from the ride, and where she lay.
  marks(k, 'trample', 21, 46.6, 2, 1.6, 0.6, 1.4, 0.8), mark(k, 'trample', 12.4, 52.4, 1.2, 1.2);
}

/** The scarecrow in the ride crossing, two of them tugging its coat off, crows it never scared. */
function scarecrow(k: Kit, land: FieldsLand): void {
  round(k, 'scarecrow', 70, 66, 0.35);
  put(k, land, 68.6, 65.3, 111, { task: { k: 'busy', x: 70, y: 66, what: 'winch' } });
  put(k, land, 71.5, 66.9, 111, { task: { k: 'busy', x: 70, y: 66, what: 'winch' } });
  marks(k, 'trample', 70, 66, 3, 1.6, 1, 1.8, 1), marks(k, 'straw', 70.4, 66.6, 3, 1.2, 0.8, 1, 0.5), mark(k, 'debris', 70.6, 67.4, 0.8, 0.4);
  round(k, 'crows', 73.4, 64.2, 0.15);
}

/** The fallen hovel to the east: a field shelter long down, its beam on the ground, brambles through it. */
function hovel(k: Kit): void {
  block(k, 'shack', 72.4, 47.6, 3.2, 2.2, { fate: 'wrecked', worn: true }), block(k, 'rubble', 75.8, 48.2, 1.6, 1.2), block(k, 'log', 70.8, 50.6, 2.8, 0.6);
  round(k, 'woodpile', 71.2, 47.8, 0.4);
  grove(k, 74.4, 51.4, 5, 2.2, ['bush', 'bush', 'deadtree'], [0.34, 0.5], 0.8);
  marks(k, 'weeds', 74, 49, 5, 3, 2.4, 1.6, 0.6), marks(k, 'debris', 75, 50.2, 3, 1.6, 0.8, 0.8, 0.4);
}

/** The road, trodden wide by the roped line: trample on it, drag marks, things dropped beside it. */
function theLine(k: Kit, land: FieldsLand): void {
  for (let y = 77; y > 40; y -= 3.2 + k.rng.range(0, 1.2)) {
    const p = { x: xAt(land.road, y) };
    mark(k, 'trample', p.x - 1.6 + k.rng.range(-0.4, 0.4), y - 0.7, 3.2, 1.4);
    if (k.rng.next() < 0.5) mark(k, 'trample', p.x + k.rng.pick([-2.6, 1.2]), y - 0.5 + k.rng.range(-0.4, 0.4), 1.4, 1);
  }
  // What they dropped: a sack, a rake, a sheaf, a shawl (debris), sickles.
  maybe(k, 'sacks', 50.8, 69.2, 0.32, 1.4), maybe(k, 'hay', 45.2, 44.4, 0.38, 1.4), prop(k, 'stave', 45.6, 57.6);
  for (const [x, y] of [[49.6, 52], [46.6, 63.6], [49, 74.4]]) mark(k, 'debris', x, y, 0.8, 0.45);
  // The patrol walking it, up and back.
  const pts: [number, number][] = [[48, 75.4], [47.2, 62], [48.6, 47], [47.2, 62]];
  put(k, land, 47.8, 70.2, 110, { task: { k: 'patrol', pts, i: 1 } });
  put(k, land, 48.4, 71.6, 110, { task: { k: 'patrol', pts, i: 1 } });
}

/** Along the lynchet's step: brambles and a hawthorn or two, flowers, an old field tree with its shade. */
function lynchet(k: Kit): void {
  round(k, 'tree', 42.2, 58.6, 1), patch(k, 'shade', 39.6, 56.6, 6, 4.2);
  round(k, 'tree', 61.8, 58.2, 0.7), round(k, 'tree', 84.6, 59.6, 0.75);
  for (const [x, y] of [[12, 61.4], [24, 61.2], [33.4, 59], [54, 58.8], [74, 60.4], [86, 60.2]]) {
    grove(k, x, y, 3, 1.4, ['bush'], [0.32, 0.44], 1.3);
    marks(k, k.rng.next() < 0.5 ? 'flowers' : 'weeds', x + 2.6, y, 2, 2, 0.4, 1.8, 0.5);
  }
}

export function strips(k: Kit, land: FieldsLand): void {
  pond(k), scarecrow(k, land), hovel(k), theLine(k, land), lynchet(k);
  // The mere stones at the strips' foot, field trees along the side hedges.
  for (const s of STRIPS) maybe(k, 'stone', s.x0 + 0.8, 76.8, 0.24, 0.6);
  for (const [x, y] of [[9.6, 75], [86.4, 70.4], [9.8, 42.6], [86.2, 52.6]]) maybe(k, 'tree', x, y, 0.9, 0.5);
  // The fallow strip and the rough one: weeds and thistle, puddles in the furrows, brambles.
  marks(k, 'weeds', 53, 58, 9, 3, 16, 2, 0.7), marks(k, 'puddle', 53, 66, 3, 2.4, 9, 1.4, 0.6);
  marks(k, 'flowers', 42.6, 66, 6, 2.4, 10, 1.8, 0.5), marks(k, 'weeds', 73, 66, 7, 3.6, 10, 2, 0.6);
  grove(k, 74, 72.4, 4, 2.6, ['bush'], [0.34, 0.46], 1.2), grove(k, 76, 56.6, 3, 2, ['bush'], [0.34, 0.46], 1.2);
  round(k, 'crows', 54.2, 52.6, 0.15);
  // The rye last, round everything laid: thick strips, the wild oat thin, the fallow and the rough barely.
  const thin = { rye: 0.06, oat: 0.5, fallow: 0.88, rough: 0.8 } as const;
  for (const s of STRIPS) {
    const pondSide = s.x1 <= 27;
    if (pondSide) {
      rye(k, land, s.x0, 40, s.x1, 47, thin[s.is]), rye(k, land, s.x0, 59.6, s.x1, 78, thin[s.is]);
      if (s.x1 > 25) rye(k, land, 25, 47, s.x1, 59.6, thin[s.is]);
    } else rye(k, land, s.x0, 40, s.x1, 78, thin[s.is]);
  }
}
