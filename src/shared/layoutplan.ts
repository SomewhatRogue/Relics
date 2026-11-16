/**
 * Wickhold re-laid out (docs/design/town-layout.md), its bones: the buildings, each with its front on its lane (a
 * block's `face` is the way you walk in, so its front looks the other way: none S, 'S' N, 'W' E, 'E' W), the three
 * levels and the steps between them, the town walls, the fences along the drops, the millpond, the ground's
 * paint, and the graves and trees of its own. Everyone and everything else comes from today's town, moved by
 * district (layoutmove.ts). Pure.
 */
import type { Block, Ledge, Round, Soil } from './arena.js';
import type { WorldState } from './story.js';
import { workDone } from './works.js';

export const LW = 64, LH = 58;
/** Where you arrive: the square's south side, looking north up to the Lantern, the hall and the church. */
export const ARRIVE = { x: 29.5, y: 31.5 };

/** The lower quarter is the ground (0); the town is level 1; Kirkhill level 2. */
export const LEDGES: Ledge[] = [
  // The town, with the Rat Steps and the East Stair down off the square's south side.
  { x: 0, y: 0, w: 64, h: 36, lv: 1, kind: 'rock', ramps: [{ x: 27, y: 34, w: 5, h: 4 }, { x: 38, y: 34, w: 3, h: 4 }] },
  // Down the west wall: Wall Lane's cottages, its slope down east to the Lower Lane.
  { x: 0, y: 36, w: 13, h: 22, lv: 1, kind: 'rock', ramps: [{ x: 11, y: 36, w: 3.5, h: 3.5 }] },
  // The Old Quarter past the east wall.
  { x: 55, y: 36, w: 9, h: 22, lv: 1, kind: 'rock', ramps: [] },
  // Kirkhill: the church, its close and graves, up the Kirk Steps from the square.
  { x: 13, y: 0, w: 27, h: 13, lv: 2, kind: 'rock', ramps: [{ x: 27, y: 11, w: 5, h: 4.5 }] },
];

const bl = (x: number, y: number, w: number, h: number, kind: Block['kind'], more: Partial<Block> = {}): Block => ({ x, y, w, h, kind, ...more });
/** A town house: no door, a front on its lane. */
const house = (x: number, y: number, w: number, h: number, face?: Block['face']): Block => bl(x, y, w, h, 'house', face ? { face } : {});

/** Rescue Row's eight homes, filled in turn from either side of the row (one per two people home). */
export const HOMES: [number, number, Block['face']][] = [0, 1, 2, 3].flatMap((i) => [[41 + i * 3.5, 39.5, undefined], [41 + i * 3.5, 45.5, 'S']] as [number, number, Block['face']][]);

/** The buildings, by what the world has done (the granary, the rubble, the homes). */
export function planBlocks(w: WorldState, homes: number): Block[] {
  const quarter = workDone(w, 'oldquarter');
  const out: Block[] = [
    // Kirkhill: the church at the head of the Kirk Steps, its front down them.
    bl(25, 2, 9, 6.5, 'church', { label: 'CHURCH', door: 'church' }),
    // The square: the town hall on its north side, its back to Kirkhill's wall; houses either side of the steps.
    bl(33, 13, 8.5, 5.5, 'hall', { label: 'TOWN HALL', door: 'townhall' }),
    house(22, 13, 5, 2.75, 'W'), house(22, 15.75, 5, 2.75, 'W'), house(41.5, 13, 3.5, 5.5, 'W'),
    // Smiths' Lane: the forge on its north side, houses either side of it and facing it; the barracks across its end.
    bl(14, 14.5, 7.5, 6, 'forge', { label: 'FORGE', door: 'forge' }),
    house(9.5, 14.5, 2.25, 6), house(11.75, 14.5, 2.25, 6),
    ...[0, 1, 2, 3].map((i) => house(12.5 + i * 2.625, 23.5, 2.625, 3.5, 'S')),
    bl(1.5, 17, 7.5, 10, 'hall', { label: 'BARRACKS', door: 'hall', face: 'W' }),
    bl(6, 13.6, 2.2, 0.5, 'rack'),
    // The counting house on the square's west side; houses down Wall Lane; the infirmary across from them.
    bl(16.5, 28.5, 6.5, 5.5, 'hall', { label: 'COUNTING HOUSE', door: 'bank', worn: true, face: 'W' }),
    ...[0, 1, 2].map((i) => house(12.5, 27 + i * 2.7, 4, 2.7, 'E')),
    bl(1.5, 29, 7.5, 7, 'house', { label: 'INFIRMARY', door: 'infirmary', face: 'W' }),
    ...[0, 1, 2, 3, 4].map((i) => house(1.5, 37 + i * 4, 7.5, 3.9, 'W')),
    // The north gate's yard: the keep and the tower facing the Gate Road.
    bl(49, 1, 6, 8, 'wall', { label: 'THE KEEP', door: 'keep', locked: true, face: 'E' }),
    bl(49.5, 10.5, 5, 6, 'tower', { label: 'TOWER', door: 'tower', face: 'E' }),
    // Market Lane: the hunters' lodge on its south side, the gate road coming straight down to its door.
    bl(43, 24, 7.5, 6, 'house', { label: "HUNTERS' LODGE", door: 'lodge', face: 'S' }),
    house(50.5, 24, 2.25, 5), house(52.75, 24, 2.25, 5), house(50.5, 29.5, 4.5, 5, 'E'),
    // The lower quarter: the Drowned Rat in its bottom-left corner, out of the square's view, its front on Rat Lane
    // along the south wall, facing the camera (Kyle, 2026-11-15); the millpond below the Rat Steps in its place.
    bl(13.5, 48, 8.5, 6.5, 'tavern', { label: 'THE DROWNED RAT', door: 'tavern' }),
    // The Old Quarter: the chapel seen through the gap in the wall, down Market Lane.
    bl(57.5, 18.5, 5.5, 7, 'house', { label: 'OLD CHAPEL', door: 'chapel', locked: true, face: 'E' }),
    // The town walls: west, and the east wall with its gap. No wall south: the town stands on a bluff over a gorge
    // (Kyle, 2026-11-15), a timber rail along the brink (three/layoutledges.ts draws the drop).
    bl(0, 0, 0.8, LH - 0.6, 'wall'), bl(55, 0, 1.5, 20, 'wall'), bl(55, 24, 1.5, LH - 24.6, 'wall'),
    bl(0.8, LH - 0.45, 12.2, 0.25, 'fence'), bl(13, LH - 0.45, 42, 0.25, 'fence'), bl(56.5, LH - 0.45, 7.5, 0.25, 'fence'),
    ...FENCES.map(([x, y, fw, fh]) => bl(x, y, fw, fh, 'fence')),
  ];
  if (!quarter) out.push(bl(55.1, 20, 1.3, 4, 'rubble'));
  for (let i = 0; i < homes; i++) out.push(bl(HOMES[i][0], HOMES[i][1], 3.5, 3, 'house', { door: 'home:' + i, ...(HOMES[i][2] ? { face: HOMES[i][2] } : {}) }));
  if (w.flags['north-fields'] === 'farm') out.push(bl(35, 2.5, 4.5, 4.5, 'granary', { label: 'GRANARY', door: 'granary' }));
  return out;
}

/** Fences along the drops a lane runs beside (gaps where the steps go down). */
const FENCES: [number, number, number, number][] = [
  // The square's south edge, over the lower quarter.
  [13, 35.6, 14, 0.3], [32, 35.6, 6, 0.3], [41, 35.6, 14, 0.3],
  // Wall Lane's east edge, over the lower quarter.
  [12.6, 39.5, 0.3, LH - 40.3],
  // Kirkhill: the graveyard's wall over the training yard and Smiths' Lane, and over the gate yard.
  [13.05, 0.8, 0.3, 12], [13.05, 12.65, 8.9, 0.3], [39.6, 0.8, 0.3, 12],
];

/** Graves (Kirkhill's yard), trees and bushes of the new town's own. */
export const OWN_ROUNDS: Round[] = [
  ...[0, 1, 2, 3].flatMap((i) => [0, 1, 2, 3].map((j): Round => ({ kind: 'stone', x: 15 + i * 2.1 + (j % 2) * 0.5, y: 2.6 + j * 2.4, r: 0.25 }))),
  { kind: 'tree', x: 23, y: 11, r: 0.6 }, { kind: 'tree', x: 37.5, y: 10.5, r: 0.6 }, { kind: 'tree', x: 2.5, y: 2.5, r: 0.6 },
  { kind: 'tree', x: 11.5, y: 2.4, r: 0.6 }, { kind: 'tree', x: 35.5, y: 55.6, r: 0.6 }, { kind: 'tree', x: 61.5, y: 3, r: 0.6 },
  { kind: 'tree', x: 61, y: 47, r: 0.6 }, { kind: 'bush', x: 13.8, y: 55.5, r: 0.35 }, { kind: 'bush', x: 53, y: 35.1, r: 0.35 },
  { kind: 'post', x: 22.6, y: 19.6, r: 0.15 }, { kind: 'post', x: 24, y: 34.2, r: 0.15 }, { kind: 'post', x: 11, y: 30.5, r: 0.15 },
  { kind: 'post', x: 44.2, y: 37.6, r: 0.15 }, { kind: 'post', x: 10.9, y: 44, r: 0.15 }, { kind: 'post', x: 13.4, y: 56.6, r: 0.15 }, { kind: 'post', x: 22.6, y: 56.6, r: 0.15 },
];

/** The millpond, below the Rat Steps (Old Pennock's rods and seat come with the pond's district). */
export const POND = { x: 26, y: 41.5, w: 6, h: 6.4 };

/** The ground's paint: earth in the yards, flags on Kirkhill's close, a worn way down the lanes. */
export const SOIL: Soil[] = [
  { mat: 'earth', x: 1, y: 1, w: 12, h: 13 }, { mat: 'grass', x: 13.5, y: 0.5, w: 9.5, h: 12 },
  // The Drowned Rat's end of town, all dirt and mud (Kyle, 2026-11-15): the yard below the steps, the pond's banks,
  // Rat Lane, the Lower Lane's west end and the slope down from Wall Lane; Rescue Row's lane and backs. (Mud never
  // over the pond itself: the water takes its colour from the ground painted under it.)
  { mat: 'earth', x: 13, y: 36, w: 30, h: 21.5 }, { mat: 'earth', x: 9, y: 36, w: 4, h: 21.5 },
  { mat: 'mud', x: 13, y: 52.5, w: 12, h: 5 }, { mat: 'mud', x: 22.5, y: 40, w: 3.4, h: 9 }, { mat: 'mud', x: 22.5, y: 48.1, w: 12, h: 4.5 }, { mat: 'mud', x: 32.1, y: 40.5, w: 2, h: 8 }, { mat: 'mud', x: 14, y: 39.5, w: 5, h: 4 },
  { mat: 'mud', x: 34, y: 46, w: 7, h: 11 }, { mat: 'earth', x: 41, y: 42.5, w: 14, h: 3 }, { mat: 'earth', x: 41, y: 48.5, w: 14, h: 9 },
  { mat: 'earth', x: 56.5, y: 0.5, w: 7, h: 57 },
];
