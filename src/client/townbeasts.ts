/**
 * A lived-in town's animals (shared/townlife.ts `life`), each where the clock puts it, drawn at its own spot so
 * both views place it among everyone else (scene.ts sorts it in; three/cards3d.ts stands it on a card): hens
 * scratching about and scattering from your feet, a duck and her ducklings walking in file out of the pond and
 * back, a cat up on the crates washing and flicking its tail (eyes in the dark), pigeons pecking that clatter
 * up when you come near and settle again. Cosmetic: each screen's own clock and heroes. Paint only.
 */
import type { GameMap } from '../shared/arena';
import type { Life } from '../shared/townlife';
import type { Ctx } from './draw';
import { dusk } from './streetlife';
import { blocked } from './ratspots';
import { groundLv } from '../shared/heights';

/** One animal: where (tiles), how high (tiles), which way it faces, and how to draw it at its feet on screen. */
export interface Beast { key: string; x: number; y: number; up: number; draw: (c: Ctx, px: number, py: number) => void }
type At = { x: number; y: number };

/** A repeatable 0..1 from two numbers. */
const hash = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const near = (heroes: At[], x: number, y: number) => {
  let best: At | null = null, d = Infinity;
  for (const h of heroes) {
    const e = Math.hypot(h.x - x, h.y - y);
    if (e < d) (d = e), (best = h);
  }
  return { h: best, d };
};

/** Wandering about a place: a fresh spot every few seconds, a third of the time getting there, the rest pecking. */
function wander(l: Life, i: number, now: number, period: number): { x: number; y: number; fx: number; pecking: boolean } {
  const s = (l.seed ?? 0) * 13 + i * 7.3, T = now / period + hash(s, 1), k = Math.floor(T), u = T - k, R = l.r ?? 1;
  const p = (j: number) => ({ x: l.x + (hash(s, j) - 0.5) * 2 * R, y: l.y + (hash(s + 3, j) - 0.5) * 1.2 * R });
  const a = p(k), b = p(k + 1), m = Math.min(1, u * 3), e = m * m * (3 - 2 * m);
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, fx: b.x >= a.x ? 1 : -1, pecking: u > 0.34 && Math.floor(now * 3 + i) % 3 === 0 };
}

function hen(c: Ctx, px: number, py: number, fx: number, peck: boolean, flap: boolean, cock: boolean): void {
  const g = c.lit, X = Math.round(px), Y = Math.round(py), f = fx, r = (dx: number, dy: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(X + (f < 0 ? -dx - w + 1 : dx), Y + dy, w, h));
  g.fillStyle = 'rgba(0,0,0,0.28)', g.fillRect(X - 3, Y, 7, 1);
  const body = cock ? '#7a3a22' : '#a08060', dark = cock ? '#3a2a24' : '#7a5e44';
  r(-3, -5, 6, 4, body), r(-4, -6, 2, 3, cock ? '#2a4a3a' : dark), r(-2, -2, 4, 1, dark);
  if (flap) r(-2, -8, 5, 2, body);
  r(1, peck ? -3 : -7, 3, 3, body), r(3, peck ? -2 : -6, 1, 1, '#c8a040'), r(1, peck ? -4 : -8, 2, 1, '#b8322a');
  r(-1, -1, 1, 1, '#c8a040'), r(1, -1, 1, 1, '#c8a040');
}

function duck(c: Ctx, px: number, py: number, fx: number, small: boolean, wet: boolean, step: number): void {
  const g = c.lit, X = Math.round(px), Y = Math.round(py), f = fx, r = (dx: number, dy: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(X + (f < 0 ? -dx - w + 1 : dx), Y + dy, w, h));
  if (wet) g.fillStyle = 'rgba(200,210,220,0.35)', g.fillRect(X - (small ? 2 : 4), Y, small ? 5 : 9, 1);
  else g.fillStyle = 'rgba(0,0,0,0.28)', g.fillRect(X - 2, Y, 5, 1);
  const lift = wet ? 1 : 0;
  if (small) return r(-1, -3 + lift, 3, 2, '#c8b060'), r(1, -4 + lift, 2, 2, '#c8b060'), void r(3, -3 + lift, 1, 1, '#c88a30');
  r(-3, -4 + lift, 6, 3, '#8a7a5a'), r(-3, -4 + lift, 2, 1, '#6a5a44'), r(-1, -3 + lift, 3, 1, '#3a4a6a');
  r(2, -7 + lift, 2, 3, '#4a3a2a'), r(4, -6 + lift, 2, 1, '#c88a30');
  if (!wet) r(-1 + step, -1, 1, 1, '#c88a30'), r(1 - step, -1, 1, 1, '#c88a30');
}

function cat(c: Ctx, px: number, py: number, now: number, seed: number, curled: boolean, look: number): void {
  const g = c.lit, X = Math.round(px), Y = Math.round(py), r = (dx: number, dy: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(X + dx, Y + dy, w, h));
  const fur = seed % 2 ? '#3a3238' : '#7a5a3a', dark = seed % 2 ? '#24202a' : '#5a4028', t = now + seed * 3;
  if (curled) {
    // Asleep in a ring, the tail round the nose, breathing.
    const b = Math.floor(t * 0.8) % 2;
    return r(-4, -3 - b, 8, 3 + b, fur), r(-4, -1, 8, 1, dark), r(2, -4 - b, 3, 2, fur), void r(-4, -1, 6, 1, dark);
  }
  // Sitting up: haunches, chest, head with its ears, the tail hanging down the crates and flicking.
  r(-3, -5, 6, 5, fur), r(-2, -9, 4, 4, fur), r(-2, -10, 1, 1, fur), r(1, -10, 1, 1, fur), r(-1, -3, 2, 3, dark);
  const flick = Math.floor(t * 1.3) % 5 === 0 ? 1 : 0;
  r(3, -2, 1, 4 + flick, fur), r(3 + flick, 2 + flick, 1, 2, fur);
  // Washing a paw now and then; otherwise looking your way.
  if (Math.floor(t * 0.25) % 4 === 0) return r(-3 + Math.floor(t * 4) % 2, -8, 2, 3, fur);
  const ex = look < 0 ? -2 : look > 0 ? 0 : -1, blink = Math.floor(t * 0.6) % 7 === 0;
  if (blink) return r(ex, -8, 3, 1, dark);
  if (dusk() > 0.4) (c.glow.fillStyle = '#c8e050'), c.glow.fillRect(X + ex, Y - 8, 1, 1), c.glow.fillRect(X + ex + 2, Y - 8, 1, 1);
  else r(ex, -8, 1, 1, '#141218'), r(ex + 2, -8, 1, 1, '#141218');
}

function pigeon(c: Ctx, px: number, py: number, fx: number, peck: boolean, fly: number, now: number): void {
  const g = c.lit, X = Math.round(px), Y = Math.round(py), f = fx, r = (dx: number, dy: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(X + (f < 0 ? -dx - w + 1 : dx), Y + dy, w, h));
  g.fillStyle = 'rgba(0,0,0,0.25)', g.fillRect(X - 2, Y + fly, 4, 1);
  r(-2, -3, 4, 2, '#6a6878'), r(-2, -2, 2, 1, '#4a4858'), r(1, peck ? -2 : -4, 2, 2, '#5a5868'), r(1, peck ? -1 : -3, 1, 1, '#3a5a4a');
  if (fly) {
    const up = Math.floor(now * 14) % 2;
    r(-4, up ? -6 : -2, 3, 1, '#8a8898'), r(2, up ? -6 : -2, 3, 1, '#8a8898');
  }
}

/** The pond a duck is swimming on, if any. */
const onWater = (m: GameMap, x: number, y: number) => (m.water ?? []).some((w) => x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h);

/** Along a closed path, `d` tiles from its start (wrapping). */
function along(path: [number, number][], d: number): { x: number; y: number; fx: number } {
  const segs = path.map((a, i) => ({ a, b: path[(i + 1) % path.length] })).map((s) => ({ ...s, len: Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) }));
  const total = segs.reduce((s, q) => s + q.len, 0);
  let u = ((d % total) + total) % total;
  for (const s of segs) {
    if (u <= s.len) return { x: s.a[0] + ((s.b[0] - s.a[0]) * u) / s.len, y: s.a[1] + ((s.b[1] - s.a[1]) * u) / s.len, fx: s.b[0] >= s.a[0] ? 1 : -1 };
    u -= s.len;
  }
  return { x: path[0][0], y: path[0][1], fx: 1 };
}

/**
 * (x, y) kept on open ground at the flock's own level: pulled back toward its middle (l.x, l.y) until it is out of
 * any building, wall, solid thing or water. A flock's ring was laid as a circle and ran into walls in the new town
 * (Kyle, 2026-11-20: animals not knowing where they are).
 */
function keepOn(m: GameMap, l: Life, x: number, y: number): [number, number] {
  const lv = groundLv(m, l.x, l.y), wet = (px: number, py: number) => (m.water ?? []).some((w) => px > w.x && px < w.x + w.w && py > w.y && py < w.y + w.h);
  for (const k of [1, 0.75, 0.5, 0.25]) {
    const px = l.x + (x - l.x) * k, py = l.y + (y - l.y) * k;
    if (!blocked(m, px, py) && !wet(px, py) && groundLv(m, px, py) === lv) return [px, py];
  }
  return [l.x, l.y];
}

export function lifeFigs(m: GameMap, now: number, heroes: At[]): Beast[] {
  const out: Beast[] = [];
  (m.life ?? []).forEach((l, li) => {
    if (l.kind === 'hens') for (let i = 0; i < (l.n ?? 4); i++) {
      // A hero's feet among them: they run off a step or two, wings going.
      const w = wander(l, i, now, 4.5), { h, d } = near(heroes, w.x, w.y), scare = h && d < 1.4 ? (1.4 - d) / 1.4 : 0;
      const [x, y] = keepOn(m, l, w.x + (h && scare ? ((w.x - h.x) / (d || 1)) * scare * 1.6 : 0), w.y + (h && scare ? ((w.y - h.y) / (d || 1)) * scare * 1.2 : 0));
      const fx = scare && h ? (x >= h.x ? 1 : -1) : w.fx;
      out.push({ key: `l${li}h${i}`, x, y, up: 0, draw: (c, px, py) => hen(c, px, py, fx, !scare && w.pecking, scare > 0.2 && Math.floor(now * 10) % 2 === 0, i === 0) });
    }
    if (l.kind === 'ducks' && l.path) for (let i = 0; i < (l.n ?? 4); i++) {
      // The mother first, the ducklings after her; a little stop and start in the walk.
      const d = now * 0.32 + Math.sin(now * 0.7) * 0.4 - (i ? 0.55 + i * 0.32 : 0), p = along(l.path, d), wet = onWater(m, p.x, p.y);
      out.push({ key: `l${li}d${i}`, x: p.x, y: p.y, up: 0, draw: (c, px, py) => duck(c, px, py, p.fx, i > 0, wet, Math.floor(now * 6 + i) % 2) });
    }
    if (l.kind === 'cat') {
      const { h, d } = near(heroes, l.x, l.y), look = h && d < 4 ? Math.sign(h.x - l.x) : 0;
      out.push({ key: `l${li}c`, x: l.x, y: l.y, up: l.up ?? 0, draw: (c, px, py) => cat(c, px, py, now, l.seed ?? 0, (l.seed ?? 0) % 2 === 0, look) });
    }
    if (l.kind === 'pigeons') {
      // Close by, the whole lot clatter up and circle off; they drop back once you've gone.
      const { d } = near(heroes, l.x, l.y), up = d < 2.2 ? Math.min(1, (2.2 - d) / 0.8) : 0;
      for (let i = 0; i < (l.n ?? 5); i++) {
        const w = wander(l, i, now, 2.6), a = now * 1.6 + i * 0.9, fly = Math.round(up * (18 + (i % 3) * 5));
        const [x, y] = up ? [w.x + Math.cos(a) * up * 1.4, w.y + Math.sin(a) * up * 0.8] : keepOn(m, l, w.x, w.y), fx = up ? (Math.sin(a) > 0 ? -1 : 1) : w.fx;
        out.push({ key: `l${li}p${i}`, x, y, up: fly / 16, draw: (c, px, py) => pigeon(c, px, py, fx, !up && w.pecking, fly, now) });
      }
    }
  });
  return out;
}
