/**
 * How an approach room is dressed for the country it's in (shared/nodes.ts skins): what lines a track
 * (hedges in the fields, trees in the wood, reeds in the fen, rock about the ore road, rock walls
 * underground) and what fills the ground beyond (strips of field, thicket, reed and willow, boulders
 * and spoil, rubble and pit props). Plans call these along their spine.
 */
import type { SoilMat } from './arena.js';
import type { Skin } from './nodes.js';
import type { Rng } from './rng.js';
import { block, hedge, patch, prop, round, type Site } from './sitekit.js';
import { along, laneAt, off, type Pt } from './spine.js';

/** The main path's ground for a palette's soil (grass on grass wouldn't show). */
export const pathMat = (soil: SoilMat): SoilMat => (soil === 'grass' || soil === 'straw' ? 'earth' : soil);

/** A bank along `pts` moved `dx` across, with gaps where `gap(t, x, y)` (t from 0 at the way in to 1 at the way out). */
export function bank(s: Site, rng: Rng, skin: Skin, pts: Pt[], dx: number, gap: (t: number, x: number, y: number) => boolean = () => false): void {
  const line = pts.map(([x, y]) => [x + dx, y] as Pt);
  if (skin === 'fields') {
    for (const p of along(line, 0.62)) if (!gap(p.t, p.x, p.y)) round(s, 'bush', p.x, p.y, 0.36);
  } else if (skin === 'wood') {
    for (const p of along(line, 1.5)) if (!gap(p.t, p.x, p.y) && rng.next() < 0.85) round(s, rng.next() < 0.5 ? 'tree' : 'pine', p.x + rng.range(-0.3, 0.3), p.y, rng.next() < 0.5 ? 0.6 : 0.5);
  } else if (skin === 'fen') {
    for (const p of along(line, 0.8)) if (!gap(p.t, p.x, p.y)) round(s, rng.next() < 0.12 ? 'tree' : 'reed', p.x + rng.range(-0.2, 0.2), p.y, 0.3);
  } else if (skin === 'rock') {
    for (const p of along(line, 1.1)) if (!gap(p.t, p.x, p.y) && rng.next() < 0.8) round(s, 'rock', p.x + rng.range(-0.25, 0.25), p.y, rng.range(0.4, 0.6));
  } else {
    for (const p of along(line, 3.4)) if (!gap(p.t, p.x, p.y)) block(s, 'rockwall', p.x - 0.6 + (dx > 0 ? 0.2 : -0.2), p.y - 1.4, 1.2, rng.range(2.2, 2.8));
  }
}

/** Is (x, y) clear of the spine (and the room's edge) by `d`? */
const clearOf = (lines: Pt[][], x: number, y: number, d: number) => lines.every((p) => off(p, x, y) > d);

/** The country beyond the banks, at least `d` from every line in `lines`. */
export function beyond(s: Site, rng: Rng, skin: Skin, w: number, h: number, lines: Pt[][], d: number): void {
  const main = lines[0];
  if (skin === 'fields') {
    // Strips of field either side: furrow, crop or grass, a band apiece, hay and the odd tree.
    for (let y = 0.8; y < h - 2.6; y += 3.2) for (const side of [-1, 1]) {
      const mat: SoilMat = rng.pick(['furrow', 'crop', 'grass', 'furrow'] as SoilMat[]);
      for (let yy = y; yy < Math.min(y + 3, h - 2.6); yy += 0.5) {
        const lx = laneAt(main, yy), x0 = side < 0 ? 0.4 : lx + d, x1 = side < 0 ? lx - d : w - 0.4;
        if (x1 - x0 > 0.8) patch(s, mat, x0, yy, x1 - x0, 0.5, false);
      }
    }
    scatter(s, rng, w, h, lines, d + 0.8, 7, (x, y) => round(s, rng.next() < 0.6 ? 'hay' : 'bush', x, y, rng.next() < 0.6 ? 0.55 : 0.36));
    scatter(s, rng, w, h, lines, d + 1.2, 2, (x, y) => round(s, 'tree', x, y, 0.6));
  } else if (skin === 'wood') {
    scatter(s, rng, w, h, lines, d + 0.6, 26, (x, y) => round(s, rng.next() < 0.5 ? 'tree' : 'pine', x, y, rng.next() < 0.5 ? 0.6 : 0.5), 1.7);
    scatter(s, rng, w, h, lines, d, 6, (x, y) => round(s, rng.next() < 0.7 ? 'bush' : 'stump', x, y, 0.32));
  } else if (skin === 'fen') {
    scatter(s, rng, w, h, lines, d, 14, (x, y) => round(s, 'reed', x, y, 0.3));
    scatter(s, rng, w, h, lines, d + 0.8, 5, (x, y) => (patch(s, 'earth', x - 1.4, y - 0.9, 2.8, 1.8), round(s, 'tree', x, y, 0.5)), 2.6);
    scatter(s, rng, w, h, lines, d, 3, (x, y) => round(s, 'stump', x, y, 0.3));
  } else if (skin === 'rock') {
    scatter(s, rng, w, h, lines, d + 0.4, 12, (x, y) => round(s, 'rock', x, y, rng.range(0.4, 0.7)), 1.5);
    scatter(s, rng, w, h, lines, d + 1.2, 3, (x, y) => block(s, 'rubble', x - 1.2, y - 0.6, 2.4, 1.2), 3);
    scatter(s, rng, w, h, lines, d + 0.6, 3, (x, y) => round(s, 'bush', x, y, 0.36));
  } else {
    scatter(s, rng, w, h, lines, d + 0.4, 8, (x, y) => round(s, 'rock', x, y, rng.range(0.4, 0.6)), 1.5);
    scatter(s, rng, w, h, lines, d + 1, 3, (x, y) => block(s, 'rubble', x - 1.2, y - 0.6, 2.4, 1.2), 3);
    for (const p of along(main, 4.4)) for (const sx of [-1, 1]) if (p.y > 2 && p.y < h - 3) round(s, 'support', p.x + sx * (d - 0.4), p.y, 0.3);
    for (let i = 0; i < 4; i++) patch(s, 'wet', rng.range(1, w - 3), rng.range(2, h - 4), rng.range(1.6, 3), rng.range(1, 1.6));
  }
  // The odd crate or barrel someone dropped.
  scatter(s, rng, w, h, lines, d, 2, (x, y) => prop(s, rng.next() < 0.5 ? 'crate' : 'barrel', x, y));
}

/** Put down up to `n` things, each `d` clear of the lines and `apart` from the round things already down. */
export function scatter(s: Site, rng: Rng, w: number, h: number, lines: Pt[][], d: number, n: number, put: (x: number, y: number) => void, apart = 1.1): void {
  for (let t = 0; t < n * 5 && n > 0; t++) {
    const x = rng.range(0.9, w - 0.9), y = rng.range(0.9, h - 2.6);
    if (!clearOf(lines, x, y, d) || s.rounds.some((q) => Math.hypot(q.x - x, q.y - y) < apart) || s.blocks.some((b) => x > b.x - 1 && x < b.x + b.w + 1 && y > b.y - 1 && y < b.y + b.h + 1)) continue;
    put(x, y), n--;
  }
}

/** A short hedge (or its skin's like) across a stretch, from x0 to x1 at y. */
export function across(s: Site, skin: Skin, x0: number, x1: number, y: number): void {
  if (skin === 'fields') hedge(s, x0, y, x1, y);
  else if (skin === 'fen') hedge(s, x0, y, x1, y, () => false, 'reed', 0.3);
  else if (skin === 'wood') hedge(s, x0, y, x1, y, (t) => Math.round(t * 20) % 2 === 1, 'tree', 0.5);
  else hedge(s, x0, y, x1, y, (t) => Math.round(t * 12) % 2 === 1, 'rock', 0.5);
}
