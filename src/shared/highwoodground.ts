/**
 * The High Wood's ground (docs/design/the-high-wood.md; the land's third map, shared/highwood.ts): fixed by hand, the
 * same every trip, so every bank, lane, ridge and crossing is where the tests walked it. Its heights are earth banks
 * (arena.ts Ledge, kind `earth`): from below a bank is a wall the Rogue climbs (sim/climb.ts), from on top you step
 * off it. Water is a few shallow pools and the stream in its ravine, crossed by one fallen trunk (a deck). Pure.
 *
 * South to north: the root stair's pools; the sunk lanes, worn deep between four banks, each bank cut once by a cross
 * lane; the struck oaks' ridge, sloped up from the south and down to the north; the old trees' stream across the
 * whole wood; the Coin Oak's rise, sloped up from the south only.
 */
import type { Block, Ledge, Water } from './arena.js';
import { ledge } from './terrkit.js';

type R = [number, number, number, number];
export const HIGHWOOD = { w: 96, h: 160 };

/** The sunk lanes' banks (x0, y0, x1, y1): between them the lanes x 20 to 26, 42 to 48, 60 to 66 and 80 to 92. */
export const BANKS: R[] = [
  [4, 112, 20, 140],
  [26, 112, 42, 126], [26, 130, 42, 140],
  [48, 112, 60, 122], [48, 126, 60, 140],
  [66, 112, 80, 140],
];
/** The struck oaks' ridge and the Coin Oak's rise. */
export const RIDGE: R = [24, 76, 72, 92];
export const RISE: R = [34, 8, 64, 26];
/** The stream in the old trees' ravine, across the wood, and the fallen trunk over it where the road crosses. */
export const STREAM: R = [0, 50, 96, 53.4];
export const TRUNK: R = [36.4, 50, 38.6, 53.4];
/** Shallow pools between the roots on the stair, and two in the old trees' hollows. */
const POOLS: R[] = [[12, 146, 18, 149.6], [62, 150, 69.4, 153], [74, 142, 79, 145.4], [24, 141.6, 30, 144], [14, 40, 20, 43.6], [70, 58, 76.4, 61.6]];

const inR = (x: number, y: number) => (r: R) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
/** What lies at (x, y): 0 dry, 1 shallow, 2 deep (the trunk counts dry). */
export function highWoodAt(x: number, y: number): number {
  const at = inR(x, y);
  if (at(TRUNK)) return 0;
  if (at(STREAM)) return 2;
  return POOLS.some(at) ? 1 : 0;
}
/** Whether (x, y) is on a bank, the ridge or the rise, within `pad` of one, or on a slope up. */
export function highUp(x: number, y: number, pad = 0): boolean {
  const near = (r: R) => x >= r[0] - pad && x < r[2] + pad && y >= r[1] - pad && y < r[3] + pad;
  return BANKS.some(near) || near(RIDGE) || near(RISE);
}
/** Whether (x, y) is within `pad` of a bank's, the ridge's or the rise's edge (a face or a slope), either side. */
export function onEdge(x: number, y: number, pad: number): boolean {
  return highUp(x, y, pad) && ![...BANKS, RIDGE, RISE].some((r) => x >= r[0] + pad && x < r[2] - pad && y >= r[1] + pad && y < r[3] - pad);
}

const box = ([x0, y0, x1, y1]: R) => ({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });

/** The heights: the banks with no way up but climbing, the ridge sloped south and north, the rise sloped south. */
export function highWoodLedges(): Ledge[] {
  const banks = BANKS.map((r): Ledge => ({ ...box(r), lv: 1, ramps: [], kind: 'earth' }));
  const ridge = box(RIDGE), rise = box(RISE);
  return [...banks, ledge(ridge.x, ridge.y, ridge.w, ridge.h, 1, ['S', 'N']), ledge(rise.x, rise.y, rise.w, rise.h, 1, ['S'])];
}

/** The water, either side of the trunk; and the trunk as a deck to stand on (never collided with), a hand over each bank. */
export function highWoodGround(): { water: Water[]; boards: Block[] } {
  const [sx0, sy0, sx1, sy1] = STREAM, [tx0, , tx1] = TRUNK;
  const water: Water[] = [
    { x: sx0, y: sy0, w: tx0 - sx0, h: sy1 - sy0, deep: true }, { x: tx1, y: sy0, w: sx1 - tx1, h: sy1 - sy0, deep: true },
    ...POOLS.map((r) => box(r)),
  ];
  const t = box(TRUNK), p = 0.2;
  return { water, boards: [{ kind: 'trunkbridge', deck: true, x: t.x, y: t.y - p, w: t.w, h: t.h + p * 2 }] };
}
