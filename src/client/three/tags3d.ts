/**
 * Words and marks over people and places in the 2.5D view, as the flat view has them: a townsperson's
 * name under them when you're close enough to talk, other
 * players' names over their heads, and a building's name on its front.
 */
import { isPost } from '../postkind';
import { POST_WORD_Y } from './posts3d';
import type { GameMap } from '../../shared/arena';
import { npcAt } from '../../shared/arena';
import { SPOT_REACH } from '../../shared/town';
import type { Hero } from '../../sim/types';
import { drawText, textWidth } from '../pixfont';
import type { Proj } from './overlay3d';
import { BOXFIGS } from './look';


export function drawTags(g: CanvasRenderingContext2D, map: GameMap, t: number, me: { x: number; y: number } | null, others: Hero[], P: Proj, _now: number): void {
  for (const b of map.blocks) {
    if (!b.label || b.kind === 'wall') continue;
    // (The job board's and the works' words on their fascia and top board: posts3d.ts.)
    const word = isPost(b) ? (b.label === 'PUBLIC WORKS' ? 'WORKS' : b.label) : b.label;
    const [x, y] = P(b.x + b.w / 2, POST_WORD_Y[b.label] ?? (b.kind === 'stall' ? 1.15 : 1.05), b.y + b.h / 2 + (isPost(b) ? 0.12 : b.h / 2 + 0.02)), w = textWidth(word);
    if (x < -w || y < -8 || x > g.canvas.width + w || y > g.canvas.height + 8) continue;
    drawText(g, word, Math.round(x - w / 2), Math.round(y), b.kind === 'stall' ? '#f0e0b0' : '#d8c48a');
  }
  // A flat figure (cards3d.ts) carries its own name, as in the flat view.
  if (BOXFIGS) for (const n of map.npcs ?? []) {
    if (n.mute || n.pose) continue;
    const at = npcAt(n, t), near = !!me && Math.hypot(me.x - at.x, me.y - at.y) <= SPOT_REACH;
    // (No mark over everyone: only an errand's gets one, as a quest mark: ../errandmarks.ts.)
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
