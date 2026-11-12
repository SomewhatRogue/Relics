/**
 * THE LEECHMAN's leeches, the water line, and its other shapes (client/leechdraw.ts draws it standing): crawling in the
 * drained mud, sunk and slow; flat on its back in the shallows, dazed; its dead, the leeches inching off it. Drawing only.
 */
import type { Enemy } from '../sim/types';
import { line, stars, type Ctx } from './draw';
import { PAL, type LeechPose } from './leechpose';

type K = typeof PAL;
const cache = new Map<string, string>();

/** A rect in its own frame: `dx` forward (flipped by `f`), `dy` up from its feet. */
export function R(g: CanvasRenderingContext2D, f: number, X: number, Y: number, dx: number, dy: number, w: number, h: number, col: string): void {
  g.fillStyle = col;
  g.fillRect(f > 0 ? X + dx : X - dx - w, Y + dy, w, h);
}

/** `a` mixed `k` of the way to `b` (hex colours), kept. */
export function mixHex(a: string, b: string, k: number): string {
  const key = a + b + k, had = cache.get(key);
  if (had) return had;
  const va = parseInt(a.slice(1, 7), 16), vb = parseInt(b.slice(1, 7), 16), ch = (s: number) => Math.round(((va >> s) & 255) * (1 - k) + ((vb >> s) & 255) * k);
  const out = '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
  cache.set(key, out);
  return out;
}

/** One leech: a dark glossy slug, a bright line down its back, a wet red belly; it lengthens and shortens as it pulses, now and then it curls. */
export function leech(g: CanvasRenderingContext2D, x: number, y: number, ph: number, now: number, vert = false, fade = 1): void {
  const L = 5 + (Math.sin(now * 2.4 + ph * 2.1) > 0.45 ? 1 : 0), curl = Math.sin(now * 0.8 + ph * 5) > 0.9 ? 1 : 0, X = Math.round(x), Y = Math.round(y);
  const P = (dx: number, dy: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(X + (vert ? dy : dx), Y + (vert ? dx : dy), vert ? h : w, vert ? w : h));
  const was = g.globalAlpha;
  g.globalAlpha = was * fade;
  P(0, 0, L, 2, PAL.leech), P(1, 0, L - 2, 1, PAL.leechHi), P(0, 1, 1, 1, PAL.leechBelly), P(L - 1, curl ? -1 : 0, 1, 1, PAL.leech), P(L - 3, 2, 2, 1, PAL.leechBelly);
  g.globalAlpha = was;
}

/** What hangs on it and drips off it, over the standing body: leeches all over, a fistful when plucking, the water ringing its legs. */
export function leechBits(c: Ctx, e: Enemy, p: LeechPose, f: number, X: number, Y: number, cr: number, l: number, hands: { near: [number, number]; far: [number, number] }, wl: number, deep: boolean): void {
  const g = c.lit, now = c.now, ln = Math.round(l * 0.6), hd = 5 + p.head[0], ht = -40 + p.head[1];
  const at = (dx: number, dy: number, w = 4): [number, number] => [f > 0 ? X + dx + ln : X - dx - ln - w, Y + dy + cr];
  const spots: [number, number, number, boolean][] = [[-7, -34, 0, false], [1, -34, 1, false], [-8, -22, 2, false], [3, -25, 3, false], [-3, -14, 4, false], [5, -20, 5, false], [-13, -37, 6, false], [-11, -31, 7, true], [-14, -29, 8, false], [hd + 2, ht - 3, 9, true], [hd + 6, ht + 8, 10, false]];
  for (const [dx, dy, ph, vert] of spots) { const [x, y] = at(dx, dy); if (wl < 0 && y > Y + wl - 1) continue; leech(g, x, y, ph + e.id, now, vert); }
  // On the arms, hanging.
  for (const [h, from] of [[hands.near, X + f * 6], [hands.far, X - f * 3]] as [[number, number], number][]) {
    const mx = (from + h[0]) / 2, my = (Y - 30 + cr + h[1]) / 2 + 3;
    leech(g, mx - 1, my, 11 + e.id + h[0], now, true), leech(g, mx + (mx > from ? 2 : -3), my - 3, 13 + e.id, now, true);
  }
  // A fistful plucked off its own chest, writhing.
  if (p.pluck > 0) for (let i = 0; i < 4; i++) leech(g, hands.near[0] - 2 + (i % 2) * 3, hands.near[1] + 1 + i * 2, 20 + i, now * 3, true, p.pluck);
  // The water round its legs: rings at the line, a ripple spreading.
  if (wl < 0) {
    const rx = deep ? 14 : 11, ry = deep ? 4 : 3, spin = Math.floor(now * 4);
    for (let i = 0; i < 30; i++) {
      const an = (i / 30) * Math.PI * 2, front = Math.sin(an) > 0;
      if ((i + spin) % 3 === 0) continue;
      g.fillStyle = front ? PAL.foam : '#1e3840';
      g.fillRect(Math.round(X + Math.cos(an) * rx), Math.round(Y + wl + Math.sin(an) * ry), 1, 1);
    }
    const k = (now * 0.9 + e.id * 0.3) % 1;
    c.glow.globalAlpha = 0.5 * (1 - k), c.glow.fillStyle = PAL.foam;
    for (let i = 0; i < 24; i++) { const an = (i / 24) * Math.PI * 2; c.glow.fillRect(Math.round(X + Math.cos(an) * (rx + 3 + k * 8)), Math.round(Y + wl + 1 + Math.sin(an) * (ry + 1 + k * 3)), 1, 1); }
    c.glow.globalAlpha = 1;
  }
  if (p.mode === 'flounder' || p.mode === 'haulout') {
    // Spray off the thrashing, and the water pouring off it as it climbs out.
    for (let i = 0; i < 16; i++) {
      const ph = (now * 2.4 + i * 0.37) % 1, an = i * 2.4;
      g.fillStyle = i % 3 ? '#cfeeee' : '#7aa8b0';
      if (p.mode === 'flounder') g.fillRect(Math.round(X + Math.cos(an) * (6 + ph * 14)), Math.round(Y + wl - Math.sin(ph * Math.PI) * 14 + 2), 1, 1 + (i % 2));
      else g.fillRect(Math.round(X - f * 6 + Math.cos(an) * 8), Math.round(Y - 24 + ph * 24), 1, 2);
    }
  }
}

/** Crawling in the drained mud: down on its knuckles, belly in the muck, dragging itself, slow. */
export function crawlLeech(c: Ctx, e: Enemy, f: number, X: number, Y: number, p: LeechPose, k: K, rim: boolean): void {
  const g = c.lit, now = c.now, cr = Math.sin(now * 2.2 + e.id), r = (dx: number, dy: number, w: number, h: number, col: string) => R(g, f, X, Y, dx, dy, w, h, col);
  const drag = Math.round(cr * 2);
  if (!rim) {
    // The trench it ploughs, a dark wet smear behind it.
    r(-30, -3, 24, 3, '#1c1610'), r(-28, -4, 18, 1, '#2a2218'), r(-12, -2, 10, 1, '#34301e');
  }
  r(-17, -12, 7, 12, k.wader), r(-17, -12, 1, 12, k.waderHi), r(-19, -4, 9, 4, k.waderLo), r(-18, -3, 8, 3, k.mud), r(-16, -7, 3, 1, k.mudLo);
  r(-12, -19, 19, 13, k.wader), r(-12, -19, 19, 1, k.waderHi), r(-12, -8, 19, 2, k.waderLo), r(-12, -6, 19, 3, k.mud), r(-10, -5, 4, 1, k.mudLo), r(1, -4, 5, 1, k.mudLo);
  r(-5, -13, 2, 6, k.strap), r(2, -14, 2, 7, k.strap);
  r(2, -24, 10, 7, k.skin), r(2, -24, 10, 1, k.skinHi), r(-12, -24, 14, 6, k.skinLo), r(-10, -26, 8, 3, k.skin), r(-12, -22, 3, 4, k.skinDk);
  const hx = 10 + drag + p.head[0];
  r(hx, -21, 10, 9, k.skin), r(hx, -21, 10, 1, k.skinHi), r(hx + 10, -17, 3, 3, k.skinLo), r(hx + 1, -13, 9, 3, k.skinLo), r(hx + 2, -12, 8, 1, '#2a0f10'), r(hx + 3, -14, 1, 2, k.bone), r(hx + 7, -14, 1, 2, k.bone);
  r(hx + 6, -18, 3, 2, '#14200a'), r(hx + 1, -18, 3, 2, '#14200a');
  line(g, X + f * (hx + 1), Y - 17, f > 0 ? -2.7 : Math.PI + 2.7, 0, 9, k.skinLo, 3);
  // Arms ahead, hands sunk to the wrist, clawing turn about.
  for (const [sh, ph] of [[7, 0], [-1, Math.PI]] as [number, number][]) {
    const hxx = 17 + Math.sin(now * 2.2 + ph) * 5, a = Math.atan2(-3 - (-17), hxx - sh);
    line(g, X + f * sh, Y - 17, f > 0 ? a : Math.PI - a, 0, Math.hypot(hxx - sh, 14), ph ? k.skinLo : k.skin, 3);
    r(Math.round(hxx) - 1, -4, 5, 4, k.mudLo), r(Math.round(hxx) + 3, -3, 1, 1, k.bone);
  }
  if (rim) return;
  for (let i = 0; i < 5; i++) leech(g, X + f * (-10 + i * 4) - (f > 0 ? 0 : 3), Y - 19 - (i % 2) * 3 - (i === 0 ? 4 : 0), i + e.id, now, i === 3);
  if (p.stars) stars(c, X + f * 8, Y - 30, 4, 8);
  // Mud thrown up by its hands; its eyes glowing low.
  c.glow.fillStyle = k.eye, c.glow.globalAlpha = 0.55, c.glow.fillRect(f > 0 ? X + hx + 7 : X - hx - 7 - 3, Y - 19, 3, 3), c.glow.fillRect(f > 0 ? X + hx + 1 : X - hx - 1 - 3, Y - 19, 3, 3), c.glow.globalAlpha = 1;
}

/** Flat on its back, dazed, in the shallows (or prone and dead, the leeches leaving it). */
export function lieLeech(c: Ctx, e: Enemy, f: number, X: number, Y: number, p: LeechPose, k: K, lv: number, rim: boolean): void {
  const g = c.lit, now = c.now, dead = p.mode === 'dead', wl = lv ? -3 : 9, wt = (col: string) => mixHex(col, PAL.water, 0.5);
  const r = (dx: number, dy: number, w: number, h: number, col: string) => {
    if (dy + h <= wl || wl > 0) return R(g, f, X, Y, dx, dy, w, h, col);
    if (dy >= wl) return R(g, f, X, Y, dx, dy, w, h, wt(col));
    R(g, f, X, Y, dx, dy, w, wl - dy, col), R(g, f, X, Y, dx, wl, w, dy + h - wl, wt(col));
  };
  if (!rim && !lv) r(-26, -3, 52, 4, 'rgba(8,6,12,0.4)');
  if (!dead) {
    // On its back, knees up in their black boots, the great belly of leather, the hump under it, one arm flung up.
    r(-26, -13, 6, 8, k.wader), r(-27, -6, 8, 4, k.waderLo), r(-26, -13, 1, 8, k.waderHi), r(-22, -7, 6, 6, k.wader);
    r(-18, -11, 24, 11, k.wader), r(-18, -11, 24, 1, k.waderHi), r(-18, -2, 24, 2, k.waderLo), r(-13, -9, 3, 2, k.strap), r(-3, -9, 2, 7, k.strap), r(-15, -7, 5, 3, k.cordLo), r(-14, -7, 3, 1, k.cord);
    r(6, -11, 7, 10, k.skin), r(6, -11, 7, 1, k.skinHi), r(6, -3, 7, 3, k.skinLo);
    r(11, -11, 10, 9, k.skin), r(11, -11, 10, 1, k.skinHi), r(20, -7, 3, 3, k.skinLo), r(12, -3, 9, 3, k.skinLo), r(14, -4, 1, 2, k.bone), r(17, -4, 1, 2, k.bone);
    r(16, -8, 3, 3, '#14200a'), r(12, -8, 3, 3, '#14200a');
    line(g, X + f * 4, Y - 10, f > 0 ? -1.2 : Math.PI + 1.2, 0, 13, k.skin, 3);
    line(g, X + f * 10, Y - 4, f > 0 ? 0.3 : Math.PI - 0.3, 0, 14, k.skinLo, 3);
    if (!rim) {
      const w = Math.floor(now * 3) % 2;
      c.glow.globalAlpha = 0.7 - 0.3 * w, c.glow.fillStyle = k.eye, c.glow.fillRect(f > 0 ? X + 16 : X - 19, Y - 8, 3, 2), c.glow.fillRect(f > 0 ? X + 12 + w : X - 15 - w, Y - 8, 3, 2), c.glow.globalAlpha = 1;
      for (let i = 0; i < 6; i++) leech(g, X + f * (-12 + i * 4) - (f > 0 ? 0 : 3), Y - 13 - (i % 2), i + e.id, now, false);
      if (p.stars) stars(c, X + f * 14, Y - 18, 4, 8);
    }
  } else {
    // Prone, face down in the mud, arms spread; leeches inching off it into the muck.
    r(-24, -8, 24, 8, k.wader), r(-24, -8, 24, 1, k.waderHi), r(-24, -2, 24, 2, k.mudLo), r(-7, -8, 2, 8, k.strap), r(4, -8, 2, 8, k.strap);
    r(-6, -10, 14, 8, k.skinLo), r(-4, -10, 10, 2, k.skin), r(7, -8, 9, 7, k.skin), r(7, -2, 9, 2, k.skinLo), r(15, -5, 3, 2, k.skinLo);
    line(g, X + f * 4, Y - 6, f > 0 ? -0.5 : Math.PI + 0.5, 0, 14, k.skin, 3), line(g, X - f * 2, Y - 2, f > 0 ? 2.9 : Math.PI - 2.9, 0, 12, k.skinLo, 3);
    if (!rim) for (let i = 0; i < 7; i++) {
      const ph = (c.now * 0.35 + i * 0.29) % 1, an = i * 0.9 + 0.5;
      leech(g, X + Math.cos(an) * (6 + ph * 26), Y - 5 + Math.sin(an) * (3 + ph * 8), i, c.now * 0.6, false, Math.max(0, 1 - ph * ph));
    }
  }
  void e;
}
