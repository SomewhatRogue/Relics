/**
 * What isn't a goblin with something in its hand: a wolf (lean, grey, low to the ground, eyes that
 * catch the light), a sapper under the ground (a mound of heaving dirt and the trail behind it), lamp
 * oil on the floor (and burning), and carrion crows on the dead and up in a cloud. Drawing only; the
 * crows and dust that scatter are cosmetic.
 */
import type { Enemy } from '../sim/types';
import type { Slick } from '../sim/oil';
import type { Flock } from '../sim/crows';
import { TORCH } from '../shared/tuning';
import { shadow, stars, type Ctx } from './draw';
import { PX } from './world';

const FUR = '#a4a2a8', FUR2 = '#7a7880', DARK = '#3a3840', EYE = '#ffd040';

/** A wolf at its feet (x, y): trotting legs, a crouch before the dart, stretched out in it, and dead. */
export function drawWolf(c: Ctx, e: Enemy, x: number, y: number): void {
  const f = e.fx < -0.2 ? -1 : 1, g = c.lit, a = e.attack, t = c.t ?? c.now;
  if (e.act === 'dead') {
    const fade = Math.max(0, 1 - e.actT / Math.max(1, e.actDur));
    g.globalAlpha = fade;
    (g.fillStyle = FUR2), g.fillRect(Math.round(x - 6), Math.round(y - 3), 12, 3);
    (g.fillStyle = '#7a1d1d'), g.fillRect(Math.round(x - 2), Math.round(y - 1), 4, 1);
    g.globalAlpha = 1;
    return;
  }
  const crouch = a && a.t < a.windup ? 1 : 0, leap = a && a.t >= a.windup && a.t < a.windup + a.active ? 1 : 0;
  const run = e.moving || leap ? Math.floor(c.now * 12 + e.id) % 2 : 0, flash = t - e.hitAt < 0.09;
  shadow(c, x, y, 6);
  const by = Math.round(y - 5 + crouch - leap * 2), bx = Math.round(x);
  // Legs, the body, the tail, the head and ears.
  g.fillStyle = DARK;
  for (const lx of [-4, -2, 2, 4]) g.fillRect(bx + lx * f, by + 3, 1, 2 - crouch + ((lx > 0) === !!run ? 0 : -1 * leap));
  g.fillStyle = flash ? '#ffffff' : FUR;
  g.fillRect(bx - 5, by, 10 + leap * 2, 3 - crouch);
  g.fillStyle = flash ? '#ffffff' : FUR2;
  g.fillRect(bx - 5, by + 2 - crouch, 10, 1);
  g.fillRect(bx - f * 6 - (f < 0 ? 2 : 0), by - 1 + run, 3, 1);
  g.fillStyle = flash ? '#ffffff' : FUR;
  const hx = bx + f * 5 + (f < 0 ? -3 : 0) + leap * f * 2;
  g.fillRect(hx, by - 2 + crouch, 4, 3);
  g.fillRect(hx + (f > 0 ? 3 : -1), by - 1 + crouch, 2, 2);
  g.fillStyle = FUR2;
  g.fillRect(hx + (f > 0 ? 0 : 3), by - 3 + crouch, 1, 1);
  c.glow.fillStyle = EYE;
  c.glow.fillRect(hx + (f > 0 ? 2 : 1), by - 1 + crouch, 1, 1);
  if ((e.scatterUntil ?? -9) > t) (c.glow.fillStyle = '#ffffff'), c.glow.fillRect(hx + (f > 0 ? 3 : 0), by - 4, 1, 2);
  if (e.act === 'stunned') stars(c, x, y - 10, 3, 4);
  void PX;
}

/** A sapper under the ground: a mound of dirt heaving where it is, clods kicked up behind it. */
export function drawMound(c: Ctx, e: Enemy, x: number, y: number): void {
  const g = c.lit, k = Math.floor(c.now * 10 + e.id) % 2;
  g.fillStyle = '#6a5a44';
  g.fillRect(Math.round(x - 5), Math.round(y - 3 - k), 11, 3 + k);
  g.fillStyle = '#9a8a6a';
  g.fillRect(Math.round(x - 4), Math.round(y - 4 - k), 8, 1);
  g.fillRect(Math.round(x - 2 + k * 3), Math.round(y - 6 - k), 1, 1);
  g.fillStyle = '#7a6a50';
  for (let i = 1; i < 6; i++) {
    const tx = x - e.fx * i * 3 + Math.sin(i * 2.1 + e.id) * 1.5, ty = y - e.fy * i * 1.6;
    g.globalAlpha = 1 - i / 6;
    g.fillRect(Math.round(tx), Math.round(ty), 2, 1);
  }
  g.globalAlpha = 1;
  // Close to the top: the ground starts to crack.
  if ((e.digT ?? 0) > 0) (c.glow.fillStyle = '#a08a6a'), (c.glow.globalAlpha = 0.5), c.glow.fillRect(Math.round(x - 1), Math.round(y - 4 - k), 2, 1), (c.glow.globalAlpha = 1);
}

/** Oil on the floor: a dark, glossy pool with a sheen moving on it; lit, flames all over it. */
export function drawSlicks(c: Ctx, slicks: Slick[], at: (x: number, y: number) => [number, number], t: number): void {
  for (const s of slicks) {
    const [x, y] = at(s.x, s.y), R = s.r * PX, burning = s.lit >= 0 && t - s.lit < (s.burn ?? TORCH.burn);
    const g = c.lit;
    for (let dy = -Math.floor(R * 0.55); dy <= R * 0.55; dy++) {
      const w = Math.floor(R * Math.sqrt(Math.max(0, 1 - (dy * dy) / (R * R * 0.3))));
      g.fillStyle = burning ? '#1a1410' : '#16120c';
      g.globalAlpha = 0.85;
      g.fillRect(Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1);
    }
    g.globalAlpha = 1;
    if (!burning) {
      // The sheen: a pale streak sliding across it.
      const sx = Math.round(x - R * 0.6 + ((t * 6 + s.id * 5) % (R * 1.2)));
      c.glow.fillStyle = '#8a8a6a';
      c.glow.globalAlpha = 0.35;
      c.glow.fillRect(sx, Math.round(y - 2), 4, 1);
      c.glow.globalAlpha = 1;
      continue;
    }
    for (let i = 0; i < 18; i++) {
      const a = i * 2.4 + s.id, r = ((i * 37) % 100) / 100 * R * 0.9, fl = Math.floor(c.now * 10 + i) % 3;
      const fx = Math.round(x + Math.cos(a) * r), fy = Math.round(y + Math.sin(a) * r * 0.5);
      c.glow.fillStyle = fl ? '#ff9a3c' : '#ffd27a';
      c.glow.fillRect(fx, fy - 2 - fl, 1, 2 + fl);
    }
  }
}

/** One crow: on the ground pecking, or in the air with its wings up or down (`wing` 0 or 1). */
function bird(c: Ctx, x: number, y: number, f: number, air: boolean, wing: number, peck = false): void {
  const g = c.lit, bx = Math.round(x), by = Math.round(y);
  g.fillStyle = '#121016';
  if (air) {
    g.fillRect(bx - 1, by, 3, 2);
    g.fillRect(bx - 4, by - 1 + wing * 2, 3, 1), g.fillRect(bx + 2, by - 1 + wing * 2, 3, 1);
    g.fillRect(bx - 5, by - 2 + wing * 3, 1, 1), g.fillRect(bx + 5, by - 2 + wing * 3, 1, 1);
  } else {
    g.fillRect(bx - 2, by - 3, 5, 3);
    g.fillRect(bx + f * 2 + (f < 0 ? -1 : 0), by - 4 + (peck ? 2 : 0), 2, 2);
    g.fillRect(bx - f * 3, by - 2, 1, 1);
  }
  // A sheen on the feathers, and the eye.
  g.fillStyle = '#4a4658';
  g.fillRect(bx - (air ? 0 : 1), by - (air ? 0 : 3), 2, 1);
  c.glow.fillStyle = '#d8d0b0';
  if (!air) c.glow.fillRect(bx + f * 3 + (f < 0 ? 0 : -1), by - 4 + (peck ? 2 : 0), 1, 1);
}

/** Crows: settled, a few black birds stooped on the dead; up, a cloud wheeling over it. */
export function drawCrows(c: Ctx, flocks: Flock[], at: (x: number, y: number) => [number, number], t: number): void {
  for (const f of flocks) {
    const [x, y] = at(f.x, f.y), up = f.up >= 0 ? t - f.up : -1;
    if (up < 0) {
      for (let i = 0; i < 5; i++) bird(c, x - 9 + i * 4.5, y - (i % 2) * 2 + 1, i % 2 ? -1 : 1, false, 0, Math.floor(c.now * 3 + i * 1.7) % 4 === 0);
      continue;
    }
    if (up > 8) continue;
    // Up: wheeling higher and wider, thinning as they go.
    const n = Math.max(0, Math.round(12 * (1 - up / 8)));
    for (let i = 0; i < n; i++) {
      const a = c.now * (2 + (i % 3)) + i * 1.3, r = 8 + up * 6 + (i % 4) * 3;
      bird(c, x + Math.cos(a) * r, y - 16 - up * 6 + Math.sin(a) * r * 0.4, 1, true, Math.floor(c.now * 12 + i) % 2);
    }
  }
}

/** A hero lost in the crows a moment: birds beating round their head. */
export function drawCrowsOn(c: Ctx, x: number, y: number): void {
  for (let i = 0; i < 6; i++) {
    const a = c.now * 7 + i * 1.05;
    bird(c, x + Math.cos(a) * 9, y - 15 + Math.sin(a) * 4, 1, true, Math.floor(c.now * 14 + i) % 2);
  }
}
