/**
 * A frozen goblin skidding off a heavy hit, and its crash (cosmetic only; the room decides both:
 * sim/iceslide.ts). Sent off: a puff of frost and a streak. Skidding: an ice trail left on the floor
 * behind it and glitter thrown off the sides. The crash: shards sprayed on along the slide, a ring at
 * the burst's own reach, a flash and a screen shake (the SHATTER callout is the 'shatter' event's).
 * Effects live in world pixels, so the 2.5D view draws the same ones (three/overlay3d.ts).
 */
import type { ArenaRoom } from '../sim/room';
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { PX, toPx } from './world';

const ICE = ['#ffffff', '#dff4ff', '#9fd8ff', '#bfe8ff'];

/** Shards thrown along (dx, dy) in a fan, some falling to lie on the floor a moment. */
function spray(fx: Fx, x: number, y: number, dx: number, dy: number, n: number, speed: number, fan: number): void {
  const base = Math.atan2(dy, dx);
  for (let i = 0; i < n; i++) {
    const a = base + (Math.random() - 0.5) * fan, v = speed * (0.4 + Math.random() * 0.9), life = 0.45 + Math.random() * 0.45;
    fx.parts.push({ x, y: y - 8, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7 - 40 * Math.random(), life, max: life, col: ICE[i % ICE.length], glow: true, grav: 220, stick: false });
  }
}

/** The events: sent off, and the crash. True if it was one. */
export function iceFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  if (ev.k === 'fling') {
    // A puff of frost off the blow, and a streak the way it's going.
    fx.burst(x, y - 8, ev.big ? 16 : 10, ICE, 60, true);
    for (let i = 0; i < 8; i++) fx.parts.push({ x: x + ev.dx * i * 2, y: y - 6 + ev.dy * i * 1.6, vx: ev.dx * 60, vy: ev.dy * 48, life: 0.18, max: 0.18, col: '#ffffff', glow: true, grav: 0, stick: false });
    fx.rings.push({ x, y: y - 4, life: 0.2, max: 0.2, col: '#dff4ff', size: 10 });
    return true;
  }
  if (ev.k !== 'icecrash') return false;
  const rad = ev.r * PX;
  spray(fx, x, y, ev.dx, ev.dy, ev.big ? 70 : 30, ev.big ? 200 : 120, ev.big ? 2.4 : 3.6);
  fx.burst(x, y - 8, ev.big ? 24 : 12, ICE, rad * 4, true, 0);
  fx.rings.push({ x, y, life: 0.4, max: 0.4, col: '#ffffff', size: rad * 1.2 });
  fx.rings.push({ x, y, life: 0.22, max: 0.22, col: '#9fd8ff', size: rad * 0.6 });
  fx.flashes.push({ x, y: y - 8, r: rad * 2.4, i: ev.big ? 1.6 : 1.1, c: [0.7, 0.9, 1], life: 0.2, max: 0.2 });
  // A rime left on the floor where it broke.
  for (let i = 0; i < (ev.big ? 26 : 12); i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * rad * 0.7;
    fx.decal(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, i % 3 ? '#8fb4c8' : '#c8e4f0');
  }
  fx.shake = Math.max(fx.shake, ev.big ? 8 : 5);
  return true;
}

/** Where each skidding goblin was drawn last frame, so its trail runs unbroken however far it went. */
const last = new Map<number, [number, number]>();
/** Every frame: each skidding goblin leaves a pale streak along the floor behind it and kicks glitter off it. */
export function iceTrails(fx: Fx, room: ArenaRoom, dt: number): void {
  const seen = new Set<number>();
  for (const e of room.enemies) {
    const s = e.sled;
    if (!s || e.act === 'dead') continue;
    seen.add(e.id);
    const [x, y] = toPx(e.x, e.y), [x0, y0] = last.get(e.id) ?? [x, y], sp = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sp, uy = s.vy / sp;
    last.set(e.id, [x, y]);
    const n = Math.max(1, Math.round(Math.hypot(x - x0, y - y0) * 1.5));
    for (let i = 0; i < n; i++) {
      const q = i / n, side = (Math.random() - 0.5) * 7, life = 0.5 + Math.random() * 0.45;
      fx.parts.push({ x: x0 + (x - x0) * q - uy * side, y: y0 + (y - y0) * q + ux * side * 0.5, vx: 0, vy: 0, life, max: life, col: ICE[i % ICE.length], glow: true, grav: 0, stick: false });
    }
    // Glitter kicked up off it as it goes.
    for (let i = 0; i < Math.ceil(dt * 50); i++) fx.parts.push({ x, y: y - 6, vx: -uy * (Math.random() - 0.5) * 140 - ux * 40, vy: ux * (Math.random() - 0.5) * 90 - 40, life: 0.3, max: 0.3, col: '#ffffff', glow: true, grav: 220, stick: false });
  }
  for (const id of last.keys()) if (!seen.has(id)) last.delete(id);
}
