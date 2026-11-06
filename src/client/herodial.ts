/**
 * The eye dial on a posed hero (heroeyes.ts has the dial itself): where the eyes are this frame, the
 * top of the head, and the rim of light, gold on the top and left edges or red from below. Only draws.
 */
import { tinted, type Ctx } from './draw';
import { LAYOUT } from './figure';
import { GOLD, type DialLook } from './heroeyes';
import type { Jointed } from './joints';
import type { LookDef } from './lookkit';

const EYES: [number, number, number] = [0, 0, 0];
/** Where the eyes are this frame (scene pixels, after `layout`): row, left eye, right eye. */
export function eyesAt(d: LookDef): [number, number, number] {
  const L = LAYOUT, [row, a, b] = d.eyes, x = (c: number) => (L.flip ? L.left + 12 - c : L.left + 1 + c) + L.lean;
  (EYES[0] = L.top + 1 + row + L.drop), (EYES[1] = Math.min(x(a), x(b))), (EYES[2] = Math.max(x(a), x(b)));
  return EYES;
}

const tops = new WeakMap<LookDef, number>();
/** The look's first row with anything in it (the top of the helm, hood or hat). */
export const topRow = (d: LookDef) => tops.get(d) ?? (tops.set(d, Math.min(...d.down.map((p) => p[2]))), tops.get(d)!);

const rims = new WeakMap<object, Map<string, HTMLCanvasElement>>();
/** The sprite's own outline on one side lit in `col`: its silhouette less itself moved a pixel by (dx, dy). */
function rimOf(s: Jointed['s'], col: string, dx: number, dy: number): HTMLCanvasElement {
  let m = rims.get(s);
  if (!m) rims.set(s, (m = new Map()));
  let r = m.get(col);
  if (!r) {
    r = document.createElement('canvas');
    (r.width = s.w), (r.height = s.h);
    const g = r.getContext('2d')!;
    g.drawImage(tinted(s, col), 0, 0);
    g.globalCompositeOperation = 'destination-out';
    g.drawImage(s.white, dx, dy);
    m.set(col, r);
  }
  return r;
}

/**
 * Toward gold the top and left edges of the figure catch a gold light; toward red its lower edges
 * glow red from below. Drawn on the glow layer over the body (the outline pixels themselves light up).
 */
export function rim(c: Ctx, L: DialLook, j: Jointed): void {
  const k = L.side > 0 ? L.rim : L.side < 0 ? L.aura : 0;
  if (!k) return;
  const s = j.s, img = L.side > 0 ? rimOf(s, GOLD, 1, 1) : rimOf(s, '#e0301a', 0, -1), x = LAYOUT.left + Math.round(LAYOUT.lean / 2), y = LAYOUT.top + LAYOUT.drop;
  c.glow.globalAlpha = k * (L.side > 0 ? 0.75 : 0.6);
  if (!LAYOUT.flip) c.glow.drawImage(img, x, y);
  else c.glow.save(), c.glow.translate(x + s.w, y), c.glow.scale(-1, 1), c.glow.drawImage(img, 0, 0), c.glow.restore();
  c.glow.globalAlpha = 1;
}
