/**
 * The places out of doors: a wood (a winding path, a clearing, the trees thick round it; Hangman's Wood
 * keeps its gallows), a mine (a gallery walled in rock, a cart track down it, pit props, side chambers
 * of ore and stores), a riverbank with its sheep pens and the track down to the fords, the peat
 * cuttings (water in rows, the turf stacked on the baulks, boards across the mud), a willow carr.
 */
import type { Water } from './arena.js';
import type { Ground } from './sites.js';
import { block, fence, fenceDown, hedge, mark, newSite, patch, path, prop, round, type Site } from './sitekit.js';
import type { Rng } from './rng.js';
import { off } from './spine.js';

/** Trees scattered thick, kept off the path, out of the clearing and apart from each other. */
function thicket(s: Site, rng: Rng, g: Ground, pts: [number, number][], clear: { x: number; y: number; r: number }[], n: number): void {
  for (let t = 0; t < n * 4 && n > 0; t++) {
    const x = rng.range(0.8, g.w - 0.8), y = rng.range(0.8, g.h - 2.6), r = rng.next() < 0.5 ? 0.6 : 0.5;
    if (off(pts, x, y) < 2.2 || clear.some((c) => Math.hypot(c.x - x, c.y - y) < c.r) || s.rounds.some((q) => Math.hypot(q.x - x, q.y - y) < 1.7)) continue;
    round(s, r > 0.55 ? 'tree' : 'pine', x, y, r), n--;
  }
}

export function wood(rng: Rng, g: Ground): Site {
  const s = newSite('grass', 'trees'), M = g.w / 2, H = g.h, cx = M + rng.range(-3, 3), cy = rng.range(9, 13), d = g.dress ?? rng;
  const pts: [number, number][] = [[M, H], [M - 2, 18.5], [cx, cy], [M + 1.6, 5.5], [M, 0]];
  path(s, 'earth', pts, 0.9);
  // The clearing: trodden, an old fire's ash, a log to sit on; in Hangman's Wood, the gallows.
  patch(s, 'earth', cx - 3.6, cy - 2.6, 7.2, 5.2), patch(s, 'ash', cx + 1, cy - 0.4, 1.6, 1.1);
  if (g.name === "Hangman's Wood") block(s, 'gallows', cx + (cx < M ? -4.2 : 1.6), cy - 1.6, 3, 1), mark(s, 'blood', cx + (cx < M ? -3.4 : 2.6), cy, 1.2, 0.6);
  else round(s, 'deadtree', cx + (cx < M ? -3 : 3), cy - 1.2, 0.45);
  round(s, 'stump', cx - 1.6, cy + 1.4, 0.3);
  thicket(s, d, g, pts, [{ x: cx, y: cy, r: 4.4 }], 30);
  for (let i = 0; i < 8; i++) round(s, d.next() < 0.7 ? 'bush' : 'rock', d.range(1, g.w - 1), d.range(1, H - 3), 0.36);
  for (let i = 0; i < 4; i++) round(s, 'stump', d.range(1, g.w - 1), d.range(1, H - 3), 0.3);
  mark(s, 'weeds', 0, 0, g.w, 0.6);
  return s;
}

export function mine(rng: Rng, g: Ground): Site {
  const s = newSite('rock', 'rockface'), M = g.w / 2, H = g.h, d = g.dress ?? rng;
  // The gallery: rock walls down both sides with openings into the side chambers; a cart track; pit props.
  mark(s, 'ruts', M - 0.8, 0.3, 1.6, H - 0.6), patch(s, 'mud', M - 2, 6, 4, 2), patch(s, 'wet', M + 1, 15, 2.4, 1.4);
  for (const wx of [4.4, g.w - 5.6]) for (let y = 0.4; y < H - 3; y += 6.2) block(s, 'rockwall', wx, y, 1.2, rng.range(3.4, 4.4));
  for (let y = 3; y < H - 3; y += 4.4) for (const sx of [-1, 1]) round(s, 'support', M + sx * 2.5, y, 0.3);
  block(s, 'cart', M + 3.2, d.range(6, 12), 2.4, 1.2);
  // The chambers: ore heaped, stores, a spoil heap.
  for (const x0 of [0.6, g.w - 4]) {
    for (let i = 0; i < 3; i++) round(s, 'rock', x0 + d.range(0.6, 2.8), d.range(1.5, H - 4), 0.5);
    prop(s, d.next() < 0.5 ? 'crate' : 'oil', x0 + 1.6, d.range(2, H - 5));
    block(s, 'rubble', x0 + 0.4, d.range(4, H - 6), 2.4, 1.2);
  }
  prop(s, 'oil', M - 3.8, 18), prop(s, 'crate', M + 3.8, 3.4);
  return s;
}

export function sheepwash(rng: Rng, g: Ground): Site {
  const s = newSite('grass', 'trees'), M = g.w / 2, H = g.h, deep = g.water.filter((w) => w.deep), fords = g.water.filter((w) => !w.deep), d = g.dress ?? rng;
  const ry = deep[0]?.y ?? 10, rh = deep[0]?.h ?? 2.6;
  // Tracks down to the fords and on up the far side to the way on.
  for (const f of fords) path(s, 'earth', [[M, H], [f.x + f.w / 2, ry + rh + 2], [f.x + f.w / 2, ry - 1.5], [M, 0]], 0.9), patch(s, 'mud', f.x - 0.6, ry + rh - 0.2, f.w + 1.2, 1.4);
  // Reeds along both banks, but not in the way of a ford.
  for (let x = 0.6; x < g.w - 0.6; x += d.range(0.8, 1.6)) for (const y of [ry - 0.5, ry + rh + 0.5]) {
    if (fords.some((f) => x > f.x - 1 && x < f.x + f.w + 1)) continue;
    round(s, 'reed', x, y + d.range(-0.2, 0.2), 0.3);
  }
  // Sheep pens on the near bank, a shepherd's hut, the wool sacked; trees on the far side.
  for (const px of [1.4, g.w - 6.4]) {
    const py = Math.min(ry + rh + 2.2 + d.range(0, 1.5), H - 7.2);
    if (py < ry + rh + 1.4) continue;
    fence(s, px, py, 4.6, [1.6]), fence(s, px, py + 3, 4.6), fenceDown(s, px, py, 3.35), fenceDown(s, px + 4.6, py, 3.35);
    patch(s, 'mud', px + 0.6, py + 0.6, 3.4, 2);
  }
  block(s, 'house', M + 4, H - 5.4, 3.5, 2), prop(s, 'crate', M + 2.9, H - 4.4);
  for (let x = 1.4; x < g.w - 1; x += d.range(2.4, 4)) if (Math.abs(x - M) > 2.6) round(s, d.next() < 0.6 ? 'tree' : 'bush', x, d.range(1.2, Math.max(1.4, ry - 2.4)), 0.5);
  return s;
}

/** The peat cuttings: water standing in rows of oblong pits either side of the way through. */
export function peatWater(rng: Rng, w: number, h: number): Water[] {
  const out: Water[] = [], M = w / 2;
  for (const x0 of [1.2, M + 3]) for (let y = 2.4; y < h - 5; y += 3.3) {
    if (rng.next() < 0.2) continue;
    out.push({ x: x0 + rng.range(0, 1.2), y, w: rng.range(3.4, 5.2), h: 1.6, deep: rng.next() < 0.3 });
  }
  return out;
}

export function peat(rng: Rng, g: Ground): Site {
  const s = newSite('mud', 'trees'), M = g.w / 2, H = g.h, d = g.dress ?? rng;
  path(s, 'earth', [[M, H], [M + rng.range(-1, 1), 12], [M, 0]], 1);
  // Boards laid across the soft ground, turf stacked to dry on the baulks, a cutter's shack.
  for (let y = 4; y < H - 4; y += 4.4) mark(s, 'planks', M - 1.6, y, 3.2, 0.5);
  for (const w of g.water) {
    patch(s, 'wet', w.x - 0.4, w.y - 0.3, w.w + 0.8, w.h + 0.6, false);
    if (rng.next() < 0.7) round(s, 'peat', w.x + rng.range(0.6, w.w - 0.6), w.y + w.h + 0.8, 0.4);
  }
  for (let i = 0; i < 10; i++) round(s, 'reed', d.range(0.6, g.w - 0.6), d.range(1, H - 3), 0.3);
  block(s, 'shack', d.next() < 0.5 ? 0.8 : g.w - 4, H - 5, 3, 1.6), prop(s, 'crate', M + 3, H - 4.2);
  hedge(s, 0.6, 0.8, g.w - 0.6, 0.8, (t) => Math.abs(t - 0.5) < 0.12, 'reed', 0.3);
  return s;
}

export function carr(rng: Rng, g: Ground): Site {
  const s = newSite('mud', 'trees'), M = g.w / 2, H = g.h, d = g.dress ?? rng;
  // A causeway of trodden earth through it; willows on the hummocks, reeds round the pools.
  path(s, 'earth', [[M, H], [M + rng.range(-1.5, 1.5), 15], [M + rng.range(-1.5, 1.5), 7], [M, 0]], 1);
  for (const w of g.water) for (let i = 0; i < 4; i++) round(s, 'reed', w.x + d.range(0, w.w), d.next() < 0.5 ? w.y - 0.4 : w.y + w.h + 0.4, 0.3);
  for (let i = 0; i < 7; i++) {
    const x = rng.range(1.4, g.w - 1.4), y = rng.range(1.4, H - 4);
    if (g.water.some((w) => x > w.x - 1.4 && x < w.x + w.w + 1.4 && y > w.y - 1.4 && y < w.y + w.h + 1.4)) continue;
    patch(s, 'earth', x - 1.5, y - 1, 3, 2);
    round(s, rng.next() < 0.6 ? 'deadtree' : 'tree', x, y, 0.45), round(s, 'stump', x + 1, y + 0.6, 0.3);
  }
  return s;
}
