/**
 * The ironhide in the flat view (and on the 2.5D view's cards, which are the flat figures): scraps of
 * iron over a small goblin's body, a cap, a breastplate, a plate on the shoulder, and an iron-headed maul.
 * Its guard broken (sim/ironhide.ts `cracked`), the plates hang askew and a gold-white crack shows
 * through the breastplate, bright at first and pulsing until it closes. Drawing only.
 */
import type { Enemy } from '../sim/types';
import { line, type Ctx } from './draw';

const IRON = '#5e5a58', LIGHT = '#9a968f', DARK = '#34302f', RUST = '#6a4632', RIVET = '#b8b4ac', WOOD = '#5a3d22';

/** The plates, over the posed body (`bx`, `by`: its feet). */
export function drawIronhide(c: Ctx, e: Enemy, bx: number, by: number, t: number): void {
  const g = c.lit, f = e.fx < -0.2 ? -1 : 1, x = Math.round(bx), y = Math.round(by), off = e.cracked ? 1 : 0;
  // The cap over the top of the head (the eyes still show under it): knocked over one ear when broken.
  g.fillStyle = IRON;
  g.fillRect(x - 4 + off * f, y - 14 + off, 8, 2);
  g.fillStyle = LIGHT;
  g.fillRect(x - 3 + off * f, y - 14 + off, 5, 1);
  // The breastplate over the body: whole, or split in two halves gone apart.
  g.fillStyle = IRON;
  if (!off) g.fillRect(x - 3, y - 8, 7, 4);
  else g.fillRect(x - 4, y - 8, 3, 4), g.fillRect(x + 1, y - 7, 4, 4);
  g.fillStyle = LIGHT;
  g.fillRect(x - 3 - off, y - 8, 2, 1);
  g.fillStyle = RUST;
  g.fillRect(x + 1 + off, y - 6 + off, 2, 1);
  g.fillStyle = RIVET;
  g.fillRect(x - 2 - off, y - 6, 1, 1), g.fillRect(x + 2 + off, y - 6 + off, 1, 1);
  g.fillStyle = DARK;
  if (!off) g.fillRect(x - 3, y - 4, 7, 1);
  // A plate on the shoulder (hanging by a strap once broken).
  g.fillStyle = IRON;
  g.fillRect(x - f * 5 - 1, y - 9 + off * 3, 3, 2 - off);
  g.fillStyle = LIGHT;
  g.fillRect(x - f * 5 - 1, y - 9 + off * 3, 3, 1);
  if (!e.cracked) return;
  // The crack: gold and white through the gap, flaring as it breaks, pulsing while it's open.
  const since = t - (e.crackAt ?? -9), flare = since < 0.35, pulse = Math.floor(c.now * 8) % 2;
  const gl = c.glow;
  gl.fillStyle = flare || pulse ? '#ffffff' : '#ffd040';
  for (let i = 0; i < 5; i++) gl.fillRect(x - 1 + (i % 2), y - 9 + i, 1, 1);
  gl.fillStyle = '#ffd040';
  gl.fillRect(x - 2, y - 6, 1, 1), gl.fillRect(x + 1, y - 5, 1, 1), gl.fillRect(x - 1 + off * f, y - 12, 1, 1);
  if (flare) (gl.globalAlpha = 1 - since / 0.35), gl.fillRect(x - 5, y - 10, 11, 7), (gl.globalAlpha = 1);
}

/** Its maul, in the weapon hand (`hx`, `hy`), raised through the wind-up and brought down on the blow. */
export function drawMaul(c: Ctx, e: Enemy, hx: number, hy: number, f: number, wind: number): void {
  const fa = Math.atan2(e.fy, e.fx), a = wind ? fa - f * (0.6 + wind * 1.6) : e.attack ? fa + f * 0.4 : -Math.PI / 2 + f * 0.5;
  line(c.lit, hx, hy - 2, a, 0, 7, WOOD, 1);
  const ex = hx + Math.cos(a) * 7, ey = hy - 2 + Math.sin(a) * 7;
  c.lit.fillStyle = DARK;
  c.lit.fillRect(Math.round(ex) - 2, Math.round(ey) - 1, 4, 3);
  c.lit.fillStyle = LIGHT;
  c.lit.fillRect(Math.round(ex) - 1, Math.round(ey) - 1, 2, 1);
}
