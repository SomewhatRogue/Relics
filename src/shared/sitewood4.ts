/**
 * Layout 4's rooms of the wood and the fen (docs/terrain-nodes.md 2.4, 2.5): the deep wood, old trees
 * close together and a faint path (narrow, or round a rocky rise); a glade, open grass inside the wood
 * with flowers and a spring's stream across it or a ring of trees round an old one; and the reed bed,
 * reeds everywhere off a boarded path, pools among them and a heron's stake.
 */
import { bankBy, cover, offset } from './portkit.js';
import type { Rng } from './rng.js';
import { begin3, country } from './siteopen.js';
import { scatter } from './siteskin.js';
import type { Ground } from './sites.js';
import { mark, patch, path, round, type Site } from './sitekit.js';
import { along, offAll } from './spine.js';

export function deepwood(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), rise = g.spec!.layout === 'rise';
  path(b.s, 'earth', b.main, 0.7);
  // Old trees shoulder to shoulder either side, a second row behind them, the floor all leaf and root.
  for (const d of [1.9, -1.9, 3.3, -3.3]) bankBy(b.s, rng, () => 'wood', b.main, d, b.w, b.h, (t) => t < 0.04 || t > 0.96 || rng.next() < 0.15);
  scatter(b.s, rng, b.w, b.h, b.lines, 4, 22, (x, y) => round(b.s, rng.next() < 0.55 ? 'tree' : 'pine', x, y, rng.range(0.55, 0.75)), 1.3);
  scatter(b.s, rng, b.w, b.h, b.lines, 2.4, 6, (x, y) => round(b.s, rng.next() < 0.5 ? 'stump' : 'rock', x, y, 0.35));
  for (const p of along(b.main, 2.2)) if (p.t > 0.1 && p.t < 0.9 && rng.next() < 0.5) mark(b.s, 'weeds', p.x - 1.2, p.y - 0.5, 2.4, 1);
  if (rise) {
    // A rocky rise beside the path: boulders heaped up under the trees, a dark hollow at its foot.
    const at = offset(b.main, (rng.next() < 0.5 ? -1 : 1) * 4.4, 0.5).find((p) => p.t > 0.4 && p.x > 3 && p.x < b.w - 3 && p.y > 3 && p.y < b.h - 4);
    if (at) {
      for (let i = 0; i < 8; i++) round(b.s, 'rock', at.x + rng.range(-1.8, 1.8), at.y + rng.range(-1.2, 1.2), rng.range(0.45, 0.7));
      patch(b.s, 'mud', at.x - 2.4, at.y + 0.6, 4.8, 1.6);
    }
  }
  return b.s;
}

export function glade(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), ring = g.spec!.layout === 'ring', mid = along(b.main, 0.5).find((p) => p.t >= 0.5)!;
  const cx = Math.max(7, Math.min(b.w - 7, mid.x)), cy = Math.max(6, Math.min(b.h - 7, mid.y)), rx = 6.4, ry = 4.6;
  patch(b.s, 'grass', cx - rx, cy - ry, rx * 2, ry * 2);
  path(b.s, b.mat, b.main, 0.6);
  for (let i = 0; i < 5; i++) mark(b.s, 'flowers', cx + rng.range(-rx + 1, rx - 3), cy + rng.range(-ry + 1, ry - 1.5), 2.4, 1);
  // The wood round it, close and dark; open wherever a path comes in or goes out.
  for (let a = 0; a < Math.PI * 2; a += 0.22) {
    const x = cx + Math.cos(a) * (rx + 1.2), y = cy + Math.sin(a) * (ry + 1.1);
    if (offAll(b.lines, x, y) < 2.4 || x < 0.8 || x > b.w - 0.8 || y < 0.8 || y > b.h - 1.2) continue;
    round(b.s, rng.next() < 0.6 ? 'tree' : 'pine', x, y, 0.6);
  }
  // A ring of birches round one old tree in the middle; or the spring's stream, reeds at its banks.
  if (ring) {
    for (let a = 0; a < Math.PI * 2; a += 0.7) {
      const x = cx + Math.cos(a) * 3.2, y = cy + Math.sin(a) * 2.4;
      if (offAll(b.lines, x, y) > 1.8) round(b.s, 'tree', x, y, 0.4);
    }
    if (offAll(b.lines, cx, cy) > 2.2) round(b.s, 'tree', cx, cy, 0.85);
  } else for (const q of g.water) for (const p of offset([[q.x, q.y], [q.x + q.w, q.y + q.h]], 0.9, 1.3)) if (offAll(b.lines, p.x, p.y) > 2.2 && rng.next() < 0.6) round(b.s, 'reed', p.x, p.y, 0.3);
  country(b, rng, [...b.lines, [[cx - rx, cy], [cx + rx, cy]]], ry + 1.5);
  return b.s;
}

export function reedbed(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng);
  // A path of boards over the wet, reeds standing thick everywhere else, a heron's stake in a pool.
  path(b.s, 'wet', b.main, 1), path(b.s, b.mat, b.main, 0.6);
  for (const p of along(b.main, 2)) if (p.t > 0.08 && p.t < 0.92 && rng.next() < 0.7) mark(b.s, 'planks', p.x - 0.7, p.y - 0.35, 1.4, 0.7);
  for (let t = 0; t < 140; t++) {
    const x = rng.range(0.6, b.w - 0.6), y = rng.range(0.8, b.h - 1.2);
    if (offAll(b.lines, x, y) < 1.8 || g.water.some((q) => q.deep && x > q.x && x < q.x + q.w && y > q.y && y < q.y + q.h)) continue;
    round(b.s, 'reed', x, y, 0.3);
  }
  const pool = g.water.find((q) => q.w >= 2);
  if (pool) round(b.s, 'post', pool.x + pool.w / 2, pool.y + 0.5, 0.15);
  for (let i = 0; i < 6; i++) patch(b.s, 'wet', rng.range(1, b.w - 4), rng.range(2, b.h - 4), rng.range(2, 4), rng.range(1.2, 2));
  cover(b.s, rng, 'fen', b.lines, b.w, b.h, 1);
  return b.s;
}
