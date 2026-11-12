/**
 * Wickhold, the last walled town: a map you walk around, built from the shared world's state.
 *
 * Lantern Square in the middle (the Last Lantern, the job board, the public works and its crew, the Roll of the
 * Brave, the well, a bard). Round it: the church and its graves (north-west), the town hall and the
 * forge (north), the mage's tower and the barred keep (north-east), the barracks (west), the hunters'
 * lodge and its archery butts (east), the counting house with its vault (west, roof fallen in), the infirmary (south-west), the Drowned Rat tavern with a sewer
 * grate behind it (south), Rescue Row (south-east). Past the rubble in the east lane, the Old Quarter.
 * Guards walk their rounds. What the world has done changes it: houses on Rescue Row, a granary or
 * a trader, more of the watch, the east lane cleared, and the town mended after the breach (mend.ts).
 */
import type { Block, GameMap, Npc, Round } from './arena.js';
import type { PropKind } from './props.js';
import type { WorldState } from './story.js';
import { townGround, townSoil } from './ground.js';
import { mending, WORN } from './mend.js';
import { siege } from './siege.js';
import { workDone } from './works.js';
import { publicWorks } from './publicworks.js';
import { BUTTS, MILLPOND } from './pastimes.js';
import { PLINTH } from './statue.js';

/** What talking to someone (or using a spot) opens. */
export type SpotId = 'board' | 'council' | 'church' | 'smith' | 'wright' | 'trainer' | 'market' | 'infirmary' | 'granary' | 'home' | 'chat'
  | 'yard' | 'gate' | 'hew' | 'orla' | 'works' | 'roll' | 'well' | 'bard' | 'dice' | 'tavern' | 'sewer' | 'locked' | 'bank' | 'merchant' | 'advocate' | 'vendor'
  /** The practice board at the training yard's pen (client/practiceui.ts). */
  | 'practice'
  /** Brisk's stair up to the night shift on the wall (client/watchpost.ts). */
  | 'watch'
  /** Old Pennock at the millpond, and Abel at the archery butts: the town's pastimes (client/pastimeui.ts). */
  | 'fish' | 'range'
  /** At the Drowned Rat: the arm-wrestling table and the card sharp's knife board (client/ratui.ts). */
  | 'arm' | 'knives'
  /** The board of bests by the Lantern: the town's best at the pastimes (client/bestui.ts). */
  | 'best'
  /** The town hall's map table, the clerk at it: the long trips (client/boardui.ts). */
  | 'map';
export interface Spot { id: SpotId; x: number; y: number; label: string; key?: string }

export const SPOTS: Spot[] = [
  { id: 'board', x: 24.1, y: 13.8, label: 'JOB BOARD' },
  { id: 'works', x: 32, y: 13.8, label: 'PUBLIC WORKS' },
  { id: 'best', x: 28, y: 13.8, label: 'BEST IN WICKHOLD' },
  { id: 'roll', x: 28, y: 25.3, label: 'THE ROLL OF THE BRAVE' },
  { id: 'well', x: 22, y: 21.4, label: 'THE WELL' },
  { id: 'market', x: 38.5, y: 14.2, label: 'MARKET ROW' },
  { id: 'gate', x: 28, y: 1.2, label: 'NORTH GATE' },
  { id: 'sewer', x: 23.5, y: 35.4, label: 'SEWER GRATE' },
  { id: 'locked', x: 51.6, y: 18, label: 'RUBBLE', key: 'oldquarter' },
];
/** How close you must stand to use a spot or talk to someone. */
export const SPOT_REACH = 1.6;

const marketIn = (w: WorldState) => w.flags['north-fields'] === 'refugees';
/** The spots out in the open today (the market is a person once the traders are in; the rubble goes). */
export const townSpots = (w: WorldState) => SPOTS.filter((s) => (s.id !== 'market' || !marketIn(w)) && (s.key !== 'oldquarter' || !workDone(w, 'oldquarter')));

/** Up to eight houses on Rescue Row: one per two people home. */
export const HOUSES = [[34, 30.5], [38, 30.5], [42, 30.5], [46, 30.5], [34, 35], [38, 35], [42, 35], [46, 35]] as const;
export const housesFor = (rescued: number) => Math.min(HOUSES.length, Math.floor(rescued / 2));

/** The class trainers, where they are (each tells the others' whereabouts). */
export const TRAINERS = {
  WARRIOR: { name: 'MASTER COLE', where: 'the barracks by the west wall' },
  RANGER: { name: 'HUNTRESS MAEVE', where: "the hunters' lodge past the archery butts, east of the square" },
  ROGUE: { name: 'WHISPER', where: 'the back of the Drowned Rat, down south by the sewer grate' },
  MAGE: { name: 'MAGISTER VELL', where: 'the old tower in the north-east, by the keep' },
  HEALER: { name: 'MOTHER ISOLDE', where: 'the church in the north-west' },
};

export const W = 62, H = 40;

/** Barrels and crates about the streets (nobody fights in town, but you can shove them about). */
export const TOWN_PROPS: { kind: PropKind; x: number; y: number }[] = [
  { kind: 'barrel', x: 21.7, y: 32.6 }, { kind: 'barrel', x: 22.5, y: 33.5 }, { kind: 'barrel', x: 12.3, y: 32.6 }, { kind: 'crate', x: 12.3, y: 33.7 },
  { kind: 'crate', x: 40.5, y: 12.7 }, { kind: 'crate', x: 40.5, y: 16.6 }, { kind: 'barrel', x: 36.4, y: 18 },
  { kind: 'barrel', x: 38.8, y: 7.6 }, { kind: 'crate', x: 30.3, y: 7.5 }, { kind: 'crate', x: 10.6, y: 16.9 },
];

export function townMap(w: WorldState): GameMap {
  const quarter = workDone(w, 'oldquarter'), watch = workDone(w, 'watch');
  const blocks: Block[] = [
    { x: 3, y: 3, w: 8, h: 4.5, kind: 'church', label: 'CHURCH', door: 'church' },
    { x: 15, y: 3, w: 6, h: 4, kind: 'hall', label: 'TOWN HALL', door: 'townhall' },
    { x: 31, y: 3, w: 7, h: 4, kind: 'forge', label: 'FORGE', door: 'forge' },
    { x: 42.5, y: 2.5, w: 4, h: 4.5, kind: 'tower', label: 'TOWER', door: 'tower' },
    { x: 48.5, y: 1.5, w: 4.5, h: 6, kind: 'wall', label: 'THE KEEP', door: 'keep', locked: true },
    { x: 1.5, y: 13, w: 8, h: 4, kind: 'hall', label: 'BARRACKS', door: 'hall' },
    { x: 10.2, y: 13.6, w: 0.5, h: 2.2, kind: 'rack' },
    { x: 45, y: 13, w: 6, h: 3.5, kind: 'house', label: "HUNTERS' LODGE", door: 'lodge' },
    { x: 37, y: 11.5, w: 3, h: 2, kind: 'stall', label: marketIn(w) ? 'TRADER' : 'EMPTY' },
    { x: 37, y: 15.5, w: 3, h: 2, kind: 'stall', label: 'PAWN' },
    // The counting house: the roof came in during the siege and was never put back; the vault under it held (Keeper Edda).
    { x: 2.4, y: 22.4, w: 6, h: 3.2, kind: 'hall', label: 'COUNTING HOUSE', door: 'bank', worn: true },
    { x: 22.9, y: 12.6, w: 2.4, h: 0.6, kind: 'stall', label: 'JOBS' },
    { x: 30.3, y: 12.6, w: 3.4, h: 0.6, kind: 'stall', label: 'PUBLIC WORKS' },
    { x: 27, y: 23.5, w: 2, h: 1, kind: 'monument' },
    { x: 23.5, y: 24, w: 2, h: 0.5, kind: 'bench' },
    { x: 31, y: 24, w: 2, h: 0.5, kind: 'bench' },
    { x: 35, y: 21, w: 2.2, h: 1.2, kind: 'cart' },
    { x: 3, y: 29, w: 7, h: 3.5, kind: 'house', label: 'INFIRMARY', door: 'infirmary' },
    { x: 13, y: 30, w: 8, h: 4, kind: 'tavern', label: 'THE DROWNED RAT', door: 'tavern' },
    // The east wall and the Old Quarter beyond it.
    { x: 53, y: 0, w: 1.6, h: 13, kind: 'wall' },
    { x: 53, y: 23, w: 1.6, h: 17, kind: 'wall' },
    { x: 56, y: 12.5, w: 5, h: 3.5, kind: 'house', label: 'OLD CHAPEL', door: 'chapel', locked: true },
  ];
  if (!quarter) blocks.push({ x: 53.1, y: 13, w: 1.4, h: 10, kind: 'rubble' });
  for (let i = 0; i < housesFor(w.rescued); i++) blocks.push({ x: HOUSES[i][0] - 1.3, y: HOUSES[i][1] - 1.6, w: 2.6, h: 1.8, kind: 'house', door: 'home:' + i });
  if (w.flags['north-fields'] === 'farm') blocks.push({ x: 22, y: 3, w: 3.6, h: 3, kind: 'granary', label: 'GRANARY', door: 'granary' });
  const r = (kind: Round['kind'], x: number, y: number, rad: number): Round => ({ kind, x, y, r: rad });
  const rounds: Round[] = [
    r('lantern', 28, 17.5, 0.5), r('well', 22, 20.4, 0.5),
    ...[[2.5, 9.4], [4.2, 9.9], [9.8, 9.4], [11.5, 9.9], [13, 9.4]].map(([x, y]) => r('stone', x, y, 0.25)),
    ...[[43, 20], [46, 20.6], [49, 20]].map(([x, y]) => r('target', x, y, 0.35)),
    ...[[19.6, 12.2], [36.3, 12.2], [20, 26.5], [36, 26.5], [12, 27], [44, 27], [8, 20], [50, 25]].map(([x, y]) => r('post', x, y, 0.15)),
    ...[[60, 5], [1.5, 37], [10, 38], [59.5, 37], [27, 38.5], [41, 8.5], [1.5, 24]].map(([x, y]) => r('tree', x, y, 0.6)),
    ...[[12.5, 7], [41, 24], [19, 37], [55.5, 9], [60.5, 21]].map(([x, y]) => r('bush', x, y, 0.35)),
    r('grate', 23.5, 36, 0.05), r('statue', 58.5, 19.5, 0.5),
    // The plinth in the square, and whoever paid for the statue on it (shared/statue.ts).
    { kind: 'plinth', x: PLINTH.x, y: PLINTH.y, r: PLINTH.r, ...(w.statue ? { hero: w.statue.by } : {}) },
    // Reeds round the millpond's edges.
    ...MILLPOND.reeds.map(([x, y]) => r('reed', x, y, 0.2)),
  ];
  const n = (name: string, x: number, y: number, talk: string, look: string, arg?: number, path?: [number, number][], speed?: number): Npc => ({ name, x, y, talk, look, arg, path, speed });
  const npcs: Npc[] = [
    n('OLD WENNA', 25.5, 19, 'chat', 'elder', 0),
    n('TAM', 22.6, 17.4, 'chat', 'child', 1),
    n('ROWAN THE BARD', 33.5, 19, 'bard', 'bard'),
    n('GATE GUARD', 26.2, 2.4, 'chat', 'guard', 5),
    n('SERGEANT DUNN', 21, 11.6, 'chat', 'guard', 6, [[21, 11.6], [34.4, 11.6], [34.4, 26.6], [21, 26.6]], 1),
    n('WATCHMAN HOB', 4, 10.8, 'chat', 'guard', 7, [[4, 10.8], [51, 10.8]], 1.2),
  ];
  if (watch) npcs.push(n('WATCHMAN PIKE', 11, 27.6, 'chat', 'guard', 8, [[11, 27.6], [51, 27.6]], 1.1), n('ORLA OF THE WATCH', 41.2, 22, 'chat', 'guard', 14, [[41.2, 22], [52, 22], [52, 12], [41.2, 12]], 1));
  if (marketIn(w)) npcs.push(n('DESSA THE TRADER', 38.5, 13.9, 'market', 'trader'));
  // Tobin buys anything at the far stall, and sells it back for a while (client/stores.ts).
  npcs.push(n('TOBIN THE PAWNBROKER', 38.5, 18.1, 'merchant', 'villager'));
  // The town's pastimes (shared/pastimes.ts): Old Pennock lends rods at the millpond, Abel keeps the butts.
  npcs.push(n('OLD PENNOCK', MILLPOND.npc[0], MILLPOND.npc[1], 'fish', 'elder'), n('ABEL', BUTTS.npc[0], BUTTS.npc[1], 'range', 'ranger'));
  if (quarter) npcs.push(n('OLD MERREN', 57, 18, 'chat', 'elder', 9));
  // Cobb the gravedigger at the top of the Deep's ladder, once the grate's open (docs/design/the-deep.md; Kyle,
  // 2026-11-11: "we say Cobb sits by the sewer grate but he doesn't"). Talking to him is the grate's own panel.
  if (workDone(w, 'sewers')) npcs.push({ ...n('COBB', 25.1, 35.7, 'sewer', 'digger'), work: 'ladder' });
  // Foreman Judd at the works stall, and his crew sweeping, hauling and shovelling (publicworks.ts).
  npcs.push(...publicWorks(w));
  const m = mending(w), sg = siege(w), worn = !workDone(w, 'shutters');
  for (const b of blocks) if (worn && b.label && WORN.includes(b.label)) b.worn = true;
  blocks.push(...m.blocks, ...sg.blocks), rounds.push(...m.rounds, ...sg.rounds), npcs.push(...m.npcs, ...sg.npcs);
  return {
    name: 'WICKHOLD', w: W, h: H, wallFace: 3, rounds, blocks, npcs, soil: townSoil(w), marks: [...townGround(w), ...m.marks], breach: m.breach,
    braziers: [{ x: 25, y: 15, r: 0.35 }, { x: 31, y: 15, r: 0.35 }, { x: 28, y: 21.6, r: 0.35 }, ...sg.braziers],
    torches: [6, 14, 22, 34, 40, 46, 58].map((x) => ({ x, y: -1.6 })),
    // The millpond under the east wall, where the mill stream comes in (shared/pastimes.ts).
    water: [{ ...MILLPOND.water, deep: true }],
    hero: { x: 28, y: 20 }, exit: null,
    theme: { floor: 'cobble', back: 'stone', ambient: [0.27, 0.25, 0.33], moon: 0.5 },
  };
}
