/**
 * Layout 4's rooms under the ground (docs/terrain-nodes.md 2.6): a flooded drift (water the length of
 * it, a deep sump to one side, boards floating), a collapse (rubble across most of it and a squeeze to
 * get through, a pit prop down), the worked-out chamber (pillars of rock left standing, ore heaps) and
 * the cave beyond the workings (rock as it was, pools, no props, no torches). Nothing in the cave hints
 * at what was down there first.
 */
import { across, cover } from './portkit.js';
import type { Rng } from './rng.js';
import { begin3, country } from './siteopen.js';
import { scatter } from './siteskin.js';
import type { Ground } from './sites.js';
import { block, mark, patch, path, round, type Site } from './sitekit.js';
import { along, offAll } from './spine.js';
import { offset } from './portkit.js';

/** Pit props along both walls of a working, every few tiles. */
function props(s: Site, b: ReturnType<typeof begin3>, d: number, every: number): void {
  for (const sd of [-1, 1]) for (const p of offset(b.main, sd * d, every)) if (p.y > 2 && p.y < b.h - 3 && p.x > 1 && p.x < b.w - 1 && offAll(b.lines, p.x, p.y) > d - 0.6) round(s, 'support', p.x, p.y, 0.3);
}

export function flooded(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng);
  path(b.s, 'wet', b.main, 1.2);
  for (const q of g.water) if (!q.deep && rng.next() < 0.5) mark(b.s, 'planks', q.x + rng.range(0, Math.max(0.1, q.w - 1.4)), q.y + rng.range(0, Math.max(0.1, q.h - 0.7)), 1.4, 0.7);
  props(b.s, b, 2.8, 3.6);
  country(b, rng, b.lines, 3.4);
  return b.s;
}

export function collapse(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), at = rng.range(0.42, 0.58);
  path(b.s, b.mat, b.main, 1);
  // The roof came in across the way: a spine of fallen rock with one squeeze through it, heaps both sides.
  const [x, y] = across(b.s, rng, 'rock', b.main, at, b.w, b.h, g.spec!.layout === 'squeeze' ? 0.95 : 1.3);
  for (const sd of [-1, 1]) for (const p of offset(b.main, sd * 2.6, 1.2)) if (Math.abs(p.t - at) < 0.12 && p.x > 1.5 && p.x < b.w - 2.5 && p.y > 2 && p.y < b.h - 3) block(b.s, 'rubble', p.x - 0.9, p.y - 0.5, 1.8, 1);
  mark(b.s, 'fallenpost', x + 1.4, y - 0.8, 2, 0.6), mark(b.s, 'debris', x - 2.4, y + 0.6, 4.8, 1.4);
  props(b.s, b, 2.6, 4.4);
  cover(b.s, rng, 'under', b.lines, b.w, b.h, 1);
  country(b, rng, b.lines, 3.2);
  return b.s;
}

export function orechamber(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), heaps = g.spec!.layout === 'heaps';
  path(b.s, b.mat, b.main, 1);
  patch(b.s, 'ash', b.w * 0.2, b.h * 0.2, b.w * 0.6, b.h * 0.55);
  // Pillars of rock left standing to hold the roof, in rough rows; ore heaps between (more on the heaps' layout).
  for (let x = 3.5; x < b.w - 2; x += 5.2) for (let y = 3.5; y < b.h - 3; y += 4.6) {
    const px = x + rng.range(-0.8, 0.8), py = y + rng.range(-0.6, 0.6);
    if (offAll(b.lines, px, py) > 2.4) round(b.s, 'rock', px, py, rng.range(0.8, 1));
  }
  scatter(b.s, rng, b.w, b.h, b.lines, 2.6, heaps ? 6 : 3, (x, y) => block(b.s, 'rubble', x - 0.9, y - 0.5, 1.8, 1), 2.4);
  for (const p of along(b.main, 3.2)) if (p.t > 0.15 && p.t < 0.85) mark(b.s, 'ruts', p.x - 0.8, p.y - 1, 1.6, 2);
  return b.s;
}

export function cave(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), winding = g.spec!.layout === 'winding';
  path(b.s, 'wet', b.main, winding ? 0.8 : 1);
  // Rock as it lies: big boulders close in, smaller ones scattered, no props and no torches.
  scatter(b.s, rng, b.w, b.h, b.lines, winding ? 2 : 3, 28, (x, y) => round(b.s, 'rock', x, y, rng.range(0.6, 1.1)), 1.2);
  scatter(b.s, rng, b.w, b.h, b.lines, 1.8, 10, (x, y) => round(b.s, 'rock', x, y, rng.range(0.3, 0.45)), 0.9);
  for (let i = 0; i < 6; i++) patch(b.s, 'wet', rng.range(1, b.w - 3), rng.range(2, b.h - 4), rng.range(1.5, 3.2), rng.range(1, 1.8));
  return b.s;
}
