/**
 * The Doorkeepers' ground in the Deep, in the flat view (shared/sealarena.ts): the sealed door set into the
 * back wall. A recess cut in the rock, a slab of grey stone in it bound with three iron straps and great
 * rivets, a bar across its middle chained at either end, old gouges on our side of it where something tried
 * it, and no light under it: a draught now and then lifts the dust at its foot. Blank stone, no mark or
 * crest. It never opens. Drawing only (lore keeper 2026-11-11).
 */
import type { GameMap } from '../shared/arena';
import type { Ctx } from './draw';
import { OX, OY, PX } from './world';

type Item = { y: number; draw: () => void };
const ROCK_LO = '#1a1820', ROCK = '#2e2b36', SLAB = '#4c4a56', SLAB_HI = '#6a6876', SLAB_LO = '#36343f';
const IRON = '#3e3a38', IRON_HI = '#7a746c', RUST = '#6a4230', CHAIN = '#58545e';
const fill = (g: CanvasRenderingContext2D, col: string, x: number, y: number, w: number, h: number) => ((g.fillStyle = col), g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)));

/** The sealed door as a ground item (drawn before anyone, so the pair and the chest stand in front of it). */
export function sealScene(map: GameMap, c: Ctx, cx: number, cy: number, items: Item[]): void {
  const s = map.sealed;
  if (!s) return;
  items.push({ y: -1e6 + 3, draw: () => drawSealed(c, OX + s.x * PX - cx, OY + 0.7 * PX - cy, s.w * PX) });
}

function drawSealed(c: Ctx, x: number, foot: number, w: number): void {
  const g = c.lit, h = 34, top = foot - h;
  // The recess cut into the rock, a step deeper at the top.
  fill(g, ROCK_LO, x - 3, top - 4, w + 6, h + 4);
  fill(g, ROCK, x - 3, top - 4, w + 6, 2), fill(g, ROCK, x - 3, top - 2, 2, h + 2), fill(g, ROCK, x + w + 1, top - 2, 2, h + 2);
  // The slab.
  fill(g, SLAB, x, top, w, h);
  fill(g, SLAB_HI, x, top, w, 1), fill(g, SLAB_HI, x, top, 1, h), fill(g, SLAB_LO, x + w - 1, top, 1, h), fill(g, SLAB_LO, x, foot - 2, w, 2);
  // Three iron straps across it, rivets along each.
  for (const dy of [6, 16, 26]) {
    fill(g, IRON, x - 1, top + dy, w + 2, 3), fill(g, IRON_HI, x - 1, top + dy, w + 2, 1), fill(g, RUST, x + w * 0.3, top + dy + 2, w * 0.2, 1);
    for (let rx = x + 3; rx < x + w - 2; rx += 7) fill(g, IRON_HI, rx, top + dy + 1, 1, 1);
  }
  // The bar across its middle, chained to a ring at either side.
  const by = top + 13;
  fill(g, IRON, x - 6, by, w + 12, 4), fill(g, IRON_HI, x - 6, by, w + 12, 1);
  for (const ex of [x - 7, x + w + 5]) {
    fill(g, IRON_HI, ex, by - 1, 3, 6), fill(g, ROCK_LO, ex + 1, by + 1, 1, 2);
    // (Its chain hanging from the ring.)
    for (let k = 0; k < 4; k++) fill(g, k % 2 ? IRON : CHAIN, ex + 1, by + 6 + k * 2, 2, 2);
  }
  // Old gouges where something tried it: short slanted scores, low on the slab.
  for (const [gx, gy, n] of [[0.2, 21, 3], [0.62, 23, 4], [0.45, 9, 2]] as const) {
    for (let k = 0; k < n; k++) for (let j = 0; j < 4; j++) fill(g, SLAB_LO, x + w * gx + k * 2 + j, top + gy + j, 1, 1);
  }
  // No light under it (lore keeper): a draught. Now and then the dust at its foot lifts and drifts out a little.
  const t = c.now, gust = Math.max(0, Math.sin(t * 0.5) * Math.sin(t * 1.3));
  if (gust > 0.2) for (let k = 0; k < 6; k++) {
    const ph = (t * 0.8 + k * 0.37) % 1, dx = (k * 0.17 + 0.08) * w, lift = ph * 5 * gust;
    fill(g, k % 2 ? '#5a5664' : '#6e6a78', x + dx + ph * 3, foot + 1 - lift, 1, 1);
  }
}
