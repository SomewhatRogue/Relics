/**
 * The Mage's sparks and lances in flight, flat (shots3d.ts has them in the 2.5D view): a white-hot core
 * in a halo of the element, a streak behind it; the trail of embers, glitter or crackle is fxmagetap.ts.
 * A held spell's spark (it bursts where it lands) is a size bigger. Drawing only.
 */
import type { Bolt } from '../sim/types';
import { line, type Ctx } from './draw';
import { EL_COL } from './palette';

export function drawSpell(c: Ctx, b: Bolt, x: number, y: number): void {
  const g = c.glow, a = Math.atan2(b.dy, b.dx), back = a + Math.PI, col = EL_COL[b.el], ty = y - 8;
  if (b.kind === 'lance') {
    // An icicle (or a lance): a halo along it, the element, a white spine and a bright point.
    g.globalAlpha = 0.35;
    line(g, x, ty, back, 0, 13, col, 3);
    g.globalAlpha = 1;
    line(g, x, ty, back, 0, 12, col, 2);
    line(g, x, ty, back, 0, 9, '#ffffff');
    g.fillStyle = '#ffffff';
    g.fillRect(Math.round(x + Math.cos(a)), Math.round(ty + Math.sin(a)), 1, 1);
    return;
  }
  const big = (b.burst ?? 0) > 0, r = big ? 2 : 1;
  // The streak behind it, fading.
  for (let i = 1; i <= 6; i++) {
    g.globalAlpha = 0.7 - i * 0.1;
    g.fillStyle = i < 3 ? '#ffffff' : col;
    g.fillRect(Math.round(x + Math.cos(back) * i * 2.2), Math.round(ty + Math.sin(back) * i * 2.2), 1, 1);
  }
  // A soft halo of the element round it, flickering.
  g.globalAlpha = 0.35 + 0.15 * Math.sin(c.now * 40 + b.id);
  g.fillStyle = col;
  g.fillRect(Math.round(x) - r - 1, Math.round(ty) - r, r * 2 + 3, r * 2 + 1);
  g.fillRect(Math.round(x) - r, Math.round(ty) - r - 1, r * 2 + 1, r * 2 + 3);
  g.globalAlpha = 1;
  g.fillRect(Math.round(x) - r, Math.round(ty) - r, r * 2 + 1, r * 2 + 1);
  // The white-hot core: a small cross.
  g.fillStyle = '#ffffff';
  g.fillRect(Math.round(x) - r + 1, Math.round(ty), r * 2 - 1, 1);
  g.fillRect(Math.round(x), Math.round(ty) - r + 1, 1, r * 2 - 1);
  g.fillRect(Math.round(x), Math.round(ty), 1, 1);
}
