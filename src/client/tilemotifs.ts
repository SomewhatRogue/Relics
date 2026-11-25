/**
 * The pattern book's motifs, drawn on the redraw's floor (looks.ts decides which and where; docs/design/
 * forest-redraw.md, "The pattern book"). Each is tile art at a pixel to a pixel, its edge broken into the turf's own
 * clumps, lit from the upper left, in a few dark shades of its own:
 * - hollow: a dip of dark moss, its upper inner edge in shadow, the far rim catching light; `pool` has still water in it;
 * - bald: a worn patch of bare earth, the turf's lip and shadow along its top;
 * - tallgrass: a stand of longer, paler blades (three/tufts3d.ts stands tufts thick in it);
 * - burn: a black heart, ash round it, scorched turf at the edge, charred ends lying in it;
 * - ring: a ring of red-capped mushrooms on darker turf;
 * - puddle, moss (a town's): rain lying in the low stones with the courses showing through the wet; moss in the damp;
 * - drift: small things lying along the wind in a lens: dead leaves, bones, stones, pale flowers, blood-red ones.
 * Zones go under the groves' floors; drifts and rings go on top of everything strewn.
 */
import type { GameMap } from '../shared/arena';
import { Rng } from '../shared/rng';
import type { ScatterKind } from '../shared/scatter';
import { motifsOf, pavedAt, type Motif } from './looks';
import { EARTH, clumpLight, earthAt } from './tilegrounds';
import { KX, KZ, type Rect } from './tilekit';
import { openPx } from './tilelitter';
import { bloom, stamp } from './tilestrew';

const MOSS = ['#0b130f', '#111c15', '#17251a', '#1f3021'], MIRE = ['#14110d', '#1c1812', '#251f18', '#2f271e'];
const SLATE = ['#111014', '#18161b', '#201e24', '#2a282f'];
const TALL = ['#121b15', '#1f2e1f', '#2a3e27', '#384f2c'], ASH = ['#0b0a0a', '#131214', '#1c1b1e', '#28272b'];
const WET = 'rgba(4, 7, 12, 0.5)', DAMP = 'rgba(4, 7, 12, 0.26)', STAIN = 'rgba(10, 26, 14, 0.42)';
/** A puddle: still water, the sky in its far half, the lit lip of its far edge, a glint. */
const STILL = '#17222c', SKY = '#22313d', RIM = '#34444f', SHINE = '#566a78';
const WATER = '#0d1317', DEEP = '#070b0e', GLINT = '#26323b', LIP = '#0b110c', SHADOW = '#1c1611', SCORCH = ['#12160f', '#191e14'];

const h01 = (a: number, b: number, s: number) => {
  const v = Math.sin(a * 12.9898 + b * 78.233 + s * 37.719) * 43758.5453;
  return v - Math.floor(v);
};

/** A zone's test and its pixels: `inside(px, py)` is the distance from the middle (under 1 inside, edge clumped) or -1. */
function zone(o: Motif, open: (px: number, py: number) => boolean, W: number, H: number) {
  const cx = Math.round(o.x * KX), cy = Math.round(o.y * KZ), rx = o.rx * KX, ry = o.ry * KZ;
  // (Not an oval: its edge swells and pinches round the middle, each zone its own way.)
  const p1 = (o.v % 97) * 0.065, p2 = (o.v % 61) * 0.103;
  const inside = (px: number, py: number) => {
    const th = Math.atan2((py - cy) / ry, (px - cx) / rx);
    const d = Math.hypot((px - cx) / rx, (py - cy) / ry) / (1 + 0.2 * Math.sin(th * 2 + p1) + 0.14 * Math.sin(th * 3 + p2) + 0.08 * Math.sin(th * 5 + p1 * 2));
    return d <= 1 + clumpLight(px, py, 6, 4, 61) * 0.5 && open(px, py) ? d : -1;
  };
  const each = (fn: (px: number, py: number, d: number) => void) => {
    for (let py = Math.max(1, Math.floor(cy - ry * 1.3)); py <= Math.min(H - 1, cy + ry * 1.3); py++)
      for (let px = Math.max(0, Math.floor(cx - rx * 1.3)); px <= Math.min(W - 1, cx + rx * 1.3); px++) {
        const d = inside(px, py);
        if (d >= 0) fn(px, py, d);
      }
  };
  return { cx, cy, rx, ry, inside, each };
}

/** The zones: laid before the groves' floors, the water and whatever is strewn. */
export function paintZones(m: GameMap, rect: Rect): void {
  const open = openPx(m), W = m.w * KX, H = m.h * KZ, floor = m.theme.floor as string;
  // (A hollow is moss in turf, wet slate in rock, mire in bare earth.)
  const dip = floor === 'grass' || floor === 'wheat' ? MOSS : floor === 'rock' ? SLATE : MIRE;
  const paved = (px: number, py: number) => pavedAt(m, px / KX, py / KZ);
  for (const o of motifsOf(m)) {
    if (o.kind.startsWith('drift') || o.kind === 'ridge') continue;
    const z = zone(o, open, W, H);
    if (o.kind === 'hollow' || o.kind === 'pool') {
      const pal = dip;
      z.each((px, py, d) => {
        const lv = 0.5 + clumpLight(px, py, 6, 4, 91) * 0.8;
        let i = lv < 0.34 ? 0 : lv < 0.56 ? 1 : 2;
        // The bank nearer the light throws its shadow in; the far rim catches it.
        if (d > 0.7 && py < z.cy) i = 0;
        else if (d > 0.82 && py > z.cy) i = Math.min(3, i + 1);
        rect(px, py, 1, 1, pal[i]);
        if (o.kind !== 'pool') return;
        const w = Math.hypot((px - z.cx) / (z.rx * 0.58), (py - z.cy - 1) / (z.ry * 0.52)) - clumpLight(px, py, 7, 4, 93) * 0.25;
        if (w > 1) return;
        rect(px, py, 1, 1, w > 0.8 && py < z.cy ? DEEP : py % 3 === 0 && w < 0.8 && h01(px >> 2, py, 3) < 0.22 ? GLINT : WATER);
      });
    } else if (o.kind === 'bald') {
      z.each((px, py) => {
        const top = z.inside(px, py - 1) < 0;
        rect(px, py, 1, 1, top ? SHADOW : earthAt(px, py, EARTH));
        if (top && open(px, py - 1)) rect(px, py - 1, 1, 1, LIP);
      });
    } else if (o.kind === 'tallgrass') {
      z.each((px, py) => {
        const rp = (py + ((px * 7) % 3)) % 4, on = h01(px, Math.floor((py + ((px * 7) % 3)) / 4), 21) < 0.44;
        rect(px, py, 1, 1, TALL[on ? (rp === 0 ? 3 : rp < 3 ? 2 : 0) : 1]);
      });
    } else if (o.kind === 'burn') {
      z.each((px, py, d) => {
        const lv = 0.5 + clumpLight(px, py, 5, 3, 95) * 0.8;
        if (d > 0.8) return rect(px, py, 1, 1, SCORCH[lv < 0.5 ? 0 : 1]);
        if (h01(px, py, 7) < 0.018) return rect(px, py, 1, 1, '#47454b');
        rect(px, py, 1, 1, ASH[d < 0.42 ? (lv < 0.55 ? 0 : 1) : lv < 0.34 ? 1 : lv < 0.6 ? 2 : 3]);
      });
      // Charred ends lying in the ash.
      const r = new Rng(o.v + 3);
      for (let i = 0; i < 4; i++) {
        const x = z.cx + Math.round((r.next() - 0.5) * z.rx), y = z.cy + Math.round((r.next() - 0.5) * z.ry), n = 3 + r.int(4), up = r.next() < 0.5 ? -1 : 1;
        for (let t = 0; t < n; t++) if (open(x + t, y + Math.round(t * 0.4 * up))) rect(x + t, y + Math.round(t * 0.4 * up), 1, 1, t === n - 1 ? '#3a1a14' : '#050505');
      }
    } else if (o.kind === 'puddle') {
      // Rain lying in the low stones: the courses show through the wet round it; still water in the middle, the
      // bank nearer the light dark, the far edge lit, the sky in its far half, a glint or two.
      z.each((px, py, d) => {
        if (!paved(px, py)) return;
        const w = d + clumpLight(px, py, 7, 4, 93) * 0.3;
        if (w > 0.64) return rect(px, py, 1, 1, w > 0.86 ? DAMP : WET);
        if (w > 0.55) return rect(px, py, 1, 1, py < z.cy ? DEEP : RIM);
        rect(px, py, 1, 1, py % 3 === 0 && h01(px >> 2, py, 3) < 0.25 ? SHINE : py > z.cy ? SKY : STILL);
      });
    } else if (o.kind === 'moss') {
      // Moss in the damp: thick clumps in the middle, thinning to a stain in the seams at the edge.
      z.each((px, py, d) => {
        if (!paved(px, py)) return;
        const lv = clumpLight(px, py, 5, 3, 97) + (1 - d) * 0.3;
        if (lv > 0.24) rect(px, py, 1, 1, MOSS[lv > 0.38 ? 3 : 2]);
        else if (lv > 0.1) rect(px, py, 1, 1, MOSS[1]);
        else if (lv > -0.05) rect(px, py, 1, 1, STAIN);
      });
    } else if (o.kind === 'ring') {
      z.each((px, py, d) => d < 0.8 && clumpLight(px, py, 6, 4, 61) < 0.02 && rect(px, py, 1, 1, MOSS[d < 0.4 ? 1 : 2]));
    }
  }
}

const DRIFT: Record<string, [ScatterKind | 'bloom', number[]][]> = {
  'drift:leaves': [['leaf', [0, 1, 2]]], 'drift:bones': [['bone', [0, 1, 2]], ['stone', [1]]], 'drift:stones': [['stone', [0, 1, 2]], ['gravel', [0, 1, 2]]],
  'drift:pale': [['flower', [0]], ['tuft', [1]]], 'drift:red': [['flower', [1, 2]], ['flower', [2]], ['tuft', [1]]],
  'drift:blue': [['bloom', [0, 1]], ['bloom', [1]], ['tuft', [1]]], 'drift:gold': [['bloom', [2, 3]], ['bloom', [3]], ['tuft', [1]]],
};

/** The drifts and the rings' mushrooms: laid last, on top of whatever is strewn. */
export function paintDrifts(m: GameMap, rect: Rect): void {
  const open = openPx(m);
  for (const o of motifsOf(m)) {
    const r = new Rng(o.v + 11);
    if (o.kind === 'ring') {
      const n = 9 + (o.v % 5), gap = r.next() * 6.28;
      for (let i = 0; i < n; i++) {
        const a = gap + 0.5 + (i / n) * 5.3 + (r.next() - 0.5) * 0.2, px = Math.round((o.x + Math.cos(a) * o.rx * 0.82) * KX), py = Math.round((o.y + Math.sin(a) * o.ry * 0.82) * KZ);
        if (open(px, py)) stamp(rect, 'shroom', 0, px, py);
      }
      continue;
    }
    const set = DRIFT[o.kind];
    if (!set) continue;
    // A lens along the heading: thick in the middle, thinning to the ends.
    for (let i = 0, n = Math.round(o.rx * (o.kind === 'drift:bones' ? 3 : 6)); i < n; i++) {
      const t = (r.next() + r.next() - 1) * 0.95, off = (r.next() - 0.5) * 2 * o.ry * (1 - Math.abs(t) * 0.8), al = t * o.rx;
      const px = Math.round((o.x + Math.cos(o.a) * al - Math.sin(o.a) * off) * KX), py = Math.round((o.y + Math.sin(o.a) * al * 0.6 + Math.cos(o.a) * off) * KZ);
      const [k, vs] = set[r.int(set.length)];
      if (open(px, py)) (k === 'bloom' ? bloom(rect, vs[r.int(vs.length)], px, py) : stamp(rect, k, vs[r.int(vs.length)], px, py));
    }
  }
}
