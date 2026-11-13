/**
 * The Rogue's long cut (shared/cuttune.ts CUT; docs/design/deep-skills.md). One act, `cut`, in three beats by
 * the act's own clock:
 * 1. The stance (CUT.stance s): still, the line from the hero out to a wall or CUT.reach tiles showing on every
 *    screen (Hero.cutLine). The stick or the mouse can still swing it; a phone with neither turns to the
 *    nearest goblin as it starts. A blow that staggers the hero here loses it, and costs nothing.
 * 2. The slash: everything within CUT.band of the line is cut (marked with when it lands) and stands still; the
 *    hero crosses to the far end in CUT.dash s, untouchable (sim/combat.ts), and the wait begins.
 * 3. The sheathe (CUT.sheathe s): the blade put away. As it closes, every one cut takes it at once
 *    (stepCuts, from the room each tick: it lands even if the hero is knocked about by then).
 */
import { CUT } from '../shared/cuttune';
import { DEEP_COOLDOWN } from '../shared/deepskill';
import { HERO } from '../shared/tuning';
import { collide } from '../shared/arena';
import { shove } from './bodies';
import { damage, isDead } from './damage';
import { statsOf } from './gearstats';
import { stun } from './stuns';
import type { Enemy, FightEvent, Hero, Intent } from './types';

const STEP = 0.2;

/** Where a line from (x, y) along (fx, fy) stops: at the first wall a hero's body can't stand in, or at `reach`. */
export function lineEnd(x: number, y: number, fx: number, fy: number, reach = CUT.reach): { x: number; y: number } {
  let ex = x, ey = y;
  for (let d = STEP; d <= reach + 1e-6; d += STEP) {
    const q = { x: x + fx * d, y: y + fy * d };
    collide(q, HERO.radius);
    if (Math.hypot(q.x - (x + fx * d), q.y - (y + fy * d)) > 0.02) break;
    (ex = q.x), (ey = q.y);
  }
  return { x: ex, y: ey };
}

/** How far (x, y) is from the segment (x0, y0)-(x1, y1). */
export function offLine(x: number, y: number, x0: number, y0: number, x1: number, y1: number): number {
  const vx = x1 - x0, vy = y1 - y0, l2 = vx * vx + vy * vy;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((x - x0) * vx + (y - y0) * vy) / l2)) : 0;
  return Math.hypot(x - (x0 + vx * t), y - (y0 + vy * t));
}

/** The nearest goblin within reach, or none. */
function nearest(h: Hero, enemies: Enemy[]): Enemy | null {
  let best: Enemy | null = null, bd = CUT.reach;
  for (const e of enemies) {
    if (isDead(e) || e.act === 'carried' || (e.z ?? 0) !== (h.z ?? 0)) continue;
    const d = Math.hypot(e.x - h.x, e.y - h.y) - e.radius;
    if (d < bd) (bd = d), (best = e);
  }
  return best;
}

/** Turn to the aim (the mouse), else the stick; else, at the start only, the nearest goblin. */
function turn(h: Hero, inp: Intent, enemies: Enemy[], start: boolean): void {
  let x = inp.ax, y = inp.ay;
  if (!x && !y) (x = inp.mx), (y = inp.my);
  if (Math.hypot(x, y) < 0.05 && start) {
    const e = nearest(h, enemies);
    if (e) (x = e.x - h.x), (y = e.y - h.y);
  }
  const l = Math.hypot(x, y);
  if (l > 0.05) (h.fx = x / l), (h.fy = y / l);
}

const lineFrom = (h: Hero) => {
  const end = lineEnd(h.x, h.y, h.fx, h.fy);
  return { x0: h.x, y0: h.y, x1: end.x, y1: end.y };
};

/** The press taken: into the stance. */
export function startCut(h: Hero, inp: Intent, enemies: Enemy[], ev: FightEvent[]): void {
  turn(h, inp, enemies, true);
  Object.assign(h, { act: 'cut', actT: 0, kvx: 0, kvy: 0, cutLine: lineFrom(h) });
  ev.push({ k: 'cutstance', x: h.x, y: h.y, id: h.id });
}

/** The slash: who's on the line is cut, and stands still till it lands. */
function slash(h: Hero, enemies: Enemy[], now: number, ev: FightEvent[]): void {
  const c = h.cutLine!, l = Math.hypot(c.x1 - c.x0, c.y1 - c.y0) || 1, dx = (c.x1 - c.x0) / l, dy = (c.y1 - c.y0) / l;
  const at = now + CUT.dash + CUT.sheathe, n = Math.round(CUT.dmg * (1 + statsOf(h).damage));
  let cut = 0;
  for (const e of enemies) {
    if (isDead(e) || e.act === 'carried' || (e.z ?? 0) !== (h.z ?? 0) || e.longCut) continue;
    if (offLine(e.x, e.y, c.x0, c.y0, c.x1, c.y1) > CUT.band + e.radius) continue;
    e.longCut = { by: h.id, at, n, dx, dy };
    e.lastBy = h.id;
    stun(e, h.id, now, at - now + 0.05, ev, 'stunned', true);
    cut++;
  }
  h.deepReady = now + DEEP_COOLDOWN.cut;
  ev.push({ k: 'cutslash', x: c.x1, y: c.y1, x0: c.x0, y0: c.y0, id: h.id, n: cut });
}

/** The act, each tick. */
export function stepCut(h: Hero, inp: Intent, enemies: Enemy[], now: number, dt: number, ev: FightEvent[]): void {
  const t = h.actT, was = t - dt;
  if (!h.cutLine) return void Object.assign(h, { act: 'idle', actT: 0 });
  if (t < CUT.stance) {
    // The stance: the line can still be swung (it follows the hero's facing).
    turn(h, inp, enemies, false);
    h.cutLine = lineFrom(h);
    return;
  }
  const c = h.cutLine;
  if (was < CUT.stance) slash(h, enemies, now, ev);
  if (t < CUT.stance + CUT.dash) {
    const k = Math.min(1, (t - CUT.stance) / CUT.dash);
    h.x = c.x0 + (c.x1 - c.x0) * k;
    h.y = c.y0 + (c.y1 - c.y0) * k;
    return;
  }
  (h.x = c.x1), (h.y = c.y1);
  // Facing back down the line while the blade goes away.
  if (t >= CUT.stance + CUT.dash + CUT.sheathe) Object.assign(h, { act: 'idle', actT: 0, cutLine: undefined });
}

/** Crossing now: untouchable (sim/combat.ts asks). */
export const dashing = (h: Hero) => h.act === 'cut' && h.actT >= CUT.stance && h.actT < CUT.stance + CUT.dash;

/** Each tick, from the room: every cut whose moment has come lands, all at once. */
export function stepCuts(enemies: Enemy[], now: number, ev: FightEvent[]): void {
  for (const e of enemies) {
    const c = e.longCut;
    if (!c || now < c.at) continue;
    e.longCut = undefined;
    if (isDead(e)) continue;
    ev.push({ k: 'cutfall', x: e.x, y: e.y, id: c.by, dx: c.dx, dy: c.dy });
    if (damage(e, c.n, now, ev, { heavy: true, dx: c.dx, dy: c.dy })) continue;
    shove(e, c.dx, c.dy, CUT.knock, e.weight);
  }
}
