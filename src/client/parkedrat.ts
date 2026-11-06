/**
 * Someone else at one of the indoor pastimes, as those in the same hall see them (parked.ts routes here):
 * at the Drowned Rat's table, sat with an elbow down and their hand locked in the regular's across it, the
 * two arms rocking one way and the other; at the Rat's knife board, side-on with a knife up, a throw that
 * streaks off to the board, and the next knife in hand; at Halvard's anvil, the hammer up, down on the
 * glowing piece in a spray of sparks, and up again. Drawn only, on this screen's clock.
 */
import type { BodyPose } from './motion';
import type { Ctx } from './draw';
import { dot, skinOf, type PropAt } from './idlekit';

export type RatPark = 'arm' | 'knives' | 'anvil';

/** Each loop (s): the arms rocking; aim, throw and reach for the next knife; the hammer up and down. */
export const RAT_LOOP: Record<RatPark, number> = { arm: 3.2, knives: 2.4, anvil: 1.2 };
const THROW = { aim: 1.2, wind: 0.35, fly: 0.3 };

/** The body: sat at the table facing across it; stood to the board with the knife up; at the anvil with the hammer. */
export function ratPose(id: RatPark, pz: BodyPose, t: number): { flip: boolean; a: number; ext: number } {
  if (id === 'arm') {
    (pz.crouch = 1), (pz.reach = 1), (pz.raise = 1), (pz.lean = Math.round(Math.sin((t / RAT_LOOP.arm) * Math.PI * 2)));
    return { flip: false, a: Math.PI - 0.2, ext: -3 };
  }
  if (id === 'knives') {
    const wind = t > THROW.aim && t < THROW.aim + THROW.wind;
    (pz.reach = 1), (pz.raise = wind ? 3 : 2), (pz.lean = wind ? -1 : 0);
    return { flip: false, a: Math.PI / 2 + 0.35, ext: -3 };
  }
  const up = t < 0.5;
  (pz.reach = 1), (pz.raise = up ? 3 : 1), (pz.lean = 0), (pz.crouch = up ? 0 : 0.1);
  return { flip: false, a: Math.PI / 2 + 0.3, ext: -3 };
}

export function ratProps(c: Ctx, at: PropAt, id: RatPark, t: number): void {
  if (id === 'arm') return arm(c, at, t);
  if (id === 'knives') return knife(c, at, t);
  hammer(c, at, t);
}

/** The locked hands over the table, rocking as one goes over a little and comes back. */
function arm(c: Ctx, at: PropAt, t: number): void {
  const s = at.side, k = Math.sin((t / RAT_LOOP.arm) * Math.PI * 2) * 0.35, ex = at.bx + s * 8, ey = at.by - 5;
  const hx = ex + s * Math.round(2 + Math.sin(k) * 5), hy = ey - Math.round(Math.cos(k) * 7);
  // Your forearm from the elbow on the table up to the hands.
  for (let i = 0; i <= 6; i++) dot(c.lit, ex + ((hx - ex) * i) / 6, ey + ((hy - ey) * i) / 6, 2, 1, skinOf(at.def));
  // The regular's forearm coming from across the table to meet it.
  const ox = hx + s * 9, oy = ey;
  for (let i = 0; i <= 6; i++) dot(c.lit, ox + ((hx - ox) * i) / 6, oy + ((hy - oy) * i) / 6, 2, 1, '#c08a62');
  dot(c.lit, hx - 1, hy - 2, 3, 3, skinOf(at.def));
  dot(c.lit, hx, hy - 1, 2, 1, '#a87a52');
}

/** A knife up by the ear, thrown off toward the board on the wall, and the next one taken from the belt. */
function knife(c: Ctx, at: PropAt, t: number): void {
  const hx = at.bx + 6, hy = at.by - 13, wind = t > THROW.aim && t < THROW.aim + THROW.wind, flying = t >= THROW.aim + THROW.wind && t < THROW.aim + THROW.wind + THROW.fly;
  const kx = hx - (wind ? 2 : 0), ky = hy - (wind ? 3 : 0);
  if (!flying && t < THROW.aim + THROW.wind + THROW.fly + 0.15 || t > RAT_LOOP.knives - 0.4) {
    if (!flying) for (let i = 0; i < 4; i++) dot(c.lit, kx, ky - i, 1, 1, i < 1 ? '#3a2818' : '#e6ecf0');
  }
  dot(c.lit, kx - 1, ky, 2, 2, skinOf(at.def));
  if (flying) {
    const k = (t - THROW.aim - THROW.wind) / THROW.fly, x = hx + k * 4, y = hy - 4 - k * 34;
    for (let i = 0; i < 4; i++) dot(c.glow, x, y + i, 1, 1, i === 0 ? '#ffffff' : '#b8bcc8');
  }
}

/** The smith's hammer up and coming down on the piece; sparks off the strike. */
function hammer(c: Ctx, at: PropAt, t: number): void {
  const up = t < 0.5, fall = t >= 0.5 && t < 0.62, hx = at.bx + 6, hy = at.by - (up ? 16 : fall ? 11 : 8);
  dot(c.lit, hx, hy, 1, 7, '#5a3d22');
  dot(c.lit, hx - 2, hy - 2, 5, 3, '#6a6470'), dot(c.lit, hx - 2, hy - 2, 5, 1, '#9a94a0');
  dot(c.lit, hx - 1, hy + 4, 2, 2, skinOf(at.def));
  // The piece on the anvil ahead, glowing; sparks fly as the hammer lands.
  const px = at.x + 3, py = at.y - 14;
  dot(c.glow, px, py, 5, 1, t > 0.6 && t < 0.9 ? '#ffe08a' : '#ff8a3a');
  if (t >= 0.62 && t < 0.92) {
    const k = (t - 0.62) / 0.3;
    for (let i = 0; i < 5; i++) dot(c.glow, px + 2 + Math.round((i - 2) * 3 * k), py - Math.round(4 * k * (1 + (i % 2))) + Math.round(6 * k * k), 1, 1, i % 2 ? '#ffd27a' : '#ffffff');
  }
}
