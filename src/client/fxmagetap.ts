/**
 * The Mage's quick spells in the air and landing (cosmetic only; the room decides them): a spark or
 * lance in flight trails its element (fire throws embers that rise, frost leaves glitter hanging,
 * storm crackles); a quick cast going out throws a puff of the element off the hand; and
 * a quick blow or spell landing pops a small burst of its element on the goblin with a little flash of
 * light. All of it smaller than the held spell's burst and ring, so the heavy still lands bigger.
 */
import type { Augment } from '../shared/tuning';
import type { ArenaRoom } from '../sim/room';
import type { FightEvent, Hero } from '../sim/types';
import type { Fx } from './fx';
import { EL_COL, EL_LIGHT } from './palette';
import { TAP_SRC, heroAt, hitEl, noteBolts, tapCast, tapEl } from './magetap';
import { toPx } from './world';

/** Each element's motes: colours, drift (px/s; fire rises), life (s) and spread. */
const STYLE: Record<Augment, { cols: string[]; vy: number; life: number; jit: number }> = {
  fire: { cols: ['#fff1b0', '#ffd27a', '#ff9a3c', '#ff6a20'], vy: -22, life: 0.35, jit: 1.5 },
  frost: { cols: ['#ffffff', '#dff4ff', '#9fd8ff'], vy: 3, life: 0.45, jit: 2 },
  storm: { cols: ['#ffffff', '#fff27a', '#fff8c0'], vy: 0, life: 0.12, jit: 3.5 },
  '': { cols: ['#ffffff', '#c9a8ff', '#9a78e0'], vy: -6, life: 0.3, jit: 1.5 },
};

/** A few motes of an element at (x, y), thrown out at `speed`. */
function motes(fx: Fx, x: number, y: number, n: number, el: Augment, speed: number): void {
  const s = STYLE[el];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random() * 0.8), life = s.life * (0.6 + Math.random() * 0.6);
    fx.parts.push({ x: x + (Math.random() - 0.5) * s.jit, y: y + (Math.random() - 0.5) * s.jit, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.8 + s.vy, life, max: life, col: s.cols[i % s.cols.length], glow: true, grav: 0, stick: false });
  }
}

let owed = 0;
/** Every frame: the trails behind the Mage's sparks and lances, and what was flying (for the hits). */
export function mageTrails(fx: Fx, room: ArenaRoom, dt: number): void {
  noteBolts(room.bolts);
  owed += dt * 45;
  const n = Math.floor(owed);
  owed -= n;
  if (!n) return;
  for (const b of room.bolts) {
    if (b.kind !== 'spark' && b.kind !== 'lance') continue;
    const [x, y] = toPx(b.x, b.y), el = b.el, s = STYLE[el];
    for (let i = 0; i < n; i++) {
      // Spread back along the path it flew this frame, so the trail stays unbroken at speed.
      const back = Math.random() * 5, life = s.life * (0.6 + Math.random() * 0.6);
      fx.parts.push({ x: x - b.dx * back + (Math.random() - 0.5) * s.jit, y: y - 8 - b.dy * back + (Math.random() - 0.5) * s.jit, vx: (Math.random() - 0.5) * 8, vy: s.vy + (Math.random() - 0.5) * 6, life, max: life, col: s.cols[Math.floor(Math.random() * s.cols.length)], glow: true, grav: 0, stick: false });
    }
    // Storm: now and then a short crack of lightning off it.
    if (el === 'storm' && Math.random() < 0.3) {
      const a = Math.random() * Math.PI * 2;
      fx.arcs.push({ x, y: y + 2, x2: x + Math.cos(a) * 6, y2: y + 2 + Math.sin(a) * 4, life: 0.05 });
    }
  }
}

/** A quick cast going out (a puff), or a quick blow landing (a small burst, ring and flash). Adds; never replaces. */
export function mageTapFx(fx: Fx, ev: FightEvent, x: number, y: number, heroes: readonly Hero[]): void {
  if (ev.k === 'shoot' || ev.k === 'slash') {
    const h = heroAt(heroes, ev.x, ev.y);
    if (!h || !tapCast(h)) return;
    // (The ring at the focus is drawn in hand: castflourish.ts.)
    motes(fx, x + ev.dx * 10, y - 11 + ev.dy * 6, 6, tapEl(h), 35);
    return;
  }
  if (ev.k !== 'hit' || ev.on !== 'enemy' || ev.tick || !TAP_SRC.has(ev.src ?? '')) return;
  const el = hitEl(ev.src!, ev.x, ev.y, heroes), cy = y - 9;
  motes(fx, x, cy, 10, el, 60);
  fx.rings.push({ x, y: cy, life: 0.18, max: 0.18, col: EL_COL[el], size: 9 });
  fx.flashes.push({ x, y: cy, r: 40, i: 1, c: EL_LIGHT[el], life: 0.1, max: 0.1 });
  // Storm forks off what it hits; frost chips fall; fire leaves a puff of embers climbing.
  if (el === 'storm') for (let i = 0; i < 2; i++) {
    const a = Math.random() * Math.PI * 2;
    fx.arcs.push({ x, y: cy + 10, x2: x + Math.cos(a) * 10, y2: cy + 10 + Math.sin(a) * 7, life: 0.08 });
  }
  else if (el === 'frost') fx.burst(x, cy, 5, ['#ffffff', '#dff4ff'], 45, true, 160);
  else if (el === 'fire') motes(fx, x, cy - 3, 4, 'fire', 12);
}
