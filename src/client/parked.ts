/**
 * Someone else at a pastime, as the town sees them (shared/pastimes.ts): parked at its spot in a loop
 * until they're done. Fishing, they sit on the bank with the rod out over the millpond, the float
 * bobbing and now and then dipping; at the butts, they stand side-on with the range's bow, draw, hold,
 * loose an arrow off toward the targets, and nock the next. Drawn only (idlepose.ts poses the body,
 * idledraw.ts calls `parkProps` for what's in hand); the loop runs on this screen's clock, staggered by
 * the hero's id, so nothing is sent to keep it going.
 */
import type { Hero } from '../sim/types';
import { hs } from './heroscale';
import type { PastimeId } from '../shared/pastimes';
import type { BodyPose } from './motion';
import type { Ctx } from './draw';
import { dot, skinOf, type PropAt } from './idlekit';
import { RAT_LOOP, ratPose, ratProps } from './parkedrat';

const parks = new WeakMap<Hero, PastimeId>();
/** Where in its loop each hero starts (from their id), so two at the butts don't loose together. */
const phase = (id: string) => {
  let x = 2166136261;
  for (let i = 0; i < id.length; i++) x = Math.imul(x ^ id.charCodeAt(i), 16777619);
  return ((x >>> 0) % 1000) / 1000;
};
/** Mark a hero parked at a pastime (townfolk.ts, from what they said), or back (null). */
export function setPark(h: Hero, id: PastimeId | null): void {
  if (id) parks.set(h, id);
  else parks.delete(h);
}
export const parkOf = (h: Hero): PastimeId | null => parks.get(h) ?? null;

/** The archer's loop (s): drawing, holding at full draw, the loose, nocking the next. */
export const SHOOT = { draw: 1.1, hold: 0.7, loose: 0.35, nock: 0.9 } as const;
const CYCLE = SHOOT.draw + SHOOT.hold + SHOOT.loose + SHOOT.nock;
/** The float's loop (s): how often it dips. */
const DIP = 5.5;

/** How far through its loop a parked hero is (s). */
export const parkT = (h: Hero, now: number, id: PastimeId) => (now + phase(h.id) * 7) % PARK_LOOP[id];

/** The body: sat down on the bank facing the water, or stood side-on to the butts with the bow up. */
export function parkPose(h: Hero, id: PastimeId, pz: BodyPose, t = 0): { flip: boolean; a: number; ext: number } {
  // At the Rat's table or its knife board, or at the anvil (parkedrat.ts).
  if (id === 'arm' || id === 'knives' || id === 'anvil') return ratPose(id, pz, t);
  if (id === 'fish') {
    // Sat on the bank (as low as the legs fold), the hands forward on the rod; the weapon laid down behind.
    (pz.crouch = 1), (pz.reach = 1), (pz.raise = 1), (pz.lean = 0);
    return { flip: h.fx < -0.2, a: Math.PI - 0.15, ext: -2 };
  }
  // The butts are up the screen and a little right: stood side-on to them, the bow arm out.
  (pz.reach = 1), (pz.raise = 2), (pz.lean = 0);
  return { flip: false, a: Math.PI / 2 + 0.35, ext: -3 };
}

/** What's in hand: the rod, its line and the float on the water; or the range's bow, string and arrow. */
export function parkProps(c: Ctx, at: PropAt, id: PastimeId, t: number): void {
  if (id === 'fish') return rod(c, at, t);
  if (id === 'range') return bow(c, at, t);
  ratProps(c, at, id, t);
}

function rod(c: Ctx, at: PropAt, t: number): void {
  // (Held at the 1.5x hero's hands, heroscale.ts; the float and the butts stay where they are in the world.)
  const s = at.side, hx = at.bx + s * hs(4), hy = at.by - hs(9);
  // A creel beside them on the bank.
  dot(c.lit, at.x - s * hs(7) - (s > 0 ? 2 : 0), at.y - 5, 6, 5, '#6a5034'), dot(c.lit, at.x - s * hs(7) - (s > 0 ? 2 : 0), at.y - 6, 6, 1, '#8a6a44');
  // The rod: out and up over the water, thinning toward the tip, the tip nodding.
  const nod = Math.round(Math.sin(at.now * 1.7) * 0.6), len = hs(17);
  for (let i = 0; i <= len; i++) {
    const k = i / len, x = hx + s * Math.round(i * 0.72), y = hy - Math.round(i * 0.7 + k * k * 1.5) + (i > hs(12) ? nod : 0);
    dot(c.lit, x, y, 1, 1, i < hs(5) ? '#5a3a20' : '#8a6a3a');
  }
  const tx = hx + s * Math.round(len * 0.72), ty = hy - Math.round(len * 0.7 + 1.5) + nod;
  // The float out on the water, bobbing; every so often it dips under, and rings spread.
  const fx = at.x + s * 34, dip = t > DIP - 0.9, fy = at.y - 2 + (dip ? 1 : Math.round(Math.sin(at.now * 2.4) * 0.5));
  // The line, sagging from the tip down to the float.
  for (let i = 1; i < 12; i++) {
    const k = i / 12, x = tx + (fx - tx) * k, y = ty + (fy - ty) * k + Math.sin(k * Math.PI) * 3;
    dot(c.glow, x, y, 1, 1, '#9aa8b0');
  }
  if (!dip) dot(c.lit, fx, fy - 1, 1, 1, '#e84a3a'), dot(c.lit, fx, fy, 1, 1, '#f0e8d8');
  const r = dip ? Math.floor((t - (DIP - 0.9)) * 6) : -1;
  if (r >= 0) for (const dx of [-r - 1, r + 1]) dot(c.glow, fx + dx, fy + 1, 1, 1, '#9ab8c8');
  // The hands on the rod's butt.
  dot(c.lit, hx - s, hy, 2, 2, skinOf(at.def));
}

function bow(c: Ctx, at: PropAt, t: number): void {
  // Draw, hold, loose, nock: how far the string's back (0..1), and whether an arrow's on it.
  const pull = t < SHOOT.draw ? t / SHOOT.draw : t < SHOOT.draw + SHOOT.hold ? 1 : 0;
  const loosing = t >= SHOOT.draw + SHOOT.hold && t < SHOOT.draw + SHOOT.hold + SHOOT.loose;
  const nocked = !loosing && t < SHOOT.draw + SHOOT.hold || t > CYCLE - SHOOT.nock * 0.4;
  // The bow arm straight out toward the butts (up and to the right), the bow upright across it.
  const bx = at.bx + hs(8), by = at.by - hs(11), H = hs(6);
  for (let i = -H; i <= H; i++) dot(c.lit, bx + Math.round(3 - (i * i) / 27), by + i, 1, 1, i === 0 ? '#3a2818' : '#8a5a30');
  const back = Math.round(pull * H), sx = bx - back;
  for (let i = -H; i <= H; i++) {
    const k = 1 - Math.abs(i) / H;
    dot(c.lit, Math.round(bx - back * k + (1 - k) * 1), by + i, 1, 1, '#c8c0b0');
  }
  if (nocked) for (let i = 0; i < 15; i++) dot(c.lit, sx + i, by - Math.round(i * 0.15), 1, 1, i >= 13 ? '#b8bcc8' : i < 3 ? '#e8e0d0' : '#d8c48a');
  // The draw hand at the string, the bow hand on the grip.
  dot(c.lit, sx - 1, by, 2, 2, skinOf(at.def));
  dot(c.lit, bx, by - 1, 2, 2, skinOf(at.def));
  // An arrow on its way to the butts, a thin streak climbing away.
  if (loosing) {
    const k = (t - SHOOT.draw - SHOOT.hold) / SHOOT.loose, ax = bx + 4 + k * 40, ay = by - 2 - k * 26;
    for (let i = 0; i < 5; i++) dot(c.glow, ax - i * 1.2, ay + i * 0.75, 1, 1, i === 0 ? '#ffffff' : '#d8c48a');
  }
}

/** For tests and the look scripts: a parked hero's loop is drawing-only (nothing on the hero changes). */
export const PARK_LOOP: Record<PastimeId, number> = { fish: DIP, range: CYCLE, ...RAT_LOOP };
