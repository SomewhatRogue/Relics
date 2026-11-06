/**
 * The watch bow: the draw, the loose, the arrow's flight (it drops a little over distance) and what it
 * hits. Head x2, body x1, legs slow; a helmet comes off at the first head hit; a shield splinters and
 * breaks; a torch hit drops it and sets its bearer alight. A miss, or nothing hit, breaks the streak.
 */
import { BOW, FIELDS, FOES, WATCH, groundY } from '../shared/watchtune';
import { firstHit, feet, type Hit } from './watchzones';
import { breakStreak, scoreHit, scoreKill } from './watchscore';
import type { Arrow, Gob, Part, WatchState } from './watchtypes';

/** How far along the draw is (0 a tap .. 1 full). */
export const drawOf = (s: WatchState) => Math.min(1, s.draw / BOW.full);
/** The near miss's shake on the sight: a quick wobble, fading out (the same on screen as in the shot). */
export function aimOf(s: WatchState): [number, number] {
  const left = s.shakeUntil - s.t;
  if (left <= 0) return [s.ax, s.ay];
  const a = FOES.shakePx * (left / FOES.shake);
  return [s.ax + Math.sin(s.t * 37) * a, s.ay + Math.cos(s.t * 29) * a];
}

/** Loose an arrow at the sight, as hard as the draw (a tap flies slower and a little wild). */
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
    if (hit) return land(s, a, hit, x0 + dx * hit.at, y0 + dy * hit.at), false;
    a.x += dx, a.y += dy;
    const gy = groundY(a.x, s.field);
    if (a.y >= gy) {
      s.pins.push({ x: a.x, y: gy, ang: Math.atan2(a.vy, a.vx), t: s.t });
      return miss(s, a.x, a.y), false;
    }
    if (a.x < FIELDS[s.field].from - 40 || a.x > WATCH.w + 20 || a.y > FIELDS[s.field].h + 20) return miss(s, a.x, a.y), false;
    return true;
  });
}

function miss(s: WatchState, x: number, y: number): void {
  breakStreak(s);
  s.events.push({ k: 'miss', x, y });
}

/** An arrow lands on a goblin's `part` at (x, y). */
function land(s: WatchState, a: Arrow, h: Hit, x: number, y: number): void {
  const g = h.gob, [fx, fy] = feet(g), ang = Math.atan2(a.vy, a.vx), ev = { x, y, gob: g.id };
  scoreHit(s);
  const glance = () => s.bits.push({ kind: 'arrow', x, y, vx: -a.vx * 0.15, vy: -30, rot: ang, spin: 9, t: s.t, rest: false });
  if (h.part === 'shield') {
    g.shieldHp--;
    g.stuck.push({ dx: x - fx, dy: y - fy, ang, on: 'shield' });
    if (g.shieldHp > 0) return void s.events.push({ k: 'splinter', ...ev });
    // Broken: its planks fall, and the arrows in it with them.
    for (let i = 0; i < 3; i++) s.bits.push({ kind: 'plank', x: fx + 5, y: fy - 12 + i * 4, vx: 10 + i * 8, vy: -25 - i * 10, rot: 0, spin: (i - 1) * 6, t: s.t, rest: false });
    for (const k of g.stuck.filter((q) => q.on === 'shield')) s.bits.push({ kind: 'arrow', x: fx + k.dx, y: fy + k.dy, vx: 6, vy: -10, rot: k.ang, spin: 4, t: s.t, rest: false });
    g.stuck = g.stuck.filter((q) => q.on !== 'shield');
    return void s.events.push({ k: 'shieldbreak', ...ev });
  }
  if (h.part === 'torch') {
    g.torch = false;
    g.burning = s.t;
    g.at = s.t;
    s.bits.push({ kind: 'torch', x, y, vx: -8, vy: -20, rot: 0, spin: -5, t: s.t, rest: false });
    return void s.events.push({ k: 'torch', ...ev });
  }
  if (h.part === 'head' && g.helmet) {
    // The first head hit takes the helmet, spinning off the way the arrow was going; the arrow glances.
    g.helmet = false;
    s.bits.push({ kind: 'helmet', x, y, vx: a.vx * 0.12 - 12, vy: -45, rot: 0, spin: -14, t: s.t, rest: false });
    glance();
    return void s.events.push({ k: 'helmet', ...ev });
  }
  g.stuck.push({ dx: x - fx, dy: y - fy, ang, on: 'gob' });
  s.events.push({ k: 'hit', part: h.part, ...ev });
  const hard = a.power >= BOW.hard ? 2 : 1;
  const dmg = h.part === 'head' ? hard * 2 : h.part === 'legs' ? BOW.legDmg : hard;
  if (h.part === 'legs') g.limp = true;
  g.hp -= dmg;
  if (g.hp <= 0) kill(s, g, h.part);
}

/** A goblin falls: points (the streak as it stands), and it lies there a while with the arrows in it. */
export function kill(s: WatchState, g: Gob, how: Part | 'fire'): void {
  const [fx, fy] = feet(g);
  g.state = 'dead';
  g.at = s.t;
  g.how = how;
  const pts = scoreKill(s, g, how);
  if (g.torch) (g.torch = false), s.bits.push({ kind: 'torch', x: fx + 5, y: fy - 20, vx: 6, vy: -10, rot: 0, spin: 4, t: s.t, rest: false });
  s.events.push({ k: 'kill', x: fx, y: fy - 16, gob: g.id, pts, head: how === 'head', how });
}
