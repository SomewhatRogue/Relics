/**
 * The Fen's things on its ground (docs/design/the-fen.md; shared/fenroamground.ts lays the water): the track, the
 * staithe, the drowned chapel and its echoes, the reeds, the willows, the bog edge's dressing and the Peat Cuts'.
 * Fixed spots for what has a reason to be somewhere; the seed scatters the reeds, the trees and the echoes. Pure.
 */
import { claim, mark, patch, path, round, unclaimed, type Kit, type Line, type P } from './expedkit.js';
import { wall } from './terrkit.js';
import { fenRoamAt, FENROAM, REEDBEDS } from './fenroamground.js';
import type { Block } from './arena.js';

/** The shelter: the eel staithe's island at the causeway's north end (its centre, and how far its safe ground reaches). */
export const STAITHE = { x: 44, y: 56.5, r: 4.5 };
/** The keeper at the staithe's fire, her talk `station:staithe`. */
export const STAITHE_KEEPER = { x: 42.6, y: 57.9 };
/** The landmark: the drowned chapel, its belfry and broken gable standing in the flooded nave (biome-sets.md rule 1). */
export const CHAPEL = { x: 18, y: 18.6, w: 7, h: 2.4 };
/** Where you come in from the north fields, and the larder on the Peat Cuts' drying ground. */
export const WAY_IN: P = { x: 28.5, y: 97.6 };
export const LARDER: P = { x: 31, y: 8.2 };

/** The track: in from the fields, the causeways, the staithe, through the reeds by their boards, past the chapel, to the cuts. */
export const MAIN: Line = [
  WAY_IN, { x: 28.6, y: 88 }, { x: 28.6, y: 75 }, { x: 44.6, y: 75 }, { x: 44.6, y: 62 }, { x: STAITHE.x, y: STAITHE.y }, { x: 44, y: 52.6 },
  { x: 41.7, y: 47 }, { x: 41.7, y: 44.8 }, { x: 36, y: 41.4 }, { x: 30.7, y: 40.4 }, { x: 30.7, y: 38.8 }, { x: 30.8, y: 34 },
  { x: 30.8, y: 24.5 }, { x: 39.6, y: 24.5 }, { x: 39.6, y: 15 }, { x: 34, y: 11 }, LARDER,
];
/** Off the track: the boardwalk west to the island, the boards to the skimmer's islet, the jetty, the far board over the reeds. */
export const SIDES: Line[] = [
  [{ x: 28.6, y: 78.7 }, { x: 9, y: 78.7 }], [{ x: 34.7, y: 74.6 }, { x: 34.7, y: 70.2 }], [{ x: 40, y: 56.7 }, { x: 30, y: 56.7 }],
  [{ x: 24, y: 47 }, { x: 20.7, y: 44.8 }, { x: 22, y: 41.4 }], [{ x: 39.6, y: 19 }, { x: 45, y: 19 }],
];
const LINES = [MAIN, ...SIDES];
const off = (x: number, y: number, d: number) => LINES.every((l) => near(l, x, y) >= d);
function near(l: Line, x: number, y: number): number {
  let best = Infinity;
  for (let i = 1; i < l.length; i++) {
    const a = l[i - 1], b = l[i], dx = b.x - a.x, dy = b.y - a.y, q = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / q));
    best = Math.min(best, Math.hypot(a.x + dx * t - x, a.y + dy * t - y));
  }
  return best;
}
/** Room at (x, y) for a thing of radius r on ground of `kind` (0 dry, 1 shallow), off the ways and clear of what is laid. */
function room(k: Kit, x: number, y: number, r: number, kind: number, way = 1.6): boolean {
  if (x < r + 3.4 || x > FENROAM.w - r - 3.4 || y < r + 2.4 || y > FENROAM.h - r - 1.4 || !unclaimed(k, x, y, r) || !off(x, y, r + way)) return false;
  const e = r + 0.1;
  return [[0, 0], [e, 0], [-e, 0], [0, e], [0, -e]].every(([dx, dy]) => fenRoamAt(x + dx, y + dy) === kind);
}

/** The track trodden, the ground's soils, the south hedge with its gap where you came in. */
export function layTrack(k: Kit): void {
  patch(k, 'grass', 3, 82, 54, 18, false), patch(k, 'mud', 3, 2, 54, 14, false), patch(k, 'grass', 36, 52, 16, 9.4, false), patch(k, 'grass', 41.2, 16, 8.8, 6, false);
  for (const l of LINES) path(k, 'earth', l, 0.7);
  k.roads.push(...LINES);
  wall(k, { x: 3.4, y: 99.4 }, { x: 26.2, y: 99.4 }), wall(k, { x: 30.8, y: 99.4 }, { x: 56.6, y: 99.4 });
  claim(k, WAY_IN.x, WAY_IN.y, 4), claim(k, STAITHE.x, STAITHE.y, 6), claim(k, LARDER.x, LARDER.y, 2.6);
  for (const [x, y, w, h] of [[26.4, 81.6, 4.4, 1], [42.6, 60.6, 4, 0.8], [29, 33.6, 3.6, 1], [37.6, 13.6, 4, 1]]) mark(k, 'mud', x, y, w, h);
}

/** The eel staithe: the smokehouse, two drying racks and a net hung up, a punt drawn up, the fire, the jetty's posts. */
export function layStaithe(k: Kit): void {
  const S = STAITHE, B = (kind: Block['kind'], x: number, y: number, w: number, h: number) => k.blocks.push({ kind, x, y, w, h });
  B('smokehouse', S.x + 1, S.y - 3.8, 3, 2.2), B('dryrack', S.x + 3.4, S.y - 0.6, 0.5, 2), B('dryrack', S.x + 3.4, S.y + 2, 0.5, 1.8);
  B('hungnet', S.x - 3.4, S.y - 3.4, 2, 0.4), B('log', S.x - 6, S.y + 2.4, 2.6, 0.6);
  k.braziers.push({ x: S.x - 2.2, y: S.y + 0.7, r: 0.35, wild: true });
  for (const [x, y] of [[S.x - 3.8, S.y - 1.9], [S.x + 5.4, S.y + 3.1]]) round(k, 'sacks', x, y, 0.34);
  for (const x of [31, 33.4, 35.6]) for (const y of [55.7, 57.8]) round(k, 'post', x, y, 0.16);
  claim(k, S.x, S.y, 6);
}

/** The drowned chapel (the landmark), its pews in the mud, and its echoes scattered by the seed: slabs and crosses awash. */
export function layChapel(k: Kit): void {
  const C = CHAPEL;
  k.blocks.push({ kind: 'chapel', x: C.x, y: C.y, w: C.w, h: C.h });
  claim(k, C.x + C.w / 2, C.y + C.h / 2, 4.2);
  // The echoes (biome-sets.md): look 0 a grave slab, 1 a cross, 2 a pew. Pews only in the nave's mud and the cuts.
  const put = (look: number, x0: number, y0: number, x1: number, y1: number, kind: number, n: number) => {
    for (let i = 0, t = 0; i < n && t < 80; t++) {
      const w = look === 2 ? 1.6 : 0.8, h = 0.45, x = k.rng.range(x0, x1), y = k.rng.range(y0, y1);
      if (!room(k, x + w / 2, y + h / 2, w / 2 + 0.2, kind, 1.2)) continue;
      k.blocks.push({ kind: 'awash', x, y, w, h, look }), claim(k, x + w / 2, y + h / 2, w / 2 + 0.3), i++;
    }
  };
  put(2, 12.6, 21, 27, 22.4, 1, 2), put(2, 12.6, 15.6, 17, 18, 1, 1);
  put(0, 42.4, 26.6, 51, 31, 1, 3), put(1, 42.4, 26.6, 51, 31, 1, 2);
  put(0, 5, 35, 55, 51.6, 1, 3), put(1, 5, 35, 55, 51.6, 1, 2), put(1, 4, 84, 56, 98, 0, 1), put(2, 25, 12, 37, 14.6, 0, 1);
}

/** Reeds standing in the reed beds' shallows, clumps you walk through, lanes left along the ways; reed tufts round the pools. */
export function layReeds(k: Kit): void {
  const [x0, y0, x1, y1] = REEDBEDS;
  for (let y = y0 + 0.7; y < y1 - 0.6; y += 1.4) for (let x = x0 + 0.6; x < x1 - 0.8; x += 1.6) {
    const cx = x + k.rng.range(-0.5, 0.5), cy = y + k.rng.range(-0.4, 0.4), w = k.rng.range(1.2, 2), h = k.rng.range(0.8, 1.3);
    if (k.rng.next() < 0.2 || !off(cx, cy, 1.4) || !unclaimed(k, cx, cy, 0.2)) continue;
    if ([[0, 0], [w, 0], [0, h], [w, h]].some(([dx, dy]) => fenRoamAt(cx - w / 2 + dx, cy - h / 2 + dy) !== 1)) continue;
    k.blocks.push({ kind: 'reeds', soft: true, x: cx - w / 2, y: cy - h / 2, w, h, look: k.rng.int(1000) } as Block);
  }
  // Tufts in the deep at the causeways' edges and round the bog edge's pools.
  for (let x = 27.6; x < 45; x += k.rng.range(0.9, 1.6)) for (const y of [73.2, 76.8]) if (fenRoamAt(x, y) === 2 && k.rng.next() < 0.55) round(k, 'reed', x, y + k.rng.range(-0.15, 0.15), 0.3);
  for (let i = 0; i < 26; i++) {
    const x = k.rng.range(4, 56), y = k.rng.range(82.4, 92);
    if (fenRoamAt(x, y) === 1 && off(x, y, 1.2) && unclaimed(k, x, y, 0.3)) round(k, 'reed', x, y, 0.3);
  }
}

/** Willows and dead trees on the dry ground, off the ways; the bog edge's drowned sheep, its fence gone over, the cuts' peat. */
export function layCountry(k: Kit): void {
  const boxes: [number, number, number, number, number][] = [[3, 84, 57, 98, 46], [6, 75, 12.4, 81.6, 5], [36, 52, 52, 61.4, 5], [41.2, 16, 50, 22, 4], [3, 2.4, 57, 16, 30]];
  for (const [x0, y0, x1, y1, n] of boxes) for (let i = 0, t = 0; i < n && t < n * 12; t++) {
    const r = k.rng.range(0.42, 0.7), x = k.rng.range(x0, x1), y = k.rng.range(y0, y1);
    if (room(k, x, y, r, 0, 1.4)) round(k, k.rng.pick(['tree', 'deadtree', 'deadtree', 'bush', 'tree']), x, y, r), i++;
  }
  mark(k, 'blood', 35.4, 86.2, 2.4, 1), mark(k, 'drag', 33, 86.6, 2.6, 0.5);
  k.grim.push({ kind: 'remains', x: 36.4, y: 86.8, k: 1 });
  for (const [x, y] of [[34.6, 85.6], [37.8, 86.4]]) round(k, 'crows', x, y, 0.15);
  k.blocks.push({ kind: 'fence', x: 8, y: 92.4, w: 6, h: 0.35, ruined: true }, { kind: 'fence', x: 44, y: 94, w: 5, h: 0.35, ruined: true });
  round(k, 'stone', 25, 93, 0.4);
  for (const [x, y] of [[27, 5.4], [35.6, 12.6], [12.9, 14.6], [50.2, 14.4]]) round(k, 'peat', x, y, 0.45);
  // The larder on the drying ground: the pot on its fire, one hung beside it.
  k.braziers.push({ x: LARDER.x, y: LARDER.y, r: 0.35, wild: true });
  k.grim.push({ kind: 'pot', x: LARDER.x, y: LARDER.y + 0.1, k: k.rng.int(4) }, { kind: 'hung', x: LARDER.x + 2.6, y: LARDER.y - 2, k: k.rng.int(4) });
  mark(k, 'debris', LARDER.x - 2, LARDER.y + 1.4, 3, 0.7);
}
