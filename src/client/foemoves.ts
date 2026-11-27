/**
 * The new goblin attacks in motion (docs/design/foe-patterns.md; Kyle, 2026-11-27: "smooth and dynamic"): a stone
 * flying to you at the throw, a fire pot arcing to where you stand with its fuse lit, the fuse fizzing on the slick
 * till it goes up, sparks scraping along a heavy's drag, and the whirl's ring and dust. Drawn from the room's own
 * attacks once a tick, into fx.ts, so both views show it. Cosmetic only (Math.random is fine).
 */
import type { ArenaRoom } from '../sim/room';
import type { Enemy } from '../sim/types';
import type { Fx } from './fx';
import { PX, toPx } from './world';

const STONE = ['#8a8494', '#6a647a'], POT = ['#6a4a2a', '#4a3420'], FUSE = ['#ffd27a', '#ff9a3c'], SPARK = ['#ffd27a', '#ffffff', '#ff9a3c'], DUST = ['#6a647a', '#57525e', '#8a8494'];
/** A thrown thing's pace (tiles a second), the pot's height at the top of its arc (screen pixels). */
const PACE = 26, ARC = 26;

let room: ArenaRoom | null = null, last = -1;

/** A short-lived mark at (tiles x, y), lifted `up` screen pixels: one stamp of a moving thing. */
function stamp(fx: Fx, x: number, y: number, up: number, col: string, glow: boolean, life = 0.06): void {
  const [px, py] = toPx(x, y);
  fx.parts.push({ x: px, y: py - up, vx: 0, vy: 0, life, max: life, col, glow, grav: 0, stick: false });
}

/** A few points along a moving thing's last stretch, so it reads as a streak between ticks. */
function streak(fx: Fx, at: (k: number) => [number, number, number], k0: number, k1: number, cols: string[], glow: boolean): void {
  for (let i = 0; i < 4; i++) {
    const [x, y, up] = at(k0 + ((k1 - k0) * i) / 3);
    stamp(fx, x, y, up, cols[i % cols.length], glow, 0.04 + i * 0.015);
  }
}

function moves(fx: Fx, e: Enemy, dt: number): void {
  const a = e.attack;
  if (!a || e.act !== 'attack') return;
  const t = a.t, w = a.windup;
  // A stone: from the hand to where the line ends, landing as the blow does.
  if (a.stone) {
    const len = Math.max(1, a.range), fly = Math.min(0.3, len / PACE), k = (t - (w - fly)) / fly;
    if (k > 0 && k <= 1.05) {
      const at = (q: number): [number, number, number] => [a.ox + a.dx * len * q, a.oy + a.dy * len * q, 14 - 6 * q];
      streak(fx, at, Math.max(0, k - dt / fly), Math.min(1, k), STONE, false);
    }
  }
  // A fire pot: up and over to where you stood, the fuse sparking on it.
  if (a.pot) {
    const d = Math.hypot(a.cx - a.ox, a.cy - a.oy), fly = Math.min(w * 0.55, Math.max(0.3, d / (PACE * 0.45))), k = (t - (w - fly)) / fly;
    if (k > 0 && k <= 1) {
      const at = (q: number): [number, number, number] => [a.ox + (a.cx - a.ox) * q, a.oy + (a.cy - a.oy) * q, 12 + Math.sin(q * Math.PI) * ARC];
      streak(fx, at, Math.max(0, k - dt / fly), k, POT, false);
      const [x, y, up] = at(k);
      stamp(fx, x, y, up + 3, FUSE[Math.floor(t * 30) % 2], true, 0.08);
    }
  }
  // The drag: sparks off the cleaver at its feet as it hauls back, then a scrape running down the line.
  if (a.kind === 'stab' && a.crush && a.range > 4) {
    if (t > w * 0.55 && t < w && Math.random() < 0.6) fx.burst(...toPx(e.x + a.dx * 0.6, e.y + a.dy * 0.6), 1, SPARK, 30, true);
    const run = a.active + 0.12, k = (t - w) / run;
    if (k > 0 && k <= 1) {
      const at = (q: number): [number, number, number] => [a.ox + a.dx * a.range * q, a.oy + a.dy * a.range * q, 1];
      streak(fx, at, Math.max(0, k - dt / run), k, SPARK, true);
      const [x, y] = at(k), [px, py] = toPx(x, y);
      fx.burst(px, py, 2, DUST, 24, false), fx.burst(px, py - 1, 2, SPARK, 40, true, 60);
    }
  }
  // The whirl: dust drawn round its feet as it winds, a ring and a burst with each hit.
  if (a.spin) {
    const r = a.radius;
    if (t < w && Math.random() < 0.7) {
      const q = Math.random() * Math.PI * 2, [px, py] = toPx(e.x + Math.cos(q) * r * 0.8, e.y + Math.sin(q) * r * 0.8);
      fx.parts.push({ x: px, y: py, vx: -Math.sin(q) * 40, vy: Math.cos(q) * 20, life: 0.25, max: 0.25, col: DUST[Math.floor(Math.random() * 3)], glow: false, grav: 0, stick: false });
    }
    if (t >= w && t - dt < w) {
      const [px, py] = toPx(e.x, e.y);
      fx.rings.push({ x: px, y: py, life: 0.3, max: 0.3, col: '#d8c8a8', size: r * PX });
      for (let i = 0; i < 10; i++) {
        const q = (i / 10) * Math.PI * 2, [sx, sy] = toPx(e.x + Math.cos(q) * r, e.y + Math.sin(q) * r);
        fx.parts.push({ x: sx, y: sy, vx: -Math.sin(q) * 60, vy: Math.cos(q) * 30 - 10, life: 0.22, max: 0.22, col: DUST[i % 3], glow: false, grav: 0, stick: false });
      }
    }
  }
  // A held swing: its feet scuff as it waits, shaking, on the blow.
  if (a.hold && t > w - a.hold && t < w && Math.random() < 0.25) fx.burst(...toPx(e.x, e.y), 1, DUST, 18, false);
}

/** Once a tick: every goblin's new attack in motion, and each fire pot's fuse on its slick. */
export function watchMoves(r: ArenaRoom, fx: Fx): void {
  if (r !== room) (room = r), (last = r.time);
  const dt = r.time - last;
  if (dt <= 0) return;
  last = r.time;
  for (const e of r.enemies) moves(fx, e, dt);
  for (const s of r.slicks) {
    if (s.fuse === undefined || s.lit >= 0) continue;
    // Fizzing faster the nearer it is.
    if (Math.random() < 0.5 + 0.5 * Math.min(1, 1 - (s.fuse - r.time))) {
      const [px, py] = toPx(s.x, s.y);
      fx.parts.push({ x: px + (Math.random() - 0.5) * 3, y: py - 2, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 30, life: 0.2, max: 0.2, col: FUSE[Math.floor(Math.random() * 2)], glow: true, grav: 60, stick: false });
    }
  }
}
