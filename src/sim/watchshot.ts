/**
 * The watch bow side-on: the draw, the loose, the arrow's flight (it drops a little over distance) and
 * where it lands (what that does: watchhit.ts). A miss, or nothing hit, breaks the streak. The upright
 * view's flight is deepshot.ts.
 */
import { BOW, FOES, SIDE, WATCH, groundY } from '../shared/watchtune';
import { DEEP } from '../shared/deeptune';
import { firstHit, feet } from './watchzones';
import { breakStreak } from './watchscore';
import { land, type HitView } from './watchhit';
import type { WatchState } from './watchtypes';

/** How far along the draw is (0 a tap .. 1 full). */
export const drawOf = (s: WatchState) => Math.min(1, s.draw / BOW.full);
/** The near miss's shake on the sight: a quick wobble, fading out (the same on screen as in the shot). */
export function aimOf(s: WatchState): [number, number] {
  const left = s.shakeUntil - s.t;
  if (left <= 0) return [s.ax, s.ay];
  const a = (s.field === 'deep' ? DEEP.shake : FOES.shakePx) * (left / FOES.shake);
  return [s.ax + Math.sin(s.t * 37) * a, s.ay + Math.cos(s.t * 29) * a];
}

/** Loose an arrow at the sight side-on, as hard as the draw (a tap flies slower and a little wild). */
export function loose(s: WatchState): void {
  const p = drawOf(s), [ax, ay] = aimOf(s);
  const wob = ((1 - p) * BOW.wobble * Math.PI) / 180, ang = Math.atan2(ay - WATCH.bowY, ax - WATCH.bowX) + s.rng.range(-wob, wob);
  const v = BOW.vTap + (BOW.vFull - BOW.vTap) * p;
  s.arrows.push({ x: WATCH.bowX, y: WATCH.bowY, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, power: p });
  s.shots++;
  s.events.push({ k: 'loose', x: WATCH.bowX, y: WATCH.bowY, power: p });
}

/** Each arrow in flight one step on: into a goblin, into the ground, or off the field. */
export function flyArrows(s: WatchState, dt: number): void {
  s.arrows = s.arrows.filter((a) => {
    const x0 = a.x, y0 = a.y;
    a.vy += BOW.gravity * dt;
    const dx = a.vx * dt, dy = a.vy * dt;
    const hit = firstHit(s.gobs, x0, y0, dx, dy);
    if (hit) return land(s, SIDE_HITS, a, hit.gob, hit.part, x0 + dx * hit.at, y0 + dy * hit.at), false;
    a.x += dx, a.y += dy;
    const gy = groundY(a.x);
    if (a.y >= gy) {
      s.pins.push({ x: a.x, y: gy, ang: Math.atan2(a.vy, a.vx), t: s.t });
      return miss(s, a.x, a.y), false;
    }
    if (a.x < SIDE.from - 40 || a.x > WATCH.w + 20 || a.y > SIDE.h + 20) return miss(s, a.x, a.y), false;
    return true;
  });
}

export function miss(s: WatchState, x: number, y: number, d?: number): void {
  breakStreak(s);
  s.events.push({ k: 'miss', x, y, d });
}

/** Side-on: where goblins stand and how loose things fly (field pixels, y down). */
export const SIDE_HITS: HitView = {
  feet: (g) => {
    const [x, y] = feet(g);
    return { x, y };
  },
  ang: (a) => Math.atan2(a.vy, a.vx),
  bit: (what, g, x, y, i, a) => {
    const [fx, fy] = feet(g), ang = a ? Math.atan2(a.vy, a.vx) : 0;
    if (what === 'glance') return { kind: 'arrow', x, y, vx: -(a?.vx ?? 0) * 0.15, vy: -30, rot: ang, spin: 9 };
    if (what === 'plank') return { kind: 'plank', x: fx + 5, y: fy - 12 + i * 4, vx: 10 + i * 8, vy: -25 - i * 10, rot: 0, spin: (i - 1) * 6 };
    if (what === 'shed') return { kind: 'arrow', x, y, vx: 6, vy: -10, rot: ang, spin: 4 };
    if (what === 'torch') return { kind: 'torch', x, y, vx: -8, vy: -20, rot: 0, spin: -5 };
    if (what === 'helmet') return { kind: 'helmet', x, y, vx: (a?.vx ?? 0) * 0.12 - 12, vy: -45, rot: 0, spin: -14 };
    return { kind: 'torch', x: fx + 5, y: fy - 20, vx: 6, vy: -10, rot: 0, spin: 4 };
  },
};
