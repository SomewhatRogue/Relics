/**
 * A Cleric's holy shield on a hero (sim/holy.ts): a soft gold shell of light round them, a halo and a
 * few rising motes, thinning as it soaks blows and flickering in its last second. Drawn with the hero
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
  // A shell of gold light round the body (the 1.5x hero: heroscale.ts), turning slowly, its dots thinning as it soaks blows.
  const n = Math.round(52 * share);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - c.now * 0.7;
    g.globalAlpha = 0.6 + 0.4 * Math.sin(a * 3 - c.now * 4);
    g.fillStyle = i % 3 ? '#ffe08a' : '#fff8e0';
    g.fillRect(Math.round(x + Math.cos(a) * 15), Math.round(y - 14 + Math.sin(a) * 18), 1, 1);
  }
  // A halo over the head, and motes drifting up through the shell.
  g.globalAlpha = 0.85;
  g.fillStyle = '#fff4c8';
  g.fillRect(Math.round(x - 5), Math.round(y - 37), 11, 1);
  g.fillRect(Math.round(x - 6), Math.round(y - 36), 1, 1), g.fillRect(Math.round(x + 6), Math.round(y - 36), 1, 1);
  for (let i = 0; i < Math.round(6 * share); i++) {
    const k = (c.now * 0.6 + i / 6) % 1;
    g.globalAlpha = 0.8 * (1 - k);
    g.fillRect(Math.round(x - 10 + i * 4), Math.round(y - 3 - k * 27), 1, 1);
  }
  g.globalAlpha = 1;
}
