/**
 * Dust at the feet, from what bodies do between room ticks: a roll, jump or dash landing, a heavy
 * stepping out of its charge, a sharp turn at speed, a slide from a blow coming to a stop, the butcher
 * pushing off for his leap and the Stoker setting off on his run. Cosmetic only (Math.random is fine).
 */
import { WEAPONS } from '../shared/tuning';
import type { ArenaRoom } from '../sim/room';
import type { Enemy, Hero } from '../sim/types';
import type { Fx } from './fx';
import { MOTION } from './motion';
import { toPx } from './world';

interface Track { x: number; y: number; dx: number; dy: number; turnAt: number; act: string; speed: number; k: number }
const seen = new Map<string, Track>();
let room: ArenaRoom | null = null, last = -1;
const COLS = ['#6a647a', '#57525e', '#8a8494'];

/** A low puff at the feet (tiles), thrown back along (bx, by) if given, else out to both sides. */
function puff(fx: Fx, x: number, y: number, n: number, bx = 0, by = 0): void {
  const [px, py] = toPx(x, y), M = MOTION.dust;
  for (let i = 0; i < n; i++) {
    const side = bx || by ? 1 : i % 2 ? 1 : -1, s = M.speed * (0.5 + Math.random() * 0.7), life = 0.18 + Math.random() * 0.16;
    const vx = bx || by ? -bx * s + (Math.random() - 0.5) * 10 : side * s, vy = bx || by ? -by * s * 0.5 - Math.random() * 6 : -Math.random() * 8;
    fx.parts.push({ x: px + (Math.random() - 0.5) * 4, y: py, vx, vy, life, max: life, col: COLS[i % 3], glow: false, grav: 0, stick: false });
  }
}

function track(key: string, x: number, y: number, act: string): Track {
  let s = seen.get(key);
  if (!s) seen.set(key, (s = { x, y, dx: 0, dy: 0, turnAt: -9, act, speed: 0, k: 0 }));
  return s;
}

/** Moving along: a sharp turn at speed kicks up dust (not more than every `turnGap`). */
function turned(fx: Fx, s: Track, x: number, y: number, dt: number, t: number): void {
  const mx = x - s.x, my = y - s.y, d = Math.hypot(mx, my), M = MOTION.dust;
  if (d / dt < M.minSpeed) return;
  const ux = mx / d, uy = my / d;
  if ((s.dx || s.dy) && ux * s.dx + uy * s.dy < M.turnDot && t - s.turnAt > M.turnGap) (s.turnAt = t), puff(fx, x, y, 3, ux, uy);
  (s.dx = ux), (s.dy = uy);
}

function hero(fx: Fx, h: Hero, dt: number, t: number): void {
  const s = track('h:' + h.id, h.x, h.y, h.act), dk = WEAPONS[h.weapon].dodge;
  if (s.act === 'roll' && h.act !== 'roll' && dk.kind !== 'blink') puff(fx, h.x, h.y, MOTION.dust.n);
  if (s.act === 'charge' && h.act === 'attack') puff(fx, h.x, h.y, 3, h.fx, h.fy);
  if (h.moving && h.act !== 'roll') turned(fx, s, h.x, h.y, dt, t);
  slid(fx, s, h.kvx, h.kvy, h.x, h.y);
  (s.x = h.x), (s.y = h.y), (s.act = h.act);
}

/** A slide from a blow coming to a stop. */
function slid(fx: Fx, s: Track, kvx: number, kvy: number, x: number, y: number): void {
  const v = Math.hypot(kvx, kvy);
  if (s.speed > 4 && v < 1.5) puff(fx, x, y, 3);
  s.speed = v;
}

function enemy(fx: Fx, e: Enemy, dt: number, t: number): void {
  if (e.act === 'dead' || e.act === 'carried') return void seen.delete('e:' + e.id);
  const s = track('e:' + e.id, e.x, e.y, e.act), a = e.attack;
  const k = a ? a.t / a.windup : 0, B = MOTION.butcher.slam;
  // The butcher pushes off for the leap; the Stoker's run starts.
  if (a?.kind === 'slam' && s.k < B.crouchShare && k >= B.crouchShare) puff(fx, e.x, e.y, MOTION.dust.n + 2);
  if (a?.kind === 'charge' && s.k < 1 && k >= 1) puff(fx, e.x, e.y, MOTION.dust.n, e.fx, e.fy);
  if (e.moving) turned(fx, s, e.x, e.y, dt, t);
  slid(fx, s, e.kvx, e.kvy, e.x, e.y);
  (s.x = e.x), (s.y = e.y), (s.act = e.act), (s.k = a ? k : 0);
}

/** Look at the room once a tick (between ticks nothing has moved). */
export function watchDust(r: ArenaRoom, fx: Fx): void {
  if (r !== room) (room = r), seen.clear(), (last = r.time);
  const dt = r.time - last;
  if (dt <= 0) return;
  last = r.time;
  for (const h of r.heroes) if (h.act !== 'down') hero(fx, h, dt, r.time);
  for (const e of r.enemies) enemy(fx, e, dt, r.time);
}
