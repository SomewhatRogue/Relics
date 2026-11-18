/**
 * THE RISE: the way in, the foot of the hill and the hollow lane (shared/lowfurrowrise.ts).
 *
 *   The nine were walked up this lane an hour or two ago, roped, from the drain to the fold. Its mud is trodden by
 *   many feet in a line; where one sat down a heel was dragged; what fell from their hands lies where it fell.
 *   Elms over the banks, brambles on the lips, the sheep tracks worn up both sides long before any of it.
 */
import { along, claim, free, mark, round, type Kit } from './expedkit.js';
import { hedgeX, LANE, TRACKS, type RiseLand } from './lowfurrowriseland.js';
import { clump, markAt, sprinkle } from './lowfurrowrisekit.js';

/** The far bank of the drain: rushes along the water, the planks laid back, a waymark, what was dropped at the foot. */
function wayIn(k: Kit): void {
  for (let x = hedgeX('W', 102) + 1.2; x < hedgeX('E', 102) - 1.2; x += k.rng.range(0.7, 1.3)) {
    if (x > 44.6 && x < 51.4) continue;
    if (k.rng.next() < 0.8) k.rounds.push({ kind: 'reed', x, y: 102.15 + k.rng.range(-0.15, 0.1), r: 0.28 });
  }
  mark(k, 'planks', 46.4, 102.5, 3.2, 1.5);
  round(k, 'waymark', 53.6, 96.4, 0.32);
  // A gleaner's sack dropped at the foot of the hill, its grain spilt.
  round(k, 'sacks', 43.6, 96.6, 0.42), markAt(k, 'straw', 43.2, 97.4, 1.6, 0.8), markAt(k, 'debris', 44.6, 97.6, 1.1, 0.6);
  for (const [x, y] of [[20, 98], [31, 99.5], [62, 98.5], [74, 99], [84, 97.5], [12, 97]] as const) clump(k, ['bush', 'bush', 'rock'], x, y, 4, 2.2, [0.32, 0.55]);
  sprinkle(k, 'weeds', 8, 8, 95, 88, 101.5, 1.6, 0.8);
}

/** The foot of the hill: the slope up, a wayside shrine where the lane begins, hawthorn and a field elm or two. */
function foot(k: Kit): void {
  round(k, 'shrine', 33.8, 88.6, 0.4), claim(k, 33.8, 88.6, 1.2);
  for (const [x, y, r] of [[22, 90.2, 1.05], [71, 89.4, 1], [84, 91, 0.9]] as const) if (free(k, x, y, r, 2)) round(k, 'tree', x, y, r);
  for (const [x, y] of [[14, 89], [27, 87.8], [58, 88.5], [64, 91], [78, 87.5], [11, 93.5], [86, 94]] as const) clump(k, ['bush', 'bush', 'rock'], x, y, 3, 1.8, [0.34, 0.55]);
  sprinkle(k, 'weeds', 6, 8, 86.5, 88, 93, 1.3, 0.8);
  sprinkle(k, 'weeds', 6, 8, 86, 88, 93, 1.8, 0.8);
}

/** The lane's floor: the nine's trodden line up the road, a dragged heel, what they dropped, old ruts and puddles. */
function trace(k: Kit, land: RiseLand): void {
  const pts = along(land.road, 2.4).filter((p) => p.y < 101 && p.y > 54);
  pts.forEach((p, i) => {
    // Many feet in a line: trodden mud, boot-printed, now this side of the road and now that.
    const s = k.rng.range(-0.7, 0.7);
    if (k.rng.next() < 0.75) markAt(k, 'mud', p.x - p.dy * s, p.y + p.dx * s, k.rng.range(1.4, 2.2), k.rng.range(0.8, 1.2));
    if (i % 6 === 1 && p.y > 58 && p.y < 90) markAt(k, 'ruts', p.x, p.y, 1.6, 2.4);
  });
  // What fell from their hands (fixed: the story's).
  for (const [x, y] of [[40.6, 82.6], [37.6, 76.2], [41.4, 69.4], [47.6, 61.2]] as const) markAt(k, 'debris', x, y, 1.2, 0.7);
  for (const [x, y] of [[39.2, 79.6], [43.8, 66.2]] as const) markAt(k, 'straw', x, y, 1.6, 0.9);
  // Where one sat down and was hauled up by the rope, heels dragging; one of them fought, once, at the lane's head.
  markAt(k, 'drag', 41.2, 74.6, 0.6, 2), markAt(k, 'drag', 46.4, 64.8, 0.6, 1.8);
  markAt(k, 'blood', 48.6, 60.4, 0.7, 0.35);
  for (const [x, y, w] of [[37.4, 84, 1.6], [42.8, 72.6, 1.2], [39, 77.4, 1], [46.6, 63.4, 1.4]] as const) markAt(k, 'puddle', x, y, w, w * 0.6);
}

/** Under the faces: stones fallen out of the banks, weeds at their foot; up each sheep track, a trodden path. */
function faces(k: Kit): void {
  for (const [y0, y1, wx, ex] of LANE) for (const [fx, o] of [[wx, 1], [ex, -1]] as const) {
    for (let y = y0 + 1; y < y1 - 0.5; y += k.rng.range(1.6, 3.2)) {
      const x = fx + o * k.rng.range(0.5, 1), r = k.rng.range(0.24, 0.42);
      if (k.rng.next() < 0.5 && free(k, x, y, r, 1.3)) round(k, 'rock', x, y, r);
      else markAt(k, 'weeds', fx + o * 0.7, y, 1.3, 0.9);
    }
  }
  for (const [side, y] of TRACKS) {
    const band = LANE.find(([y0, y1]) => y > y0 + 0.5 && y < y1 - 0.5)!, fx = side === 'W' ? band[2] : band[3], o = side === 'W' ? -1 : 1;
    mark(k, 'path', Math.min(fx - o * 1.6, fx + o * 2.8), y - 0.3, 4.4, 0.8);
  }
}

/** The banks: elms along both lips (none in front of the barn, so it shows from the lane), brambles and long grass. */
function banks(k: Kit): void {
  const elms: [number, number][] = [[31.8, 84.6], [30.6, 77.6], [30.8, 70.2], [33.6, 64.4], [38.6, 59.6], [49.4, 84.2], [53.6, 79.6], [55.6, 62], [57.4, 60]];
  for (const [x, y] of elms) {
    const r = k.rng.range(0.9, 1.15), px = x + k.rng.range(-0.6, 0.6), py = y + k.rng.range(-0.6, 0.6);
    if (free(k, px, py, r, 2)) round(k, 'tree', px, py, r);
  }
  // Brambles in clumps on the lips, never on a track.
  for (const [x, y] of [[33, 86.2], [32.6, 79.8], [32, 72.6], [35.6, 67.6], [40.6, 61.8], [48.2, 86.2], [48.2, 79.4], [47.8, 72.2], [52.6, 68.4], [55, 64.4], [24, 86], [60, 84.5]] as const) {
    clump(k, ['bush', 'bush', 'bush', 'rock'], x, y, 3, 1.5, [0.36, 0.52], 1.6);
  }
  sprinkle(k, 'weeds', 10, 46.5, 58, 58, 86, 1.8, 1);
  for (const [x, y] of [[50.8, 71], [53.2, 82.6], [49.6, 66.4]] as const) clump(k, ['rock', 'rock', 'bush'], x, y, 3, 1.2, [0.3, 0.5], 1.6);
}

export function layLane(k: Kit, land: RiseLand): void {
  wayIn(k), foot(k), trace(k, land), faces(k), banks(k);
}
