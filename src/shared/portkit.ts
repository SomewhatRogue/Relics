/**
 * Dressing a layout-3 room along a spine that may run any way (shared/siteskin.ts does it for one that
 * runs bottom to top): banks set off to the side of the track by its normal, the country beyond it,
 * cover beside it, a boundary across it with one gap (a choke point), and a transition room's two
 * countries, each on its own side of the line where one gives way to the other.
 */
import type { Area } from './arena.js';
import type { Skin } from './nodes.js';
import type { Rng } from './rng.js';
import { beyond, scatter } from './siteskin.js';
import { block, fits, newSite, patch, round, type Keep, type Site } from './sitekit.js';
import { along, off, offAll, type Pt } from './spine.js';

/** A line set off `d` to the left of the way it runs (negative: to the right). */
export function offset(pts: Pt[], d: number, step = 0.5): { x: number; y: number; t: number }[] {
  return along(pts, step).map((p) => ({ x: p.x - p.dy * d, y: p.y + p.dx * d, t: p.t }));
}

/** A bank of the skin's own growth beside a track, gaps where `gap(t)`; `skinAt` for a transition's two countries. */
export function bankBy(s: Site, rng: Rng, skinAt: (t: number) => Skin, pts: Pt[], d: number, w: number, h: number, gap: (t: number) => boolean = () => false): void {
  let acc = 99;
  for (const p of offset(pts, d, 0.31)) {
    const skin = skinAt(p.t), step = skin === 'fields' ? 0.62 : skin === 'fen' ? 0.8 : skin === 'rock' ? 1.1 : skin === 'wood' ? 1.5 : 3.4;
    if ((acc += 0.31) < step) continue;
    if (gap(p.t) || p.x < 0.5 || p.x > w - 0.5 || p.y < 0.5 || p.y > h - 0.7 || off(pts, p.x, p.y) < Math.abs(d) - 0.4) continue;
    acc = 0;
    if (skin === 'fields') round(s, 'bush', p.x, p.y, 0.36);
    else if (skin === 'wood') rng.next() < 0.85 && round(s, rng.next() < 0.5 ? 'tree' : 'pine', p.x, p.y, rng.next() < 0.5 ? 0.6 : 0.5);
    else if (skin === 'fen') round(s, rng.next() < 0.12 ? 'tree' : 'reed', p.x, p.y, 0.3);
    else if (skin === 'rock') rng.next() < 0.8 && round(s, 'rock', p.x, p.y, rng.range(0.4, 0.6));
    else block(s, 'rockwall', p.x - 0.6, p.y - 0.6, 1.2, 1.2);
  }
}
const alongLen = (pts: Pt[]) => pts.slice(1).reduce((n, [x, y], i) => n + Math.hypot(x - pts[i][0], y - pts[i][1]), 0);

/** The country beyond the banks, at least `d` off every line, whichever way they run. */
export function beyondBy(s: Site, rng: Rng, skin: Skin, w: number, h: number, lines: Pt[][], d: number): void {
  if (skin === 'fields') {
    // Field plots either side: furrow, crop or grass, hay and the odd tree.
    for (let t = 0; t < 26; t++) {
      const pw = rng.range(3.5, 7), ph = rng.range(2, 3.6), x = rng.range(0.4, w - 0.4 - pw), y = rng.range(0.6, h - 2.4 - ph);
      if (offAll(lines, x + pw / 2, y + ph / 2) < d + Math.max(pw, ph) / 2) continue;
      patch(s, rng.pick(['furrow', 'crop', 'grass', 'furrow'] as const), x, y, pw, ph, false);
    }
    scatter(s, rng, w, h, lines, d + 0.8, 7, (x, y) => round(s, rng.next() < 0.6 ? 'hay' : 'bush', x, y, rng.next() < 0.6 ? 0.55 : 0.36));
    scatter(s, rng, w, h, lines, d + 1.2, 2, (x, y) => round(s, 'tree', x, y, 0.6));
  } else if (skin === 'under') {
    scatter(s, rng, w, h, lines, d + 0.4, 8, (x, y) => round(s, 'rock', x, y, rng.range(0.4, 0.6)), 1.5);
    scatter(s, rng, w, h, lines, d + 1, 3, (x, y) => block(s, 'rubble', x - 1.2, y - 0.6, 2.4, 1.2), 3);
    for (const sd of [-1, 1]) for (const p of offset(lines[0], sd * (d - 0.4), 4.4)) if (p.y > 2 && p.y < h - 3 && p.x > 1 && p.x < w - 1) round(s, 'support', p.x, p.y, 0.3);
    for (let i = 0; i < 4; i++) patch(s, 'wet', rng.range(1, w - 3), rng.range(2, h - 4), rng.range(1.6, 3), rng.range(1, 1.6));
  } else beyond(s, rng, skin, w, h, lines, d);
}

/** A transition's two countries: the one you come from near the way in, the one you go into past `at`. */
export function mixBeyond(s: Site, rng: Rng, from: Skin, to: Skin, w: number, h: number, lines: Pt[][], d: number, side: (x: number, y: number) => boolean): void {
  for (const [skin, keep] of [[from, false], [to, true]] as [Skin, boolean][]) {
    const t = newSite(s.floor);
    beyondBy(t, rng, skin, w, h, lines, d);
    s.soil.push(...t.soil.filter((q) => side(q.x + q.w / 2, q.y + q.h / 2) === keep));
    s.rounds.push(...t.rounds.filter((q) => side(q.x, q.y) === keep));
    s.blocks.push(...t.blocks.filter((q) => side(q.x + q.w / 2, q.y + q.h / 2) === keep));
    s.props.push(...t.props.filter((q) => side(q.x, q.y) === keep));
  }
}

/**
 * Cover beside the fight: hurdles, a low broken wall, a cart on its side, a spoil heap, set 2 to 4
 * tiles off the track so a fight can be taken round them (and archers have something to stand behind).
 */
export function cover(s: Site, rng: Rng, skin: Skin, lines: Pt[][], w: number, h: number, n: number): void {
  const main = lines[0];
  for (let t = 0, put = 0; t < n * 8 && put < n; t++) {
    const p = offset(main, (rng.next() < 0.5 ? -1 : 1) * rng.range(2.4, 3.8), 1)[rng.int(Math.max(1, Math.floor(alongLen(main))))];
    if (!p || p.t < 0.15 || p.t > 0.85 || p.x < 1.5 || p.x > w - 1.5 || p.y < 2 || p.y > h - 3.5 || offAll(lines, p.x, p.y) < 2.2) continue;
    if (s.rounds.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 1.4) || s.blocks.some((b) => p.x > b.x - 1.4 && p.x < b.x + b.w + 1.4 && p.y > b.y - 1.4 && p.y < b.y + b.h + 1.4)) continue;
    if (skin === 'rock' || skin === 'under') block(s, 'rubble', p.x - 1, p.y - 0.5, 2, 1);
    else if (skin === 'fields' && rng.next() < 0.4) block(s, 'wall', p.x - 0.9, p.y - 0.2, 1.8, 0.4);
    else block(s, 'hurdle', p.x - 1.1, p.y - 0.22, 2.2, 0.45);
    put++;
  }
}

/**
 * A boundary right across the way (a hedge, a palisade, a line of willows, a rock spine) at `t` along
 * the track, with one gap where the track goes through it: the choke point a fight turns on.
 */
export function across(s: Site, rng: Rng, kind: 'hedge' | 'palisade' | 'willow' | 'rock', pts: Pt[], t: number, w: number, h: number, gap = 1.1): Pt {
  const p = along(pts, 0.25).find((q) => q.t >= t) ?? along(pts, 0.25)[0], nx = -p.dy, ny = p.dx;
  for (let d = -40; d <= 40; d += kind === 'hedge' ? 0.6 : kind === 'palisade' ? 0.5 : 0.9) {
    const x = p.x + nx * d, y = p.y + ny * d;
    if (Math.abs(d) < gap || x < 0.4 || x > w - 0.4 || y < 0.4 || y > h - 0.8) continue;
    if (kind === 'hedge') round(s, 'bush', x, y, 0.36);
    else if (kind === 'palisade') Math.abs(nx) > Math.abs(ny) ? block(s, 'fence', x - 0.25, y - 0.18, 0.5, 0.35) : block(s, 'fence', x - 0.18, y - 0.25, 0.35, 0.5);
    else if (kind === 'willow') round(s, rng.next() < 0.6 ? 'tree' : 'reed', x, y, 0.45);
    else round(s, 'rock', x, y, rng.range(0.45, 0.6));
  }
  return [p.x, p.y];
}

/** Is a box clear of the keep (the room's ways and spots)? For things placed after the plan. */
export const clearBox = (k: Keep, a: Area) => fits(k, a.x + a.w / 2, a.y + a.h / 2, Math.max(a.w, a.h) / 2);
