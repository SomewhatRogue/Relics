/**
 * Approach rooms out on the road (docs/terrain-nodes.md 2.2): a track between its banks (bending,
 * S-bending, or hedged in), a crossroads (four ways, a T, or two tracks off it at different heights),
 * a clearing (round, long, or with a stream through), and in the wood a path winding through the
 * trees or round a deadfall. All lay their path along the room's spine and dress for its skin.
 */
import type { Ground } from './sites.js';
import { across, bank, beyond, pathMat, scatter } from './siteskin.js';
import { mark, newSite, patch, path, round, type Site } from './sitekit.js';
import { along, laneAt, type Pt } from './spine.js';
import type { Rng } from './rng.js';

/** The room's spine, skin and palette, and a new site painted in it. */
function begin(g: Ground): { s: Site; pts: Pt[]; skin: NonNullable<NonNullable<Ground['spec']>['skin']>; mat: ReturnType<typeof pathMat> } {
  const sp = g.spec!, s = newSite(sp.palette.floor, sp.palette.back);
  return { s, pts: g.spine![0], skin: sp.skin ?? 'fields', mat: pathMat(sp.palette.soil) };
}

/** Wheel ruts down a path, in short runs (not underground). */
function ruts(s: Site, pts: Pt[]): void {
  for (const p of along(pts, 3.4)) if (Math.abs(p.dx) < 0.45 && p.y > 1 && p.y < 22) mark(s, 'ruts', p.x - 0.8, p.y - 1.2, 1.6, 2.4);
}

/** Verges of the palette's own ground beside a path. */
function verges(s: Site, rng: Rng, g: Ground, pts: Pt[]): void {
  const soil = g.spec!.palette.soil;
  if (soil === pathMat(soil)) return;
  for (const p of along(pts, 2.6)) if (rng.next() < 0.6) patch(s, soil, p.x + (rng.next() < 0.5 ? -2.6 : 1.2), p.y - 0.8, 1.4, 1.6);
}

export function track(rng: Rng, g: Ground): Site {
  const { s, pts, skin, mat } = begin(g), layout = g.spec!.layout;
  path(s, mat, pts, 1.05), verges(s, rng, g, pts);
  if (skin !== 'under') ruts(s, pts);
  // Hedged in: banks both sides, a gate or a gap here and there. Otherwise a bank on one side, broken.
  const gate = rng.range(0.25, 0.75), gate2 = rng.range(0.15, 0.85), side = rng.next() < 0.5 ? -1 : 1;
  if (layout === 'hedged') {
    bank(s, rng, skin, pts, -2.3, (t) => Math.abs(t - gate) < 0.05);
    bank(s, rng, skin, pts, 2.3, (t) => Math.abs(t - gate2) < 0.05);
  } else bank(s, rng, skin, pts, side * 2.4, (t) => Math.abs(t - gate) < 0.08 || (layout === 'sbend' && t > 0.7));
  beyond(s, rng, skin, g.w, g.h, [pts], layout === 'hedged' ? 3.2 : 2.6);
  return s;
}

export function crossroads(rng: Rng, g: Ground): Site {
  const { s, pts, skin, mat } = begin(g), layout = g.spec!.layout, ty = rng.range(9.5, 13.5), lx = laneAt(pts, ty);
  // The other road: right across, off to one side only, or off both sides at different heights.
  const sideOnly = rng.next() < 0.5 ? -1 : 1, ty2 = layout === 'offset' ? Math.min(g.h - 5, ty + rng.range(3.6, 5)) : ty;
  const roads: Pt[][] = [];
  if (layout !== 'tee' || sideOnly < 0) roads.push([[0.2, ty], [lx, ty]]);
  if (layout !== 'tee' || sideOnly > 0) roads.push([[laneAt(pts, ty2), ty2], [g.w - 0.2, ty2]]);
  path(s, mat, pts, 1.05);
  for (const r of roads) path(s, mat, r, 0.9);
  // Trampled earth where they meet, wheel ruts through it.
  patch(s, mat, lx - 2.6, ty - 1.8, 5.2, 3.6), patch(s, g.spec!.palette.soil, lx - 1.6, ty - 1.1, 3.2, 2.2);
  if (skin !== 'under') ruts(s, pts);
  // Banks in the four corners, kept back from both roads.
  const near = (_t: number, _x: number, y: number) => Math.abs(y - ty) < 2.6 || Math.abs(y - ty2) < 2.6;
  bank(s, rng, skin, pts, -2.4, near), bank(s, rng, skin, pts, 2.4, near);
  for (const r of roads) {
    const y = r[0][1], l = laneAt(pts, y), west = r[0][0] < l, x0 = west ? 0.6 : l + 3, x1 = west ? l - 3 : g.w - 0.6;
    if (x1 - x0 > 1) across(s, skin, x0, x1, y - 2.2), across(s, skin, x0, x1, y + 2.2);
  }
  beyond(s, rng, skin, g.w, g.h, [pts, ...roads], 3.2);
  return s;
}

/** The clearing's middle, size, and what it's ringed by. */
export function clearing(rng: Rng, g: Ground): Site {
  const { s, pts, skin, mat } = begin(g), layout = g.spec!.layout, long = layout === 'long';
  const cy = layout === 'stream' ? rng.range(8, 10.5) : rng.range(9, 13), cx = Math.max(7, Math.min(g.w - 7, laneAt(pts, cy) + rng.range(-2.5, 2.5)));
  const rx = long ? 8 : 5.6, ry = long ? 3.4 : 4.4;
  patch(s, 'grass', cx - rx, cy - ry, rx * 2, ry * 2), patch(s, mat, cx - rx * 0.6, cy - ry * 0.55, rx * 1.2, ry * 1.1);
  patch(s, 'ash', cx + rng.range(-2, 2), cy + rng.range(-1, 1), 1.6, 1.1);
  path(s, mat, pts, 0.85);
  // Ringed by its skin's growth (or rock), open where the path comes in and goes out.
  const ring: Pt[] = [];
  for (let a = 0; a < Math.PI * 2; a += 0.05) ring.push([cx + Math.cos(a) * (rx + 1.4), cy + Math.sin(a) * (ry + 1.3)]);
  for (const [x, y] of ring.filter((_, i) => i % (skin === 'fields' ? 2 : 5) === 0)) {
    if (Math.abs(x - laneAt(pts, y)) < 2.6 || x < 0.8 || x > g.w - 0.8 || y < 0.8 || y > g.h - 2.6) continue;
    if (skin === 'fields') round(s, 'bush', x, y, 0.36);
    else if (skin === 'fen') round(s, rng.next() < 0.3 ? 'tree' : 'reed', x, y, 0.3);
    else if (skin === 'wood') round(s, rng.next() < 0.5 ? 'tree' : 'pine', x, y, 0.55);
    else round(s, 'rock', x, y, rng.range(0.45, 0.65));
  }
  // A stream: the frame's shallow water below the clearing; reeds by it, the path wading it.
  for (const w of g.water) if (!w.deep) for (let x = 0.8; x < g.w - 0.8; x += rng.range(1, 2)) if (Math.abs(x - laneAt(pts, w.y)) > 2.4) round(s, 'reed', x, w.y + (rng.next() < 0.5 ? -0.45 : w.h + 0.45), 0.3);
  beyond(s, rng, skin, g.w, g.h, [pts, [[cx - rx * 0.7, cy], [cx + rx * 0.7, cy]]], Math.max(3, ry + 0.6));
  round(s, 'stump', cx - 1.8, cy + 1.2, 0.3);
  return s;
}

export function woodpath(rng: Rng, g: Ground): Site {
  const { s, pts, skin, mat } = begin(g), layout = g.spec!.layout;
  path(s, mat, pts, 0.85), verges(s, rng, g, pts);
  if (layout === 'deadfall') {
    // Fallen trunks and their root plates in a tangle beside a bend: stumps, boulders and briars.
    const at = along(pts, 1).find((p) => p.t > 0.45)!, sx = at.x < g.w / 2 ? 1 : -1, cx = at.x + sx * 4.6, cy = at.y;
    for (let i = 0; i < 9; i++) round(s, rng.pick(['stump', 'rock', 'bush'] as const), cx + rng.range(-2.2, 2.2), cy + rng.range(-1.6, 1.6), 0.4);
    patch(s, 'mud', cx - 2.8, cy - 2, 5.6, 4);
  }
  bank(s, rng, skin, pts, -2.2, (t) => rng.next() < 0.2 || t > 0.9), bank(s, rng, skin, pts, 2.2, (t) => rng.next() < 0.2 || t < 0.1);
  beyond(s, rng, skin, g.w, g.h, [pts], 2.8);
  scatter(s, rng, g.w, g.h, [pts], 1.8, 5, (x, y) => round(s, 'stump', x, y, 0.3));
  mark(s, 'weeds', 0, 0, g.w, 0.6);
  return s;
}
