/**
 * An elite's affixes on its body (shared/elites.ts), drawn over the posed goblin in both views (the 2.5D
 * view's cards are these figures): Plated, grey plates (the ironhide's, askew and cracked gold once the
 * plates are broken); Quick, dust kicked up at its heels; Gorging, blood down to the chin and dripping.
 * `x`, `y`: its feet. Drawing only.
 */
import type { Enemy } from '../sim/types';
import type { Ctx } from './draw';
import { drawIronhide } from './ironhidedraw';

const DUST = '#c0b090', BLOOD = '#8a1010', BLOOD2 = '#b81818';

export function drawElite(c: Ctx, e: Enemy, x: number, y: number): void {
  if (!e.elite?.length || e.act === 'dead') return;
  const t = c.t ?? c.now, f = e.fx < -0.2 ? -1 : 1;
  if (e.elite.includes('plated') && e.variant !== 'ironhide') drawIronhide(c, e, x, y, t);
  if (e.elite.includes('gorging') && e.fy >= -0.55) {
    // Blood from the mouth down over the chin and chest; now and then a drip falls.
    const g = c.lit;
    g.fillStyle = BLOOD;
    g.fillRect(Math.round(x - 2), Math.round(y - 8), 5, 1);
    g.fillRect(Math.round(x - 1), Math.round(y - 7), 3, 2);
    g.fillStyle = BLOOD2;
    g.fillRect(Math.round(x - 1 + f), Math.round(y - 8), 2, 1);
    const d = (c.now * 1.2 + e.id * 0.37) % 1;
    if (d < 0.6) (g.fillStyle = BLOOD), g.fillRect(Math.round(x + f), Math.round(y - 6 + d * 7), 1, 1);
  }
  if (e.elite.includes('quick')) {
    // Dust at its heels, more when it's moving: drawn unlit, so it reads at night as the sprint's does.
    const d = c.glow, n = e.moving ? 4 : 2;
    d.fillStyle = DUST;
    for (let i = 0; i < n; i++) {
      const age = (c.now * (e.moving ? 3 : 1.2) + i / n + e.id * 0.13) % 1, side = i % 2 ? 1 : -1;
      d.globalAlpha = 0.75 * (1 - age);
      d.fillRect(Math.round(x - e.fx * (3 + age * 4) + side * (2 + age * 2)), Math.round(y - age * 3), 2, 1);
    }
    d.globalAlpha = 1;
  }
}
