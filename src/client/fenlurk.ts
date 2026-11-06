/**
 * Goblins lying in Fenmere's reeds (sim/lurk.ts), as drawn in both views (strawman.ts drawFoe hands them
 * here; the 2.5D view's cards draw the same): lying hidden, nothing but a pair of eyes at the water and a
 * ring now and then; within LURK.tell of a hero the reeds over it shiver and the eyes brighten; springing,
 * it stands up out of the water over the rise, streaming wet. Drawing only, from the room's own task clock.
 */
import { LURK } from '../shared/tuning';
import { lurking, rising } from '../sim/lurk';
import type { Enemy } from '../sim/types';
import type { Ctx } from './draw';

let heroes: { x: number; y: number }[] = [];
/** The heroes this frame (scene.ts and the 2.5D cards set it before drawing), for the shiver's distance. */
export const lurkFrame = (hs: { x: number; y: number }[]) => void (heroes = hs);

/** Before the body: hidden (draw nothing more), or how far down it still is as it stands up (pixels). */
export function lurkPose(c: Ctx, e: Enemy, x: number, y: number): { hide: boolean; dy: number; k: number } {
  if (e.act === 'dead' || e.task?.k !== 'lurk') return { hide: false, dy: 0, k: 1 };
  const t = c.t ?? c.now;
  if (lurking(e)) {
    const near = heroes.some((h) => Math.hypot(h.x - e.x, h.y - e.y) <= LURK.tell), g = c.lit, ph = c.now * 1.3 + e.id * 2.1;
    // A ring on the water, slow.
    if (Math.sin(ph) > 0.6) (g.globalAlpha = 0.35), (g.fillStyle = '#b8c8c8'), g.fillRect(Math.round(x - 3), Math.round(y), 7, 1), (g.globalAlpha = 1);
    if (near) {
      // The reeds over it shiver.
      g.fillStyle = '#7a8448';
      for (let i = -2; i <= 2; i++) g.fillRect(Math.round(x + i * 2 + Math.sin(c.now * 18 + i + e.id) * 1.2), Math.round(y - 9 - (i & 1) * 2), 1, 8);
    }
    // Its eyes at the water, blinking; brighter once you're close.
    if (near || Math.sin(c.now * 0.9 + e.id * 1.7) > -0.2) {
      c.glow.fillStyle = near ? '#c8ff6a' : '#6a8a3a';
      c.glow.fillRect(Math.round(x - 2), Math.round(y - 2), 1, 1), c.glow.fillRect(Math.round(x + 1), Math.round(y - 2), 1, 1);
    }
    return { hide: true, dy: 0, k: 0 };
  }
  const k = rising(e, t);
  return k === null ? { hide: false, dy: 0, k: 1 } : { hide: false, dy: Math.round((1 - k) * 9), k };
}

/** After the body, while it stands up: the water at its waist and running off it. */
export function lurkAfter(c: Ctx, x: number, y: number, k: number): void {
  if (k >= 1) return;
  const g = c.lit, w = 9;
  g.fillStyle = '#2a3a3a', g.fillRect(Math.round(x - w / 2), Math.round(y - 1), w, 3);
  g.fillStyle = '#9ab0b0';
  for (let i = 0; i < 4; i++) g.fillRect(Math.round(x - 4 + i * 2.5), Math.round(y - 3 - ((c.now * 30 + i * 5) % 9)), 1, 2);
  g.globalAlpha = 0.5, g.fillRect(Math.round(x - 6), Math.round(y + 1), 13, 1), (g.globalAlpha = 1);
}
