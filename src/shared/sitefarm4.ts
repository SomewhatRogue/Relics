/**
 * Layout 4's farm rooms (docs/terrain-nodes.md 2.3): the stackyard (hayricks in rows, or round a
 * threshing barn, straw everywhere), the watermill on its pond (the wheel on one side or the other, a
 * leat running off it), and the orchard (trees in rows, or old and overgrown, a press shed, windfalls).
 */
import { bankBy, cover, offset } from './portkit.js';
import type { Rng } from './rng.js';
import { begin3, country, ruts3 } from './siteopen.js';
import { scatter } from './siteskin.js';
import type { Ground } from './sites.js';
import { block, mark, patch, path, round, type Site } from './sitekit.js';
import { along, boxOff, offAll } from './spine.js';

export function stackyard(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), yard = g.spec!.layout === 'rickyard';
  path(b.s, b.mat, b.main, 1.1), ruts3(b);
  patch(b.s, 'straw', 2, 2, b.w - 4, b.h - 4);
  if (yard) {
    // The threshing barn, its ricks round it.
    const at = offset(b.main, (rng.next() < 0.5 ? -1 : 1) * 5.4, 1).find((p) => p.t > 0.35 && p.x > 4 && p.x < b.w - 6 && p.y > 4 && p.y < b.h - 5);
    if (at) block(b.s, 'barn', at.x - 2.6, at.y - 1.6, 5.2, 3.2);
    scatter(b.s, rng, b.w, b.h, b.lines, 2.6, 7, (x, y) => round(b.s, 'hay', x, y, rng.range(0.7, 0.9)), 2.2);
  } else for (const sd of [-1, 1]) for (const p of offset(b.main, sd * 3.4, 2.4)) {
    // Ricks in a row either side of the cart track.
    if (p.t > 0.12 && p.t < 0.88 && p.x > 1.5 && p.x < b.w - 1.5 && p.y > 2 && p.y < b.h - 3 && offAll(b.lines, p.x, p.y) > 2.6) round(b.s, 'hay', p.x, p.y, rng.range(0.7, 0.9));
  }
  scatter(b.s, rng, b.w, b.h, b.lines, 2.4, 2, (x, y) => block(b.s, 'cart', x - 1.2, y - 0.5, 2.4, 1), 3);
  for (let i = 0; i < 5; i++) mark(b.s, 'straw', rng.range(1, b.w - 4), rng.range(2, b.h - 4), 2.4, 1.2);
  cover(b.s, rng, 'fields', b.lines, b.w, b.h, 1);
  country(b, rng, b.lines, 6);
  return b.s;
}

export function mill(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), pond = g.water.find((q) => q.deep) ?? g.water[0], left = g.spec!.layout === 'wheelleft';
  path(b.s, b.mat, b.main, 1.1), ruts3(b);
  // The mill against its pond: the wheel turning in the leat on the pond's near side.
  if (!pond) {
    // No room for its pond: the mill by the lane all the same, its wheel in the leat behind it.
    const at = offset(b.main, (left ? -1 : 1) * 4.6, 1).find((p) => p.t > 0.35 && p.x > 3 && p.x < b.w - 7 && p.y > 3 && p.y < b.h - 6);
    if (at) block(b.s, 'mill', at.x - 2.2, at.y - 1.5, 4.4, 3, { look: left ? 1 : 0 });
  } else {
    // On the pond's far side from the lane, its wheel toward the water; above it if there's no room beside.
    const cx = pond.x + pond.w / 2, cy = pond.y + pond.h / 2, lane = along(b.main, 0.5).reduce((a, p) => (Math.hypot(p.x - cx, p.y - cy) < Math.hypot(a.x - cx, a.y - cy) ? p : a));
    const right = lane.x < cx, r = Math.max(pond.w, pond.h) / 2 + 0.9;
    const cands = [[right ? pond.x + pond.w + 1.2 : pond.x - 5.6, cy - 1.5], [cx - 2.2, pond.y - 3 - r + pond.h / 2 - 0.2], [cx - 2.2, cy + r + 0.2], [right ? pond.x - 5.6 : pond.x + pond.w + 1.2, cy - 1.5]];
    const ok = ([x, y]: number[]) => x > 0.6 && y > 1 && x + 4.4 < b.w - 0.6 && y + 3 < b.h - 1.5 && boxOff(b.lines, { x, y, w: 4.4, h: 3 }) > 1.5 &&
      Math.hypot(Math.max(x, Math.min(x + 4.4, cx)) - cx, Math.max(y, Math.min(y + 3, cy)) - cy) > r - 0.3;
    const at = cands.find(ok);
    if (at) block(b.s, 'mill', at[0], at[1], 4.4, 3, { look: at[0] > cx ? 1 : 0 });
    for (let x = pond.x; x < pond.x + pond.w; x += rng.range(0.7, 1.2)) round(b.s, 'reed', x, pond.y - 0.4, 0.3);
    patch(b.s, 'mud', pond.x - 1, pond.y - 1, pond.w + 2, pond.h + 2);
  }
  // Sacks and a cart at its door, a hedge along the lane.
  scatter(b.s, rng, b.w, b.h, b.lines, 2.4, 1, (x, y) => block(b.s, 'cart', x - 1.2, y - 0.5, 2.4, 1), 3);
  bankBy(b.s, rng, b.skinAt, b.main, (left ? 1 : -1) * 2.4, b.w, b.h, (t) => t < 0.1 || t > 0.9 || rng.next() < 0.25);
  cover(b.s, rng, 'fields', b.lines, b.w, b.h, 1);
  country(b, rng, b.lines, 3.2);
  return b.s;
}

export function orchard(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), old = g.spec!.layout === 'overgrown';
  path(b.s, b.mat, b.main, 0.9);
  patch(b.s, 'grass', 1, 1, b.w - 2, b.h - 2, false);
  // Apple trees in rows (or what the rows became), the windfalls under them.
  for (let y = 2.6; y < b.h - 2.5; y += 2.6) for (let x = 2.2 + ((y / 2.6) % 2) * 1.2; x < b.w - 1.8; x += 2.8) {
    const px = x + (old ? rng.range(-0.7, 0.7) : 0), py = y + (old ? rng.range(-0.5, 0.5) : 0);
    if (offAll(b.lines, px, py) < 2 || (old && rng.next() < 0.25)) continue;
    round(b.s, 'apple', px, py, 0.5);
    if (rng.next() < 0.4) mark(b.s, 'flowers', px - 0.7, py + 0.4, 1.4, 0.5);
  }
  if (old) scatter(b.s, rng, b.w, b.h, b.lines, 1.8, 10, (x, y) => round(b.s, 'bush', x, y, 0.36), 1);
  // The press shed by the track.
  const at = offset(b.main, (rng.next() < 0.5 ? -1 : 1) * 3.6, 1).find((p) => p.t > 0.3 && p.t < 0.7 && p.x > 3 && p.x < b.w - 4 && p.y > 3 && p.y < b.h - 4);
  if (at) block(b.s, 'shack', at.x - 1.4, at.y - 0.9, 2.8, 1.8);
  return b.s;
}
