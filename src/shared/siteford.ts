/**
 * The ford (docs/terrain-nodes.md 2.2): a river right across the room, waded at its shallows. Two
 * fords, one wide one, or the old road's bridge broken in the middle with a single ford off to the
 * side. The worn track goes down to the shallows and up the far bank; the old road still runs to the
 * bridge, grassing over, because nobody's crossed there since it went.
 */
import type { Ground } from './sites.js';
import { bridgeBits } from './river.js';
import { beyond, pathMat } from './siteskin.js';
import { mark, newSite, patch, path, round, type Site } from './sitekit.js';
import { laneAt, type Pt } from './spine.js';
import type { Rng } from './rng.js';

export function ford(rng: Rng, g: Ground): Site {
  const sp = g.spec!, s = newSite(sp.palette.floor, sp.palette.back), pts = g.spine![0], r = g.river!, skin = sp.skin ?? 'fields', mat = pathMat(sp.palette.soil);
  // The worn track to the shallows and on: wider, ruts, mud trodden out either side of the water.
  path(s, mat, pts, 1.1);
  for (const f of r.fords) {
    patch(s, 'mud', f.x - 0.7, r.y + r.h - 0.3, f.w + 1.4, 1.6), patch(s, 'mud', f.x - 0.7, r.y - 1.3, f.w + 1.4, 1.6);
    mark(s, 'path', f.x + f.w / 2 - 0.7, r.y + r.h + 0.6, 1.4, 2.2), mark(s, 'path', f.x + f.w / 2 - 0.7, r.y - 2.8, 1.4, 2.2);
  }
  // Every ford not on the track still gets a way down to it.
  for (const f of r.fords) {
    const fx = f.x + f.w / 2;
    if (Math.abs(laneAt(pts, r.y + r.h / 2) - fx) < 1) continue;
    path(s, mat, [[laneAt(pts, r.y + r.h + 3.5), r.y + r.h + 3.5], [fx, r.y + r.h + 0.4]], 0.7), path(s, mat, [[fx, r.y - 0.4], [laneAt(pts, r.y - 3.5), r.y - 3.5]], 0.7);
  }
  const lines: Pt[][] = [pts];
  if (r.bridge) {
    // The old road to the bridge, both banks, gone to grass; the bridge's ends, posts and its wreck below.
    const bx = r.bridge.x + r.bridge.w / 2, road: Pt[] = [[laneAt(pts, g.h - 3), g.h - 3], [bx, r.y + r.h + 0.6]], far: Pt[] = [[bx, r.y - 0.6], [laneAt(pts, 3), 3]];
    path(s, 'earth', road, 0.9), path(s, 'earth', far, 0.9);
    for (const [a, b] of [road, far]) for (let k = 0.2; k < 1; k += 0.25) patch(s, 'grass', a[0] + (b[0] - a[0]) * k - 0.8, a[1] + (b[1] - a[1]) * k - 0.5, 1.6, 1);
    const bits = bridgeBits(r);
    s.marks.push(...bits.marks);
    lines.push(road, far);
  }
  // Reeds along both banks, never in a ford's mouth or on the bridge.
  const open = (x: number) => r.fords.some((f) => x > f.x - 1.2 && x < f.x + f.w + 1.2) || (r.bridge && x > r.bridge.x - 0.9 && x < r.bridge.x + r.bridge.w + 0.9);
  for (let x = 0.6; x < g.w - 0.6; x += rng.range(0.7, 1.4)) for (const y of [r.y - 0.45, r.y + r.h + 0.45]) if (!open(x)) round(s, skin === 'rock' ? 'rock' : 'reed', x, y + rng.range(-0.15, 0.15), skin === 'rock' ? 0.4 : 0.3);
  // The country either side, kept off the river and its banks.
  beyond(s, rng, skin, g.w, g.h, [...lines, [[0, r.y + r.h / 2], [g.w, r.y + r.h / 2]]], Math.max(2.6, r.h / 2 + 1.6));
  return s;
}
