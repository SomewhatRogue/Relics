/**
 * A building's name up on its roof, over everything (Kyle, 2026-11-16: names on the front wall were hidden by
 * whatever stood before it), in both views: the flat one here on the glow layer after every sprite, the 2.5D one on
 * its overlay (three/tags3d.ts) by the same rule. Stalls, the job board and the works keep their words where they
 * are (blocks.ts, posts). A dark shadow under the letters so they read on any roof.
 */
import type { Block, GameMap } from '../shared/arena';
import { isPost } from './postkind';
import { drawText, textWidth } from './pixfont';
import { OX, OY, PX } from './world';

/** Whether a block's name goes on its roof (not a stall's, a post's or a wall's). */
export const roofNamed = (b: Block) => !!b.label && b.kind !== 'stall' && b.kind !== 'wall' && !isPost(b);

/** The words with a shadow, centred on (x, y). */
export function nameAt(g: CanvasRenderingContext2D, word: string, x: number, y: number, col = '#e8d49a'): void {
  const w = textWidth(word), tx = Math.round(x - w / 2), ty = Math.round(y - 3);
  for (const [dx, dy] of [[1, 1], [0, 1], [1, 0], [-1, 0], [0, -1]]) drawText(g, word, tx + dx, ty + dy, '#0d0b10');
  drawText(g, word, tx, ty, col);
}

/**
 * Every named building's name in the middle of its roof, the camera at (cx, cy); `tall` its wall's height on screen
 * (blocks.ts LOOK), `up` how far its level lifts it (levelpaint.ts).
 */
export function drawHallNames(g: CanvasRenderingContext2D, map: GameMap, cx: number, cy: number, tall: (b: Block) => number, up: (x: number, y: number) => number): void {
  const W = g.canvas.width, H = g.canvas.height;
  for (const b of map.blocks) {
    if (!roofNamed(b) || b.ruined) continue;
    const x = OX + (b.x + b.w / 2) * PX - cx, y = OY + (b.y + b.h / 2) * PX - cy - tall(b) - up(b.x + b.w / 2, b.y + b.h / 2);
    if (x < -60 || x > W + 60 || y < -10 || y > H + 10) continue;
    nameAt(g, b.label!, x, y);
  }
}
