/**
 * The poisoner's darts left, shown on the hero while the pouch isn't full (sim/darts.ts): five small pips over
 * the head, a green one for each dart in, a dim one for each gone; the next one back fills in as it comes.
 * Nothing at all when the pouch is full. Drawn in both views, where the crossbow's load is (xbowmark.ts).
 */
import { DARTS, WEAPONS } from '../shared/tuning';
import type { Hero } from '../sim/types';
import type { Ctx } from './draw';

/** (x, y) the hero's feet on screen; `t` the room's clock (for the one coming back). */
export function drawDarts(c: Ctx, h: Hero, x: number, y: number, t: number): void {
  if (!WEAPONS[h.weapon].heavy.venom || h.darts === undefined || h.act === 'down') return;
  // (Over the 1.5x hero's head, as the crossbow's ring: heroscale.ts.)
  const g = c.glow, top = Math.round(y - 38), n = DARTS.most, x0 = Math.round(x) - (n * 3 - 1) / 2;
  const back = h.dartAt === undefined ? 0 : 1 - Math.max(0, h.dartAt - t) / DARTS.back;
  for (let i = 0; i < n; i++) {
    const px = Math.round(x0 + i * 3);
    if (i < h.darts) (g.fillStyle = '#8fd46a'), g.fillRect(px, top, 2, 2);
    else if (i === h.darts) {
      // The next dart back: dim, its lower pixel lit once it is half way, both near the end.
      g.fillStyle = '#3e4a3a';
      g.fillRect(px, top, 2, 2);
      g.fillStyle = '#6a9a52';
      if (back > 0.5) g.fillRect(px, top + 1, 2, 1);
      if (back > 0.85) g.fillRect(px, top, 2, 1);
    } else (g.fillStyle = '#3e4a3a'), g.fillRect(px, top, 2, 2);
  }
}
