/**
 * The crossbow's load, shown on the hero (sim/crossbow.ts keeps it on the hero, so a guest sees what the
 * leader's room decided): over an empty crossbow a hollow bolt; while one is wound, a ring that fills
 * as it winds (kept where it is between pieces); a bolt wound on in one go glints, a star of light that
 * turns at the crossbow. Drawn in both views (the 2.5D view's flat figures and its box figures).
 */
import { WEAPONS } from '../shared/tuning';
import type { Hero } from '../sim/types';
import type { Ctx } from './draw';

/** (x, y) the hero's feet on screen. */
export function drawLoad(c: Ctx, h: Hero, x: number, y: number): void {
  if (!WEAPONS[h.weapon].reloads || h.act === 'down') return;
  // (Over the 1.5x hero's head: heroscale.ts.)
  const g = c.glow, top = Math.round(y - 38);
  if (h.xbowGlint) {
    // The glint: a four-pointed star at the hand, breathing.
    const s = 2 + Math.round(1.5 + 1.5 * Math.sin(c.now * 7)), sx = Math.round(x + h.fx * 9), sy = Math.round(y - 13 + h.fy * 4);
    g.fillStyle = '#e4eefa';
    g.fillRect(sx - s, sy, s * 2 + 1, 1);
    g.fillRect(sx, sy - s, 1, s * 2 + 1);
    g.fillStyle = '#ffffff';
    g.fillRect(sx - 1, sy - 1, 3, 3);
    return;
  }
  if (!h.xbowEmpty) return;
  const wound = h.xbowWind ?? 0;
  // A ring that fills as it winds (all of it dim until then).
  const n = 24, lit = Math.floor(wound * n);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    g.fillStyle = i < lit ? (h.winding && h.xbowClean ? '#e4eefa' : '#cfd6dc') : '#4f4a5c';
    g.fillRect(Math.round(x + Math.cos(a) * 7), Math.round(top + Math.sin(a) * 7), 1, 1);
  }
  // In the middle, the bolt it hasn't got: a hollow one, grey.
  g.fillStyle = '#8a8494';
  g.fillRect(Math.round(x), top - 2, 1, 5);
  g.fillRect(Math.round(x) - 1, top - 2, 3, 1);
}
