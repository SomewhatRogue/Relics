/**
 * The built-up places: a better-off street (stone houses in terraces on a cobbled street with its
 * gutters, a walled garden, a merchant's courtyard, a fountain or a market cross where it widens, stalls
 * at the bottom, a gatehouse at the top), a manor's grounds (the hall's burned front, the gravel drive
 * between statues, a walled garden with its parterre, the stable court, gate piers), and a village gone to
 * ruin (broken walls where the houses were, the old market's columns, rubble and weeds).
 */
import type { Ground } from './sites.js';
import { block, fence, fenceDown, hedge, line, mark, newSite, patch, path, prop, round, type Site } from './sitekit.js';
import type { Rng } from './rng.js';

/** A walled enclosure, its walls broken by a gate in the side facing `gate` and one in the bottom. */
function walled(s: Site, x: number, y: number, w: number, h: number, gate: 'left' | 'right'): void {
  fence(s, x, y, w, [], 'wall', 0.5), fence(s, x, y + h - 0.5, w, [w / 2 - 0.8], 'wall', 0.5);
  fenceDown(s, x, y + 0.5, h - 1, gate === 'left' ? [h / 2 - 1.2] : [], 'wall', 0.5);
  fenceDown(s, x + w - 0.5, y + 0.5, h - 1, gate === 'right' ? [h / 2 - 1.2] : [], 'wall', 0.5);
}

export function street(rng: Rng, g: Ground): Site {
  const s = newSite('cobble', 'stone'), M = g.w / 2, H = g.h, d = g.dress ?? rng;
  // Gutters down both sides of the street, worn earth in the middle; muddy yards behind the terraces.
  mark(s, 'gutter', M - 2.7, 0.3, 0.3, H - 0.6), mark(s, 'gutter', M + 2.4, 0.3, 0.3, H - 0.6);
  line(s, 'earth', M, H, M, 0, 0.6);
  patch(s, 'mud', 0.4, 0.2, M - 3.6, 2.6, false), patch(s, 'mud', M + 3, 0.2, M - 3.4, 2.6, false);
  // Terraces of stone, front doors on the street.
  for (const y of [3, 13.4]) for (let i = 0; i < 3; i++) {
    if (d.next() < 0.1) continue;
    block(s, 'house', 0.8 + i * 3.4, y, 3.3, 2.2, { style: 'stone' });
    block(s, 'house', M + 3 + i * 3.4, y, 3.3, 2.2, { style: 'stone' });
  }
  // The walled garden on one side, a merchant's courtyard on the other.
  const left = rng.next() < 0.5, gx = left ? 0.8 : M + 4.2, cx = left ? M + 3.4 : 0.6;
  walled(s, gx, 6.9, 8.4, 5.6, left ? 'right' : 'left');
  patch(s, 'grass', gx + 0.6, 7.5, 7.2, 4.4, false);
  for (let i = 0; i < 3; i++) round(s, 'bush', gx + 1.5 + i * 2.6, 8.6, 0.36);
  round(s, 'tree', gx + (left ? 1.6 : 6.8), 10.6, 0.6), block(s, 'bench', gx + 3.2, 10.6, 2, 0.5);
  patch(s, 'swept', cx, 6.8, 9.6, 5.8, false), mark(s, 'flags', cx + 0.6, 7.2, 8.4, 4.8);
  block(s, 'barn', cx + (left ? 4.2 : 0.4), 6.8, 5, 3), round(s, 'well', cx + (left ? 1.8 : 7.6), 10.8, 0.5);
  prop(s, 'crate', cx + 4.4, 11.2), prop(s, 'barrel', cx + 5.4, 11.4), prop(s, 'oil', cx + 1.4, 7.4);
  // Where the street widens: a fountain or the market cross.
  if (rng.next() < 0.5) round(s, 'fountain', left ? M + 2.8 : M - 2.8, 10, 0.8);
  else round(s, 'cross', left ? M + 2.2 : M - 2.2, 10, 0.4);
  // Stalls at the bottom of the street, and the gatehouse round the way on at the top.
  for (const x of [1.4, 5, M + 4, M + 7.6]) if (d.next() < 0.7) block(s, 'stall', x, 18.2, 3, 1.4), prop(s, 'crate', x + 1.5, 20.2);
  if (!g.fork) s.gates.push({ kind: 'wall', x: M - 4.7, y: 0, w: 3.1, h: 1.3 }, { kind: 'wall', x: M + 1.6, y: 0, w: 3.1, h: 1.3 });
  return s;
}

export function manor(rng: Rng, g: Ground): Site {
  const s = newSite('grass', 'stone'), M = g.w / 2, H = g.h, d = g.dress ?? rng;
  // The gravel drive and its turning circle; the hall's front, burned, either side of the way on.
  line(s, 'swept', M, H, M, 0, 1.5), patch(s, 'swept', M - 4.5, 3.4, 9, 4.6);
  block(s, 'hall', M - 7.6, 0.3, 5.2, 3.2, { worn: true }), block(s, 'hall', M + 2.4, 0.3, 5.2, 3.2, { worn: true });
  for (const y of [8.6, 12.4, 16.2]) for (const sx of [-1, 1]) if (rng.next() < 0.75) round(s, 'statue', M + sx * 2.7, y, 0.45);
  // The walled garden: a parterre of low hedges round a fountain.
  const gx = 0.8, gy = 5.8;
  walled(s, gx, gy, 9.2, 9.6, 'right');
  patch(s, 'grass', gx + 0.5, gy + 0.5, 8.2, 8.6, false);
  for (const [x, y] of [[1.6, 7.4], [6, 7.4], [1.6, 12.6], [6, 12.6]]) hedge(s, gx + x, gy - 5.8 + y, gx + x + 2.2, gy - 5.8 + y);
  round(s, 'fountain', gx + 4.6, gy + 4.4, 0.8), path(s, 'swept', [[gx + 4.6, gy + 9.4], [gx + 4.6, gy + 5.4]], 0.5);
  // The stable court across the drive.
  const cx = M + 4.4;
  patch(s, 'swept', cx, 5.6, g.w - cx - 0.6, 9, false), mark(s, 'flags', cx + 0.4, 9.2, g.w - cx - 1.4, 5);
  block(s, 'barn', cx + 2.4, 5.8, 5, 3), round(s, 'well', cx + 1.2, 11.6, 0.5), block(s, 'cart', cx + 4.6, 12.4, 2.8, 1.2);
  prop(s, 'barrel', cx + 0.8, 9.2), prop(s, 'crate', g.w - 1.2, 9.6);
  // Lawns going to seed, old trees, a broken colonnade near the gate, the gate piers.
  for (const x of [2, 5.4, g.w - 2.2, g.w - 5.6]) round(s, 'tree', x + d.range(-0.5, 0.5), d.range(17.5, 19.5), 0.6);
  for (let y = 17.6; y < 21; y += 1.6) for (const sx of [-1, 1]) round(s, d.next() < 0.7 ? 'pillar' : 'stone', M + sx * 3.4, y, 0.4);
  s.gates.push({ kind: 'wall', x: M - 6, y: 22.3, w: 2.2, h: 1 }, { kind: 'wall', x: M + 3.8, y: 22.3, w: 2.2, h: 1 });
  mark(s, 'weeds', 0, H - 0.8, g.w, 0.7);
  return s;
}

export function ruinvillage(rng: Rng, g: Ground): Site {
  const s = newSite('grass', 'stone'), M = g.w / 2, H = g.h, d = g.dress ?? rng;
  // The old lane, gone to grass in places.
  path(s, 'earth', [[M, H], [M + d.range(-1, 1), 12], [M, 0]], 1.2);
  for (let i = 0; i < 4; i++) patch(s, 'grass', M - 1.4 + d.range(-0.5, 0.5), d.range(1, H - 3), 2.8, 1.6);
  // Where the houses stood: a back wall, a side, a bit of front, the floor's flags, rubble.
  for (const y of [1.6, 8.2, 15]) for (const sx of [-1, 1]) {
    if (d.next() < 0.15) continue;
    const fx = sx < 0 ? M - 7.6 + d.range(-0.4, 0.4) : M + 3 + d.range(-0.4, 0.4);
    mark(s, 'flags', fx + 0.4, y + 0.5, 3.4, 2.2), mark(s, 'weeds', fx, y, 4.2, 3);
    block(s, 'wall', fx, y, d.range(2.4, 4.2), 0.5);
    if (d.next() < 0.7) block(s, 'wall', d.next() < 0.5 ? fx : fx + 3.7, y + 0.5, 0.5, d.range(1.2, 2.4));
    if (d.next() < 0.5) block(s, 'wall', fx, y + 2.6, 1.4, 0.5);
    if (d.next() < 0.6) block(s, 'rubble', fx + 1.6, y + 1.3, 1.6, 1);
  }
  // The old market: columns round it, a statue still standing or fallen.
  for (const sx of [-1, 1]) for (let y = 10.2; y < 15; y += 2.2) if (rng.next() < 0.8) round(s, 'pillar', M + sx * 2.9, y, 0.45);
  round(s, rng.next() < 0.6 ? 'statue' : 'cross', M + (rng.next() < 0.5 ? -4.6 : 4.6), 13, 0.45);
  for (let i = 0; i < 6; i++) round(s, 'stone', d.range(1, g.w - 1), d.range(1, H - 3), 0.35);
  for (let i = 0; i < 3; i++) round(s, d.next() < 0.5 ? 'deadtree' : 'bush', d.range(1, g.w - 1), d.range(1, H - 4), 0.4);
  prop(s, 'crate', 2, H - 4), prop(s, 'barrel', g.w - 2, H - 4.5), prop(s, 'oil', g.w - 2.6, 7);
  return s;
}
