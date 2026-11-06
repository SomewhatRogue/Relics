/**
 * A test hook for the hound sheet (scripts/hound-look.cjs): one hound in one pose drawn by the game's
 * own drawHound onto a small canvas, lit and glow layers laid together, no world, light or shadow.
 */
import type { HoundLook } from '../shared/houndlook';
import type { Hound } from '../sim/types';
import { BARE } from './draw';
import { drawHound } from './hound';
import type { PoseName } from './houndposes';

/** The hound as a PNG data URL, `w` by `h` scene pixels, feet at (w/2, h - 4); `name` drawn over it. */
export function houndArt(look: HoundLook, pose: [PoseName, number], w = 32, h = 22, name = false): string {
  const lit = document.createElement('canvas'), glow = document.createElement('canvas'), out = document.createElement('canvas');
  for (const c of [lit, glow, out]) (c.width = w), (c.height = h);
  const g = { lit: lit.getContext('2d')!, glow: glow.getContext('2d')!, now: 1 };
  const dog: Hound = { x: 0, y: 0, fx: 1, fy: 0, state: 'heel', target: 0, t: 0, next: 0, back: 0, bites: 0, moving: false };
  BARE.on = true;
  try {
    drawHound(g, dog, Math.round(w / 2), h - 4, { look, pose, name: name ? look.name : '' });
  } finally {
    BARE.on = false;
  }
  const o = out.getContext('2d')!;
  o.drawImage(lit, 0, 0);
  o.drawImage(glow, 0, 0);
  return out.toDataURL();
}
