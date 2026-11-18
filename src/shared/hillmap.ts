/**
 * The proving hill (docs/design/territories.md, "The proving hill"; heights by docs/design/elevation.md): the first
 * build's small Lowfurrow, kept as a test map (`?land=hill`). The frame's, the pathing's and the rules' tests stand
 * on it (tests/territory.test.ts, landroom, pathlevels, afoot), so the real territories can be re-laid without
 * breaking them. Plain blocks: the right shape and heights, no art. One map of 44 by 96, in from the bottom and
 * out at the top, always by day:
 *
 *   the stile, the headland (zone), the field gate, the long strips (scape) up the first lynchet, the stooks
 *   (zone), the drain and its bridge, the barn road (scape, a hollow lane between banks with a sheep track up
 *   each), the second lynchet, the fold yard (zone), the stile on the rise.
 *
 * The seed bends the road and shuffles the trees, the loose hay, which goblin holds the bow and where the
 * pond's chest is. It never moves the hero, the exit, the gates, the zones, the ledges, the water, the
 * cages or the barn.
 */
import { levelAt, type GameMap, type Ledge, type Stretch } from './arena.js';
import { block, claim, mark, newKit, patch, path, prop, round, scatter, spotIn, type Kit, type Line, type P } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import { THEMES, type Foe } from './terrain.js';
import { gateIn, giverNpc, layRoad, ledge, road, thickHedge, wall } from './terrkit.js';
import type { Mini } from './miniquest.js';
import type { TerrPlan, TerrZone } from './territory.js';
import { lightFor } from './timeofday.js';

// The ground: walls, heights, gates, soil, the road.

export const LOW = { w: 44, h: 96 };
/** What the scenes need from the ground: its ledges, the level at a point, the road, the stretches. */
export interface LowLand { ledges: Ledge[]; lv: (x: number, y: number) => number; road: Line; stretches: Stretch[] }

/** The road's fixed points, bottom to top, and how far the seed may bend it between each pair. */
const ROAD = [{ x: 22, y: 93 }, { x: 22, y: 84 }, { x: 22, y: 77 }, { x: 18, y: 68 }, { x: 26, y: 60 }, { x: 22, y: 50 }, { x: 22, y: 43 }, { x: 22, y: 34 }, { x: 22, y: 22 }, { x: 20, y: 12 }, { x: 22, y: 1 }];
const BENDS = [0.5, 0, 1, 1, 1, 0, 0, 0.6, 0.9, 0.4];

/** Both sides walled the whole height: two staggered rows of bushes, trees behind. */
function sides(k: Kit): void {
  const { w, h } = LOW;
  wall(k, { x: 3, y: 0.4 }, { x: 3, y: h - 0.4 }), wall(k, { x: 3.6, y: 0.75 }, { x: 3.6, y: h - 0.75 });
  wall(k, { x: w - 3, y: 0.4 }, { x: w - 3, y: h - 0.4 }), wall(k, { x: w - 3.6, y: 0.75 }, { x: w - 3.6, y: h - 0.75 });
  for (let y = 1; y < h - 0.5; y += 2) for (const x0 of [0.8, w - 2.1]) {
    const r = k.rng.range(0.55, 0.8), x = x0 + k.rng.range(0, 1.3);
    k.rounds.push({ kind: k.rng.pick(['tree', 'tree', 'bush']), x, y: y + k.rng.range(-0.5, 0.5), r });
  }
}

/** The soil: grass in and out, stubble on the headland, ridge and furrow up the strips, the cut strip, the banks. */
function ground(k: Kit): void {
  patch(k, 'grass', 0, 90, LOW.w, 6, false);
  patch(k, 'furrow', 4, 78, 36, 12, false);
  for (let i = 0; i < 6; i++) patch(k, i % 2 ? 'furrow' : 'crop', 4, 58 + i * 3, 36, 3, false);
  patch(k, 'furrow', 4, 44, 36, 14, false);
  patch(k, 'grass', 0, 24, 18, 16, false), patch(k, 'grass', 26, 24, 18, 16, false);
  patch(k, 'grass', 4, 4, 36, 18, false), patch(k, 'straw', 12, 9.5, 6, 5, false);
  patch(k, 'grass', 0, 0, LOW.w, 4, false);
}

/** The heights: the first lynchet (level 1 from y 70 up), the banks either side of the lane (2), the second lynchet (2 from y 24 up). */
function heights(): Ledge[] {
  const top = ledge(0, 0, LOW.w, 24, 2);
  // The lane climbs onto the rise by a slope across its width.
  top.ramps.push({ x: 18, y: 23, w: 8, h: 2 });
  // (The banks run a tile under the rise, so the line where they meet is never a level lower: `levelAt` is strict at an edge.)
  const west = ledge(0, 23, 18, 17, 2, ['S']), east = ledge(26, 23, 18, 17, 2, ['S']);
  // A sheep track worn up each bank from the lane, so nobody under a face is far from a way up (elevation.md, "Not annoying").
  west.ramps.push({ x: 17, y: 30, w: 2, h: 3 }), east.ramps.push({ x: 25, y: 30, w: 2, h: 3 });
  return [ledge(0, 0, LOW.w, 70, 1, ['S']), west, east, top];
}

export function layLand(k: Kit): LowLand {
  const ledges = heights(), lv = (x: number, y: number) => levelAt({ ledges } as unknown as GameMap, x, y);
  const line = road(k, ROAD, BENDS);
  // Kept clear: the way in and out, each gate's gathering ground and checkpoint, where the road meets each slope.
  for (const [x, y, r] of [[22, 92.5, 2.2], [22, 1.8, 2], [22, 79, 2.4], [22, 74.4, 1.9], [22, 45, 2.4], [22, 40.2, 1.9], [19.2, 70, 2.2], [22, 24, 2.6], [16.4, 31.5, 1.7], [27.4, 31.5, 1.5]]) claim(k, x, y, r);
  sides(k);
  ground(k);
  // The stiles, in and out: a fence either side of the road.
  block(k, 'fence', 17.2, 90.8, 3.6, 0.35), block(k, 'fence', 23.2, 90.8, 3.6, 0.35);
  block(k, 'fence', 16.4, 2.6, 4.2, 0.35), block(k, 'fence', 23.4, 2.6, 4.2, 0.35);
  // The field gate in its hedge.
  thickHedge(k, 77, 0.4, 20.02), thickHedge(k, 77, 23.98, LOW.w - 0.4);
  const s0 = gateIn(k, { x: 20.4, y: 76.3, w: 3.2, h: 1.4 }, 'THE HEADLAND', [101]);
  // The pond down its side path off the strips (shallow), the pocket.
  k.water.push({ x: 4.5, y: 61.5, w: 5, h: 3 });
  const side: Line = [{ x: 20, y: 66 }, { x: 14, y: 65.4 }, { x: 10, y: 63.6 }];
  k.roads.push(side), path(k, 'earth', side, 0.6);
  // The drain, deep, but for the bridge whose planks the hungry pulled off.
  k.water.push({ x: 0, y: 42.2, w: 20.4, h: 1.4, deep: true }, { x: 23.6, y: 42.2, w: 20.4, h: 1.4, deep: true });
  mark(k, 'planks', 20.4, 42.2, 3.2, 1.4);
  const s1 = gateIn(k, { x: 20.4, y: 42.2, w: 3.2, h: 1.4 }, 'THE STOOKS', [102], { x: 20.1, y: 43.7, w: 3.8, h: 2.6 }, { x: 22, y: 40.2 });
  const s2: Stretch = { name: 'THE FOLD YARD', keep: [], packs: [103] };
  return { ledges, lv, road: line, stretches: [s0, s1, s2] };
}

// The scenes.

/** The zones and scapes, in the order you come to them. */
export const LOW_ZONES: TerrZone[] = [
  { name: 'THE HEADLAND', kind: 'zone', x: 4, y: 78, w: 36, h: 12, stretch: 0 },
  { name: 'THE LONG STRIPS', kind: 'scape', x: 4, y: 58, w: 36, h: 18, stretch: 1 },
  { name: 'THE STOOKS', kind: 'zone', x: 4, y: 44, w: 36, h: 14, stretch: 1 },
  { name: 'THE BARN ROAD', kind: 'scape', x: 4, y: 22, w: 36, h: 20, stretch: 2 },
  { name: 'THE FOLD YARD', kind: 'zone', x: 4, y: 4, w: 36, h: 18, stretch: 2 },
];
/** Where the captives are caged: one in the headland, two in the stooks, two in the fold yard. */
export const LOW_CAGES: P[] = [{ x: 13.5, y: 82 }, { x: 14, y: 50 }, { x: 16.5, y: 51.5 }, { x: 14, y: 12 }, { x: 16, y: 13 }];

/** A scrapper of `pack` standing at (x, y), on whatever level is under it. */
function put(land: LowLand, foes: Foe[], x: number, y: number, pack: number, more: Partial<Foe> = {}): Foe {
  const f: Foe = { kind: 'scrapper', x, y, pack, ...more };
  const z = land.lv(x, y);
  if (z) f.z = z;
  foes.push(f);
  return f;
}

/** The headland: the gleaners' handcart on its side, one caged by it, two fighting over the dinner, sheaves dropped. */
function headland(k: Kit, land: LowLand): void {
  block(k, 'cart', 13.8, 83.4, 2.4, 1.2);
  put(land, k.foes, 24.8, 80.4, 101, { awake: false });
  put(land, k.foes, 27.4, 81.4, 101, { awake: false });
  claim(k, 26, 81, 1.6);
  scatter(k, 4, ['hay'], 6, 79.5, 38, 88.5, [0.32, 0.42]);
}

/** The long strips: a scarecrow in the rye, the pond's chest down the side path, a knot of two. */
function strips(k: Kit, land: LowLand): void {
  round(k, 'scarecrow', 30, 67.6, 0.35);
  k.chests.push({ x: 10.7 + k.rng.range(-0.2, 0.3), y: k.rng.range(62, 64) });
  const bow = k.rng.int(2);
  put(land, k.foes, 27.2, 61.8, 110, bow === 0 ? { bow: true } : {});
  put(land, k.foes, 28.6, 60.4, 110, bow === 1 ? { bow: true } : {});
}

/** The stooks: a cut strip, sheaves stood in three rows of five (cover), the hay cart with an archer by it. */
function stooks(k: Kit, land: LowLand): void {
  block(k, 'cart', 27.8, 48.4, 2.4, 1.2);
  for (const y of [46.6, 53.2, 56.6]) for (const x of [6.2, 10, 18.8, 33, 37]) round(k, 'hay', x + k.rng.range(-0.25, 0.25), y + k.rng.range(-0.2, 0.2), 0.5);
  put(land, k.foes, 15.6, 48.4, 102);
  put(land, k.foes, 18.6, 50.6, 102);
  put(land, k.foes, 30.8, 50.6, 102, { bow: true });
}

/** The barn road: the great barn on the east bank, doorless, carts across its doorway; elms on both banks; an archer on the west one. */
function barnRoad(k: Kit, land: LowLand): void {
  block(k, 'barn', 29, 26.5, 8, 6, { door: undefined });
  block(k, 'cart', 29.6, 32.6, 2.4, 1.1);
  block(k, 'cart', 33, 32.7, 2.4, 1.1);
  put(land, k.foes, 15, 32, 111, { bow: true });
  claim(k, 15, 32, 1.2);
  for (const [x0, x1] of [[4.5, 14.5], [29.5, 41]]) for (let t = 0; t < 7; t++) {
    const r = k.rng.range(0.5, 0.75), s = spotIn(k, x0, 25, x1, 37.6, r, 1.4);
    if (s) k.rounds.push({ kind: 'tree', x: s.x, y: s.y, r });
  }
}

/** The fold yard: a pen of hurdles with a gap toward the road, the last two caged in it, a pack with a drummer round it. */
function foldYard(k: Kit, land: LowLand): void {
  block(k, 'fence', 12, 9.5, 6, 0.35);
  block(k, 'fence', 12, 14.15, 6, 0.35);
  block(k, 'fence', 12, 9.5, 0.35, 5);
  block(k, 'fence', 17.65, 9.5, 0.35, 1.6);
  block(k, 'fence', 17.65, 12.9, 0.35, 1.6);
  const bow = k.rng.int(3);
  put(land, k.foes, 14.6, 7.8, 103, { variant: 'drummer' });
  [{ x: 10.4, y: 11.5 }, { x: 19.8, y: 15.2 }, { x: 16, y: 16.6 }].forEach((p, i) => put(land, k.foes, p.x, p.y, 103, i === bow ? { bow: true } : {}));
}

/**
 * The hill's one mini quest, for the tests (tests/minis.test.ts): someone by the headland's cart who won't speak till
 * the two at the dinner are dead, and sends you to the pond, where two goblins are made only then.
 */
export function hillMinis(land: LowLand): Mini[] {
  const foes: Foe[] = [];
  put(land, foes, 12, 66.5, 201), put(land, foes, 13.6, 67.4, 201);
  return [{
    id: 'hill-pond', kind: 'find', giver: { x: 17.4, y: 84.2, look: 'villager', low: true }, after: [101], foes,
    at: { x: 12.5, y: 66.5, r: 5 }, frees: [{ x: 10.8, y: 65.6 }], giverLeaves: 'done', chest: { x: 12.6, y: 68.6 },
  }];
}

export function hillPlan(job: Job): TerrPlan {
  const k = newKit(new Rng(job.seed * 7927 + 83));
  Object.assign(k, { mw: LOW.w, mh: LOW.h });
  const land = layLand(k);
  for (const c of LOW_CAGES) prop(k, 'cage', c.x, c.y);
  headland(k, land), strips(k, land), stooks(k, land), barnRoad(k, land), foldYard(k, land);
  layRoad(k, land.road, 0.9);
  const minis = hillMinis(land);
  for (const m of minis) claim(k, m.giver.x, m.giver.y, 0.6);
  const map: GameMap = {
    name: 'THE PROVING HILL', w: LOW.w, h: LOW.h, wallFace: 3, rounds: k.rounds, blocks: k.blocks, braziers: [], torches: [],
    hero: { x: 22, y: 92.5 }, exit: { x: 20.5, y: 0, w: 3, h: 0.9 }, theme: lightFor(THEMES.field, 'field', 'day'),
    water: k.water, soil: k.soil, marks: k.marks, ledges: land.ledges, stretches: land.stretches,
    // Most of the land is raised: anything set down on it (a cage, someone freed, a hero up at a gate) stands on it.
    settle: true,
    minis, npcs: minis.map(giverNpc),
  };
  return { map, foes: k.foes, props: k.props, chests: k.chests, zones: LOW_ZONES.map((z) => ({ ...z })) };
}
