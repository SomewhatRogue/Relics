/**
 * What lies on a job's ground (shared/scatter.ts decides what and where: thick round trees, rocks, walls and water,
 * thin in the open), drawn the tile way for the redraw's floor in place of scatterpaint.ts's old-look sprites, which
 * came out pale and a size too big on the dark turf. One drawn pixel to one floor pixel, each thing a few pixels,
 * lit top left with a dark foot, in the ground's own dark shades. The accents are ours: rust leaves, pale bone, a
 * blood-red cap on a mushroom, a ghost-pale flower. (docs/design/forest-redraw.md, "Ground layout".)
 */
import type { GameMap } from '../shared/arena';
import { scatterOf, type ScatterKind } from '../shared/scatter';
import { KX, KZ, type Rect } from './tilekit';

const C: Record<string, string> = {
  d: '#0f1710', g: '#243322', l: '#33462b', b: '#43583a', // turf: foot, body, lit, blade tip
  s: '#34323c', p: '#484551', k: '#15141a', // stone: body, lit top, foot
  t: '#33261a', u: '#1a130d', // twig, its shadow
  w: '#77725f', v: '#5a5647', // bone, bone in shade
  r: '#4a2a1a', o: '#5c3520', // dead leaves
  m: '#1f2e1c', n: '#2a3d25', // moss
  c: '#64201b', h: '#86362a', e: '#8a8474', // mushroom: cap, cap's light, stem
  y: '#4e4d2e', z: '#646238', // reed
  q: '#12171a', // wet
  f: '#8a8894', x: '#6b1d1b', // flower: ghost-pale, or blood-red
};

const ART: Record<ScatterKind, string[][]> = {
  tuft: [['.b.l.', 'lglgl', '.ddd.'], ['l.b', 'glg', '.d.'], ['.l..b', 'lgl.l', 'gglgg', '.ddd.']],
  clump: [['.ll..', 'lggg.', 'ggggd', '.ddd.'], ['.lg.', 'lggd', '.dd.']],
  stone: [['.pp.', 'pssk', '.kk.'], ['pp', 'sk'], ['.pps.', 'psssk', '.kkk.']],
  twig: [['t...', '.tt.', '...t', '..u.'], ['..t', 'tt.', '.u.']],
  bone: [['w.w', '.w.', 'v.v'], ['.ww.', 'wvvw', '.vv.'], ['w..', '.w.', '..w']],
  leaf: [['r.', '.o'], ['o', 'r'], ['.r', 'o.', '.r']],
  moss: [['.nn.', 'nmmn', '.mm.'], ['nm', 'mm']],
  shroom: [['.h.', 'ccc', '.e.'], ['.h..', 'ccc.', '.e.h', '..cc', '...e']],
  reed: [['z..', 'y.z', 'yyy', '.d.'], ['.z', 'yy', 'yy', 'd.']],
  wet: [['.qqq.', 'qqqqq', '.qqq.'], ['qqq', 'qqq']],
  flower: [['.f.', 'fff', '.g.'], ['x', 'g'], ['.x.', 'xxx', '.g.']],
  gravel: [['s.p', '.k.'], ['p.', '.s'], ['s..p', '..k.']],
};

/** Growing things keep off bare and laid ground; stones, twigs, leaves and bones lie anywhere. */
const GROWS = new Set<ScatterKind>(['tuft', 'clump', 'moss', 'flower', 'shroom']);

/** Draw the map's scatter; `bare(x, y)` (tiles) says the ground there grows nothing (a path, flags, swept earth). */
export function strew(m: GameMap, rect: Rect, bare: (x: number, y: number) => boolean): void {
  const { floor } = scatterOf(m);
  // The wet edge first, under everything else.
  for (const pass of [true, false]) for (let i = 0; i < floor.length; i++) {
    const k = floor[i];
    if ((k.k === 'wet') !== pass || (GROWS.has(k.k) && bare(k.x, k.y))) continue;
    const arts = ART[k.k], v = (Math.imul(i + 1, 2654435761) >>> 0) % arts.length;
    // (The bigger of a kind where the scatter says big: its last variant is its largest.)
    const rows = arts[k.s > 1.15 ? arts.length - 1 : v], x0 = Math.round(k.x * KX) - (rows[0].length >> 1), y0 = Math.round(k.y * KZ) - rows.length + 1;
    rows.forEach((row, j) => [...row].forEach((ch, c) => C[ch] && rect(x0 + c, y0 + j, 1, 1, C[ch])));
  }
}

/** One thing of a kind, variant `v`, its foot's middle at floor pixel (px, py): the pattern book's drifts and rings. */
export function stamp(rect: Rect, k: ScatterKind, v: number, px: number, py: number): void {
  const rows = ART[k][v % ART[k].length], x0 = px - (rows[0].length >> 1), y0 = py - rows.length + 1;
  rows.forEach((row, j) => [...row].forEach((ch, c) => C[ch] && rect(x0 + c, y0 + j, 1, 1, C[ch])));
}

const FERNS = [['l.....l', '.lg.gl.', '..lgl..', '.lgdgl.', '..ddd..'], ['.l...l.', 'l.lgl.l', '.lgdgl.', '..ddd..'], ['l...l', '.lgl.', 'lgdgl', '.ddd.']];
/** A fern at a grove's edge (tilelitter.ts), variant `v`, its foot's middle at floor pixel (px, py). */
export function fern(rect: Rect, v: number, px: number, py: number): void {
  const rows = FERNS[v % FERNS.length], x0 = px - (rows[0].length >> 1), y0 = py - rows.length + 1;
  rows.forEach((row, j) => [...row].forEach((ch, c) => C[ch] && rect(x0 + c, y0 + j, 1, 1, C[ch])));
}
