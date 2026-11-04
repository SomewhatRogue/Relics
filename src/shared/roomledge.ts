/**
 * Raised ground in a layout-3 room (docs/terrain-nodes.md 2.10, "archers on the heights"): wherever it
 * fits beside the track, not just a top corner, its ramp at the end nearer the way so you can get up
 * it, archers on top. The high road always has a big one; a hollow way (a hedged track, the ore road's
 * cutting) has a bank either side of the lane; a wood's edge on a slope, the spoil shelf above a hamlet
 * and a rocky rise in the rock or the wood have one; elsewhere now and then. Never across the way.
 * Also here: the way into a heart from a side, which has to go round the heart's landmarks the same way.
 */
import type { Area, Ledge, Water } from './arena.js';
import type { Foe } from './terrain.js';
import type { RoomSpec } from './route.js';
import type { Rng } from './rng.js';
import type { Spot } from './sitekit.js';
import { boxOff, offAll, type Pt } from './spine.js';

export interface Raise {
  rng: Rng; spec: RoomSpec; road?: string; obj: string; fork: boolean; index: number; W: number; H: number;
  spine: Pt[][]; water: Water[]; keepOff: { x: number; y: number }[]; spots: Spot[]; onLedge: Set<Spot>; foes: Foe[]; ledges: Ledge[];
}

const TWO = new Set(['track/hedged', 'oreroad/cutting']);
const ONE = new Set(['woodedge/slope', 'hamletmine/shelf']);

/** Which side of the track a point is on (by the nearest stretch of it). */
function sideOf(pts: Pt[], x: number, y: number): number {
  let best = 0, bd = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], d = Math.hypot((ax + bx) / 2 - x, (ay + by) / 2 - y);
    if (d < bd) (bd = d), (best = Math.sign((bx - ax) * (y - ay) - (by - ay) * (x - ax)));
  }
  return best;
}

export function raise3(o: Raise): void {
  // Banks and rises of earth and stone (a raised wooden deck out in a field read wrong).
  const { rng, spec, road, W, H } = o, key = `${spec.node}/${spec.layout}`, big = road === 'high';
  if (o.fork || o.obj === 'burn' || road === 'low') return;
  const skin = spec.skin ?? 'fields', rocky = skin === 'rock' || skin === 'under' || (skin === 'wood' && spec.node === 'clearing');
  const want = TWO.has(key) ? 2 : big || ONE.has(key) || (rocky && rng.next() < 0.5) || (o.index >= 1 && rng.next() < 0.35) ? 1 : 0;
  const lw = big ? 7.5 : TWO.has(key) ? 6 : 6.5, lh = big ? 4.2 : TWO.has(key) ? 2.8 : 3.4, main = o.spine[0];
  const bad = (a: Area, pad: number) => o.water.some((q) => a.x < q.x + q.w + pad && a.x + a.w > q.x - pad && a.y < q.y + q.h + pad && a.y + a.h > q.y - pad) ||
    o.spots.some((s) => s.x > a.x - s.r - pad && s.x < a.x + a.w + s.r + pad && s.y > a.y - s.r - pad && s.y < a.y + a.h + s.r + pad) ||
    o.keepOff.some((p) => p.x > a.x - 3 && p.x < a.x + a.w + 3 && p.y > a.y - 3 && p.y < a.y + a.h + 3);
  const found: { a: Area; side: number; score: number }[] = [];
  for (let y = 0; y + lh <= H - 4.5; y += 1) for (let x = 0; x + lw <= W; x += 1) {
    const a = { x, y, w: lw, h: lh }, c = offAll(o.spine, x + lw / 2, y + lh / 2), half = Math.hypot(lw, lh) / 2;
    if (c < 1.6 || bad(a, 0.4)) continue;
    const d = c - half > 4 ? c - half : boxOff(o.spine, a);
    if (d < 1.6) continue;
    found.push({ a, side: sideOf(main, x + lw / 2, y + lh / 2), score: Math.abs(d - 2.2) + rng.next() * 1.5 });
  }
  found.sort((p, q) => p.score - q.score);
  const took: typeof found = [];
  for (const f of found) {
    if (took.length >= want) break;
    if (took.some((t) => t.side === f.side || (f.a.x < t.a.x + t.a.w + 1 && f.a.x + f.a.w > t.a.x - 1 && f.a.y < t.a.y + t.a.h + 1 && f.a.y + f.a.h > t.a.y - 1))) continue;
    // Its ramp on its front edge, at the end nearer the track, and clear to walk up.
    const { a } = f, left = offAll(o.spine, a.x, a.y + a.h + 1) < offAll(o.spine, a.x + a.w, a.y + a.h + 1);
    const ramp = { x: left ? a.x : a.x + a.w - 1.8, y: a.y + a.h - 1.3, w: 1.8, h: 2.8 };
    if (ramp.y + ramp.h > H - 0.6 || bad({ ...ramp, y: a.y + a.h, h: 1.5 }, 0.3)) continue;
    took.push(f);
    o.ledges.push({ ...a, ramps: [ramp], kind: 'rock' });
    for (let x = a.x + 1; x < a.x + a.w; x += 1.5) {
      const s = { x, y: a.y + a.h / 2, r: a.h / 2 + 0.3 };
      o.spots.push(s), o.onLedge.add(s);
    }
    o.spots.push({ x: ramp.x + 0.9, y: ramp.y + ramp.h / 2, r: 1.5 });
    for (let i = 0; i < (big ? 3 : 2); i++) o.foes.push({ kind: 'scrapper', bow: true, z: 1, x: a.x + 1.3 + (i * (a.w - 2.6)) / Math.max(1, big ? 2 : 1), y: a.y + 1 + (i % 2) * Math.min(0.8, a.h - 2) });
  }
}

/**
 * A heart come into low down a side (layout 3): the way over to its lane, kept off its landmarks (they
 * stay where they always are, so the way in goes round them: higher or lower, joining the lane sooner or later).
 */
export function sideWayIn(side: 'N' | 'E' | 'S' | 'W', W: number, H: number, guard: Spot[]): Pt[] {
  const x0 = side === 'W' ? 0 : W, x1 = side === 'W' ? 2.6 : W - 2.6, M = W / 2;
  let best: Pt[] = [], bs = -Infinity;
  for (const y of [H - 3, H - 2.4, H - 3.8, H - 4.8, H - 6, H - 7.4, H - 9]) for (const j of [H - 4.4, H - 2.8, H - 6.4, H - 8.4]) {
    // Clear of the landmarks by the way in, and by where the party stands on coming in.
    const line: Pt[] = [[x0, y], [x1, y], [M, j], [M, 0]], sx = side === 'W' ? 2 : W - 2;
    const score = Math.min(9, ...guard.map((g) => Math.min(offAll([line], g.x, g.y) - g.r, Math.hypot(g.x - sx, g.y - y) - g.r - 1.4)));
    if (score >= 1.8) return line;
    if (score > bs) (bs = score), (best = line);
  }
  return best;
}
