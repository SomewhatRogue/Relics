/**
 * The ground's marks the tile way (docs/design/forest-redraw.md, "The laid soils"): churned mud, trampled ground, a
 * puddle, weeds and loose straw, for three/redrawfloor.ts. Their old painters (groundpaint.ts, marks.ts) are a
 * rectangle of flecks scaled onto the new grid; here a mark is a shape with a wandering edge, filled as the ground
 * beside it is drawn, or a handful of the kit's own small stamps (tilestrew.ts). Paint only; variety from the mark's
 * own Rng, never Math.random.
 */
import type { Rng } from '../shared/rng';
import { KX, KZ, type Rect } from './tilekit';
import { clumpLight, earthAt } from './tilegrounds';
import { mudAt } from './tilesoils';
import { stamp } from './tilestrew';

type M = { kind: string; x: number; y: number; w: number; h: number };
export const TILED_MARKS = new Set(['mud', 'trample', 'puddle', 'weeds', 'straw']);

const TROD = ['#1d1711', '#28201a', '#2e251d', '#3a2f24'], PRINT = '#0e0b08', RIM = '#120e0b';
const WET = 'rgba(4, 7, 12, 0.45)', DEEP = '#070b0e', STILL = '#17222c', SKY = '#22313d', LIP = '#34444f', SHINE = '#566a78';

/** Each floor pixel of a mark's shape: an oval that swells and pinches, its edge in clumps; `d` 0 in the middle, 1 at the edge. */
function shape(k: M, rng: Rng, fn: (px: number, py: number, d: number, cy: number) => void): void {
  const cx = (k.x + k.w / 2) * KX, cy = (k.y + k.h / 2) * KZ, rx = Math.max(4, (k.w / 2) * KX), ry = Math.max(3, (k.h / 2) * KZ), p1 = rng.next() * 6.28, p2 = rng.next() * 6.28;
  for (let py = Math.floor(cy - ry * 1.3); py <= cy + ry * 1.3; py++) for (let px = Math.floor(cx - rx * 1.3); px <= cx + rx * 1.3; px++) {
    const th = Math.atan2((py - cy) / ry, (px - cx) / rx);
    const d = Math.hypot((px - cx) / rx, (py - cy) / ry) / (1 + 0.18 * Math.sin(th * 2 + p1) + 0.12 * Math.sin(th * 3 + p2));
    if (d <= 1 + clumpLight(px, py, 5, 3, 67) * 0.4) fn(px, py, d, cy);
  }
}
/** A spot inside the mark's oval, floor pixels. */
const spot = (k: M, rng: Rng): [number, number] => {
  const a = rng.next() * 6.28, r = Math.sqrt(rng.next()) * 0.9;
  return [Math.round((k.x + k.w / 2 + Math.cos(a) * r * (k.w / 2)) * KX), Math.round((k.y + k.h / 2 + Math.sin(a) * r * (k.h / 2)) * KZ)];
};

const PAINT: Record<string, (rect: Rect, rng: Rng, k: M) => void> = {
  // Churned mud: the mud's own ground, sunk a little (a dark edge), a boot print or two in it.
  mud(rect, rng, k) {
    shape(k, rng, (px, py, d) => rect(px, py, 1, 1, d > 0.88 ? RIM : mudAt(px, py)));
    for (let i = 0; i < 1 + rng.int(2); i++) {
      const [x, y] = spot(k, rng);
      rect(x, y, 2, 2, PRINT), rect(x + 3, y + 1, 2, 2, PRINT);
    }
  },
  // Trampled ground: dark trodden earth showing through in clumps, boot prints, a weed come back.
  trample(rect, rng, k) {
    shape(k, rng, (px, py, d) => (d < 0.6 || clumpLight(px, py, 6, 4, 73) > -0.08) && rect(px, py, 1, 1, earthAt(px, py, TROD)));
    for (let i = 0; i < Math.max(1, Math.round(k.w * k.h * 0.5)); i++) {
      const [x, y] = spot(k, rng);
      rect(x, y, 2, 2, PRINT), rect(x + 3, y + 1, 2, 2, PRINT);
    }
    for (let i = 0; i < Math.round(k.w * k.h * 0.4); i++) stamp(rect, 'tuft', rng.int(3), ...spot(k, rng));
  },
  // A puddle: the ground wet round it, still water with the far edge lit and the sky in its far half.
  puddle(rect, rng, k) {
    shape(k, rng, (px, py, d, cy) => {
      if (d > 0.82) return rect(px, py, 1, 1, WET);
      if (d > 0.7) return rect(px, py, 1, 1, py < cy ? DEEP : LIP);
      rect(px, py, 1, 1, py % 3 === 0 && ((px >> 2) * 7 + py) % 5 === 0 ? SHINE : py > cy ? SKY : STILL);
    });
  },
  // Weeds: the kit's tufts and clumps, a couple a tile, the odd pale flower.
  weeds(rect, rng, k) {
    const at = Array.from({ length: Math.max(1, Math.round(k.w * k.h * 2.4)) }, () => spot(k, rng)).sort((a, b) => a[1] - b[1]);
    for (const [x, y] of at) stamp(rect, rng.next() < 0.08 ? 'flower' : rng.next() < 0.4 ? 'clump' : 'tuft', rng.int(3), x, y);
  },
  // Loose straw: a few stalks lying, pale over their shadows.
  straw(rect, rng, k) {
    for (let i = 0; i < Math.max(2, Math.round(k.w * k.h * 3.5)); i++) {
      const [x, y] = spot(k, rng), len = 3 + rng.int(3), c = rng.next() < 0.35 ? '#857036' : '#6e5b2e';
      rect(x + 1, y + 1, len, 1, '#1a140d');
      rect(x, y, len, 1, c);
      if (rng.next() < 0.4) rect(x + len, y + 1, 2, 1, c);
    }
  },
};

/** Paint one ground mark the tile way (a kind in TILED_MARKS). */
export function tileMark(rect: Rect, rng: Rng, k: M): void {
  PAINT[k.kind]?.(rect, rng, k);
}
