/**
 * Wickhold's ground, so the square isn't one sheet of cobbles: worn flagstones round the Lantern and
 * the well, packed earth where carts turn inside the gate, wheel ruts down the gate road, paths worn
 * corner to corner where people actually walk, missing cobbles, puddles, straw by the stalls and muck
 * by the tavern, weeds along the walls and edges, a drain down to the sewer grate, spent arrows under
 * the breach. Paint only, fixed data (each mark paints from its own seed), so every screen sees the
 * same ground. Mending heals some of it (the mud, the holes, the arrows); the rest is just the town.
 */
import type { Mark } from './arena.js';
import type { WorldState } from './story.js';
import { workDone } from './works.js';

const mk = (kind: Mark['kind'], x: number, y: number, w: number, h: number): Mark => ({ kind, x, y, w, h });

/** Always there, mended or not. */
const STANDING: Mark[] = [
  // Under everything else: earth where the carts turn, then the paths people wear.
  mk('earth', 24.2, 0.2, 7.6, 4.2), mk('earth', 34.2, 19.8, 4.2, 3.4), mk('earth', 13.4, 34.2, 8, 2.6), mk('earth', 0.4, 18.6, 5, 4.6),
  mk('path', 21.6, 25.6, -4.4, 8.6), mk('path', 21.2, 12.2, -15.6, 5.6), mk('path', 33.4, 11.6, 1.2, -4), mk('path', 34.6, 25, 9.6, 2.8),
  mk('ruts', 26.7, 3.6, 2.6, 8.2), mk('ruts', 38.6, 17.8, 14.2, 1.1), mk('ruts', 4, 27.2, 30, 1),
  // The old flagstones round the Lantern and the well, worn into the cobbles.
  mk('flags', 23.8, 14.6, 8.6, 6.4), mk('flags', 20.5, 18.9, 3.1, 3),
  mk('gutter', 23.35, 26.8, 0.3, 8.9), mk('gutter', 1.4, 11.95, 18.6, 0.3),
  mk('puddle', 24.6, 22.6, 1.2, 0.5), mk('puddle', 27.5, 8.6, 1, 0.4), mk('puddle', 20.2, 33.4, 1.4, 0.6), mk('puddle', 44, 11.4, 1, 0.4), mk('puddle', 8.6, 28.1, 1.2, 0.5),
  mk('straw', 35.8, 10.8, 5.2, 7.4), mk('straw', 13, 34.4, 8.2, 1.6),
  mk('holes', 36.8, 13.9, 0.8, 0.5), mk('holes', 18.2, 26.7, 0.9, 0.5),
  mk('weeds', 0.2, 0, 16.6, 0.5), mk('weeds', 39.2, 0, 13.6, 0.5), mk('weeds', 0, 7.8, 0.5, 31), mk('weeds', 0, 39.3, 53, 0.7), mk('weeds', 52.4, 23, 0.6, 17), mk('weeds', 52.4, 0.3, 0.6, 12.4),
  mk('mud', 15, 34.6, 4.6, 1.3),
];
/** Broken cobbles in the square, till it's washed and set right. */
const SQUARE_HOLES = [mk('holes', 26, 12.4, 1, 0.6), mk('holes', 33, 20.5, 0.8, 0.5), mk('holes', 22.6, 23.4, 1, 0.5), mk('holes', 30.4, 24.8, 0.9, 0.6)];
/** Churned mud, holes and spent arrows in the lanes, till they're cleared. */
const LANE_MESS = [
  mk('mud', 25.6, 1.6, 4.8, 2), mk('mud', 34.6, 21.8, 3, 1.4), mk('mud', 2.4, 19.8, 3.4, 2), mk('mud', 27, 9.8, 2, 1.4),
  mk('holes', 15, 10, 1, 0.6), mk('holes', 40, 10.2, 0.8, 0.5), mk('holes', 10, 27.6, 1, 0.6), mk('holes', 45, 27.4, 0.9, 0.5), mk('holes', 30, 29.5, 1, 0.6),
  mk('arrows', 18, 0.4, 20.5, 2.8), mk('arrows', 12.5, 0.4, 4, 1.4),
];

export function townGround(w: WorldState): Mark[] {
  return [...STANDING, ...(workDone(w, 'wash') ? [] : SQUARE_HOLES), ...(workDone(w, 'lanes') ? [] : LANE_MESS)];
}
