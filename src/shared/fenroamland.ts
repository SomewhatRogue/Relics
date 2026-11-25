/**
 * The Fen's things on its ground (docs/design/the-fen.md; shared/fenroamground.ts lays the water): the track, the
 * staithe, the drowned chapel and its echoes, the reeds, the willows, the bog edge's dressing and the Peat Cuts'.
 * Fixed spots for what has a reason to be somewhere; the seed scatters the reeds, the trees and the echoes. Pure.
 */
import { claim, mark, patch, path, round, unclaimed, type Kit, type Line, type P } from './expedkit.js';
import { wall } from './terrkit.js';
import { fenRoamAt, FENROAM, ISLES, REEDBEDS } from './fenroamground.js';
import type { Block } from './arena.js';

/** The shelter: the eel staithe's island at the causeway's north end (its centre, and how far its safe ground reaches). */
export const STAITHE = { x: 66, y: 84.8, r: 4.5 };
/** The keeper at the staithe's fire, her talk `station:staithe`. */
export const STAITHE_KEEPER = { x: 64.6, y: 86.2 };
/** The landmark: the drowned chapel, its belfry and broken gable standing in the flooded nave (biome-sets.md rule 1). */
export const CHAPEL = { x: 28.8, y: 28.5, w: 7, h: 2.4 };
/** Where you come in from the north fields, and the larder on the Peat Cuts' drying ground. */
export const WAY_IN: P = { x: 42.8, y: 146.4 };
export const LARDER: P = { x: 46.5, y: 12.3 };

/** The track: in from the fields, the causeways, the staithe, through the reeds by their boards, past the chapel, to the cuts. */
export const MAIN: Line = [
  WAY_IN, { x: 42.9, y: 132 }, { x: 42.9, y: 112.5 }, { x: 66.9, y: 112.5 }, { x: 66.9, y: 93 }, { x: STAITHE.x, y: STAITHE.y }, { x: 66, y: 78.9 },
  { x: 62.6, y: 70.5 }, { x: 62.6, y: 67.2 }, { x: 54, y: 62.1 }, { x: 46.1, y: 60.6 }, { x: 46.1, y: 58.2 }, { x: 46.2, y: 51 },
  { x: 46.2, y: 36.8 }, { x: 59.4, y: 36.8 }, { x: 59.4, y: 22.5 }, { x: 51, y: 16.5 }, LARDER,
];
/** Off the track: the boardwalk west to the island and the causeway winding on to the far islet, the boards to the
 * skimmer's islet, the winding boards east, the jetty, the far board over the reeds, the bank to the sexton's isle. */
export const SIDES: Line[] = [
  [{ x: 42.9, y: 118.1 }, { x: 13.2, y: 118.1 }, { x: 13.2, y: 105.2 }, { x: 22.8, y: 105.2 }, { x: 22.8, y: 94 }, { x: 20.4, y: 91.4 }],
  [{ x: 52.1, y: 111.9 }, { x: 52.1, y: 105.3 }], [{ x: 66.9, y: 97.1 }, { x: 73.9, y: 97.1 }, { x: 73.9, y: 102.9 }, { x: 79.6, y: 102.9 }],
  [{ x: 60, y: 85.1 }, { x: 45, y: 85.1 }], [{ x: 36, y: 70.5 }, { x: 31.1, y: 67.2 }, { x: 33, y: 62.1 }], [{ x: 59.4, y: 28.5 }, { x: 67.5, y: 28.5 }],
  [{ x: 46.2, y: 35.8 }, { x: 10.9, y: 35.8 }, { x: 10.9, y: 44.4 }],
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
  patch(k, 'grass', 4.5, 123, 81, 27, false), patch(k, 'mud', 4.5, 3, 81, 21, false), patch(k, 'grass', 54, 78, 24, 14.2, false), patch(k, 'grass', 61.8, 24, 13.2, 9, false);
  for (const l of LINES) path(k, 'earth', l, 0.7);
  k.roads.push(...LINES);
  wall(k, { x: 5.1, y: 149.1 }, { x: 39.3, y: 149.1 }), wall(k, { x: 46.2, y: 149.1 }, { x: 84.9, y: 149.1 });
  claim(k, WAY_IN.x, WAY_IN.y, 6), claim(k, STAITHE.x, STAITHE.y, 6), claim(k, LARDER.x, LARDER.y, 2.6);
  for (const [x, y, w, h] of [[40.7, 122.6, 4.4, 1], [64.9, 91.1, 4, 0.8], [44.4, 50.6, 3.6, 1], [57.4, 20.6, 4, 1]]) mark(k, 'mud', x, y, w, h);
}

/** The eel staithe: the smokehouse, two drying racks and a net hung up, a punt drawn up, the fire, the jetty's posts. */
export function layStaithe(k: Kit): void {
  const S = STAITHE, B = (kind: Block['kind'], x: number, y: number, w: number, h: number) => k.blocks.push({ kind, x, y, w, h });
  B('smokehouse', S.x + 1, S.y - 3.8, 3, 2.2), B('dryrack', S.x + 3.4, S.y - 0.6, 0.5, 2), B('dryrack', S.x + 3.4, S.y + 2, 0.5, 1.8);
  B('hungnet', S.x - 3.4, S.y - 3.4, 2, 0.4), B('log', S.x - 6, S.y + 2.4, 2.6, 0.6);
  k.braziers.push({ x: S.x - 2.2, y: S.y + 0.7, r: 0.35, wild: true });
  for (const [x, y] of [[S.x - 3.8, S.y - 1.9], [S.x + 5.4, S.y + 3.1]]) round(k, 'sacks', x, y, 0.34);
  for (const x of [46.5, 50.1, 53.4]) for (const y of [83.7, 86.5]) round(k, 'post', x, y, 0.16);
  claim(k, S.x, S.y, 6);
}

/** The drowned chapel (the landmark), its pews in the mud, and its echoes scattered by the seed: slabs and crosses awash,
 * thickest round the chapel and the graveyard, thinning out over the reeds and the bog. */
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
  put(2, 18.9, 31.5, 40.5, 33.6, 1, 4), put(2, 18.9, 23.4, 25.5, 27, 1, 2), put(0, 18.9, 23.4, 41, 34, 1, 3), put(1, 22, 24, 38, 33, 1, 2);
  put(0, 63.6, 39.9, 76.5, 46.5, 1, 5), put(1, 63.6, 39.9, 76.5, 46.5, 1, 4);
  put(0, 7.5, 51.4, 82.5, 57, 1, 3), put(1, 7.5, 51.4, 82.5, 57, 1, 2), put(0, 7.5, 57, 82.5, 77.4, 1, 3), put(1, 7.5, 57, 82.5, 77.4, 1, 2);
  put(1, 6, 126, 84, 147, 0, 2), put(2, 37.5, 18, 55.5, 21.9, 0, 2);
}

/** Reeds standing in the reed beds' shallows, clumps you walk through, lanes left along the ways; reed tufts in the deep
 * round the causeways' edges and the isles, and round the bog edge's pools. */
export function layReeds(k: Kit): void {
  const [x0, y0, x1, y1] = REEDBEDS;
  for (let y = y0 + 0.7; y < y1 - 0.6; y += 1.4) for (let x = x0 + 0.6; x < x1 - 0.8; x += 1.6) {
    const cx = x + k.rng.range(-0.5, 0.5), cy = y + k.rng.range(-0.4, 0.4), w = k.rng.range(1.2, 2), h = k.rng.range(0.8, 1.3);
    if (k.rng.next() < 0.2 || !off(cx, cy, 1.4) || !unclaimed(k, cx, cy, 0.2)) continue;
    if ([[0, 0], [w, 0], [0, h], [w, h]].some(([dx, dy]) => fenRoamAt(cx - w / 2 + dx, cy - h / 2 + dy) !== 1)) continue;
    k.blocks.push({ kind: 'reeds', soft: true, x: cx - w / 2, y: cy - h / 2, w, h, look: k.rng.int(1000) } as Block);
  }
  const tuft = (x: number, y: number) => fenRoamAt(x, y) === 2 && k.rng.next() < 0.55 && round(k, 'reed', x, y + k.rng.range(-0.15, 0.15), 0.3);
  for (let x = 41.4; x < 67.5; x += k.rng.range(0.9, 1.6)) for (const y of [109.8, 115.2]) tuft(x, y);
  for (const [ix0, iy0, ix1, iy1] of ISLES) {
    for (let x = ix0; x < ix1; x += k.rng.range(0.9, 1.6)) tuft(x, iy0 - 0.6), tuft(x, iy1 + 0.6);
    for (let y = iy0; y < iy1; y += k.rng.range(0.9, 1.6)) tuft(ix0 - 0.6, y), tuft(ix1 + 0.6, y);
  }
  for (let i = 0; i < 60; i++) {
    const x = k.rng.range(6, 84), y = k.rng.range(123.6, 144);
    if (fenRoamAt(x, y) === 1 && off(x, y, 1.2) && unclaimed(k, x, y, 0.3)) round(k, 'reed', x, y, 0.3);
  }
}

/** Willows and dead trees on the dry ground, off the ways; the bog edge's drowned sheep, its fence gone over, the cuts' peat. */
export function layCountry(k: Kit): void {
  const boxes: [number, number, number, number, number][] = [
    [4.5, 126, 85.5, 147, 104], [9, 112.5, 18.6, 122.4, 11], [54, 78, 78, 92.2, 11], [61.8, 24, 75, 33, 9], [4.5, 3.6, 85.5, 24, 68],
    [16, 88, 28, 95, 5], [77.4, 99, 84, 108.4, 4], [5, 42, 16, 48.4, 4], [21, 34.6, 42, 39, 3],
  ];
  for (const [x0, y0, x1, y1, n] of boxes) for (let i = 0, t = 0; i < n && t < n * 12; t++) {
    const r = k.rng.range(0.42, 0.7), x = k.rng.range(x0, x1), y = k.rng.range(y0, y1);
    if (room(k, x, y, r, 0, 1.4)) round(k, k.rng.pick(['tree', 'deadtree', 'deadtree', 'bush', 'tree']), x, y, r), i++;
  }
  wood(k);
  mark(k, 'blood', 53.7, 129.5, 2.4, 1), mark(k, 'drag', 50.2, 130, 2.6, 0.5);
  k.grim.push({ kind: 'remains', x: 54.6, y: 130.2, k: 1 });
  for (const [x, y] of [[51.9, 128.4], [56.7, 129.6]]) round(k, 'crows', x, y, 0.15);
  k.blocks.push({ kind: 'fence', x: 13.5, y: 138.7, w: 6, h: 0.35, ruined: true }, { kind: 'fence', x: 67.2, y: 141.1, w: 5, h: 0.35, ruined: true });
  round(k, 'stone', 37.5, 139.5, 0.4);
  for (const [x, y] of [[40.5, 8.1], [53.4, 18.9], [19.4, 21.9], [75.3, 21.6], [28.9, 4.4], [84, 17.6]]) round(k, 'peat', x, y, 0.45);
  // The larder on the drying ground: the pot on its fire, one hung beside it.
  k.braziers.push({ x: LARDER.x, y: LARDER.y, r: 0.35, wild: true });
  k.grim.push({ kind: 'pot', x: LARDER.x, y: LARDER.y + 0.1, k: k.rng.int(4) }, { kind: 'hung', x: LARDER.x + 2.6, y: LARDER.y - 2, k: k.rng.int(4) });
  mark(k, 'debris', LARDER.x - 2, LARDER.y + 1.4, 3, 0.7);
}

/** The way in is the last of the wood going to bog: pines and stumps by the hedge, thinning to dead trees and then reeds northward. */
function wood(k: Kit): void {
  for (let i = 0, t = 0; i < 58 && t < 900; t++) {
    const u = k.rng.next(), y = 147 - 22.5 * u * u, r = k.rng.range(0.5, 0.8), x = k.rng.range(6, 84), up = (147 - y) / 22.5;
    if (!room(k, x, y, r, 0, 1.6)) continue;
    const roll = k.rng.next();
    round(k, roll < 0.6 - up * 0.5 ? 'pine' : roll < 0.8 ? 'deadtree' : roll < 0.92 ? 'stump' : 'tree', x, y, r), i++;
  }
}
