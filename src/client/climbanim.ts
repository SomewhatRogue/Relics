/**
 * A Rogue going up an earth face, seen as a climb (Kyle, 2026-11-25: "a climbing animation for the rogue when they're
 * going up terrain"). The rules (sim/climb.ts) set the hero on the top in one tick and push a `land` event with
 * `how: 'climb'` (where they stood below, the way they went). Drawn, they haul up from the foot of the face, over the
 * lip, in CLIMB.time seconds. Drawing only: nothing in the fight reads it, and the event reaches every player, so a
 * friend sees the same on their own screen.
 *
 * `startClimb` on the event; `climbOf(id, x, y)` each draw, with where the rules have that hero, says how far along
 * (the event names no hero: the one now standing a little way on in the way it went is the one who climbed);
 * `climbPlace` where to draw them, `climbPose` how the body is held (heropose steps 5 to 7, 15 to 17, 25 to 27).
 */
import type { BodyPose } from './motion';

export const CLIMB = { time: 0.35, claim: 0.3, near: 2.6, across: 0.5 };

interface Rise { x: number; y: number; dx: number; dy: number; t0: number; id?: string }
const live: Rise[] = [];
const clock = () => performance.now() / 1000;
const smooth = (k: number) => { const c = Math.min(1, Math.max(0, k)); return c * c * (3 - 2 * c); };

/** A climb begins: (x, y) where they stood below, (dx, dy) the way they went. */
export function startClimb(x: number, y: number, dx: number, dy: number, now = clock()): void {
  if (live.length > 24) live.length = 0;
  live.push({ x, y, dx, dy, t0: now });
}

export interface Climb {
  /** 0..1 through the climb. */
  k: number;
  /** The foot of the face. */
  fx: number; fy: number;
  /** The way they climb. */
  dx: number; dy: number;
  /** Share of the way up the face (0..1), and of the way across to the top. */
  rise: number; across: number;
  /** The pose: 0 reaching, 1 pulling, 2 a knee over the lip. */
  frame: 0 | 1 | 2;
}

/** How far along this hero's climb is at `now`, or null when they are not climbing. (x, y) is where the rules have them. */
export function climbOf(id: string, x: number, y: number, now = clock()): Climb | null {
  for (let i = live.length - 1; i >= 0; i--) if (now - live[i].t0 > CLIMB.time + 0.1) live.splice(i, 1);
  let r = live.find((q) => q.id === id);
  if (!r) {
    r = live.find((q) => {
      if (q.id || now - q.t0 > CLIMB.claim) return false;
      const ox = x - q.x, oy = y - q.y, along = ox * q.dx + oy * q.dy;
      return along > 0.5 && Math.hypot(ox, oy) < CLIMB.near && Math.abs(ox * q.dy - oy * q.dx) < 0.6;
    });
    if (!r) return null;
    r.id = id;
  }
  const k = (now - r.t0) / CLIMB.time;
  if (k < 0 || k >= 1) return null;
  return { k, fx: r.x, fy: r.y, dx: r.dx, dy: r.dy, rise: smooth(k / 0.85), across: smooth((k - CLIMB.across) / (1 - CLIMB.across)) ** 1.5, frame: k < 0.34 ? 0 : k < 0.68 ? 1 : 2 };
}

/** Where to draw a climber: up the face from the foot, then across the lip to the top. Heights from `h0` (below) to `h1` (the top). */
export function climbPlace(c: Climb, topX: number, topY: number, footX: number, footY: number, h0: number, h1: number): [number, number, number] {
  return [footX + (topX - footX) * c.across, footY + (topY - footY) * c.across, h0 + (h1 - h0) * c.rise];
}

/** The body held for a climb. `base`: 0 toward or away from you, 10 across the screen, 20 from the side. */
export function climbPose(p: BodyPose, c: Climb, base: number, flip: boolean): void {
  p.phase = 'rest';
  p.step = base + 5 + c.frame;
  // Reaching: both arms up the face; pulling: hauled in close; knee over: crouched onto the lip.
  p.raise = [3, 4, 1][c.frame];
  p.crouch = [0.04, 0.12, 0.2][c.frame];
  p.lean = base ? (flip ? -1 : 1) * [0, 1, 2][c.frame] : 0;
  p.reach = 0;
}
