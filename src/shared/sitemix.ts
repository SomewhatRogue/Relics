/**
 * Layout 3's mixed rooms (slice 4): two countries in one room. A farm burned out at the edge of the
 * wood; a roofless chapel and its graves out in the fields; a goblin camp built into a village street
 * (their shacks and stakes between the cottages); and a mine's head below a hamlet, the cottages down
 * by the road and the adit in the rock above. Each still gets one landmark and one set piece.
 */
import { bankBy, cover, offset } from './portkit.js';
import type { Rng } from './rng.js';
import { begin3, country, ruts3 } from './siteopen.js';
import type { Ground } from './sites.js';
import { block, mark, patch, path, round, wooden, type Site } from './sitekit.js';
import { cottage } from './sitevillage.js';
import { laneAt, offAll } from './spine.js';

/** A spot `d` off the track, between `t0` and `t1` along it, with `room` clear on every side. */
function beside(b: ReturnType<typeof begin3>, rng: Rng, d: number, t0: number, t1: number, room: number) {
  for (let k = 0; k < 30; k++) {
    const p = offset(b.main, (rng.next() < 0.5 ? -1 : 1) * d, 1).find((q) => q.t > t0 + rng.next() * (t1 - t0));
    if (p && p.x > room && p.x < b.w - room && p.y > room && p.y < b.h - room - 1.5 && offAll(b.lines, p.x, p.y) > d - 0.6) return p;
  }
  return null;
}

export function burntfarm(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), l = g.spec!.layout;
  path(b.s, b.mat, b.main, 1), ruts3(b);
  // The farm, burned: the house fallen in to ash, the barn (or the byre) still standing, charred.
  const p = beside(b, rng, 5.2, 0.3, 0.7, 4.5);
  if (p) {
    b.s.blocks.push({ ...wooden({ kind: 'house', x: p.x - 1.75, y: p.y - 2.4, w: 3.5, h: 2 }), ruined: true });
    const bx = p.x + (p.x < b.w / 2 ? 2.4 : -7.4);
    const barn = wooden({ kind: 'barn', x: bx, y: p.y - (l === 'byre' ? 1.6 : 2.6), w: l === 'byre' ? 4 : 5, h: l === 'byre' ? 2 : 3 });
    b.s.blocks.push({ ...barn, hp: Math.round((barn.maxHp ?? 40) * 0.35), smoulder: true });
    patch(b.s, 'ash', p.x - 3, p.y - 3, 6, 4.4), mark(b.s, 'scorch', p.x - 2, p.y - 0.6, 4, 1.6), mark(b.s, 'debris', p.x - 1.4, p.y - 0.2, 2.8, 1.2);
    path(b.s, 'earth', [[p.x, p.y - 0.3], [p.x, p.y + 1.2]], 0.5);
  }
  // The wood comes right up to it on one side; the farm's fields on the other.
  bankBy(b.s, rng, () => 'fields', b.main, 2.3, b.w, b.h, (t) => rng.next() < 0.2), bankBy(b.s, rng, () => 'wood', b.main, -2.3, b.w, b.h, (t) => rng.next() < 0.3);
  cover(b.s, rng, 'fields', b.lines, b.w, b.h, 2);
  const s0 = b.main[0], s1 = b.main[b.main.length - 1], nx = -(s1[1] - s0[1]), ny = s1[0] - s0[0];
  country({ ...b, from: 'fields', skin: 'wood', toSide: (x, y) => (x - s0[0]) * nx + (y - s0[1]) * ny < 0 }, rng, b.lines, 2.8);
  return b.s;
}

export function chapelfields(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), l = g.spec!.layout;
  path(b.s, b.mat, b.main, 0.95);
  const p = beside(b, rng, 6.4, 0.25, 0.75, 5.5);
  if (p) {
    // The chapel's walls, roofless and broken, its door down the screen, pillars and the altar within.
    const w = l === 'nave' ? 7 : 5, h = l === 'nave' ? 4.6 : 3.6, x = p.x - w / 2, y = p.y - h / 2;
    for (let k = 0; k < w; k += 1) if (rng.next() > 0.25) block(b.s, 'wall', x + k, y, 1, 0.4);
    for (const sx of [x, x + w - 0.4]) for (let k = 0.4; k < h; k += 1) if (rng.next() > 0.3) block(b.s, 'wall', sx, y + k, 0.4, Math.min(1, h - k));
    for (let k = 0; k < w; k += 1) if (Math.abs(x + k + 0.5 - p.x) > 1.1 && rng.next() > 0.35) block(b.s, 'wall', x + k, y + h - 0.4, 1, 0.4);
    block(b.s, 'altar', p.x - 0.6, y + 0.6, 1.2, 0.6);
    if (l === 'nave') for (const sx of [-1.6, 1.6]) round(b.s, 'pillar', p.x + sx, p.y + 0.3, 0.32);
    patch(b.s, 'swept', x + 0.4, y + 0.4, w - 0.8, h - 0.8, false), mark(b.s, 'flags', x + 0.6, y + 0.6, w - 1.2, h - 1.2);
    // The graves round it, and the old yew.
    for (let i = 0; i < 7; i++) {
      const gx = p.x + rng.range(-w, w), gy = p.y + h / 2 + rng.range(0.6, 3.2);
      if (gx > 1 && gx < b.w - 2 && gy < b.h - 3 && offAll(b.lines, gx, gy) > 2) mark(b.s, 'mound', gx - 0.5, gy - 0.25, 1, 0.5);
    }
    round(b.s, 'tree', p.x + (p.x < b.w / 2 ? w / 2 + 1.6 : -w / 2 - 1.6), p.y - h / 2 + 0.6, 0.65);
  }
  bankBy(b.s, rng, b.skinAt, b.main, 2.3, b.w, b.h, (t) => Math.abs(t - 0.5) < 0.1), bankBy(b.s, rng, b.skinAt, b.main, -2.3, b.w, b.h, (t) => Math.abs(t - 0.4) < 0.1);
  country(b, rng, [...b.lines, ...(p ? [[[p.x - 5, p.y], [p.x + 5, p.y]] as [number, number][]] : [])], 3);
  return b.s;
}

/** The hungry's camp in a village street: their shacks and tents between the cottages, stakes across the lane's end. */
export function campvillage(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), l = g.spec!.layout;
  path(b.s, 'mud', b.main, 1.3), ruts3(b);
  for (const y of l === 'square' ? [2.4, 15.2] : [2.4, 8.8, 15.2]) for (const sx of [-1, 1]) {
    const lx = laneAt(b.main, y + 3.2), hx = sx < 0 ? lx - 6.9 : lx + 3.4;
    if (hx < 0.8 || hx + 4.4 > g.w - 0.6) continue;
    if (rng.next() < 0.6) cottage(b.s, rng, hx, y, -sx, lx + sx * 1.2);
    else block(b.s, rng.next() < 0.5 ? 'shack' : 'tent', hx + 0.3, y + 0.4, 3, 1.6), patch(b.s, 'mud', hx - 0.4, y + 1.6, 4, 2);
  }
  if (l === 'square') patch(b.s, 'mud', laneAt(b.main, 11) - 5, 8.5, 10, 5), mark(b.s, 'trample', laneAt(b.main, 11) - 4, 9, 8, 4);
  // Sharpened stakes across the lane, a gap left for them to come and go.
  const y = rng.range(5.5, 7), lx = laneAt(b.main, y);
  for (let x = 1; x < g.w - 1; x += 0.7) if (Math.abs(x - lx) > 1.3) block(b.s, 'fence', x - 0.2, y, 0.4, 0.5);
  mark(b.s, 'scorch', lx + 2, y + 2, 2.4, 1.2);
  return b.s;
}

/** A mine's head below a hamlet: the cottages down by the road, the spoil, carts and the adit in the rock above. */
export function hamletmine(rng: Rng, g: Ground): Site {
  const b = begin3(g, rng), ex = g.spec!.outs![0].at;
  path(b.s, b.mat, b.main, 1.1), ruts3(b);
  for (const sx of [-1, 1]) round(b.s, 'support', ex + sx * 1.7, 1.2, 0.3), round(b.s, 'support', ex + sx * 1.7, 2.6, 0.3);
  patch(b.s, 'ash', ex - 3, 0.2, 6, 4);
  // The hamlet: two or three cottages in the room's lower half, facing the road.
  for (let i = 0, t = 0; i < 3 && t < 40; t++) {
    const p = offset(b.main, (rng.next() < 0.5 ? -1 : 1) * 4.6, 1).find((q) => q.y > b.h * 0.5 && rng.next() < 0.15);
    if (!p || p.x < 1 || p.x > b.w - 5 || p.y > b.h - 4.5 || b.s.blocks.some((q) => Math.abs(q.x - (p.x - 1.75)) < 5 && Math.abs(q.y - (p.y - 2)) < 4)) continue;
    cottage(b.s, rng, p.x - 1.75, p.y - 2, p.x < laneAt(b.main, p.y) ? 1 : -1, laneAt(b.main, p.y + 1.2)), i++;
  }
  // The workings above: spoil heaps either side of the way up, a cart.
  for (let i = 0, t = 0; i < 3 && t < 40; t++) {
    const p = offset(b.main, (rng.next() < 0.5 ? -1 : 1) * rng.range(3.5, 6), 1).find((q) => q.y < b.h * 0.45 && q.y > 3 && rng.next() < 0.2);
    if (p && p.x > 2 && p.x < b.w - 3) block(b.s, 'rubble', p.x - 1.3, p.y - 0.7, 2.6, 1.4), i++;
  }
  cover(b.s, rng, 'rock', b.lines, b.w, b.h, 1);
  country({ ...b, from: 'fields', skin: 'rock', toSide: (_x, y) => y < b.h * 0.5 }, rng, b.lines, 3.2);
  return b.s;
}
