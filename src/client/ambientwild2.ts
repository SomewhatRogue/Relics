/**
 * The wild's reactions to a hero's nearness (ambientwild.ts): two or three small dark birds that burst up from a
 * bush or a tree when a hero comes within about 1.5 tiles (then that cover is quiet a good while), and the map's
 * crows, which peck and hop as ever but lift off and circle away when a hero is within about 2.5 tiles, and settle
 * once it has gone. A little cosmetic memory keeps a flush to one burst and lets the crows rise and settle smoothly;
 * each screen keeps its own. Paint only.
 */
import type { GameMap, Round } from '../shared/arena';
import type { Beast } from './townbeasts';
import { hash, away, dot, coversOf, nearest, type At } from './ambientwildkit';

const flush = new Map<string, { t0: number; ux: number; uy: number; quiet: number }>();
let lastFlush = -99;

/** A small dark bird in flight: a body and two wings that beat. */
function bird(c: Parameters<Beast['draw']>[0], px: number, py: number, now: number, i: number, a: number): void {
  const X = Math.round(px), Y = Math.round(py), up = Math.floor(now * 16 + i) % 2;
  dot(c, X, Y - 1, -1, 0, 3, 1, '#16141c', a);
  dot(c, X, Y - 1, -3, up ? -2 : 1, 2, 1, '#2a2632', a);
  dot(c, X, Y - 1, 2, up ? -2 : 1, 2, 1, '#2a2632', a);
}

/** Covers a hero has just come close to flush two or three birds, once in a long while each. */
export function birds(m: GameMap, now: number, heroes: At[]): Beast[] {
  const cv = coversOf(m), out: Beast[] = [];
  if (flush.size > 200) flush.clear();
  for (const r of [...nearest(cv.bushes, heroes, 4, 4), ...nearest(cv.trees, heroes, 4, 3)]) {
    const key = `${r.x},${r.y}`;
    let f = flush.get(key);
    if (f && now < f.t0) flush.delete(key), (f = undefined);
    if (!f) {
      const { d, ux, uy } = away(heroes, r.x, r.y);
      // A third of covers hold birds; one burst at a time about the place.
      if (hash(r.x, r.y) > 0.38) continue;
      if (d < 1.5 && now - lastFlush > 5) (f = { t0: now, ux, uy, quiet: now + 35 + hash(r.y, r.x) * 25 }), flush.set(key, f), (lastFlush = now);
      else continue;
    }
    const dt = now - f.t0;
    if (dt > 1.4) continue;
    for (let i = 0; i < 3; i++) {
      const ang = (i - 1) * 0.55, ca = Math.cos(ang), sa = Math.sin(ang), dx = f.ux * ca - f.uy * sa, dy = f.ux * sa + f.uy * ca, v = 3.2 + i * 0.8;
      const a = dt < 1 ? 1 : Math.max(0, 1 - (dt - 1) / 0.4);
      out.push({ key: `bd${key}_${i}`, x: r.x + dx * dt * v + (i - 1) * 0.15, y: r.y + dy * dt * v * 0.6, up: 0.4 + dt * (1.5 + i * 0.25), draw: (c, px, py) => bird(c, px, py, now, i, a) });
    }
  }
  return out;
}

const air = new Map<string, { a: number; t: number; hold: number }>();

/** One crow: dark body, head, wing bar when aloft; pecks, hops, now and then flaps up (as streetlife.ts's did). */
function crow(c: Parameters<Beast['draw']>[0], px: number, py: number, o: { face: number; peck: boolean; fly: boolean; beat: number }): void {
  const X = Math.round(px), Y = Math.round(py), { face, peck, fly } = o;
  dot(c, X, Y, -2, -3, 5, 3, '#16141c');
  dot(c, X, Y, face * 2 + (face < 0 ? -1 : 0), peck ? -2 : -5, 2, 2, '#16141c');
  dot(c, X, Y, -1, -3, 2, 1, '#2a2632');
  if (fly) dot(c, X, Y, -4, -4 - o.beat, 9, 1, '#2a2632');
  else dot(c, X, Y, 0, 0, 1, 1, '#3a3440');
  dot(c, X, Y, face * 3 + (face < 0 ? 1 : 0), peck ? -1 : -4, 1, 1, '#c8a040');
}

/** The map's crows (3 a round, the two nearest rounds): the old pecking and hopping, and lifting off from a hero. */
export function crowFigs(m: GameMap, now: number, heroes: At[]): Beast[] {
  const out: Beast[] = [];
  for (const r of nearest(coversOf(m).crows, heroes, 16, 2) as Round[]) {
    const key = `${r.x},${r.y}`, { d, ux, uy } = away(heroes, r.x, r.y);
    let s = air.get(key);
    if (!s || now < s.t) s = { a: 0, t: now, hold: -99 };
    const dt = Math.min(0.25, now - s.t);
    if (d < 2.5) s.hold = now;
    const want = now - s.hold < 2.2 ? 1 : 0;
    s.a = want ? Math.min(1, s.a + dt / 0.6) : Math.max(0, s.a - dt / 2.4);
    s.t = now, air.set(key, s);
    const a = s.a, e = a * a * (3 - 2 * a);
    for (let i = 0; i < 3; i++) {
      const t = now * (0.9 + i * 0.23) + r.x * 3 + i * 2.1, hop = Math.floor(t) % 7 === 0 ? 0.1 : 0;
      const idle = Math.floor(t * 0.5 + i) % 11 === 0, peck = !idle && Math.floor(t * 2.5) % 3 === 0;
      const bx = r.x + (-8 + i * 7 + Math.sin(t * 0.3) * 3) / 20, by = r.y + ((i % 2) * 3 - 2) / 20;
      const ang = now * 1.3 + i * 2.1, x = bx + (Math.cos(ang) * 1.2 + ux * 2.2) * e, y = by + (Math.sin(ang) * 0.8 + uy * 1.4) * e;
      const lift = e * (1.1 + 0.45 * i) + (idle ? 0.3 : 0) + hop;
      const face = e ? (Math.sin(ang) > 0 ? -1 : 1) : Math.sin(t * 0.3 + i) > 0 ? 1 : -1, fly = e > 0.05 || idle;
      out.push({ key: `cr${key}_${i}`, x, y, up: lift, draw: (c, px, py) => crow(c, px, py, { face, peck: !fly && peck, fly, beat: Math.floor(now * 12 + i) % 2 }) });
    }
  }
  return out;
}
