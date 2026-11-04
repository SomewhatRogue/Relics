/**
 * The spellblade's charge and its wreathing, shown (sim/spellblade.ts keeps both on the hero, so a guest
 * sees what the leader's room decided). In hand, the edge glows violet up its length as the charge
 * builds, white when full, and burns in the element while wreathed. Over the hero, in both views: a
 * ring that fills with the charge, and a pip of the element for each wreathed swing left. Drawing only.
 */
import { WEAPONS } from '../shared/tuning';
import type { Hero } from '../sim/types';
import { line, type Ctx } from './draw';
import { EL_COL } from './palette';

const wreathed = (h: Hero, t: number) => (h.wreathe ?? 0) > 0 && t < (h.wreatheUntil ?? -9);

/** The edge in hand along `a` from (ox, oy): violet with the charge, the element while wreathed. */
export function bladeEdge(c: Ctx, h: Hero, ox: number, oy: number, a: number): void {
  const k = Math.min(1, h.bladeCharge ?? 0), g = c.glow;
  if ((h.wreathe ?? 0) > 0 && h.wreatheEl) {
    const col = EL_COL[h.wreatheEl];
    for (let i = 3; i <= 12; i++) {
      g.globalAlpha = 0.5 + 0.5 * Math.random();
      g.fillStyle = Math.random() < 0.3 ? '#ffffff' : col;
      g.fillRect(Math.round(ox + Math.cos(a) * i + (Math.random() - 0.5) * 2), Math.round(oy + Math.sin(a) * i - Math.random() * 2), 1, 1);
    }
    g.globalAlpha = 1;
    return;
  }
  if (k <= 0) return;
  g.globalAlpha = 0.35 + 0.55 * k * (k >= 1 ? 0.7 + 0.3 * Math.sin(c.now * 8) : 1);
  line(g, ox, oy, a, 3, 3 + 9 * k, k >= 1 ? '#ffffff' : '#c9a8ff');
  g.globalAlpha = 1;
}

/** Over the hero, (x, y) its feet on screen: the charge's ring, and a pip for each wreathed swing left. */
export function drawBladeMark(c: Ctx, h: Hero, x: number, y: number, now: number): void {
  if (!WEAPONS[h.weapon].catches || h.act === 'down') return;
  const g = c.glow, top = Math.round(y - 25), k = Math.min(1, h.bladeCharge ?? 0);
  if (wreathed(h, now) && h.wreatheEl) {
    const n = h.wreathe ?? 0;
    g.fillStyle = EL_COL[h.wreatheEl];
    for (let i = 0; i < n; i++) g.fillRect(Math.round(x - (n - 1) * 2 + i * 4) - 1, top - 1 + (Math.floor(c.now * 10 + i) % 2), 2, 2);
    return;
  }
  if (k <= 0) return;
  const pts = 12, lit = Math.round(k * pts);
  for (let i = 0; i < pts; i++) {
    const a = -Math.PI / 2 + (i / pts) * Math.PI * 2;
    g.fillStyle = i < lit ? (k >= 1 ? '#ffffff' : '#c9a8ff') : '#3a3048';
    g.fillRect(Math.round(x + Math.cos(a) * 4), Math.round(top + Math.sin(a) * 4), 1, 1);
  }
}
