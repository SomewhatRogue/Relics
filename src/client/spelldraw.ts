/**
 * The Mage's sparks and lances in flight, flat (shots3d.ts has them in the 2.5D view): a white-hot core
 * in a halo of the element, a streak behind it; the trail of embers, glitter or crackle is fxmagetap.ts.
 * A quick cast is a narrow, long bolt; a held spell (it bursts where it lands) a big ball, stretched behind. Drawing only.
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
  if ((b.burst ?? 0) > 0) return fireball(c, b, x, ty, a, col);
  // A quick cast: a bolt, narrow and long (Kyle, 2026-11-04). The element along it, a white-hot spine,
  // a bright point at the front, and a faint tail.
  g.globalAlpha = 0.3;
  line(g, x, ty, back, 0, 14, col, 3);
  g.globalAlpha = 0.9;
  line(g, x, ty, back, 0, 12, col);
  g.globalAlpha = 1;
  line(g, x, ty, back, 0, 8, '#ffffff');
  for (let i = 0; i < 3; i++) {
    g.globalAlpha = 0.4 - i * 0.12;
    g.fillStyle = col;
    g.fillRect(Math.round(x + Math.cos(back) * (15 + i * 3)), Math.round(ty + Math.sin(back) * (15 + i * 3)), 1, 1);
  }
  g.globalAlpha = 1;
  g.fillStyle = '#ffffff';
  g.fillRect(Math.round(x + Math.cos(a)), Math.round(ty + Math.sin(a)), 1, 1);
}

/** A held spell in flight: a big ball of the element, drawn out behind it as it goes and breathing a little. */
function fireball(c: Ctx, b: Bolt, x: number, y: number, a: number, col: string): void {
  const g = c.glow, back = a + Math.PI, stretch = 1.15 + 0.2 * Math.sin(c.now * 30 + b.id);
  // Blobs shrinking back along the line of flight: the stretch.
  for (let i = 4; i >= 0; i--) {
    const d = i * 2.4 * stretch, r = Math.max(1, 4 - i * 0.7), bx = Math.round(x + Math.cos(back) * d), by = Math.round(y + Math.sin(back) * d);
    g.globalAlpha = i ? 0.55 - i * 0.09 : 0.45 + 0.15 * Math.sin(c.now * 40 + b.id);
    g.fillStyle = col;
    g.fillRect(bx - Math.round(r), by - Math.round(r) + 1, Math.round(r) * 2 + 1, Math.round(r) * 2 - 1);
    g.fillRect(bx - Math.round(r) + 1, by - Math.round(r), Math.round(r) * 2 - 1, Math.round(r) * 2 + 1);
  }
  g.globalAlpha = 1;
  g.fillStyle = col;
  g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5);
  // The white-hot heart, pushed to the front.
  g.fillStyle = '#ffffff';
  const fx = Math.round(x + Math.cos(a)), fy = Math.round(y + Math.sin(a));
  g.fillRect(fx - 1, fy - 1, 3, 3);
}
