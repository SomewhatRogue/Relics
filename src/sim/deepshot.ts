/**
 * The watch bow upright (deep): the arrow leaves the hero's eye along the sight and flies out up the
 * field, taking time to get there (far goblins need leading), dropping as it goes; a tap is slow and
 * wild, a full draw fast and tight, so its spread and drop at range are far smaller. It stops in the
 * first goblin whose plane it passes through inside a zone, or in the ground (a miss).
 */
import { DEEP, DEEP_BOW, EYE } from '../shared/deeptune';
import { deepAt, deepFirstHit } from './deepzones';
import { aimOf, drawOf, miss } from './watchshot';
import { land, type HitView } from './watchhit';
import type { WatchState } from './watchtypes';

/** Upright: where goblins stand and how loose things fly (metres: x across, y up, d out). */
export const DEEP_HITS: HitView = {
  feet: (g) => {
    const { u, d } = deepAt(g);
    return { x: u, y: 0, d };
  },
  ang: () => 0,
  bit: (what, g, x, y, i) => {
    const { d } = deepAt(g), side = g.id % 2 ? 1 : -1;
    if (what === 'helmet') return { kind: 'helmet', x, y, d, vx: side * 1.4, vy: 3.2, vd: 1.2, rot: 0, spin: side * 14 };
    if (what === 'plank') return { kind: 'plank', x: x + (i - 1) * 0.15, y, d, vx: (i - 1) * 1.2, vy: 1.5, vd: 0.4, rot: 0, spin: (i - 1) * 6 };
    if (what === 'torch' || what === 'drop') return { kind: 'torch', x: what === 'drop' ? x + 0.3 : x, y: what === 'drop' ? 1.4 : y, d, vx: side * 0.6, vy: 0.8, vd: 0, rot: 0, spin: side * 5 };
    return { kind: 'arrow', x, y, d, vx: side * 0.5, vy: what === 'glance' ? 2 : 0.5, vd: -0.5, rot: 0, spin: 9 };
  },
};

/** Loose an arrow out along the sight, as hard as the draw. */
export function deepLoose(s: WatchState): void {
  const p = drawOf(s), [ax, ay] = aimOf(s), spread = ((DEEP_BOW.spreadTap + (DEEP_BOW.spreadFull - DEEP_BOW.spreadTap) * p) * Math.PI) / 180;
  const tu = ax + s.rng.range(-spread, spread), td = ay + s.rng.range(-spread, spread), n = Math.hypot(tu, 1, td);
  const v = DEEP_BOW.vTap + (DEEP_BOW.vFull - DEEP_BOW.vTap) * p;
  s.arrows.push({ x: 0, y: EYE.up, d: -EYE.back, vx: (tu / n) * v, vy: (-td / n) * v, vd: v / n, power: p });
  s.shots++;
  s.events.push({ k: 'loose', x: 0, y: EYE.up, d: -EYE.back, power: p });
}

/** Each arrow in flight one step on: into a goblin, into the ground, or past the far edge. */
export function deepFly(s: WatchState, dt: number): void {
  s.arrows = s.arrows.filter((a) => {
    const x0 = a.x, y0 = a.y, d0 = a.d!;
    a.vy -= DEEP_BOW.gravity * dt;
    a.x += a.vx * dt, a.y += a.vy * dt, a.d = d0 + a.vd! * dt;
    const hit = deepFirstHit(s.gobs, x0, y0, d0, a.x, a.y, a.d);
    if (hit) return land(s, DEEP_HITS, a, hit.gob, hit.part, hit.x, hit.y), false;
    if (a.y <= 0) {
      // Into the field: where along the step it met the ground.
      const k = y0 / (y0 - a.y), x = x0 + (a.x - x0) * k, d = d0 + (a.d - d0) * k;
      s.pins.push({ x, y: 0, d, ang: 0, t: s.t });
      return miss(s, x, 0, d), false;
    }
    if (a.d > DEEP.far + 25 || Math.abs(a.x) > 60) return miss(s, a.x, a.y, a.d), false;
    return true;
  });
}
