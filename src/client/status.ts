/** Elements on a goblin: flames while it burns, drifting frost while chilled, a block of ice when frozen. */
import type { Enemy } from '../sim/types';
import type { Ctx } from './draw';

const TALL: Record<Enemy['kind'], number> = { butcher: 24, scrapper: 14, dummy: 18, swingDummy: 18 };

/** `t` is the room's time (the statuses are kept in it); (x, y) the feet on screen. */
export function drawStatus(c: Ctx, e: Enemy, x: number, y: number, t: number): void {
  if (e.act === 'dead') return;
  const tall = TALL[e.kind], w = Math.round(e.radius * 16) + 2, g = c.glow;
  if (e.frozenUntil > t) {
    const left = Math.round(x - w), top = Math.round(y - tall - 1), fade = Math.min(1, (e.frozenUntil - t) / 0.4);
    g.globalAlpha = 0.32 * fade;
    g.fillStyle = '#bfe8ff';
    g.fillRect(left, top, w * 2, tall + 2);
    g.globalAlpha = 0.85 * fade;
    g.fillStyle = '#e8f8ff';
    g.fillRect(left, top, w * 2, 1);
    g.fillRect(left, top, 1, tall + 2);
    for (let i = 0; i < 3; i++) g.fillRect(left + 3 + i * 4, top + 3 + i * 5, 1, 2);
    g.globalAlpha = 1;
    return;
  }
  if (e.burnUntil > t) {
    const cols = ['#fff1b0', '#ffd27a', '#ff9a3c', '#ff6a20'];
    for (let i = 0; i < 7; i++) {
      const f = Math.floor(c.now * 12 + i * 3.7) % 5, fx = x - w + ((i * 7) % (w * 2)), fy = y - tall * (0.3 + ((i * 13) % 7) / 10) - f;
      g.fillStyle = cols[(i + f) % 4];
      g.fillRect(Math.round(fx), Math.round(fy), 1, f > 2 ? 2 : 1);
    }
  }
  if (e.chillUntil > t) {
    g.fillStyle = '#dff4ff';
    for (let i = 0; i < 4; i++) {
      const a = c.now * 1.5 + i * 1.57;
      g.fillRect(Math.round(x + Math.cos(a) * (w + 2)), Math.round(y - tall * 0.5 + Math.sin(a * 1.3) * tall * 0.4), 1, 1);
    }
  }
}
