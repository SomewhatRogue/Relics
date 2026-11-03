/**
 * Words and marks over people and places in the 2.5D view, as the flat view has them: a gold mark over
 * anyone you can talk to (brighter, and their name under them, when you're close enough to), other
 * players' names over their heads, and a building's name on its front.
 */
import type { GameMap } from '../../shared/arena';
import { npcAt } from '../../shared/arena';
import { SPOT_REACH } from '../../shared/town';
import type { Hero } from '../../sim/types';
import { drawText, textWidth } from '../pixfont';
import type { Proj } from './overlay3d';
import { BOXFIGS } from './look';

/** Over-the-head heights (tiles) for a grown townsperson, and a child. */
const HEAD = 1.65, SMALL = 1.05;

export function drawTags(g: CanvasRenderingContext2D, map: GameMap, t: number, me: { x: number; y: number } | null, others: Hero[], P: Proj, now: number): void {
  const bob = Math.floor(now * 3) % 2;
  for (const b of map.blocks) {
    if (!b.label || b.kind === 'wall') continue;
    const [x, y] = P(b.x + b.w / 2, b.kind === 'stall' ? 1.15 : 1.05, b.y + b.h + 0.02), w = textWidth(b.label);
    if (x < -w || y < -8 || x > g.canvas.width + w || y > g.canvas.height + 8) continue;
    drawText(g, b.label, Math.round(x - w / 2), Math.round(y), b.kind === 'stall' ? '#f0e0b0' : '#d8c48a');
  }
  // A flat figure (cards3d.ts) carries its own mark and name, as in the flat view.
  if (BOXFIGS) for (const n of map.npcs ?? []) {
    if (n.mute || n.pose) continue;
    const at = npcAt(n, t), near = !!me && Math.hypot(me.x - at.x, me.y - at.y) <= SPOT_REACH;
    const [x, y] = P(at.x, (n.look === 'child' ? SMALL : HEAD) + (n.look === 'mage' ? 0.45 : 0) + (n.lift ?? 0) / 16, at.y);
    g.fillStyle = near ? '#fff1b0' : '#d4a537';
    const mx = Math.round(x), my = Math.round(y) - 3 + bob;
    g.fillRect(mx, my - 2, 1, 1), g.fillRect(mx - 1, my - 1, 3, 1), g.fillRect(mx, my, 1, 1);
    if (near) {
      const [fx, fy] = P(at.x, 0, at.y + 0.35);
      drawText(g, n.name, Math.round(fx - textWidth(n.name) / 2), Math.round(fy), '#f0e0b0');
    }
  }
  for (const h of others) {
    const [x, y] = P(h.x, BOXFIGS ? 1.75 : 1.5, h.y), name = (h.tag ?? h.id).toUpperCase();
    drawText(g, name, Math.round(x - textWidth(name) / 2), Math.round(y - 6), '#9ad8a8');
  }
}
