/**
 * Layout 3's transitions (docs/terrain-nodes.md 2.4 to 2.6, slice 4): half one country, half the next,
 * the change at a line across the way that you walk through. The wood's edge (a hedge and a stile,
 * a felled ride, or a slope up into the trees), a coppice, the carr where the wood goes to fen, the ore
 * road out of the fields into the rock, and the village's end where its last cottages give onto fields.
 */
import { across, bankBy, cover, offset } from './portkit.js';
import type { Rng } from './rng.js';
import { begin3, country, ruts3 } from './siteopen.js';
import type { Ground } from './sites.js';
import { block, patch, path, round, type Site } from './sitekit.js';
import { cottage } from './sitevillage.js';
import { along, laneAt } from './spine.js';

export function woodedge(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), l = g.spec!.layout;
  path(b.s, b.mat, b.main, 0.95), ruts3(b);
  bankBy(b.s, rng, b.skinAt, b.main, 2.3, b.w, b.h, (t) => Math.abs(t - b.cut) < 0.08), bankBy(b.s, rng, b.skinAt, b.main, -2.3, b.w, b.h, (t) => Math.abs(t - b.cut) < 0.08);
  // The last field's hedge right across, a stile in it where the track goes through; or a ride felled straight through the trees.
  if (l !== 'ride') across(b.s, rng, 'hedge', b.main, b.cut, b.w, b.h, l === 'stile' ? 0.9 : 1.2);
  else for (const p of offset(b.main, 1.8, 1.4)) if (p.t > b.cut) round(b.s, 'stump', p.x, p.y, 0.3);
  // The woodcutter's shack by the edge, and his stack of poles.
  const at = offset(b.main, (rng.next() < 0.5 ? -1 : 1) * 4.2, 0.5).find((p) => p.t > b.cut + 0.05 && p.x > 2 && p.x < b.w - 5 && p.y > 2 && p.y < b.h - 4);
  if (at) block(b.s, 'shack', at.x - 1.5, at.y - 0.8, 3, 1.6), [0, 0.7, 1.4].forEach((k) => round(b.s, 'stump', at.x + 2.2, at.y - 0.4 + k * 0.6, 0.28));
  cover(b.s, rng, b.skin, b.lines, b.w, b.h, 1);
  country(b, rng, b.lines, 2.8);
  return b.s;
}

export function coppice(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), l = g.spec!.layout;
  path(b.s, b.mat, b.main, 0.9);
  bankBy(b.s, rng, b.skinAt, b.main, 2.2, b.w, b.h, (t) => t > b.cut), bankBy(b.s, rng, b.skinAt, b.main, -2.2, b.w, b.h, (t) => t > b.cut);
  // Rows of cut stools and poles in the wood's half, a charcoal hearth's ring of ash, hurdles stacked.
  for (let y = 1.6; y < b.h - 2.6; y += 1.8) for (let x = 1.2; x < b.w - 1; x += 1.8) {
    if (!b.toSide(x, y) || along(b.main, 1).some((p) => Math.hypot(p.x - x, p.y - y) < 2.4) || rng.next() < 0.25) continue;
    round(b.s, rng.next() < 0.7 ? 'stump' : 'bush', x + rng.range(-0.2, 0.2), y + rng.range(-0.2, 0.2), 0.3);
  }
  const hearth = offset(b.main, (rng.next() < 0.5 ? -1 : 1) * 4, 0.5).find((p) => p.t > b.cut + 0.1 && p.x > 3 && p.x < b.w - 3 && p.y > 3 && p.y < b.h - 4);
  if (hearth) patch(b.s, 'ash', hearth.x - 1.4, hearth.y - 0.9, 2.8, 1.8), block(b.s, 'hurdle', hearth.x - 1.1, hearth.y + 1.4, 2.2, 0.45);
  if (l === 'ride') {
    // A ride crossing the coppice: a straight cut right across.
    const p = along(b.main, 0.5).find((q) => q.t > b.cut + 0.15) ?? along(b.main, 0.5)[0];
    path(b.s, 'grass', [[p.x + p.dy * 30, p.y - p.dx * 30], [p.x - p.dy * 30, p.y + p.dx * 30]], 0.9);
  }
  cover(b.s, rng, b.from, b.lines, b.w, b.h, 1);
  country(b, rng, b.lines, 3);
  return b.s;
}

export function carredge(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng);
  path(b.s, b.mat, b.main, 0.85);
  bankBy(b.s, rng, b.skinAt, b.main, 2.2, b.w, b.h, (t) => rng.next() < 0.25), bankBy(b.s, rng, b.skinAt, b.main, -2.2, b.w, b.h, (t) => rng.next() < 0.25);
  // Where the wood goes to fen: a line of willows right across, the track through them, and the wet beyond.
  across(b.s, rng, 'willow', b.main, b.cut, b.w, b.h, 1.2);
  for (const q of g.water) if (rng.next() < 0.5) round(b.s, 'reed', q.x + rng.range(0, q.w), q.y - 0.4, 0.3);
  country(b, rng, b.lines, 2.6);
  return b.s;
}

export function oreroad(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), l = g.spec!.layout;
  path(b.s, b.mat, b.main, 1.1), ruts3(b);
  // Hedges giving out to rocks; in a cutting, rock walls close in on both sides past the change.
  const d = l === 'cutting' ? 2 : 2.5;
  bankBy(b.s, rng, b.skinAt, b.main, d, b.w, b.h, (t) => l !== 'cutting' && Math.abs(t - 0.6) < 0.05), bankBy(b.s, rng, b.skinAt, b.main, -d, b.w, b.h);
  // Spoil carted out and tipped beside the road.
  for (let i = 0, t = 0; i < (l === 'spoil' ? 4 : 2) && t < 40; t++) {
    const p = offset(b.main, (rng.next() < 0.5 ? -1 : 1) * rng.range(3.6, 5.5), 1).find((q) => q.t > b.cut && rng.next() < 0.1);
    if (p && p.x > 2 && p.x < b.w - 3 && p.y > 2 && p.y < b.h - 3) block(b.s, 'rubble', p.x - 1.2, p.y - 0.6, 2.4, 1.2), patch(b.s, 'ash', p.x - 1.6, p.y - 0.4, 3.2, 1.4), i++;
  }
  cover(b.s, rng, 'rock', b.lines, b.w, b.h, 2);
  country(b, rng, b.lines, 3);
  return b.s;
}

/** The village's end: its last cottages along the lane, then fields (or, coming in from the fields, the other way about). */
export function villageend(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), l = g.spec!.layout, houses = g.spec!.fromCountry === 'village' ? (y: number) => y > g.h * 0.5 : (y: number) => y < g.h * 0.5;
  path(b.s, b.mat, b.main, 1.2), ruts3(b);
  for (const y of [2.4, 8.8, 15.2]) for (const sx of l === 'row' ? [rng.next() < 0.5 ? -1 : 1] : [-1, 1]) {
    if (!houses(y + 1) || rng.next() < 0.15) continue;
    const lx = laneAt(b.main, y + 3.2), hx = sx < 0 ? lx - 6.9 : lx + 3.4;
    if (hx > 0.8 && hx + 4.4 < g.w - 0.6) cottage(b.s, rng, hx, y, -sx, lx + sx * 1.2);
  }
  if (l === 'green') patch(b.s, 'grass', laneAt(b.main, g.h / 2) - 4, g.h * 0.5 - 2, 8, 4);
  // A palisade across the lane where the village stops, its gate open: the last place to hold them.
  across(b.s, rng, 'palisade', b.main, 0.5, g.w, g.h, 1.2);
  const t = { ...b, toSide: (x: number, y: number) => !houses(y) };
  country({ ...t, from: 'fields', skin: 'fields' }, rng, b.lines, 3);
  b.s.soil = b.s.soil.filter((q) => !houses(q.y + q.h / 2) || q.mat === b.mat || q.mat === 'earth' || q.mat === 'furrow');
  b.s.rounds = b.s.rounds.filter((q) => !houses(q.y) || q.kind !== 'hay');
  return b.s;
}
