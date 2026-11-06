/**
 * A layout-3 room's frame (docs/terrain-nodes.md 3.4): its size, the way in and the ways on by side,
 * the spine from one to the others (a straight leg wanders, a turn curves round its corner, a fork
 * parts in the middle, a side way gets a short spur), and the water its node brings, laid across the
 * way you're going: a ford's river runs across a bottom-to-top leg and down a left-to-right one.
 */
import type { Area, Water } from './arena.js';
import type { Job } from './jobs.js';
import { INWARD, edgePt, innerPt, wayArea, spawnAt, type Port } from './ports.js';
import { river, riverDown, type River } from './river.js';
import { Rng } from './rng.js';
import { roomSeed, type RoomSpec } from './route.js';
import { boxOff, off, type Pt } from './spine.js';
import { wetBeside } from './wetland.js';
import { isNode4 } from './nodes4.js';
import { water4 } from './water4.js';
import { STAITHE } from './staithetune.js';

export interface Frame3 {
  spec: RoomSpec; rng: Rng; seed: number; w: number; h: number;
  spawn: { x: number; y: number }; exit: Area; ways: { area: Area; road?: 'high' | 'low'; port: Port & { way?: import('./ways.js').WayKind } }[];
  spine: Pt[][]; water: Water[]; wet: { x: number; y: number; r: number }[]; river?: River;
}

const BEND: Record<string, number> = { track: 2.6, woodpath: 3.6, clearing: 2.2, crossroads: 1.4, ford: 1.6, causeway: 0.5, fenford: 1.2, carredge: 2.8, woodedge: 2.2, coppice: 2, oreroad: 2.4, minehead: 1.4, outfall: 1.4, burntfarm: 2, chapelfields: 2.2, hamletmine: 1.4, villageend: 1, lane: 1, yard: 1.2, strips: 1.4, campvillage: 1.2,
  deepwood: 3.4, glade: 2, reedbed: 2.4, flooded: 1, collapse: 1.4, cave: 3, orechamber: 2.2, churchyard: 1.6, mill: 1.4, orchard: 1.2, stackyard: 1.4, barrows: 2.4 };

/** A leg from one port to another: wandering if it runs straight across, curving round the corner if it turns. */
export function leg(rng: Rng, w: number, h: number, a: Port, b: Port, bend: number, m = 4): Pt[] {
  const A0 = edgePt(a, w, h), A1 = innerPt(a, w, h, 2.5), B1 = innerPt(b, w, h, 2.6), B0 = edgePt(b, w, h), [ax, ay] = INWARD[a.side], [bx, by] = INWARD[b.side];
  const clamp = ([x, y]: Pt): Pt => [Math.max(m, Math.min(w - m, x)), Math.max(m - 0.5, Math.min(h - m, y))];
  const j = () => rng.range(-bend, bend);
  if (ax * bx + ay * by < -0.5) {
    // Straight across: two bends on the way, sideways to the way you're going.
    const px = Math.abs(ax) > 0 ? 0 : 1, py = 1 - px, at = (t: number): Pt => clamp([A1[0] + (B1[0] - A1[0]) * t + px * j(), A1[1] + (B1[1] - A1[1]) * t + py * j()]);
    return [A0, A1, at(0.33), at(0.67), B1, B0];
  }
  // A turn: round the corner where the two ways would meet.
  const C: Pt = ax ? [B1[0], A1[1]] : [A1[0], B1[1]], q = (t: number): Pt => clamp([(1 - t) ** 2 * A1[0] + 2 * t * (1 - t) * C[0] + t * t * B1[0] + j() * 0.5, (1 - t) ** 2 * A1[1] + 2 * t * (1 - t) * C[1] + t * t * B1[1] + j() * 0.5]);
  return [A0, A1, q(0.35), q(0.7), B1, B0];
}

/** The nearest point on a line to (x, y). */
function nearestOn(pts: Pt[], x: number, y: number): Pt {
  let best: Pt = pts[0], bd = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    const p: Pt = [ax + dx * t, ay + dy * t], d = Math.hypot(p[0] - x, p[1] - y);
    if (d < bd) (bd = d), (best = p);
  }
  return best;
}

export function frame3(job: Job, spec: RoomSpec): Frame3 {
  const w = spec.w!, h = spec.h!, seed = roomSeed(job, spec.index, `${spec.node}/${spec.layout}`), geo = new Rng(seed + 11), inP = spec.in!;
  const ways = spec.outs!.map((p) => ({ area: wayArea(p, w, h), road: p.road, port: p }));
  const f: Frame3 = { spec, rng: new Rng(seed), seed, w, h, spawn: spawnAt(inP, w, h), exit: ways[0].area, ways, spine: [], water: [], wet: [] };
  const bend = BEND[spec.node] ?? 2;
  if (spec.outs!.length > 1) {
    // A fork: the way in comes to the middle of the room and parts for the two roads.
    const mid: Pt = [w / 2 + geo.range(-2, 2), h * 0.5 + geo.range(-1.5, 1.5)];
    const [a, b] = spec.outs!, toMid = leg(geo, w, h, inP, a, bend).slice(0, 2);
    const branch = (p: Port): Pt[] => { const B1 = innerPt(p, w, h, 2.6); return [mid, [(mid[0] + B1[0]) / 2 + geo.range(-1, 1), (mid[1] + B1[1]) / 2 + geo.range(-1, 1)], B1, edgePt(p, w, h)]; };
    f.spine = [[...toMid, mid, ...branch(a).slice(1)], branch(b)];
  } else f.spine = [leg(geo, w, h, inP, spec.outs![0], bend)];
  water(f, geo);
  // A side way: a short spur off the track to the gap at the edge.
  if (spec.side) {
    const s0 = edgePt(spec.side.port, w, h), s1 = innerPt(spec.side.port, w, h, 2.2), n = nearestOn(f.spine[0].slice(1, -1), s1[0], s1[1]);
    const spur: Pt[] = [n, [(n[0] + s1[0]) / 2, (n[1] + s1[1]) / 2], s1, s0];
    f.spine.push(spur);
    // Never cut off by water: deep water across the spur is waded there (a second, narrow ford).
    for (const q of f.water) if (q.deep && offBox(spur, q) < 1.2) delete q.deep;
  }
  return f;
}

const offBox = (line: Pt[], q: Water) => boxOff([line], q);
const spotOf = (q: Water) => ({ x: q.x + q.w / 2, y: q.y + q.h / 2, r: Math.max(q.w, q.h) / 2 + 0.2 });

/** The node's water, laid across or beside the way, and the track moved through a ford. */
function water(f: Frame3, geo: Rng): void {
  const { spec, w, h } = f, n = spec.node, l = spec.layout, main = f.spine[0], down = spec.in!.side === 'W' || spec.in!.side === 'E';
  if (isNode4(n)) return water4(f, geo);
  if (n === 'ford' || n === 'fenford' || n === 'outfall') {
    // A river across the way: fords to wade (two, one wide one, or a broken bridge and one), the track through the nearest.
    // The Staithe (the NETS way): a broad deep river for the jetty to stand in, one ford near an end (shared/staithe.ts).
    const st = spec.piece === 'staithe', len = down ? h : w, at = geo.range((down ? w : h) * 0.38, (down ? w : h) * 0.5), rw = st ? STAITHE.river : n === 'fenford' ? 3.2 : 2.6;
    const fords = st ? [{ x: geo.next() < 0.5 ? geo.range(2.2, 3.6) : len - 3.4 - geo.range(2.2, 3.6), w: 3.4 }] : l === 'wide' || l === 'spread' ? [{ x: geo.range(4, len - 9), w: 5 }] : l === 'twofords' || l === 'islands' ? [{ x: geo.range(3, len / 2 - 5), w: 3.2 }, { x: geo.range(len / 2 + 2, len - 6.4), w: 3.2 }] : [{ x: geo.range(4, len - 7.4), w: 3.4 }];
    f.river = down ? riverDown(h, at, rw, fords) : river(w, at, rw, fords, n === 'ford' && l === 'broken' && !st ? w / 2 + geo.range(-1.5, 1.5) : undefined);
    f.water = f.river.water;
    const c = (q: { x: number; w: number }) => q.x + q.w / 2, mid = down ? (main[1][1] + main[main.length - 2][1]) / 2 : (main[1][0] + main[main.length - 2][0]) / 2;
    const near = [...fords].sort((a, b) => Math.abs(c(a) - mid) - Math.abs(c(b) - mid))[0], fc = c(near);
    const [a0, a1] = main, [b1, b0] = main.slice(-2), before = down ? (a1[0] < at ? at - 2.2 : at + rw + 2.2) : a1[1] > at ? at + rw + 2.2 : at - 2.2, after = down ? (a1[0] < at ? at + rw + 2.2 : at - 2.2) : a1[1] > at ? at - 2.2 : at + rw + 2.2;
    const P = (u: number): Pt => (down ? [u, fc] : [fc, u]);
    f.spine[0] = [a0, a1, P(before), P(at + rw / 2), P(after), b1, b0];
    if (f.spine.length > 1) f.spine[1][0] = P(after);
    for (let u = 0.8; u < len; u += 1.6) f.wet.push(down ? { x: at + rw / 2, y: u, r: 1.5 } : { x: u, y: at + rw / 2, r: 1.5 });
    if (n === 'fenford') for (const q of wetBeside(f.spine, w, h, 3.2, geo, 0.35)) f.water.push(q), f.wet.push(spotOf(q));
    return;
  }
  if (n === 'causeway' || n === 'carredge' || spec.skin === 'fen') {
    // The fen close on the track (deep both sides of a causeway; pools in a carr's wet half; the fen's pools).
    const deep = n === 'causeway' ? 1 : n === 'carredge' ? 0.25 : 0.15, near = n === 'causeway' ? 1.8 : 2.8;
    const half = n === 'carredge' ? (x: number, y: number) => off(main.slice(Math.floor(main.length / 2)), x, y) < off(main.slice(0, Math.ceil(main.length / 2) + 1), x, y) : () => true;
    for (const q of wetBeside(f.spine, w, h, near, geo, deep, n === 'causeway' ? 1 : n === 'carredge' ? 0.8 : 0.4)) if (half(q.x + q.w / 2, q.y + q.h / 2)) f.water.push(q), f.wet.push(spotOf(q));
    if (n === 'causeway' && l === 'broken') {
      // A gap in the causeway: a stretch of shallows across the track to wade.
      const p = main[Math.floor(main.length / 2)], gap = { x: p[0] - (down ? 1 : 2.2), y: p[1] - (down ? 2.2 : 1), w: down ? 2 : 4.4, h: down ? 4.4 : 2 };
      f.water.push(gap);
    }
    return;
  }
  if (n === 'clearing' && l === 'stream') {
    // A stream across the way below the clearing, shallow from bank to bank.
    const p = main[2];
    f.water = [down ? { x: p[0] - 0.6, y: 0, w: 1.3, h } : { x: 0, y: p[1] - 0.6, w, h: 1.3 }];
  }
}
