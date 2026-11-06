/**
 * An elite's affixes on its body (shared/elites.ts), drawn over the posed goblin in both views (the 2.5D
 * view's cards are these figures): Plated, grey plates (the ironhide's, askew and cracked gold once the
 * plates are broken); Quick, dust kicked up at its heels; Gorging, blood down to the chin and dripping;
 * Oil-soaked, a dark wet sheen over it, a glint sliding down, dripping;
 * Hornblower, a cow horn at its belt, put to its mouth while it blows, rings of the call going out;
 * Smouldering, embers glowing in its hide and drifting up off it.
 * `x`, `y`: its feet. Drawing only.
 */
import type { Enemy } from '../sim/types';
import type { Ctx } from './draw';
import { drawIronhide } from './ironhidedraw';
import { blit } from './draw';
import { MEATY2_SPRITES as S } from './meatysprites2';
import { calling } from '../sim/hornstate';

const DUST = '#c0b090', BLOOD = '#8a1010', BLOOD2 = '#b81818', OIL = '#1a1410', SHEEN = '#8a9aa8', EMBER = ['#ff6a20', '#ff9a3c', '#ffd27a'], CALL = '#ffd27a';

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
  if (e.elite.includes('oiled')) {
    // A dark wet sheen down its front, a glint sliding down it, and a drip.
    const g = c.lit;
    g.fillStyle = OIL;
    g.globalAlpha = 0.55;
    g.fillRect(Math.round(x - 3), Math.round(y - 12), 7, 8);
    g.globalAlpha = 1;
    const s = (c.now * 0.7 + e.id * 0.31) % 1;
    c.glow.fillStyle = SHEEN;
    c.glow.globalAlpha = 0.7;
    c.glow.fillRect(Math.round(x - 1 + f), Math.round(y - 12 + s * 7), 1, 2);
    c.glow.globalAlpha = 1;
    const d = (c.now * 0.9 + e.id * 0.53) % 1;
    if (d < 0.5) (g.fillStyle = OIL), g.fillRect(Math.round(x - f * 2), Math.round(y - 3 + d * 6), 1, 1);
  }
  if (e.elite.includes('horn')) {
    // The horn: at its belt, or up at its mouth while it blows, the call going out in rings.
    const blowing = calling(e, t);
    if (blowing) {
      blit(c, S.horn, Math.round(x + f * 5), Math.round(y - 15));
      const k = (t - e.call!.at) / Math.max(0.01, e.call!.until - e.call!.at), g = c.glow;
      g.fillStyle = CALL;
      for (let r = 0; r < 3; r++) {
        const q = (c.now * 1.6 + r / 3) % 1, rr = 4 + q * 10;
        g.globalAlpha = (1 - q) * (0.4 + 0.5 * k);
        for (let a = -0.9; a <= 0.9; a += 0.3) g.fillRect(Math.round(x + f * (8 + Math.cos(a) * rr)), Math.round(y - 16 + Math.sin(a) * rr * 0.7), 1, 1);
      }
      g.globalAlpha = 1;
    } else blit(c, S.horn, Math.round(x - f * 3), Math.round(y - 4));
  }
  if (e.elite.includes('ember')) {
    // Embers in its hide, winking, and a few drifting up off it.
    for (let i = 0; i < 5; i++) {
      const q = (c.now * 0.8 + i * 0.21 + e.id * 0.17) % 1, on = Math.floor(c.now * 4 + i * 1.7) % 3 !== 0;
      c.glow.fillStyle = EMBER[i % 3];
      if (on) c.glow.fillRect(Math.round(x - 3 + ((i * 3 + e.id) % 7)), Math.round(y - 5 - ((i * 5) % 9)), 1, 1);
      c.glow.globalAlpha = 1 - q;
      c.glow.fillRect(Math.round(x - 2 + i + Math.sin(q * 6 + i) * 1.5), Math.round(y - 14 - q * 10), 1, 1);
      c.glow.globalAlpha = 1;
    }
  }
}
