/**
 * What the Staithe's two sorts carry (foekits.ts hands them here; foes.ts poses the body): the gaffer's
 * fishing gaff, taken off the eel-catchers (a long pole, a plain iron hook at its end, never a billhook's blade; held back as it winds up, flung out along the lane as it throws),
 * and the skimmer's pot of lamp oil from the hoard and its lit taper (rimed over
 * while frost pins it). Drawing only.
 */
import type { Enemy } from '../sim/types';
import { line, type Ctx } from './draw';
import { PX } from './world';

const POLE = '#6a5038', IRON = '#9a9aa4', POT = '#3a3028', OILC = '#2a2214';

export function drawStaitheKit(c: Ctx, e: Enemy, bx: number, by: number, hx: number, hy: number, f: number, wind: number, t: number): void {
  const g = c.lit, fa = Math.atan2(e.fy, e.fx), a = e.attack;
  if (e.variant === 'gaffer') {
    if (a?.kind === 'hook' && a.t >= a.windup) {
      // Thrown: the line out along the lane, the hook at its end.
      const reach = Math.min(1, (a.t - a.windup) / Math.max(0.05, a.active)) * a.range * PX;
      line(g, hx, hy - 3, fa, 0, 12, POLE, 1);
      line(g, hx, hy - 3, fa, 12, Math.max(12, reach), '#a89a72', 1);
      g.fillStyle = IRON, g.fillRect(Math.round(hx + Math.cos(fa) * reach) - 1, Math.round(hy - 3 + Math.sin(fa) * reach) - 1, 3, 2);
      return;
    }
    // Held: the gaff over the shoulder (back as it winds up), its plain hook curling at the end (a fishing gaff, no blade).
    const ang = wind ? fa + Math.PI * (0.65 + wind * 0.25) * (f > 0 ? 1 : -1) * -1 : -Math.PI / 2 - f * 0.45, len = 20;
    line(g, hx, hy - 2, ang, 0, len, POLE, 1);
    const tx = Math.round(hx + Math.cos(ang) * len), ty = Math.round(hy - 2 + Math.sin(ang) * len);
    g.fillStyle = IRON;
    g.fillRect(tx, ty, 2, 1), g.fillRect(tx + f * 2, ty + 1, 1, 2), g.fillRect(tx + f, ty + 3, 1, 1);
    return;
  }
  // The skimmer: its pot of oil held against it, a lit taper in the other hand; pouring, the pot tipped out.
  const px = Math.round(bx - f * 3), py = Math.round(by - 8);
  g.fillStyle = POT, g.fillRect(px - 2, py, 5, 4), g.fillRect(px - 1, py - 1, 3, 1);
  g.fillStyle = OILC, g.fillRect(px - 1, py, 3, 1);
  if (a?.kind === 'pour' && wind) for (let i = 0; i < 4; i++) g.fillRect(Math.round(px + Math.cos(fa) * (3 + i)), Math.round(py + 2 + i), 1, 1);
  line(g, hx, hy - 2, -Math.PI / 2 + f * 0.3, 0, 5, '#7a6a4a', 1);
  const pinned = (e.pinUntil ?? -9) > t;
  c.glow.fillStyle = pinned ? '#cfe8ff' : Math.floor(c.now * 10 + e.id) % 2 ? '#ffb040' : '#ffd27a';
  c.glow.fillRect(Math.round(hx + f * 1.5), Math.round(hy - 8), 1, 2);
  if (pinned) {
    // Rimed where it stands.
    c.glow.fillStyle = '#cfe8ff';
    c.glow.globalAlpha = 0.6;
    for (let i = 0; i < 8; i++) c.glow.fillRect(Math.round(bx - 4 + ((i * 3) % 9)), Math.round(by - 2 - ((i * 5) % 14)), 1, 1);
    c.glow.globalAlpha = 1;
  }
}
