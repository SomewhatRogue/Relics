/**
 * A Mage's held spells going off, seen (sim/holds.ts decides them; each drawn at the size it was
 * judged at, `r` on the event): the cold blast a fan of frost thrown out to its reach, the frost nova
 * a ring of ice opening round the Mage, the lightning strike gold sparks where it's called and, as it
 * falls, a scorch, earth thrown up, cold sparks out to its edge and the screen shaking, the ring of fire and the charged ring flaring up as they're raised (they then burn on the
 * floor: spellground.ts), the shatter a burst of ice shards, the lunge and the dash a trail of their
 * element. And GRASP: violet streaks dragging inward. In the same style as the taps (fxmagetap.ts):
 * motes, rings and short flashes. Cosmetic only (Math.random is fine); the one overlay draws both views.
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { EL_COL, EL_LIGHT } from './palette';
import { PX, toPx } from './world';

const COLS = { fire: ['#fff1b0', '#ffd27a', '#ff9a3c', '#ff6a20'], frost: ['#ffffff', '#dff4ff', '#9fd8ff', '#7ab8e0'], storm: ['#ffffff', '#fff27a', '#fff8c0'] };
const VIOLET = ['#c9a8ff', '#ffffff', '#9a78e0'];

/** Motes thrown from (x, y) out along `a` (radians) within `spread`, reaching about `reach` px in `t` s. */
function fan(fx: Fx, x: number, y: number, a: number, spread: number, reach: number, n: number, cols: string[], t = 0.28): void {
  for (let i = 0; i < n; i++) {
    const b = a + (Math.random() - 0.5) * spread, v = (reach / t) * (0.55 + Math.random() * 0.5), life = t * (0.8 + Math.random() * 0.5);
    fx.parts.push({ x, y, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.8, life, max: life, col: cols[i % cols.length], glow: true, grav: 0, stick: false });
  }
}

/** Motes round a circle of `rad` px, thrown out (or in, `v` < 0). */
function round(fx: Fx, x: number, y: number, rad: number, n: number, cols: string[], v: number, rise = 0): void {
  for (let i = 0; i < n; i++) {
    const b = (i / n) * Math.PI * 2 + Math.random() * 0.2, life = 0.3 + Math.random() * 0.3;
    fx.parts.push({ x: x + Math.cos(b) * rad, y: y + Math.sin(b) * rad * 0.8, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.8 + rise, life, max: life, col: cols[i % cols.length], glow: true, grav: 0, stick: false });
  }
}

/** True if it was one of these (and has been drawn). */
export function spellFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  if (ev.k === 'grasp') {
    // The reach drawn as it was judged (Kyle: "not clear what's happening"): the cone's edge in violet,
    // then three waves of motes along its arc sweeping in to the spot ahead, so even an empty cast reads.
    const a = Math.atan2(ev.dy, ev.dx), half = ((ev.arc ?? 70) / 2) * (Math.PI / 180), R = ev.r * PX;
    const tx = x + ev.dx * 1.5 * PX, ty = y - 8 + ev.dy * 1.5 * PX * 0.8;
    const at = (b: number, d: number) => [x + Math.cos(b) * d, y - 8 + Math.sin(b) * d * 0.8] as const;
    for (const side of [-1, 1]) {
      const [ex, ey] = at(a + side * half, R);
      fx.arcs.push({ x, y: y - 8, x2: ex, y2: ey, life: 0.45, col: '#9a78e0', straight: true });
    }
    for (let wave = 0; wave < 3; wave++) {
      const d = R * (1 - wave * 0.22), n = 14 - wave * 3;
      for (let i = 0; i < n; i++) {
        const b = a - half + (i / (n - 1)) * half * 2, [sx, sy] = at(b, d), life = 0.32 + wave * 0.06;
        fx.parts.push({ x: sx, y: sy, vx: (tx - sx) / life, vy: (ty - sy) / life, life, max: life, col: VIOLET[(i + wave) % 3], glow: true, grav: 0, stick: false });
      }
    }
    fx.rings.push({ x: tx, y: ty, life: 0.45, max: 0.45, col: '#c9a8ff', size: 14 });
    fx.flashes.push({ x: x + ev.dx * R * 0.5, y: y - 8 + ev.dy * R * 0.4, r: R, i: 0.8, c: [0.8, 0.65, 1], life: 0.25, max: 0.25 });
    if (!ev.n) fx.say(tx, ty - 26, 'NOTHING IN REACH', '#c8c4d0', 1.1);
    return true;
  }
  if (ev.k === 'grasped') {
    const [x2, y2] = toPx(ev.x2, ev.y2);
    fx.arcs.push({ x, y: y - 8, x2, y2: y2 - 8, life: 0.2, col: '#c9a8ff', straight: true });
    return true;
  }
  if (ev.k === 'skystrike') {
    const rad = ev.r * PX, cols = ['#ffffff', '#c8dcff', '#9fb8ff'];
    fx.crater(x, y, ev.big ? 12 : 9);
    fx.debris(x, y - 2, ev.big ? 20 : 14);
    fx.burst(x, y - 6, ev.big ? 30 : 22, cols, 90, true);
    round(fx, x, y - 2, rad * 0.9, ev.big ? 26 : 18, cols, 30);
    fx.rings.push({ x, y, life: 0.3, max: 0.3, col: '#c8dcff', size: rad });
    fx.flashes.push({ x, y: y - 10, r: rad * 2 + 40, i: 1.6, c: [0.8, 0.88, 1], life: 0.2, max: 0.2 });
    fx.shake = Math.max(fx.shake, ev.big ? 7 : 5);
    return true;
  }
  if (ev.k !== 'spell') return false;
  const el = (ev.el || 'fire') as keyof typeof COLS, cols = COLS[el], rad = ev.r * PX, a = Math.atan2(ev.dy, ev.dx), big = ev.big ? 1.4 : 1;
  switch (ev.what) {
    case 'coldblast':
      fan(fx, x + ev.dx * 6, y - 9 + ev.dy * 5, a, (ev.big ? 100 : 70) * (Math.PI / 180), rad, Math.round(40 * big), cols);
      fx.flashes.push({ x: x + ev.dx * rad * 0.4, y: y - 8 + ev.dy * rad * 0.3, r: rad, i: 1.1, c: EL_LIGHT.frost, life: 0.2, max: 0.2 });
      fx.shake = Math.max(fx.shake, 2);
      break;
    case 'nova':
      round(fx, x, y - 6, 4, Math.round(36 * big), cols, rad / 0.3);
      fx.rings.push({ x, y: y - 4, life: 0.3, max: 0.3, col: '#ffffff', size: rad }, { x, y: y - 4, life: 0.4, max: 0.4, col: EL_COL.frost, size: rad * 0.9 });
      fx.flashes.push({ x, y: y - 6, r: rad * 1.4, i: 1.2, c: EL_LIGHT.frost, life: 0.22, max: 0.22 });
      fx.shake = Math.max(fx.shake, 3);
      break;
    case 'strike':
      // Called: a few gold sparks on the spot (its mark and the bolt are the room's: skystrikedraw.ts).
      round(fx, x, y - 2, rad * 0.5, 10, ['#ffe9a8', '#ffffff', '#c8dcff'], -10, -30);
      break;
    case 'flamering':
    case 'stormring':
      // Raised: the ring flares up all the way round (it then burns on the floor: spellground.ts).
      round(fx, x, y - 2, rad, Math.round(32 * big), cols, el === 'fire' ? 8 : 20, el === 'fire' ? -40 : 0);
      fx.rings.push({ x, y: y - 2, life: 0.3, max: 0.3, col: EL_COL[el], size: rad });
      fx.flashes.push({ x, y: y - 6, r: rad * 1.5, i: 1, c: EL_LIGHT[el], life: 0.25, max: 0.25 });
      fx.shake = Math.max(fx.shake, 2);
      break;
    case 'shatter':
      round(fx, x, y - 6, 6, Math.round(30 * big), ['#ffffff', '#dff4ff', '#9fd8ff'], rad / 0.25, -20);
      fx.rings.push({ x, y: y - 4, life: 0.25, max: 0.25, col: '#ffffff', size: rad });
      fx.flashes.push({ x, y: y - 8, r: rad * 1.3, i: 1.3, c: EL_LIGHT.frost, life: 0.18, max: 0.18 });
      fx.shake = Math.max(fx.shake, 4);
      break;
    case 'lunge':
    case 'dash': {
      // A trail laid down the whole way at once (the run takes a fifth of a second): embers or crackle.
      const n = Math.round(ev.r * 8);
      for (let i = 0; i <= n; i++) {
        const k = i / n, px = x + ev.dx * rad * k, py = y - 8 + ev.dy * rad * k * 0.8;
        fx.burst(px, py, 2, cols, el === 'fire' ? 18 : 30, true, el === 'fire' ? 0 : 0);
        if (el === 'storm' && i % 2 === 0) fx.arcs.push({ x: px, y: py, x2: px + (Math.random() - 0.5) * 10, y2: py + (Math.random() - 0.5) * 8, life: 0.12 });
      }
      fx.flashes.push({ x: x + ev.dx * rad * 0.5, y: y - 8 + ev.dy * rad * 0.4, r: rad, i: 1, c: EL_LIGHT[el], life: 0.2, max: 0.2 });
      break;
    }
    default:
      return false;
  }
  return true;
}
