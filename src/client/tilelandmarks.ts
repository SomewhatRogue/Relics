/**
 * A biome set's landmark and its echoes, drawn the tile way (docs/design/biome-sets.md). The wood's set is the
 * gallows: one great oak a map, three times an oak's size, its boughs hung (three mutations: the hanged, a gibbet
 * cage, empty nooses and crows), and old ropes left in some of the oaks round it. Cards like any tree
 * (tiletrees.ts): six shades of leaf, four of bark, lit from the upper left, dark outlines; what hangs has a few
 * colours of its own. Cosmetic only, a hash of the variant, never Math.random.
 */
import type { Cut } from './three/propcards';
import { clumpLight as clump } from './tilegrounds';
import { BARK, Grid, LEAF, hash, quant } from './tiletrees';

// 10.. rope (dark, lit), cloth (dark, mid, lit), sacking and bone (dull, lit), iron (dark, mid, lit), crow, old blood.
const EXTRA = ['#5a4b2e', '#8f7c4e', '#150f0d', '#2c1d1a', '#46302a', '#7d7766', '#a39c86', '#121217', '#2c2c36', '#4b4b59', '#08080b', '#4a1616'];
const ROPE = 10, CLOTH = 12, BONE = 15, IRON = 17, CROW = 20, BLOOD = 21;
const COLS = [...LEAF, ...BARK, ...EXTRA];
export type OakKind = 'hanged' | 'cage' | 'ropes';
export const OAK_KINDS: OakKind[] = ['hanged', 'cage', 'ropes'];

const rope = (G: Grid, x: number, y0: number, y1: number) => { for (let y = y0; y <= y1; y++) G.set(x, y, ROPE + ((y >> 1) & 1)); };
/** A noose: the loop at a rope's end, open. */
function noose(G: Grid, x: number, y: number): void {
  G.set(x, y, ROPE + 1), G.set(x - 1, y + 1, ROPE), G.set(x + 1, y + 1, ROPE + 1), G.set(x - 1, y + 2, ROPE), G.set(x + 1, y + 2, ROPE), G.set(x, y + 3, ROPE);
}
/** The hanged: a sack over the head, a shirt gone dark, the hands tied in front, bare feet. 26 pixels from `y`. */
function hanged(G: Grid, x: number, y: number, v: number): void {
  for (let j = 0; j < 4; j++) for (let i = -2; i <= 1; i++) G.set(x + i, y + j, i === -2 ? BONE + 1 : j === 3 || i === 1 ? CLOTH + 1 : BONE);
  G.set(x - 1, y + 4, ROPE + 1), G.set(x, y + 4, ROPE);
  for (let j = 5; j < 16; j++) for (let i = -3; i <= 2; i++) G.set(x + i, y + j, i === -3 ? CLOTH + 2 : i === 2 || j === 15 ? CLOTH : CLOTH + 1);
  for (let j = 7 + (v % 3); j < 11 + (v % 3); j++) G.set(x - 1 + (j & 1), y + j, BLOOD);
  G.set(x - 1, y + 12, BONE), G.set(x, y + 12, BONE), G.set(x - 1, y + 13, BONE + 1), G.set(x, y + 13, BONE);
  for (let j = 16; j < 24; j++) for (const i of [-3, -2, 1, 2]) G.set(x + i, y + j, i === -3 || i === 1 ? CLOTH + 1 : CLOTH);
  for (let j = 24; j < 26; j++) for (const i of [-3, -2, 1, 2]) G.set(x + i, y + j, i === -3 || i === 1 ? BONE + 1 : BONE);
}
/** A gibbet cage on its chain: iron hoops and bars, what is left of someone in the bottom of it. */
function cage(G: Grid, x: number, y: number): void {
  for (let j = 0; j < 9; j++) G.set(x, y + j, j & 1 ? IRON + 2 : IRON);
  const top = y + 9;
  for (let j = 0; j < 22; j++) for (let i = -6; i <= 6; i++) {
    const hoop = j === 0 || j === 10 || j === 21, bar = i === -6 || i === -3 || i === 0 || i === 3 || i === 6;
    if (hoop || bar) G.set(x + i, top + j, i <= -3 && !hoop ? IRON + 2 : hoop && i < 0 ? IRON + 2 : hoop || i < 6 ? IRON + 1 : IRON);
  }
  for (const [i, j, c] of [[-2, 18, BONE + 1], [-1, 18, BONE], [-2, 19, BONE], [-1, 19, BONE], [1, 17, BONE], [2, 16, BONE + 1], [1, 19, BONE], [4, 19, BONE], [-5, 20, BONE], [2, 20, BONE + 1]] as const) G.set(x + i, top + j, c);
}
const crow = (G: Grid, x: number, y: number, left: boolean) => {
  for (const [i, j] of [[0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2], [3, 2]]) G.set(x + (left ? -i : i), y + j, CROW);
  G.set(x + (left ? 2 : -2), y + 1, IRON + 2);
};

/** The great oak, variant `v`, hung as `kind` says: a trunk three men round, dead boughs under a crown in four rows. */
export function greatOakCut(v: number, kind: OakKind): Cut {
  const W = 124, H = 152, cx = W / 2, G = new Grid(W, H), foot = H - 1, crownFoot = H - 50, top = crownFoot - 12;
  // The trunk: wider to its roots, lit on its left, grooved; a hollow in it.
  for (let y = top; y <= foot; y++) {
    const t = (y - top) / (foot - top), w = Math.round(13 + t * t * 9), root = y > foot - 6 ? 6 - (foot - y) : 0, x0 = cx - (w >> 1) - root, x1 = cx + (w >> 1) + root;
    for (let x = x0; x <= x1; x++) {
      const u = (x - x0) / (x1 - x0);
      let s = u < 0.22 ? 3 : u < 0.5 ? 2 : u < 0.8 ? 1 : 0;
      if (s > 0 && hash(x >> 1, y >> 3, 61 + v) < 0.2) s--;
      G.set(x, y, 6 + (y < crownFoot + 4 ? Math.min(s, 1) : s));
    }
  }
  for (let j = -5; j <= 5; j++) for (let i = -2; i <= 2; i++) if ((i * i) / 6 + (j * j) / 28 < 1) G.set(cx + 2 + i, crownFoot + 24 + j, 6);
  // Two dead boughs out from under the crown, sagging: lit along the top, dark beneath.
  const bough = (dir: number, len: number, y0: number) => {
    for (let i = 0; i <= len; i++) {
      const x = Math.round(cx + dir * (5 + i)), y = Math.round(y0 - i * 0.16 + (i * i) / (len * 9)), th = Math.max(2, Math.round(5 - (i / len) * 3));
      for (let k = 0; k < th; k++) G.set(x, y + k, k === 0 ? 8 : k < th - 1 ? 7 : 6);
    }
    return (i: number) => Math.round(y0 - i * 0.16 + (i * i) / (len * 9)) + Math.max(2, Math.round(5 - (i / len) * 3));
  };
  const right = bough(1, 46, crownFoot + 7), left = bough(-1, 38, crownFoot + 10);
  // The crown: lobes in rows, the top row first so the lower rows hang in front; each lobe lit on its own top left.
  const rows: [number, number, number][][] = [];
  const row = (y: number, n: number, r: number, spread: number) => rows.push(Array.from({ length: n }, (_, i) => {
    const x = cx + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread) + (hash(v, i + n * 7, 71) - 0.5) * 5;
    return [x, y + (hash(v, i + n * 5, 72) - 0.5) * 5, r + (hash(v, i + n * 3, 73) - 0.5) * 4] as [number, number, number];
  }));
  row(crownFoot - 76, 3, 15, W * 0.34), row(crownFoot - 56, 4, 17, W * 0.56), row(crownFoot - 34, 5, 17, W * 0.74), row(crownFoot - 12, 6, 15, W * 0.84);
  for (const lobes of rows) for (const [bx, by, br] of lobes) {
    for (let y = Math.floor(by - br); y <= by + br; y++) for (let x = Math.floor(bx - br); x <= bx + br; x++) {
      const dx = x + 0.5 - bx, dy = y + 0.5 - by, d = Math.hypot(dx, dy * 1.15);
      if (d > br - (hash(x >> 1, y >> 1, 17) < 0.35 ? 1.5 : 0)) continue;
      let lv = 0.55 - (dx / br) * 0.22 - (dy / br) * 0.36 - ((x - cx) / W) * 0.2 + clump(x, y, 7, 5, 19);
      if (dy > br * 0.62) lv = Math.min(lv, 0.22);
      G.set(x, y, quant(lv));
    }
  }
  G.outline(0);
  // What hangs from the boughs, in front of everything.
  const at = (dir: number, i: number): [number, number] => [Math.round(cx + dir * (5 + i)), (dir > 0 ? right : left)(i)];
  if (kind === 'hanged') {
    for (const [dir, i, len] of [[1, 22, 9], [1, 40, 14], [-1, 28, 11]] as const) {
      const [x, y] = at(dir, i);
      rope(G, x, y, y + len), hanged(G, x, y + len + 1, v + i);
    }
  } else if (kind === 'cage') {
    const [x, y] = at(1, 34);
    cage(G, x, y);
    for (const [i, len] of [[14, 12], [30, 7]] as const) {
      const [lx, ly] = at(-1, i);
      rope(G, lx, ly, ly + len), noose(G, lx, ly + len + 1);
    }
  } else {
    for (const [dir, i, len] of [[1, 12, 16], [1, 26, 9], [1, 41, 20], [-1, 16, 12], [-1, 33, 18]] as const) {
      const [x, y] = at(dir, i);
      rope(G, x, y, y + len), noose(G, x, y + len + 1);
    }
    const [c1x, c1y] = at(1, 34), [c2x, c2y] = at(-1, 24);
    crow(G, c1x, c1y - 8, false), crow(G, c2x, c2y - 8, true);
  }
  return G.cut(COLS, Math.round(cx), foot);
}

/** An old rope left in an oak, variant `v`: a noose, a cut end, or two of uneven length. Hangs from 26 pixels up. */
export function ropeCut(v: number): Cut {
  const G = new Grid(7, 26), k = v % 3, len = 9 + (v % 5);
  rope(G, 3, 0, len);
  if (k !== 1) noose(G, 3, len + 1);
  else G.set(2, len + 1, ROPE), G.set(4, len + 1, ROPE + 1);
  if (k === 2) rope(G, 0, 0, 5 + (v % 4)), G.set(0, 6 + (v % 4), ROPE);
  return G.cut(COLS, 3, 25);
}
