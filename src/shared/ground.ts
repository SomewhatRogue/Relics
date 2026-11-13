/**
 * Wickhold's ground. Most of it is packed earth and trodden mud now, with the cobbles surviving in
 * islands and strips: round the Lantern, along the building fronts, the old road down from the gate,
 * a spine down each lane. Over that, big soft shapes: mud churned where the carts turn, a track worn
 * across the square, the wet round the well, straw under the stalls, ash round the braziers. Then the
 * small marks: flagstones, ruts, a drain, puddles, weeds, missing cobbles, spent arrows.
 *
 * Fixed data, painted once into the floor (client/soil.ts, client/groundpaint.ts) from its own seeds,
 * so every screen sees the same ground. Mending sweeps some of the mud and relays some cobble (washing
 * the square, clearing the lanes), never all of it.
 */
import type { Mark, Soil } from './arena.js';
import type { WorldState } from './story.js';
import { workDone } from './works.js';

const S = (mat: Soil['mat'], x: number, y: number, w: number, h: number, round = true): Soil => ({ mat, x, y, w, h, round });
const L = (mat: Soil['mat'], x1: number, y1: number, x2: number, y2: number, half: number): Soil => ({ mat, x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: half });
const mk = (kind: Mark['kind'], x: number, y: number, w: number, h: number): Mark => ({ kind, x, y, w, h });

/** The buildings' fronts, where a strip of cobble survives (x, front y, width). */
const FRONTS: [number, number, number][] = [[3, 7.5, 8], [15, 7, 6], [31, 7, 7], [42.5, 7, 4], [1.5, 17, 8], [45, 16.5, 6], [3, 32.5, 7], [13, 34, 8]];
const BRAZIERS: [number, number][] = [[25, 15], [31, 15]];
/** The shade trees (town.ts plants them): the square's south corners over the benches, west of the well, between the church
 *  and the hall, by the counting house, south by the lane. */
export const TREES: [number, number][] = [[22.6, 25.3], [33.6, 25.3], [17.6, 24.6], [13, 5], [14.6, 22.4], [22.6, 30.4]];

export function townSoil(w: WorldState): Soil[] {
  const washed = workDone(w, 'wash'), cleared = workDone(w, 'lanes'), spine = cleared ? 1.1 : 0.7;
  const lanes = cleared ? 'swept' : 'earth';
  return [
    // Mud everywhere to start; packed earth where it's walked and swept, the square most of all.
    S('mud', -1, -1, 64, 42, false),
    S('earth', 23, -1, 10, 6), S('earth', 35, 9.4, 8, 10), S(lanes, 12, 33, 12, 5), S(lanes, 31, 28, 18, 9), S(lanes, 0, 17.4, 11, 8), S(lanes, 38, 16.4, 15, 3),
    ...(cleared ? [L('swept', 1, 10.5, 52, 10.5, 1.7), L('swept', 1, 27.9, 52, 27.9, 1.9)] : []),
    // The cobbles: the old gate road, a spine down each lane, the building fronts, and Lantern Square paved
    // edge to edge (Kyle, 2026-11-13: "more clean"), flagstones round the Lantern's dais.
    L('cobble', 28, 0.2, 28, 13.6, 1.1), L('cobble', 1.5, 10.6, 52, 10.6, spine), L('cobble', 2, 28, 52, 28, spine), L('cobble', 34.5, 17.9, 52.5, 17.9, spine - 0.1),
    ...FRONTS.map(([x, y, fw]) => S('cobble', x - 0.4, y - 0.2, fw + 0.8, 1.5, false)),
    S('cobble', 20.5, 11.9, 15, 14.9, false), S('flags', 24.5, 15.2, 7, 6.9),
    // Till it's washed and relaid: a track worn across it, mud and earth where the cobbles have gone.
    ...(washed ? [] : [L('earth', 34.8, 11.6, 21.4, 26.2, 0.55), S('mud', 21, 22.6, 2.8, 1.8), S('earth', 31.6, 12.8, 2.6, 1.4), S('mud', 33.2, 24.4, 2.2, 1.4), S('earth', 24.4, 25.4, 2.4, 1)]),
    S('mud', cleared ? 26 : 24.4, cleared ? 1.6 : 1, cleared ? 4.4 : 7.6, cleared ? 2.4 : 4.2), S('mud', 13.5, 33.6, 7, 2.4),
    ...(cleared ? [] : [S('mud', 33.8, 20.6, 4.8, 3.2), S('mud', 22.5, 29.6, 6, 3.4), S('mud', 1.6, 19.6, 5, 3)]),
    S('wet', 20.4, 19.2, 3.2, 2.6), S('straw', 36.2, 10.6, 4.6, 7.8), S('straw', 14.2, 34.4, 6, 1.4),
    ...BRAZIERS.map(([x, y]) => S('ash', x - 0.9, y - 0.6, 1.8, 1.4)),
    // Green where nobody walks: round the trees, along the verge west of the square; then the trees' shade.
    ...TREES.map(([x, y]) => S('grass', x - 1.3, y - 0.9, 2.6, 1.8)), S('grass', 12.2, 18.6, 6.8, 5.4), S('grass', 30.4, 29.2, 3.4, 2.2),
    ...TREES.map(([x, y]) => S('shade', x - 1.6, y - 1.3, 3.4, 2.2)),
    ...(workDone(w, 'shutters') ? [] : [S('ash', 22.5, 8.1, 1.8, 1.4)]),
  ];
}

/** The small marks over the soil, always there. */
const STANDING: Mark[] = [
  mk('ruts', 26.7, 3.6, 2.6, 8.2), mk('ruts', 38.6, 17.4, 14.2, 1.1), mk('ruts', 4, 27.2, 30, 1),
  mk('gutter', 23.35, 26.8, 0.3, 8.9), mk('gutter', 1.4, 11.95, 18.6, 0.3),
  mk('puddle', 24.6, 22.6, 1.2, 0.5), mk('puddle', 27.5, 8.6, 1, 0.4), mk('puddle', 20.2, 33.4, 1.4, 0.6), mk('puddle', 44, 11.4, 1, 0.4), mk('puddle', 8.6, 28.6, 1.2, 0.5), mk('puddle', 25.4, 3.3, 1.4, 0.5),
  mk('holes', 36.8, 13.9, 0.8, 0.5), mk('holes', 40, 10.3, 0.8, 0.5),
  mk('weeds', 0.2, 0, 16.6, 0.5), mk('weeds', 39.2, 0, 13.6, 0.5), mk('weeds', 0, 7.8, 0.5, 31), mk('weeds', 0, 39.3, 53, 0.7), mk('weeds', 52.4, 23, 0.6, 17), mk('weeds', 52.4, 0.3, 0.6, 12.4),
];
/** Cobbles gone from the square's islands, till it's washed and relaid. */
const SQUARE_HOLES = [mk('holes', 23.4, 13, 1, 0.6), mk('holes', 31.2, 13.2, 0.8, 0.5), mk('holes', 23.8, 24, 1, 0.5), mk('holes', 31, 23.8, 0.9, 0.6)];
/** Holes in the lanes' cobble and spent arrows under the breach, till the lanes are cleared. */
const LANE_MESS = [mk('holes', 15, 10.3, 1, 0.6), mk('holes', 10, 27.7, 1, 0.6), mk('holes', 45, 27.7, 0.9, 0.5), mk('holes', 44, 17.6, 0.9, 0.5), mk('arrows', 18, 0.4, 20.5, 2.8), mk('arrows', 12.5, 0.4, 4, 1.4)];

export function townGround(w: WorldState): Mark[] {
  return [...STANDING, ...(workDone(w, 'wash') ? [] : SQUARE_HOLES), ...(workDone(w, 'lanes') ? [] : LANE_MESS)];
}
