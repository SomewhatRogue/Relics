/**
 * The bigger rooms' own furniture in the flat view (shared/bighalls.ts; three/insidefurn3d.ts draws them in 2.5D):
 * a tavern table with its tankards and a candle stub, the church's stone font with dark water in it, an armour stand
 * (a helm, a breastplate on a post, a shield leant on it). Painted as furnish.ts paints the rest: the top, then the
 * front from `wallY` down `tall`.
 */
import type { Block } from '../shared/arena';

type Rect = (x: number, y: number, w: number, h: number, c: string) => void;

export function insideFurniture(b: Block, rect: Rect, w: number, roofH: number, wallY: number, tall: number): boolean {
  let seed = Math.round(b.x * 41 + b.y * 13) + 3;
  const rnd = (n: number) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), seed % Math.max(1, n));
  switch (b.kind) {
    case 'table': {
      rect(0, 0, w, roofH, '#5a3d22'), rect(1, 1, w - 2, roofH - 2, '#6b4a2b');
      for (let y = 4; y < roofH - 1; y += 4) rect(1, y, w - 2, 1, '#5a3d22');
      for (let i = 0, n = 2 + rnd(3); i < n; i++) {
        const x = 3 + rnd(Math.max(1, w - 8)), y = 2 + rnd(Math.max(1, roofH - 6));
        rect(x, y, 3, 3, rnd(3) ? '#6a5a48' : '#8a8494'), rect(x + 1, y + 1, 1, 1, '#2a1d12');
      }
      rect(Math.round(w / 2), Math.round(roofH / 2) - 1, 1, 2, '#e8e0c8');
      rect(0, wallY, w, 2, '#3a2818');
      rect(2, wallY + 2, 2, tall - 2, '#2a1d12'), rect(w - 4, wallY + 2, 2, tall - 2, '#2a1d12');
      return true;
    }
    case 'font': {
      const cx = Math.round(w / 2);
      rect(1, 1, w - 2, roofH - 2, '#625c6c'), rect(2, 0, w - 4, roofH, '#625c6c');
      rect(3, 3, w - 6, roofH - 6, '#1e2a36'), rect(4, 4, 2, 1, '#3a5a7a');
      rect(cx - 3, wallY, 6, tall - 3, '#4a4652'), rect(cx - 2, wallY, 1, tall - 3, '#57525e');
      rect(1, wallY + tall - 3, w - 2, 3, '#3e3a46');
      return true;
    }
    case 'stand': {
      const cx = Math.round(w / 2);
      rect(cx - 3, 0, 6, Math.min(roofH, 5), '#74707e'), rect(cx - 2, 1, 4, 1, '#1a1820');
      rect(cx - 1, wallY, 2, tall, '#3a2818');
      rect(cx - 5, wallY + 3, 10, 7, '#6a6878'), rect(cx - 5, wallY + 9, 10, 2, '#4a4652'), rect(cx - 1, wallY + 4, 2, 5, '#8a8494');
      rect(w - 4, wallY + 6, 3, 9, rnd(2) ? '#3a5a4a' : '#6a2a2a');
      rect(cx - 4, wallY + tall - 1, 8, 1, '#2e2016');
      return true;
    }
  }
  return false;
}
