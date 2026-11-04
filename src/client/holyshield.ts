/**
 * A Cleric's holy shield on a hero (sim/holy.ts): a soft gold ring on the floor round their feet and a
 * faint halo of motes, thinning as it soaks blows and flickering in its last second. Drawn with the hero
 * (actors.ts), so the flat view and the 2.5D view's figure cards both carry it.
 */
import { HOLY_SHIELD } from '../shared/tuning';
import type { Hero } from '../sim/types';
import type { Ctx } from './draw';

export function drawHolyShield(c: Ctx, h: Hero, x: number, y: number, t: number): void {
  const left = (h.shieldUntil ?? 0) - t, hp = h.shieldHp ?? 0;
  if (left <= 0 || hp <= 0 || h.act === 'down') return;
  if (left < 1 && Math.floor(c.now * 10) % 2) return;
  const share = Math.max(0.3, hp / HOLY_SHIELD.hp), g = c.glow;
  // The ring at the feet: an ellipse of dots, slowly turning.
  const n = Math.round(22 * share);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - c.now * 0.6;
    g.globalAlpha = 0.45 + 0.35 * Math.sin(a * 2 + c.now * 3);
    g.fillStyle = i % 3 ? '#ffe9a8' : '#fff8e0';
    g.fillRect(Math.round(x + Math.cos(a) * 8), Math.round(y + Math.sin(a) * 3), 1, 1);
  }
  // A few motes drifting up through the shield.
  for (let i = 0; i < Math.round(4 * share); i++) {
    const k = (c.now * 0.6 + i / 4) % 1;
    g.globalAlpha = 0.7 * (1 - k);
    g.fillStyle = '#fff4c8';
    g.fillRect(Math.round(x - 6 + i * 4), Math.round(y - 2 - k * 20), 1, 1);
  }
  g.globalAlpha = 1;
}
