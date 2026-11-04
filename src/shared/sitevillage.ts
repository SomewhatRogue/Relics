/**
 * The farming places: a village round its green (cottages facing the lane with their yards and fences,
 * kitchen gardens behind, the well and a wayside shrine, strip fields and hedges out at the edges), a
 * farmstead (house, barns, the yard between, a paddock, an orchard, a ploughed field), and open fields
 * cut by tracks and hedgerows.
 */
import type { Ground } from './sites.js';
import { block, fence, fenceDown, hedge, line, mark, newSite, patch, path, prop, round, type Site } from './sitekit.js';
import type { Rng } from './rng.js';

/** A cottage facing the lane: its yard in front, fenced, a path to the lane, its garden behind. */
export function cottage(s: Site, rng: Rng, hx: number, y: number, toLane: number, laneX: number): void {
  block(s, 'house', hx, y, 3.5, 2);
  patch(s, 'earth', hx - 0.3, y + 1.8, 4.1, 2, false);
  path(s, 'earth', [[hx + 1.75, y + 2.4], [hx + 1.75, y + 3.2], [laneX, y + 3.2]], 0.55);
  fence(s, hx - 0.3, y + 4.0, 4.1, toLane > 0 ? [2.5] : [0]);
  fenceDown(s, toLane > 0 ? hx - 0.45 : hx + 3.85, y + 2.1, 1.9);
  patch(s, 'furrow', hx + 0.1, y - 2.1, 3.3, 1.7, false);
  if (rng.next() < 0.5) round(s, 'bush', toLane > 0 ? hx - 0.5 : hx + 4, y - 1.2, 0.36);
  prop(s, rng.next() < 0.6 ? 'barrel' : 'crate', toLane > 0 ? hx - 0.7 : hx + 4.2, y + 1.1);
}

/** Strip fields across an edge: ploughed and standing in turn, grass balks between, a hedge on the inside. */
function strips(s: Site, rng: Rng, x0: number, x1: number, y0: number, y1: number, hedgeX: number): void {
  for (let x = x0; x + 1 < x1; x += 1.9) patch(s, rng.next() < 0.5 ? 'furrow' : 'crop', x, y0, Math.min(1.5, x1 - x), y1 - y0, false);
  const gap = rng.range(0.3, 0.7);
  hedge(s, hedgeX, y0, hedgeX, y1, (t) => Math.abs(t - gap) < 0.06);
  for (let i = 0; i < 2; i++) round(s, 'hay', rng.range(x0 + 0.7, x1 - 0.7), rng.range(y0 + 1, y1 - 1), 0.55);
  if (rng.next() < 0.6) round(s, 'scarecrow', rng.range(x0 + 0.6, x1 - 0.6), rng.range(y0 + 2, y1 - 2), 0.25);
}

export function green(rng: Rng, g: Ground): Site {
  const s = newSite('grass'), M = g.w / 2, H = g.h, bend = rng.range(-1, 1), d = g.dress ?? rng;
  // The lane, parting round the green and meeting again, ruts down it; a track out to the fields.
  path(s, 'earth', [[M, H], [M + bend, 17], [M, 16.5]], 1.3);
  path(s, 'earth', [[M, 7.5], [M - bend * 0.6, 4], [M, 0]], 1.3);
  path(s, 'earth', [[M, 16.5], [M - 3.6, 12], [M, 7.5]], 0.85);
  path(s, 'earth', [[M, 16.5], [M + 3.6, 12], [M, 7.5]], 0.85);
  mark(s, 'ruts', M - 0.8, 0.4, 1.6, 7), mark(s, 'ruts', M - 0.8, 16.5, 1.6, H - 17);
  line(s, 'earth', 0.3, 21.2, g.w - 0.3, 21.2, 0.7);
  // The well and the shrine on the green's rim.
  const side = rng.next() < 0.5 ? -1 : 1;
  round(s, 'well', M + side * 3.3, 12, 0.5), patch(s, 'mud', M + side * 3.3 - 1.3, 12.2, 2.6, 1.4), mark(s, 'puddle', M + side * 3.3 - 0.6, 12.9, 1.2, 0.5);
  round(s, 'shrine', M - side * 3.5, 9.6, 0.3);
  // The cottages, facing the lane.
  for (const y of [2.4, 9, 15.6]) {
    if (d.next() > 0.12) cottage(s, d, M - 7 + d.range(-0.3, 0.2), y, 1, M - 1.2);
    if (d.next() > 0.12) cottage(s, d, M + 3.5 + d.range(-0.2, 0.3), y, -1, M + 1.2);
  }
  // Strip fields beyond the hedges.
  strips(s, d, 0.5, M - 8.2, 0.8, 20.2, M - 7.8);
  strips(s, d, M + 8.2, g.w - 0.5, 0.8, 20.2, M + 7.8);
  if (d.next() < 0.6) block(s, 'cart', d.next() < 0.5 ? 1.6 : g.w - 4.6, 21.8, 2.8, 1.2);
  mark(s, 'weeds', 0, 0, g.w, 0.5);
  return s;
}

export function farmstead(rng: Rng, g: Ground): Site {
  const s = newSite('grass'), M = g.w / 2, H = g.h, d = g.dress ?? rng;
  // The yard: trodden earth between house and barns, mud by the trough and the barn doors.
  patch(s, 'earth', M - 8.5, 3.5, 17, 12);
  path(s, 'earth', [[M, H], [M + d.range(-0.8, 0.8), 15], [M, 0]], 1.1);
  patch(s, 'mud', M - 4.6, 8.2, 3, 2), patch(s, 'mud', M + 3, 6.2, 4, 1.8), patch(s, 'straw', M + 3.5, 6.6, 5, 1.4);
  // The farmhouse, its garden behind; the barns across the yard.
  block(s, 'house', M - 7.6, 4, 3.5, 2), patch(s, 'furrow', M - 7.4, 1.6, 3.2, 1.8, false);
  block(s, 'barn', M + 3, 3, 5, 3);
  if (d.next() < 0.6) block(s, 'barn', M + 4, 10.4, 5, 3);
  round(s, 'well', M - 3.4, 8.6, 0.5);
  prop(s, 'barrel', M - 3.6, 5.4), prop(s, 'crate', M + 8.5, 4.2), prop(s, 'oil', M + 8.6, 5.4), prop(s, 'table', M - 5.4, 6.8), prop(s, 'barrel', M + 2.4, 7);
  block(s, 'cart', M - 6.8, 11.2, 2.8, 1.2);
  // The paddock: fenced, gates on two sides, hay in it.
  const px = 1.6, py = 13.4;
  fence(s, px, py, 8, [5.2]), fence(s, px, py + 6, 8, [3]);
  fenceDown(s, px, py, 6), fenceDown(s, px + 8, py, 6.35, [2.2]);
  patch(s, 'mud', px + 1, py + 1.5, 5, 3);
  for (let i = 0; i < 3; i++) round(s, 'hay', px + 1.6 + i * 2.4, py + 2.4 + (i % 2) * 1.6, 0.55);
  // The orchard up the side; a ploughed field beyond a hedge in the far corner.
  for (let y = 1.5; y < 11; y += 2.7) round(s, 'tree', 1.4 + (y % 2), y, 0.6);
  for (let y = 14.4; y < 20.6; y += 1.6) patch(s, 'furrow', M + 3.4, y, g.w - M - 4, 1.2, false);
  hedge(s, M + 2.8, 13.8, M + 2.8, 20.6, (t) => t > 0.4 && t < 0.55);
  hedge(s, M + 3.2, 13.6, g.w - 0.6, 13.6, (t) => t > 0.65 && t < 0.8);
  if (d.next() < 0.6) round(s, 'scarecrow', M + 8, 17, 0.25);
  return s;
}

export function fields(rng: Rng, g: Ground): Site {
  const s = newSite('wheat', 'trees'), M = g.w / 2, H = g.h, ty = rng.range(8, 13), d = g.dress ?? rng;
  // The track up the middle and one across; sunken between hedgerows, trees standing in them.
  path(s, 'earth', [[M, H], [M + d.range(-0.6, 0.6), ty], [M, 0]], 1);
  line(s, 'earth', 0.3, ty, g.w - 0.3, ty, 0.8), mark(s, 'ruts', M - 0.8, 0.5, 1.6, H - 1);
  for (const sx of [-1, 1]) {
    const hx = M + sx * 2.4;
    hedge(s, hx, 0.8, hx, ty - 1.3, (t) => d.next() < 0.08 || Math.abs(t - 0.5) < 0.05);
    hedge(s, hx, ty + 1.3, hx, H - 3.2, (t) => d.next() < 0.08 || Math.abs(t - 0.4) < 0.05);
    round(s, 'tree', hx + sx * 0.4, d.range(2, ty - 2), 0.6);
  }
  // Four fields: standing grain, ploughed, or cut with the stooks still out; a scarecrow, a shelter.
  for (const [x0, x1] of [[0.6, M - 3], [M + 3, g.w - 0.6]]) for (const [y0, y1] of [[0.8, ty - 1.2], [ty + 1.2, H - 3]]) {
    const r = rng.next();
    if (r < 0.35) for (let y = y0; y < y1 - 0.6; y += 1.5) patch(s, 'furrow', x0, y, x1 - x0, 1, false);
    else if (r < 0.7) {
      patch(s, 'grass', x0, y0, x1 - x0, y1 - y0, false);
      for (let i = 0; i < 4; i++) round(s, 'hay', d.range(x0 + 1, x1 - 1), d.range(y0 + 1, y1 - 1), 0.55);
    } else if (rng.next() < 0.7) round(s, 'scarecrow', (x0 + x1) / 2 + rng.range(-2, 2), (y0 + y1) / 2, 0.25);
  }
  block(s, 'shack', d.next() < 0.5 ? 1 : g.w - 4, ty + 1.6, 3, 1.6);
  prop(s, 'crate', M + 3.6, ty + 2.2), prop(s, 'barrel', M - 3.6, ty - 2.2);
  return s;
}
