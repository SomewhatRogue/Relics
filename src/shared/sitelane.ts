/**
 * Approach rooms where people lived and worked (docs/terrain-nodes.md 2.3): a lane of cottages (a row
 * on one side with fields across, a row on both sides, or the village's end giving out into fields
 * halfway up), a farmyard (a steading with house and barns either side of the track, or barns round a
 * courtyard), and strip fields (standing grain, or stubble with the stooks still out).
 */
import type { Ground } from './sites.js';
import { bank, beyond, pathMat } from './siteskin.js';
import { block, fence, fenceDown, mark, newSite, patch, path, prop, round, type Site } from './sitekit.js';
import { laneAt, type Pt } from './spine.js';
import { cottage } from './sitevillage.js';
import type { Rng } from './rng.js';

function begin(g: Ground): { s: Site; pts: Pt[]; mat: ReturnType<typeof pathMat> } {
  const sp = g.spec!;
  return { s: newSite(sp.palette.floor, sp.palette.back), pts: g.spine![0], mat: pathMat(sp.palette.soil) };
}

export function lane(rng: Rng, g: Ground): Site {
  const { s, pts, mat } = begin(g), layout = g.spec!.layout, skin = g.spec!.skin ?? 'fields';
  path(s, mat, pts, 1.2);
  for (let y = 1; y < g.h - 2; y += 3.4) mark(s, 'ruts', laneAt(pts, y + 1.2) - 0.8, y, 1.6, 2.4);
  // Which sides have houses, and how far up: the village's end gives out into fields halfway.
  const sides = layout === 'onesided' ? [rng.next() < 0.5 ? -1 : 1] : [-1, 1], top = layout === 'villageend' ? 10 : 0;
  for (const y of [2.4, 8.8, 15.2]) {
    if (y < top) continue;
    for (const sx of sides) {
      if (rng.next() < 0.15) continue;
      const lx = laneAt(pts, y + 3.2), hx = sx < 0 ? lx - 6.9 + rng.range(-0.3, 0.2) : lx + 3.4 + rng.range(-0.2, 0.3);
      if (hx < 0.8 || hx + 4.4 > g.w - 0.6) continue;
      cottage(s, rng, hx, y, -sx, lx + sx * 1.2);
    }
  }
  // Fields across the lane from a one-sided row, and above the village's end.
  if (layout === 'onesided') bank(s, rng, skin, pts, -sides[0] * 2.4, (t) => Math.abs(t - 0.5) < 0.06);
  if (top) bank(s, rng, skin, pts.filter(([, y]) => y <= top + 2), -2.4), bank(s, rng, skin, pts.filter(([, y]) => y <= top + 2), 2.4);
  beyondFields(s, rng, g, pts, layout === 'onesided' ? -sides[0] : 0, top);
  return s;
}

/** Fields only where there are no houses: across the lane (side), or above the village's end. */
function beyondFields(s: Site, rng: Rng, g: Ground, pts: Pt[], side: number, top: number): void {
  const t: Site = { ...newSite(s.floor), soil: [], rounds: [], blocks: [], props: [], marks: [], gates: [] };
  beyond(t, rng, g.spec!.skin ?? 'fields', g.w, g.h, [pts], 3);
  const keep = (x: number, y: number) => (side ? Math.sign(x - laneAt(pts, y)) === side : y < top - 1.4);
  s.soil.push(...t.soil.filter((q) => keep(q.x + q.w / 2, q.y + q.h / 2)));
  s.rounds.push(...t.rounds.filter((q) => keep(q.x, q.y)));
  s.blocks.push(...t.blocks.filter((q) => keep(q.x + q.w / 2, q.y + q.h / 2)));
}

export function yard(rng: Rng, g: Ground): Site {
  const { s, pts, mat } = begin(g), layout = g.spec!.layout, skin = g.spec!.skin ?? 'fields', ly = rng.range(7, 10), lx = laneAt(pts, ly);
  const side = lx < g.w / 2 ? 1 : -1;
  // The yard itself, trodden and mucky, the track through it.
  patch(s, g.spec!.palette.soil === 'grass' ? 'earth' : g.spec!.palette.soil, lx - 8, ly - 4.5, 16, 10), path(s, mat, pts, 1.1);
  patch(s, 'mud', lx + side * 3, ly + 1.4, 3, 1.8), patch(s, 'straw', lx - side * 6, ly - 2.6, 4.4, 1.4);
  if (layout === 'steading') {
    // The farmhouse one side of the track, the barns across it.
    block(s, 'house', side > 0 ? lx - 6.6 : lx + 3.1, ly - 3.2, 3.5, 2), patch(s, 'furrow', side > 0 ? lx - 6.4 : lx + 3.3, ly - 5.6, 3.2, 1.8, false);
    block(s, 'barn', side > 0 ? lx + 2.6 : lx - 7.6, ly - 3.6, 5, 3);
    if (rng.next() < 0.6) block(s, 'barn', side > 0 ? lx + 3 : lx - 8, ly + 2.4, 5, 3);
  } else {
    // Barns in a U round a courtyard off the track, its mouth facing it.
    const x0 = side > 0 ? lx + 2.6 : lx - 11.2;
    block(s, 'barn', x0 + 1, ly - 4.4, 7.6, 2.6), block(s, 'barn', side > 0 ? x0 + 6.4 : x0, ly - 1.6, 2.6, 4.6);
    patch(s, 'swept', x0, ly - 1.6, 8.6, 5, false), mark(s, 'flags', x0 + 0.6, ly - 1.2, 5.6, 4);
    block(s, 'house', side > 0 ? lx - 6.4 : lx + 3, ly + 1, 3.5, 2);
  }
  prop(s, 'barrel', lx + side * 2.4, ly - 0.6), prop(s, 'oil', lx - side * 2.6, ly + 2.6), prop(s, 'crate', lx + side * 2.6, ly + 3.4);
  // The paddock below the yard, fenced, hay in it.
  const px = side > 0 ? lx - 10.2 : lx + 2.4, py = ly + 6;
  if (px > 0.6 && px + 8 < g.w - 0.6 && py + 6 < g.h - 2.5) {
    fence(s, px, py, 8, [5.2]), fence(s, px, py + 5, 8, [3]), fenceDown(s, px, py, 5), fenceDown(s, px + 8, py, 5.35, [2.2]);
    patch(s, 'mud', px + 1, py + 1.2, 5, 2.6);
    for (let i = 0; i < 3; i++) round(s, 'hay', px + 1.6 + i * 2.4, py + 2 + (i % 2) * 1.4, 0.55);
  }
  bank(s, rng, skin, pts.filter(([, y]) => y < ly - 5), 2.4), bank(s, rng, skin, pts.filter(([, y]) => y < ly - 5), -2.4);
  beyond(s, rng, skin, g.w, g.h, [pts, [[lx - 9, ly], [lx + 9, ly]], [[lx - 9, ly + 7], [lx + 9, ly + 7]]], 4.4);
  return s;
}

export function strips(rng: Rng, g: Ground): Site {
  const { s, pts, mat } = begin(g), stubble = g.spec!.layout === 'stubble';
  path(s, mat, pts, 0.95);
  // The strips: long beds running up the room either side, a grass balk between each.
  for (const side of [-1, 1]) for (let k = 0; k < 6; k++) for (let y = 0.8; y < g.h - 2.8; y += 0.5) {
    const lx = laneAt(pts, y), x = side < 0 ? lx - 3 - k * 1.9 - 1.5 : lx + 3 + k * 1.9;
    if (x > 0.4 && x + 1.5 < g.w - 0.4) patch(s, stubble ? (k % 2 ? 'grass' : 'straw') : k % 3 === 1 ? 'furrow' : 'crop', x, y, 1.5, 0.5, false);
  }
  bank(s, rng, 'fields', pts, -2.2, (t) => Math.abs(t - 0.3) < 0.05), bank(s, rng, 'fields', pts, 2.2, (t) => Math.abs(t - 0.65) < 0.05);
  // Stooks in rows on the stubble; a field shelter; a cart's tracks across.
  const n = stubble ? 12 : 4;
  for (let i = 0, t = 0; i < n && t < 60; t++) {
    const y = rng.range(1.2, g.h - 3.4), lx = laneAt(pts, y), x = rng.next() < 0.5 ? rng.range(0.9, lx - 3.4) : rng.range(lx + 3.4, g.w - 0.9);
    if (x < 0.9 || x > g.w - 0.9 || s.rounds.some((q) => Math.hypot(q.x - x, q.y - y) < 1.4)) continue;
    round(s, 'hay', x, y, stubble ? 0.4 : 0.55), i++;
  }
  const shx = rng.next() < 0.5 ? 1 : g.w - 4;
  if (Math.abs(shx + 1.5 - laneAt(pts, 14)) > 4.5) block(s, 'shack', shx, 13, 3, 1.6);
  return s;
}
