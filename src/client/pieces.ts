/**
 * Layout 4's new pieces as one list of boxes each (Kyle: "the same source data for both views so they
 * can't drift"): a mine's headframe, a fallen trunk, a watermill and its wheel, a fence of sharpened
 * stakes, the hungry's hanging tree, a headstone, an apple tree. The flat view paints the list in
 * three-quarter view (piecedraw.ts); the 2.5D view builds the same boxes (three/pieces3d.ts).
 *
 * A box is [x, y, z, w, h, d, colour, shape?]: (x, z) its foot's centre in tiles (from a block's
 * top-left corner, or a round's foot), y how high its base stands, w by h by d its size; a `lump` is a
 * rounded crown, a `cone` a point. Paint only.
 */
import type { Block, Round } from '../shared/arena';
import { STAITHE_KINDS, staitheBoxes } from './staithebox';
import { gibbetBoxes, oakBoxes, waymarkBoxes } from './woodpieces';
import { FEN_KINDS, fenBoxes } from './fenpieces';

export type Bx = [number, number, number, number, number, number, number, ('lump' | 'cone')?];
export const PIECE_BLOCKS = new Set<Block['kind']>(['headframe', 'log', 'mill', 'stakes', 'jetty', 'gangway', 'smokehouse', 'dryrack', 'hungnet', 'oak', 'haystack', 'boards', 'reeds']);
/** Boards you walk on (the Staithe's jetty and a log laid across): the flat view paints them under everyone (staithedraw.ts). */
export const DECKS = new Set<Block['kind']>(['jetty', 'gangway', 'boards']);
export const PIECE_ROUNDS = new Set<Round['kind']>(['hangtree', 'headstone', 'apple', 'gibbet', 'waymark']);

const TIMBER = 0x4a3420, DARK = 0x2e2016, STONE = 0x6a6470, IRON = 0x55505e, ROPE = 0x8a7a5a, BARK = 0x4a3a2a, LEAF = 0x2f4a28;
/** A tiny repeatable shuffle for looks. */
const shuffle = (n: number) => () => ((n = (n * 1103515245 + 12345) & 0x7fffffff), n / 0x7fffffff);

/** A block's boxes, by its kind and footprint (`look`: which way a mill's wheel faces). */
export function blockBoxes(b: Pick<Block, 'kind' | 'w' | 'h' | 'look' | 'ruined' | 'deck'>): Bx[] {
  const w = b.w, d = b.h, cx = w / 2, cz = d / 2, out: Bx[] = [], r = shuffle(Math.round(w * 37 + d * 11));
  if (STAITHE_KINDS.has(b.kind)) return staitheBoxes(b, r);
  if (FEN_KINDS.has(b.kind)) return fenBoxes(b, r);
  if (b.kind === 'oak') return oakBoxes(b, r);
  if (b.kind === 'haystack') {
    // A stack of hay on the threshing floor: a heaped base, a rounded top, loose wisps, a fork left in it.
    out.push([cx, 0, cz, w, 0.55, d, 0xb8a060], [cx, 0.45, cz, w * 0.9, 0.55, d * 0.85, 0xc8b06a, 'lump'], [cx, 0.85, cz, w * 0.6, 0.45, d * 0.6, 0xd8c47a, 'lump']);
    for (let i = 0; i < 6; i++) out.push([0.15 + r() * (w - 0.3), 0, 0.15 + r() * (d - 0.3), 0.12, 0.1, 0.12, 0x9a8448]);
    out.push([w * 0.7, 0.6, cz, 0.05, 0.9, 0.05, 0x5a3d22]);
    return out;
  }
  if (b.kind === 'headframe') {
    // Four legs leaning in to a head, cross braces, the sheave wheel on top and the rope down the shaft.
    for (const [x, z] of [[0.25, 0.25], [w - 0.25, 0.25], [0.25, d - 0.25], [w - 0.25, d - 0.25]]) out.push([x + (cx - x) * 0.15, 0, z + (cz - z) * 0.15, 0.18, 2.9, 0.18, TIMBER]);
    for (const y of [0.9, 1.9]) out.push([cx, y, 0.35, w - 0.5, 0.12, 0.12, DARK], [cx, y, d - 0.35, w - 0.5, 0.12, 0.12, DARK], [0.35, y, cz, 0.12, 0.12, d - 0.5, DARK], [w - 0.35, y, cz, 0.12, 0.12, d - 0.5, DARK]);
    out.push([cx, 2.9, cz, w - 0.3, 0.16, 0.5, TIMBER]);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      out.push([cx + Math.cos(a) * 0.42, 3.05 + 0.42 + Math.sin(a) * 0.42, cz, 0.14, 0.14, 0.08, IRON]);
    }
    out.push([cx, 3.05, cz, 0.08, 0.42, 0.08, IRON], [cx + 0.42, 0.15, cz, 0.04, 3.25, 0.04, ROPE], [cx, 0, cz, w * 0.6, 0.05, d * 0.6, 0x14100c]);
    return out;
  }
  if (b.kind === 'log') {
    // A trunk on its side, its cut end pale, a few broken branches, the root plate torn up at the other end.
    const along = w >= d, len = along ? w : d, k = (u: number): [number, number] => (along ? [u, cz] : [cx, u]);
    for (let u = 0.3; u < len - 0.2; u += 0.5) { const [x, z] = k(u); out.push([x, 0, z, along ? 0.52 : 0.62, 0.55, along ? 0.62 : 0.52, r() < 0.5 ? BARK : 0x3e3022]); }
    const [ex, ez] = k(len - 0.12), [rx, rz] = k(0.1);
    out.push([ex, 0.05, ez, along ? 0.08 : 0.5, 0.48, along ? 0.5 : 0.08, 0x8a6a40]);
    out.push([rx, 0, rz, along ? 0.5 : 1.3, 1.1, along ? 1.3 : 0.5, 0x3a2e24, 'lump']);
    for (let i = 0; i < 3; i++) { const [x, z] = k(len * (0.35 + i * 0.2)); out.push([x, 0.5, z + (along ? 0.3 : 0), 0.1, 0.5, 0.1, BARK]); }
    return out;
  }
  if (b.kind === 'mill') {
    // Stone below, boarded above, a steep roof; the door; the wheel in its leat on the pond's side.
    out.push([cx, 0, cz, w, 1.2, d, STONE], [cx, 1.2, cz, w - 0.1, 0.8, d - 0.1, 0x5a3d22]);
    for (let i = 0; i < 4; i++) out.push([cx, 2 + i * 0.22, cz, w + 0.2 - i * 0.05, 0.22, d + 0.2 - i * (d / 4.4), 0x3a3036]);
    out.push([cx, 0, d - 0.02, 0.8, 1.05, 0.06, DARK], [cx - w * 0.3, 1.45, d - 0.02, 0.4, 0.32, 0.06, 0x14100c], [cx + w * 0.3, 1.45, d - 0.02, 0.4, 0.32, 0.06, 0x14100c]);
    const side = b.look === 1 ? -0.12 : w + 0.12;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      out.push([side, 1.1 + Math.sin(a) * 1.05 - 0.09, cz + Math.cos(a) * 1.05, 0.3, 0.18, 0.3, TIMBER]);
      if (i % 3 === 0) out.push([side, 1.1 + Math.sin(a) * 0.5 - 0.04, cz + Math.cos(a) * 0.5, 0.08, 0.08, 0.08, DARK]);
    }
    out.push([side, 1.0, cz, 0.36, 0.2, 0.2, IRON]);
    return out;
  }
  // Stakes: sharpened poles rammed in a row, leaning out, their points pale.
  const along = w >= d, len = along ? w : d;
  for (let u = 0.15; u < len; u += 0.32) {
    const x = along ? u : cx, z = along ? cz : u, h = 0.75 + r() * 0.25;
    out.push([x, 0, z, 0.13, h, 0.13, r() < 0.5 ? 0x5a4a30 : 0x4a3c26], [x, h, z, 0.13, 0.22, 0.13, 0x9a8a62, 'cone']);
  }
  out.push(along ? [cx, 0.3, cz, w, 0.07, 0.06, DARK] : [cx, 0.3, cz, 0.06, 0.07, d, DARK]);
  return out;
}

/** A round's boxes, from its foot. */
export function roundBoxes(o: Pick<Round, 'kind' | 'r' | 'x' | 'y'>): Bx[] {
  const r = shuffle(Math.round(o.x * 31 + o.y * 17)), out: Bx[] = [];
  if (o.kind === 'hangtree') {
    // A big old tree with one long limb out to the east, high enough to hang from (the stock under it is
    // grim, by the ankles from hooks at 0.75 and 1.35 along the limb: the larder rule).
    out.push([0, 0, 0, 0.55, 3.1, 0.55, BARK], [0.95, 2.85, 0, 1.9, 0.2, 0.22, BARK], [-0.55, 2.7, 0, 1, 0.16, 0.16, BARK], [0.3, 0, 0.2, 0.9, 0.14, 0.5, 0x3a2e24, 'lump']);
    out.push([0, 3.0, 0, 2.4, 1.5, 2, 0x24391f, 'lump'], [-0.45, 3.4, 0.2, 1.6, 1.2, 1.5, LEAF, 'lump']);
    out.push([1.75, 3.05, 0, 0.16, 0.12, 0.2, 0x16141c], [1.83, 3.17, 0.06, 0.1, 0.08, 0.1, 0x16141c]);
    return out;
  }
  if (o.kind === 'gibbet') return gibbetBoxes();
  if (o.kind === 'waymark') return waymarkBoxes();
  if (o.kind === 'headstone') {
    // A slab, its top rounded, leaning a little; moss at its foot.
    const lean = (r() - 0.5) * 0.12;
    out.push([lean, 0, 0, 0.38, 0.5, 0.1, 0x5a5662], [lean, 0.42, 0, 0.38, 0.18, 0.1, 0x5a5662, 'lump'], [0, 0, 0.08, 0.44, 0.04, 0.12, 0x3e4a36]);
    return out;
  }
  // An apple tree: a short crooked trunk, a low round crown, apples in it.
  out.push([0, 0, 0, 0.18, 0.75, 0.18, BARK], [0, 0.6, 0, 1.2, 0.85, 1.05, 0x3a5a2a, 'lump'], [0.15, 0.9, 0.1, 0.8, 0.6, 0.7, 0x456a32, 'lump']);
  for (let i = 0; i < 4; i++) out.push([(r() - 0.5) * 0.9, 0.75 + r() * 0.5, 0.35 + r() * 0.15, 0.08, 0.08, 0.08, 0x9a2a1a]);
  return out;
}

/** How tall a piece stands (tiles), for the flat view's canvas. */
export const pieceTall = (bx: Bx[]) => Math.max(0, ...bx.map((q) => q[1] + q[4]));
