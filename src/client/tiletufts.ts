/**
 * Tufts of grass and clumps of standing wheat, drawn the tile way (docs/design/tile-redraw.md, "Making a new asset"):
 * a handful of blades a few pixels tall, three shades, lit on the left, a dark foot. Stood up as cards over a grass or
 * wheat floor (three/tufts3d.ts), where they lean a pixel in the gusts and part round anyone walking through.
 * The living world (docs/design/living-world.md): Kyle, 2026-11-23, "beautiful and dynamic worlds that you impact".
 */
import { gradeCanvas } from './darkgold';
import type { Cut } from './three/propcards';

const GRASS = ['#141f15', '#223120', '#2f4127', '#3d5230'];
const WHEAT = ['#3e3219', '#7a6630', '#98823c', '#b8a052'];

const h01 = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** One tuft: `kind` grass or wheat, `v` which of a few variants (the same v draws the same tuft). */
export function tuftCut(kind: 'grass' | 'wheat', v: number): Cut {
  const wheat = kind === 'wheat', W = 7, H = wheat ? 11 : 6, C = wheat ? WHEAT : GRASS;
  const mk = () => Object.assign(document.createElement('canvas'), { width: W, height: H });
  const lit = mk(), g = lit.getContext('2d')!;
  const px = (x: number, y: number, w: number, h: number, c: string) => ((g.fillStyle = c), g.fillRect(x, y, w, h));
  const n = wheat ? 3 + Math.floor(h01(v, 1) * 2) : 4 + Math.floor(h01(v, 2) * 2);
  // A dark foot the blades stand in.
  px(1, H - 1, W - 2, 1, C[0]);
  for (let i = 0; i < n; i++) {
    const x = Math.min(W - 1, Math.floor(((i + 0.5) / n) * W + (h01(v, i + 3) - 0.5) * 1.6));
    const tall = wheat ? 6 + Math.floor(h01(v, i + 9) * 4) : 2 + Math.floor(h01(v, i + 9) * 4);
    const shade = h01(v, i + 17) < 0.45 ? 2 : 1;
    // Lit on the left: the left blades a shade up.
    px(x, H - 1 - tall, 1, tall, C[x < W / 2 ? shade : 1]);
    if (wheat) px(x, H - 2 - tall, 1, 2, C[3]);
    else if (tall >= 4) px(x, H - 1 - tall, 1, 1, C[3]);
  }
  gradeCanvas(lit, 'floor');
  return { lit, glow: mk(), w: W, h: H, ax: Math.floor(W / 2), ay: H - 1 };
}
