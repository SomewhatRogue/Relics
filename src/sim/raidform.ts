/**
 * Where a raiding party forms and who is in it (sim/raids.ts). It forms on the land's roads (sim/raidroads.ts), on the
 * stretch joined to the hero it's for, out of sight of every hero (RAID.from), never near a shelter's ring or a camp post
 * (RAID.clear), on open ground. Who: the land's roster (shared/raidtune.ts), drawn on the raids' own stream.
 */
import { collide, inArea, useMap, type GameMap } from '../shared/arena';
import { cast } from '../shared/encounter';
import type { Role } from '../shared/encounters';
import { RAID, type RaidRole } from '../shared/raidtune';
import type { Rng } from '../shared/rng';
import type { Foe } from '../shared/terrain';
import { nearestPt, roadsOf, type Roads } from './raidroads';

type P = { x: number; y: number };
const far = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);

/** Open ground for a body at (px, py): on the map, out of water, nothing solid there. */
export function open(m: GameMap, px: number, py: number): boolean {
  if (px < 2 || py < 2.5 || px > m.w - 2 || py > m.h - 2) return false;
  if ((m.water ?? []).some((w) => inArea({ x: w.x - 0.6, y: w.y - 0.6, w: w.w + 1.2, h: w.h + 1.2 }, px, py))) return false;
  useMap(m);
  const q = { x: px, y: py };
  collide(q, 0.5);
  return Math.hypot(q.x - px, q.y - py) < 1e-6;
}

/** Clear of every shelter's ring and every camp post by RAID.clear. */
export const clearOf = (m: GameMap, p: P) =>
  (m.stations ?? []).every((s) => far(s, p) >= RAID.clear + s.r) && (m.guards ?? []).every((g) => far(g, p) >= RAID.clear);

/** The road point it forms at, for hero `h` with `seen` the heroes who must not see it; -1 if none will do. */
export function formAt(m: GameMap, r: Roads, h: P, seen: P[], rng: Rng): number {
  const c = r.part[nearestPt(r, h)];
  const ok = r.pts.map((_, i) => i).filter((i) => r.part[i] === c && seen.every((o) => far(o, r.pts[i]) >= RAID.from[0]) && clearOf(m, r.pts[i]) && open(m, r.pts[i].x, r.pts[i].y));
  if (!ok.length) return -1;
  const band = ok.filter((i) => far(h, r.pts[i]) <= RAID.from[1]);
  return band.length ? band[rng.int(band.length)] : ok.sort((a, b) => far(h, r.pts[a]) - far(h, r.pts[b]) || a - b)[0];
}

/** Who marches: a lead, perhaps a wolf-keeper and a wolf or two, the rest drawn; RAID.size of them. */
export function roster(m: GameMap, rng: Rng): (RaidRole | 'keeper' | 'wolf')[] {
  const ro = RAID.rosters[m.name];
  if (!ro) return [];
  const n = RAID.size[0] + rng.int(RAID.size[1] - RAID.size[0] + 1), out: (RaidRole | 'keeper' | 'wolf')[] = [rng.pick(ro.lead)];
  if (ro.wolves > 0 && rng.next() < ro.wolves) {
    out.push('keeper', 'wolf');
    if (rng.next() < 0.5) out.push('wolf');
  }
  while (out.length < n) out.push(rng.pick(ro.rest));
  return out.slice(0, n);
}

/** One of them as a planned goblin, of pack `pack`, at (x, y). */
export function raider(role: RaidRole | 'keeper' | 'wolf', x: number, y: number, pack: number): Foe {
  const f: Foe = { kind: 'scrapper', x, y, pack };
  if (role === 'gaffer') f.variant = 'gaffer';
  else cast(f, role as Role);
  return f;
}

export { roadsOf };
