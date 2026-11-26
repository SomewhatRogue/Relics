/**
 * The roads a raiding party marches (sim/raids.ts): the land's roads and paths (`map.trails`) as a graph, with the stretch
 * inside a shelter's ring swapped for an arc round it (goblins are kept out of the rings: sim/landrules.ts guard), so a
 * party never routes through one but can still pass it. Built once a map; pure lookups after.
 */
import type { GameMap } from '../shared/arena';

type P = { x: number; y: number };
export interface Roads { pts: P[]; adj: number[][]; part: number[]; ends: number[] }
const built = new WeakMap<GameMap, Roads | null>();

const near = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);

/** The map's roads, or null if it has none. */
export function roadsOf(map: GameMap): Roads | null {
  if (built.has(map)) return built.get(map)!;
  const lines = map.trails ?? [], rings = map.stations ?? [];
  const out = (p: P) => rings.some((s) => near(p, s) <= s.r + 1);
  const pts: P[] = [], adj: number[][] = [];
  const add = (p: P) => (pts.push({ x: p.x, y: p.y }), adj.push([]), pts.length - 1);
  const link = (a: number, b: number) => a !== b && !adj[a].includes(b) && (adj[a].push(b), adj[b].push(a));
  for (const l of lines) {
    // Every tile or so along it, so a ring cuts only the bit inside it.
    let last = -1, cut = -1;
    for (let i = 0; i < l.length; i++) {
      const a = l[i], b = l[i + 1] ?? a, n = Math.max(1, Math.ceil(near(a, b) / 1.5));
      for (let k = 0; k < (i + 1 < l.length ? n : 1); k++) {
        const p = { x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n };
        if (out(p)) { if (last >= 0) cut = last; last = -1; continue; }
        const j = add(p);
        if (last >= 0) link(last, j);
        else if (cut >= 0) skirt(cut, j);
        last = j;
        cut = -1;
      }
    }
  }
  // A road through a ring goes round it instead (Kyle 2026-11-25: the fen's staithe cut its track in two): an arc just
  // outside the ring, the shorter way, from where the road went in to where it came out.
  function skirt(a: number, b: number): void {
    const s = rings.find((r) => near(pts[a], r) <= r.r + 3 && near(pts[b], r) <= r.r + 3);
    if (!s) return;
    const rad = s.r + 2.5, t0 = Math.atan2(pts[a].y - s.y, pts[a].x - s.x);
    let dt = Math.atan2(pts[b].y - s.y, pts[b].x - s.x) - t0;
    if (dt > Math.PI) dt -= 2 * Math.PI;
    if (dt < -Math.PI) dt += 2 * Math.PI;
    const n = Math.max(2, Math.ceil((Math.abs(dt) * rad) / 1.5));
    let prev = a;
    for (let k = 1; k < n; k++) {
      const t = t0 + (dt * k) / n, j = add({ x: s.x + Math.cos(t) * rad, y: s.y + Math.sin(t) * rad });
      link(prev, j);
      prev = j;
    }
    link(prev, b);
  }
  // Where a path meets another (its end on another's line, or two points together): joined.
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (near(pts[i], pts[j]) < 1.2) link(i, j);
  const part = pts.map(() => -1);
  for (let s = 0, c = 0; s < pts.length; s++) {
    if (part[s] >= 0) continue;
    const q = [s];
    part[s] = c;
    while (q.length) for (const n of adj[q.pop()!]) if (part[n] < 0) (part[n] = c), q.push(n);
    c++;
  }
  const r = pts.length ? { pts, adj, part, ends: pts.map((_, i) => i).filter((i) => adj[i].length === 1) } : null;
  built.set(map, r);
  return r;
}

/** The road point nearest p (optionally only in part `c`). */
export function nearestPt(r: Roads, p: P, c?: number): number {
  let best = -1, bd = Infinity;
  r.pts.forEach((q, i) => {
    const d = near(p, q);
    if (d < bd && (c === undefined || r.part[i] === c)) (bd = d), (best = i);
  });
  return best;
}

/** The way along the roads from point `a` to point `b` (indices), as points; [] if they aren't joined. */
export function route(r: Roads, a: number, b: number): P[] {
  if (a < 0 || b < 0 || r.part[a] !== r.part[b]) return [];
  const dist = r.pts.map(() => Infinity), from = r.pts.map(() => -1), done = r.pts.map(() => false);
  dist[a] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < dist.length; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || u === b) break;
    done[u] = true;
    for (const v of r.adj[u]) {
      const d = dist[u] + near(r.pts[u], r.pts[v]);
      if (d < dist[v]) (dist[v] = d), (from[v] = u);
    }
  }
  const way: P[] = [];
  for (let u = b; u >= 0; u = u === a ? -1 : from[u]) way.unshift(r.pts[u]);
  return way;
}
