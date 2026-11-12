/**
 * What THE LEECHMAN throws, drawn from its hand (client/leechdraw.ts): THE LINE whirling overhead and flying along its lane to
 * the hook, then hauled in; the slab of peat held high and heaved down its lane; the handful of leeches flung at a red circle.
 * The lanes are the ones the room judges (the attack's origin, direction, range and circle); art pixels are screen pixels over
 * `s`, the scale it is drawn at. Drawing only.
 */
import type { Enemy } from '../sim/types';
import { LEECHMAN } from '../shared/leechtune';
import { leech } from './leechlie';
import { PAL, type LeechPose } from './leechpose';
import { LEECH } from './leechstate';
import { PX } from './world';

const clamp = (v: number) => Math.min(1, Math.max(0, v));

export function leechLine(c: Ctx0, e: Enemy, p: LeechPose, f: number, X: number, Y: number, hand: [number, number], s: number): void {
  const g = c.lit, a = e.attack, now = c.now, tile = PX / s;
  if (p.whirl > 0) {
    // The loop of line whirled round its head, widening; the hook flying round at the end of it.
    const rw = 5 + 13 * p.whirl, ry = rw * 0.42, cx = hand[0] + f * 2, cy = hand[1] - 3, spin = now * 17 * f;
    for (let i = 0; i < 26; i++) {
      const an = spin - i * 0.16;
      g.fillStyle = i < 3 ? PAL.cord : i % 3 ? PAL.cordLo : PAL.cord;
      g.globalAlpha = 1 - i / 34;
      g.fillRect(Math.round(cx + Math.cos(an) * rw), Math.round(cy + Math.sin(an) * ry), 1, 1);
    }
    g.globalAlpha = 1;
    hook(c, cx + Math.cos(spin) * rw, cy + Math.sin(spin) * ry, 0.3);
    return;
  }
  if (p.cast && a) {
    // Out along the lane (its origin, aim and length are the room's): a line with a little sag, the hook at the end.
    const ex = hand[0] + a.dx * p.cast.d * tile, ey = hand[1] + a.dy * p.cast.d * tile - 2, sag = 1 + p.cast.slack * 14;
    cord(c, hand[0], hand[1], ex, ey, sag);
    hook(c, ex, ey, Math.atan2(a.dy, a.dx));
    return;
  }
  if (p.haul > 0 && !a) {
    // Hand over hand: the line comes in taut to where the hero was put.
    const hx = (LEECH.hookTo.x - e.x) * tile, hy = (LEECH.hookTo.y - e.y) * tile - 6;
    cord(c, hand[0], hand[1], X + hx, Y + hy, 0.5);
    return;
  }
  if (p.slab) {
    const sl = p.slab;
    if (sl.held !== undefined) return slab(g, hand[0] - f * 3, hand[1] - 5 + (1 - sl.held) * 2, now, 1, f);
    if (sl.fly !== undefined && a) {
      const d = (a.range ?? LEECHMAN.peat.range!) * sl.fly, arc = Math.sin(sl.fly * Math.PI) * 24;
      slab(g, X + a.dx * d * tile, Y - 30 + 24 * sl.fly + a.dy * d * tile - arc, now, 1 + sl.fly, f);
    }
    return;
  }
  if (p.fling !== null && p.fling < 1 && a) {
    // A handful flung at the red circle: each its own arc, tumbling.
    const tx = X + (a.cx - e.x) * tile, ty = Y + (a.cy - e.y) * tile;
    for (let i = 0; i < 6; i++) {
      const k = clamp(p.fling * 1.12 - i * 0.035), sx = (i - 2.5) * 2.2, sy = ((i * 5) % 7) - 3;
      leech(g, hand[0] + (tx + sx - hand[0]) * k, hand[1] + (ty + sy - 26 - hand[1]) * k + 26 * k - Math.sin(k * Math.PI) * 22, i + 3, now * 4, Math.floor(now * 12 + i) % 2 === 0);
    }
  }
}

type Ctx0 = import('./draw').Ctx;

/** A line from (x0, y0) to (x1, y1) sagging `sag` px between, in cord with its lit strands. */
function cord(c: Ctx0, x0: number, y0: number, x1: number, y1: number, sag: number): void {
  const n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) / 1.2));
  for (let i = 0; i <= n; i++) {
    const k = i / n, px = Math.round(x0 + (x1 - x0) * k), py = Math.round(y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * sag);
    c.lit.fillStyle = i % 2 ? PAL.cord : PAL.cordLo, c.lit.fillRect(px, py, 2, 2);
    // Over the red of its own lane: the bright strand on the unlit layer.
    c.glow.fillStyle = i % 4 < 2 ? '#fff0c0' : '#d8c488', c.glow.fillRect(px, py, 1, 2);
  }
}

/** The hook: a curved barb of iron with a glint. */
function hook(c: Ctx0, x: number, y: number, a: number): void {
  const g = c.lit, X = Math.round(x), Y = Math.round(y), d = Math.cos(a) >= 0 ? 1 : -1;
  g.fillStyle = PAL.iron;
  g.fillRect(X, Y - 2, 2, 6), g.fillRect(X + d, Y + 3, 2, 2), g.fillRect(X + 2 * d, Y + 2, 2, 2);
  g.fillStyle = '#7a8288', g.fillRect(X - d, Y - 1, 1, 1);
  c.glow.fillStyle = '#e8f0f4', c.glow.fillRect(X, Y - 2, 2, 6), c.glow.fillRect(X + d, Y + 3, 2, 2), c.glow.fillStyle = '#ffffff', c.glow.fillRect(X, Y - 2, 1, 1);
}

/** A slab of peat: black and fibrous, a tuft of dead grass on top, muddy water running off it. */
function slab(g: CanvasRenderingContext2D, x: number, y: number, now: number, k: number, f: number): void {
  const X = Math.round(x - 7 * k), Y = Math.round(y - 4 * k), w = Math.round(14 * k), h = Math.round(8 * k);
  g.fillStyle = '#1e160e', g.fillRect(X, Y, w, h);
  g.fillStyle = '#3a2c1c', g.fillRect(X + 1, Y, w - 2, 2);
  g.fillStyle = '#4e3c26', g.fillRect(X + 2, Y, w - 6, 1);
  g.fillStyle = '#2a1e12';
  for (let i = 2; i < h - 1; i += 2) g.fillRect(X + (i % 4), Y + i, w - 3, 1);
  g.fillStyle = '#6a7a3a', g.fillRect(X + 3, Y - 2, 1, 2), g.fillRect(X + 6, Y - 3, 1, 3), g.fillRect(X + 9, Y - 2, 1, 2);
  g.fillStyle = '#4a3a26';
  for (let i = 0; i < 4; i++) g.fillRect(X + 2 + i * 3, Y + h + Math.floor(((now * 3 + i * 0.31) % 1) * 8), 1, 2);
  void f;
}
