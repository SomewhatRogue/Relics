/**
 * The plinth in Lantern Square as boxes (tall, 2026-11-13: it lifts a hero-sized figure over the square) (pieces.ts: the same list both views build), and where its plate and
 * its statue go, so the flat view and the 2.5D view put the name and the figure in the same place. Paint only.
 */
import type { Bx } from './pieces';

/** In tiles from the round's foot: a slab, the body with the plate on its front, the cap the statue stands on. */
export const PLINTH_BOX = { slab: [2.2, 0.16, 1.0], body: [1.9, 1.5, 0.74], cap: [2.06, 0.12, 0.88] } as const;
/** How high the cap's top stands (tiles): the statue's feet. */
export const PLINTH_TOP = PLINTH_BOX.slab[1] + PLINTH_BOX.body[1] + PLINTH_BOX.cap[1];
/** The body's front face: how far forward of the foot (tiles), and its foot and top above the floor (tiles). */
export const PLATE = { z: PLINTH_BOX.body[2] / 2, y0: PLINTH_BOX.slab[1], y1: PLINTH_BOX.slab[1] + PLINTH_BOX.body[1] };

const STONE = 0x57525e, DARK = 0x45414c, PALE = 0x6a6470;

export function plinthBoxes(): Bx[] {
  const [sw, sh, sd] = PLINTH_BOX.slab, [bw, bh, bd] = PLINTH_BOX.body, [cw, ch, cd] = PLINTH_BOX.cap;
  // Carved (Kyle, 2026-11-13): a moulding round its foot, a pilaster up each front corner, a cornice under the cap.
  const px = bw / 2 - 0.1;
  return [
    [0, 0, 0, sw, sh, sd, DARK], [0, sh, 0, bw, bh, bd, STONE],
    [0, sh, 0, bw + 0.12, 0.12, bd + 0.1, PALE], [0, sh + 0.12, 0, bw + 0.04, 0.05, bd + 0.03, DARK],
    [-px, sh + 0.17, 0, 0.18, bh - 0.31, bd + 0.05, PALE], [px, sh + 0.17, 0, 0.18, bh - 0.31, bd + 0.05, PALE],
    [0, sh + bh - 0.14, 0, bw + 0.08, 0.05, bd + 0.05, DARK], [0, sh + bh - 0.09, 0, bw + 0.12, 0.09, bd + 0.1, PALE],
    [0, sh + bh, 0, cw, ch, cd, PALE],
  ];
}

/** A name cut on the plate: one line, or two (at a space nearest the middle, else halved) when it's long. */
export function plateLines(name: string): string[] {
  const s = name.trim();
  if (s.length <= 7) return [s];
  const mid = s.length / 2, sp = [...s].map((c, i) => (c === ' ' ? i : -1)).filter((i) => i > 0).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
  return sp !== undefined ? [s.slice(0, sp), s.slice(sp + 1)] : [s.slice(0, Math.ceil(mid)), s.slice(Math.ceil(mid))];
}
