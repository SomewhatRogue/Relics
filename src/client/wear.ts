/**
 * A Wickhold building still showing the night of the breach (shared/arena.ts `worn`): soot up the
 * front wall, one window boarded over, the other shutter hanging, holes in the roof with the laths
 * showing. Painted into the block's cached canvas; mending the shutters and roofs takes it away.
 */
import type { Block } from '../shared/arena';

type Rect = (x: number, y: number, w: number, h: number, c: string) => void;

export function wear(g: CanvasRenderingContext2D, rect: Rect, b: Block, w: number, roofH: number, wallY: number, tall: number): void {
  let seed = Math.round(b.x * 53 + b.y * 29) + 3;
  const rnd = (n: number) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), seed % Math.max(1, n));
  // Soot licking up the wall from the ground, darkest low down.
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 3; i++) {
    const sx = rnd(w - 10), sw = 8 + rnd(14);
    for (let j = 0; j < tall; j++) if (rnd(tall) < tall - j) rect(sx + rnd(3), wallY + tall - 1 - j, Math.max(2, sw - Math.round(j / 2)), 1, 'rgba(14,10,8,0.35)');
  }
  g.globalCompositeOperation = 'source-over';
  // Holes in the roof: a dark gap with the laths across it.
  for (let i = 0; i < Math.max(1, Math.round(w / 40)); i++) {
    const hx = 3 + rnd(w - 14), hy = 2 + rnd(Math.max(1, roofH - 8)), hw = 6 + rnd(6), hh = 3 + rnd(3);
    rect(hx, hy, hw, hh, '#0d0b10');
    for (let x = hx + 1; x < hx + hw; x += 3) rect(x, hy, 1, hh, '#5a3d22');
  }
  // The right window boarded, two planks crossed; the left one's shutter hanging off a hinge.
  // (Sized to the tall heroes, 2026-11-12.)
  const wy = wallY + 8, rx = Math.round(w * 0.72), lx = Math.round(w * 0.22);
  rect(rx - 3, wy - 1, 9, 7, '#14121a');
  rect(rx - 4, wy, 11, 2, '#7a5a34'), rect(rx - 4, wy + 3, 11, 2, '#6b4a2b');
  rect(lx - 4, wy + 1, 3, 7, '#4a3420');
}

/** Which of the two windows still show a light (a boarded one doesn't). */
export const windowsLit = (b: Block) => (b.worn ? [0.22] : [0.22, 0.72]);
