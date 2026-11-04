/**
 * Side ways on a layout-3 route (docs/terrain-nodes.md 3.4, slice 3): one or two a job, each a gap at
 * the edge of an approach room (a field gate, a gap in the reeds, a cleft) on a side the way in and
 * the ways on don't use, leading to a dead end with a chest and one other thing in it: someone caged,
 * a nest, a cache of oil, a fouled shrine. Never at a fork; never in the heart. Rolled with the route.
 */
import type { Job } from './jobs.js';
import { LAYOUTS3, SIDE_ROOMS, type Cache } from './nodeports.js';
import { edgePt, portRange, type Port, type Side } from './ports.js';
import type { Rng } from './rng.js';
import type { RoomSpec } from './route.js';

export function sideWays(job: Job, rng: Rng, paths: RoomSpec[][]): void {
  // A room shared by both roads is one place: the same side way whichever road you came by.
  const groups = new Map<string, RoomSpec[]>();
  for (const p of paths) for (const r of p) if (!r.heart && (r.outs?.length ?? 0) === 1) {
    const k = `${r.index}/${r.node}/${r.layout}`, g = groups.get(k) ?? [];
    if (!g.includes(r)) g.push(r);
    groups.set(k, g);
  }
  const n = job.rooms >= 5 ? 1 + rng.int(2) : job.rooms >= 3 ? 1 : rng.next() < 0.5 ? 1 : 0;
  const caches = new Set<Cache>();
  let put = 0;
  for (const g of rng.shuffle([...groups.values()])) {
    if (put >= n) break;
    const r = g[0], w = r.w!, h = r.h!, taken = g.flatMap((x) => [x.in!, ...x.outs!]);
    const sides = (['E', 'W', 'S'] as Side[]).filter((s) => !taken.some((p) => p.side === s));
    if (!sides.length) continue;
    const side = rng.pick(sides), [lo, hi] = portRange(side, w, h);
    let port: Port | null = null;
    for (let t = 0; t < 12 && !port; t++) {
      const p = { side, at: Math.round(rng.range(lo, hi) * 10) / 10 }, [x, y] = edgePt(p, w, h);
      if (g.every((x2) => [x2.in!, ...x2.outs!].every((q) => { const [qx, qy] = edgePt(q, w, h); return Math.hypot(qx - x, qy - y) > 6; }))) port = p;
    }
    if (!port) continue;
    const node = rng.pick(SIDE_ROOMS[r.country ?? 'fields']), layout = rng.pick(LAYOUTS3[node]);
    const wild = r.country === 'wood' || r.country === 'under' || r.country === 'rock' || r.country === 'fen';
    const opts = (node === 'pens' ? ['captive'] : ['captive', 'oil', 'shrine', ...(wild ? ['nest'] : [])]) as Cache[];
    const cache = opts.filter((c) => !caches.has(c))[0] ? rng.pick(opts.filter((c) => !caches.has(c))) : opts[0];
    caches.add(cache);
    for (const x of g) x.side = { port, node, layout, cache };
    put++;
  }
}
