/**
 * A Cleric's guard, shown (sim/holyguard.ts decides it): held, a holy ward round them in warm gold, a
 * slow shell of light and a circle at their feet, thinning as their stamina drains. It's round them, not
 * a shield in front, because it holds blows from every side. A blow it holds for a friend draws its own
 * gold line (fxladder.ts `coverfor`). Drawing only, on the glow layer, in both views.
 */
import { HERO, WEAPONS } from '../shared/tuning';
import type { Hero } from '../sim/types';
import type { Ctx } from './draw';

const RX = 12, RY = 14, LIFT = 10, DOTS = 48, GOLD = '#ffe9a8';

/** Round the Cleric, (x, y) their feet on screen: the ward while they hold their guard. */
export function drawHolyGuard(c: Ctx, h: Hero, x: number, y: number): void {
  if (!h.blocking || h.act === 'down' || WEAPONS[h.weapon]?.cls !== 'HEALER') return;
  const g = c.glow, k = Math.max(0.2, Math.min(1, h.stamina / HERO.stamina)), cy = y - LIFT, turn = c.now * 0.4;
  for (let i = 0; i < DOTS; i++) {
    // Every other dot goes as it drains, so the light thins evenly.
    if (i % 2 && k < 0.5) continue;
    const a = (i / DOTS) * Math.PI * 2 + turn;
    g.globalAlpha = 0.35 + 0.45 * k + 0.2 * Math.max(0, Math.sin(a * 3 - c.now * 2));
    g.fillStyle = i % 6 === 0 ? '#ffffff' : GOLD;
    g.fillRect(Math.round(x + Math.cos(a) * RX), Math.round(cy + Math.sin(a) * RY), 1, 1);
  }
  // The circle at their feet.
  g.globalAlpha = 0.3 + 0.3 * k;
  g.fillStyle = GOLD;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 - turn;
    g.fillRect(Math.round(x + Math.cos(a) * RX), Math.round(y + Math.sin(a) * 4), 1, 1);
  }
  g.globalAlpha = 1;
}
