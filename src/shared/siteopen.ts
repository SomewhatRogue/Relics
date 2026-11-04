/**
 * Layout 3's open rooms (docs/terrain-nodes.md 2.2), laid along a spine that may run any way: a track
 * (wandering, S-bending, or a hollow way between banks), a crossroads (the other road crossing it, a T,
 * or two roads off it at different places), a clearing, a path through the wood, a ford. Each puts
 * cover beside the track where the fight will be, and dresses for its country.
 */
import type { SoilMat } from './arena.js';
import type { Skin } from './nodes.js';
import { bankBy, beyondBy, cover, offset } from './portkit.js';
import type { Rng } from './rng.js';
import type { Ground } from './sites.js';
import { pathMat } from './siteskin.js';
import { mark, newSite, patch, path, round, type Site } from './sitekit.js';
import { along, offAll, type Pt } from './spine.js';
import { bridgeBits } from './river.js';

export interface Begun { cut: number; s: Site; main: Pt[]; lines: Pt[][]; skin: Skin; from: Skin; mat: SoilMat; w: number; h: number; skinAt(t: number): Skin; toSide(x: number, y: number): boolean }

/** The room's spine, skins and palette, a new site painted in it, and (a transition) where one country gives way to the next. */
export function begin3(g: Ground, rng: Rng): Begun {
  const sp = g.spec!, s = newSite(sp.palette.floor, sp.palette.back), main = g.spine![0], skin = sp.skin ?? 'fields', from = sp.from ?? skin, cut = rng.range(0.4, 0.55);
  const [ax, ay] = main[0], [bx, by] = main[main.length - 1];
  const toSide = (x: number, y: number) => { const a = Math.hypot(x - ax, y - ay), b = Math.hypot(x - bx, y - by); return a / (a + b || 1) > cut; };
  return { cut, s, main, lines: g.spine!, skin, from, mat: pathMat(sp.palette.soil), w: g.w, h: g.h, skinAt: (t) => (t > cut ? skin : from), toSide };
}

/** Wheel ruts where the track runs up and down the room (they're drawn that way), not underground. */
export function ruts3(b: Begun): void {
  if (b.skin === 'under') return;
  for (const p of along(b.main, 3.4)) if (Math.abs(p.dx) < 0.45 && p.y > 1 && p.y < b.h - 2) mark(b.s, 'ruts', p.x - 0.8, p.y - 1.2, 1.6, 2.4);
}

/** The country beyond, one or (a transition) two. */
export function country(b: Begun, rng: Rng, lines: Pt[][], d: number): void {
  if (b.from === b.skin) return beyondBy(b.s, rng, b.skin, b.w, b.h, lines, d);
  const t = newSite(b.s.floor);
  for (const [skin, keep] of [[b.from, false], [b.skin, true]] as [Skin, boolean][]) {
    t.soil = [], t.rounds = [], t.blocks = [], t.props = [];
    beyondBy(t, rng, skin, b.w, b.h, lines, d);
    b.s.soil.push(...t.soil.filter((q) => b.toSide(q.x + q.w / 2, q.y + q.h / 2) === keep));
    b.s.rounds.push(...t.rounds.filter((q) => b.toSide(q.x, q.y) === keep));
    b.s.blocks.push(...t.blocks.filter((q) => b.toSide(q.x + q.w / 2, q.y + q.h / 2) === keep));
    b.s.props.push(...t.props.filter((q) => b.toSide(q.x, q.y) === keep));
  }
}

export function track3(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), l = g.spec!.layout, gate = rng.range(0.25, 0.75), side = rng.next() < 0.5 ? -1 : 1;
  path(b.s, b.mat, b.main, 1.05), ruts3(b);
  if (l === 'hedged') bankBy(b.s, rng, b.skinAt, b.main, 2.3, b.w, b.h, (t) => Math.abs(t - gate) < 0.05), bankBy(b.s, rng, b.skinAt, b.main, -2.3, b.w, b.h, (t) => t > 0.85);
  else bankBy(b.s, rng, b.skinAt, b.main, side * 2.4, b.w, b.h, (t) => Math.abs(t - gate) < 0.08 || (l === 'sbend' && t > 0.7));
  cover(b.s, rng, b.skin, b.lines, b.w, b.h, l === 'hedged' ? 1 : 2);
  country(b, rng, b.lines, l === 'hedged' ? 3.2 : 2.6);
  return b.s;
}

export function crossroads3(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), l = g.spec!.layout, pts = along(b.main, 0.5), at = (t: number) => pts.find((p) => p.t >= t) ?? pts[pts.length >> 1];
  // The other road: right across, off one side only, or two roads off it at different places.
  const ends = (p: { x: number; y: number; dx: number; dy: number }, sd: number): Pt => { let d = 0; while (d < 40 && p.x - p.dy * sd * d > 0.3 && p.x - p.dy * sd * d < b.w - 0.3 && p.y + p.dx * sd * d > 0.3 && p.y + p.dx * sd * d < b.h - 1) d += 0.5; return [p.x - p.dy * sd * d, p.y + p.dx * sd * d]; };
  const p1 = at(rng.range(0.4, 0.55)), p2 = l === 'offset' ? at(rng.range(0.62, 0.72)) : p1, one = rng.next() < 0.5 ? -1 : 1;
  const roads: Pt[][] = [];
  if (l !== 'tee' || one < 0) roads.push([[p1.x, p1.y], ends(p1, -1)]);
  if (l !== 'tee' || one > 0) roads.push([[p2.x, p2.y], ends(p2, 1)]);
  path(b.s, b.mat, b.main, 1.05), ruts3(b);
  for (const r of roads) path(b.s, b.mat, r, 0.9);
  patch(b.s, b.mat, p1.x - 2.6, p1.y - 1.8, 5.2, 3.6), patch(b.s, g.spec!.palette.soil, p1.x - 1.6, p1.y - 1.1, 3.2, 2.2);
  // Banks in the corners, kept back from both roads.
  const near = (t: number) => Math.abs(t - p1.t) < 0.14 || Math.abs(t - p2.t) < 0.14;
  bankBy(b.s, rng, b.skinAt, b.main, 2.4, b.w, b.h, near), bankBy(b.s, rng, b.skinAt, b.main, -2.4, b.w, b.h, near);
  for (const r of roads) for (const sd of [-2.2, 2.2]) bankBy(b.s, rng, () => b.skin, r, sd, b.w, b.h, (t) => t < 0.2 || Math.abs(t - 0.6) < 0.06);
  cover(b.s, rng, b.skin, [...b.lines, ...roads], b.w, b.h, 2);
  country(b, rng, [...b.lines, ...roads], 3.2);
  return b.s;
}

export function clearing3(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), l = g.spec!.layout, long = l === 'long', mid = along(b.main, 0.5).find((p) => p.t >= rng.range(0.4, 0.6))!;
  const cx = Math.max(7, Math.min(b.w - 7, mid.x + rng.range(-2, 2))), cy = Math.max(6, Math.min(b.h - 7, mid.y + rng.range(-1.5, 1.5)));
  const rx = long ? 8 : 5.6, ry = long ? 3.4 : 4.4;
  patch(b.s, 'grass', cx - rx, cy - ry, rx * 2, ry * 2), patch(b.s, b.mat, cx - rx * 0.6, cy - ry * 0.55, rx * 1.2, ry * 1.1);
  patch(b.s, 'ash', cx + rng.range(-2, 2), cy + rng.range(-1, 1), 1.6, 1.1);
  path(b.s, b.mat, b.main, 0.85);
  // Ringed by its country's growth (or rock), open wherever a track comes in or goes out.
  for (let a = 0; a < Math.PI * 2; a += b.skin === 'fields' ? 0.1 : 0.25) {
    const x = cx + Math.cos(a) * (rx + 1.4), y = cy + Math.sin(a) * (ry + 1.3), sk = b.skinAt(b.toSide(x, y) ? 1 : 0);
    if (offAll(b.lines, x, y) < 2.6 || x < 0.8 || x > b.w - 0.8 || y < 0.8 || y > b.h - 1.2) continue;
    if (sk === 'fields') round(b.s, 'bush', x, y, 0.36);
    else if (sk === 'fen') round(b.s, rng.next() < 0.3 ? 'tree' : 'reed', x, y, 0.3);
    else if (sk === 'wood') round(b.s, rng.next() < 0.5 ? 'tree' : 'pine', x, y, 0.55);
    else round(b.s, 'rock', x, y, rng.range(0.45, 0.65));
  }
  for (const q of g.water) if (!q.deep) for (const p of offset([[q.x, q.y], [q.x + q.w, q.y + q.h]], 0.9, 1.4)) if (offAll(b.lines, p.x, p.y) > 2.4 && rng.next() < 0.7) round(b.s, 'reed', p.x, p.y, 0.3);
  cover(b.s, rng, b.skin, b.lines, b.w, b.h, 1);
  country(b, rng, [...b.lines, [[cx - rx * 0.7, cy], [cx + rx * 0.7, cy]]], Math.max(3, ry + 0.6));
  round(b.s, 'stump', cx - 1.8, cy + 1.2, 0.3);
  return b.s;
}

export function woodpath3(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), l = g.spec!.layout;
  path(b.s, b.mat, b.main, 0.85);
  if (l === 'deadfall') {
    // Fallen trunks and their root plates in a tangle beside a bend: stumps, boulders and briars.
    const at = offset(b.main, (rng.next() < 0.5 ? -1 : 1) * 4.6, 0.5).find((p) => p.t > 0.45 && p.x > 3 && p.x < b.w - 3 && p.y > 3 && p.y < b.h - 4);
    if (at) {
      for (let i = 0; i < 9; i++) round(b.s, rng.pick(['stump', 'rock', 'bush'] as const), at.x + rng.range(-2.2, 2.2), at.y + rng.range(-1.6, 1.6), 0.4);
      patch(b.s, 'mud', at.x - 2.8, at.y - 2, 5.6, 4);
    }
  }
  bankBy(b.s, rng, b.skinAt, b.main, -2.2, b.w, b.h, (t) => rng.next() < 0.2 || t > 0.9), bankBy(b.s, rng, b.skinAt, b.main, 2.2, b.w, b.h, (t) => rng.next() < 0.2 || t < 0.1);
  country(b, rng, b.lines, 2.8);
  return b.s;
}

export function ford3(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), r = g.river!, down = !!r.down;
  // The worn track to the shallows and on, mud trodden out either side of the water.
  path(b.s, b.mat, b.main, 1.1);
  const box = (u: number, v: number, du: number, dv: number) => (down ? patch(b.s, 'mud', v, u, dv, du) : patch(b.s, 'mud', u, v, du, dv));
  for (const f of r.fords) box(f.x - 0.7, r.y + r.h - 0.3, f.w + 1.4, 1.6), box(f.x - 0.7, r.y - 1.3, f.w + 1.4, 1.6);
  // Reeds (or rocks) along both banks, never in a ford's mouth.
  const open = (u: number) => r.fords.some((f) => u > f.x - 1.2 && u < f.x + f.w + 1.2) || (!!r.bridge && u > r.bridge.x - 0.9 && u < r.bridge.x + r.bridge.w + 0.9);
  const len = down ? b.h : b.w, kind = b.skin === 'rock' ? 'rock' : 'reed';
  for (let u = 0.6; u < len - 0.6; u += rng.range(0.7, 1.4)) for (const v of [r.y - 0.45, r.y + r.h + 0.45]) if (!open(u)) round(b.s, kind, down ? v : u, down ? u : v + rng.range(-0.15, 0.15), kind === 'rock' ? 0.4 : 0.3);
  if (r.bridge) {
    // The old road to the broken bridge, both banks, gone to grass; the bridge's ends and its wreck below.
    const bx = r.bridge.x + r.bridge.w / 2;
    path(b.s, 'earth', [[b.main[1][0], b.main[1][1]], [bx, r.y + r.h + 0.6]], 0.9), path(b.s, 'earth', [[bx, r.y - 0.6], [b.main[b.main.length - 2][0], b.main[b.main.length - 2][1]]], 0.9);
    b.s.marks.push(...bridgeBits(r).marks);
  }
  cover(b.s, rng, b.skin, b.lines, b.w, b.h, 1);
  const across: Pt[] = down ? [[r.y + r.h / 2, 0], [r.y + r.h / 2, b.h]] : [[0, r.y + r.h / 2], [b.w, r.y + r.h / 2]];
  country(b, rng, [...b.lines, across], Math.max(2.6, r.h / 2 + 1.6));
  return b.s;
}

