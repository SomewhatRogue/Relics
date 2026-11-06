/**
 * The new meaty sorts' turns (numbers: shared/meaty.ts). Each has one thing and one answer:
 * - the Planker's barn door takes everything from the front (`plankFaces`); it turns slowly and not at all
 *   while it bashes and stands after, so get to its side;
 * - the Swingle spins its flail in a striped ring round itself, then reels (`reelAt`): stunned, so the
 *   punish lands harder (GUARD.stunnedMult), as any blow on a stunned goblin does;
 * - the Forker jabs a red lane that starts FORKER.inner out (the tines): inside that it can't reach
 *   you, and it backs off, slower than you walk, to get its reach again.
 * The room's hooks: sim/ownfoes.ts (their turns and bodies), sim/combat.ts and sim/board.ts (the door).
 */
import { PLANKER, FORKER, HERO, SWINGLE } from '../shared/tuning';
import { held } from './damage';
import { begin, walk } from './enemies';
import type { Enemy, FightEvent, Hero } from './types';

export { meatySort } from '../shared/meaty';

const BODY: Record<string, { radius: number; weight: number }> = { planker: PLANKER, swingle: SWINGLE, forker: FORKER };

/** A new one's body: bigger and heavier than a small goblin's. */
export function shapeMeaty(e: Enemy): void {
  const b = e.variant && BODY[e.variant];
  if (b) (e.radius = b.radius), (e.weight = b.weight);
}

/**
 * Does the Planker's door meet something coming from the direction (`dx`, `dy`) (from the goblin toward
 * where it comes from)? Not when it's down: stunned, frozen, netted, pinned, or caught unaware.
 */
export function plankFaces(e: Enemy, dx: number, dy: number, now: number): boolean {
  if (e.variant !== 'planker' || e.alert === false || e.act === 'dead' || held(e, now)) return false;
  const l = Math.hypot(dx, dy) || 1;
  return (e.fx * dx + e.fy * dy) / l > PLANKER.cone;
}

/** How far out the Forker's tines start: inside FORKER.inner no part of you is on the lane. */
export const tinesFrom = () => FORKER.inner + HERO.radius + 0.2;

/** The Planker: in and bash, once it has turned its door to you. */
export function stepPlanker(e: Enemy, t: Hero, d: number, level: boolean, ux: number, uy: number, facing: number, speed: number, dt: number, ev: FightEvent[]): void {
  if (level && d <= PLANKER.reach && e.cooldown <= 0 && facing > 0.8) return begin(e, 'cleave', PLANKER.bash, t, ev);
  if (d > PLANKER.reach * 0.8) walk(e, ux, uy, speed * PLANKER.speed * Math.max(0.2, facing), dt);
}

/** The Swingle: reels once a spin is over; spins when someone is close; else comes on. */
export function stepSwingle(e: Enemy, t: Hero, d: number, level: boolean, ux: number, uy: number, facing: number, speed: number, now: number, dt: number, ev: FightEvent[]): void {
  if (e.spinAt !== undefined && e.spinAt > (e.reelAt ?? -99)) {
    e.reelAt = now;
    Object.assign(e, { act: 'stunned', actT: 0, actDur: SWINGLE.reel });
    ev.push({ k: 'stunned', x: e.x, y: e.y });
    return;
  }
  if (level && d <= SWINGLE.from && e.cooldown <= 0 && now - (e.spinAt ?? -99) >= SWINGLE.every) {
    e.spinAt = now;
    begin(e, 'slam', SWINGLE.spin, t, ev);
    // Round itself, whichever way it faces.
    if (e.attack) (e.attack.cx = e.x), (e.attack.cy = e.y);
    return;
  }
  if (d > 1.1) walk(e, ux, uy, speed * SWINGLE.speed * Math.max(0.2, facing), dt);
}

/** The Forker: off a step if you're inside its tines; a jab from its reach; else in to that reach. */
export function stepForker(e: Enemy, t: Hero, d: number, level: boolean, ux: number, uy: number, facing: number, speed: number, dt: number, ev: FightEvent[]): void {
  if (level && d < FORKER.inner + 0.15) return walk(e, -ux, -uy, speed * FORKER.speed * FORKER.back, dt);
  if (level && d <= FORKER.reach && e.cooldown <= 0 && facing > 0.85) {
    begin(e, 'stab', FORKER.jab, t, ev);
    // The lane starts at the tines.
    const a = e.attack, k = tinesFrom();
    if (a) (a.ox += a.dx * k), (a.oy += a.dy * k);
    return;
  }
  if (d > FORKER.reach * 0.85) walk(e, ux, uy, speed * FORKER.speed * Math.max(0.2, facing), dt);
}
