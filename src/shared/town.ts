/**
 * Wickhold, the last walled town: a map you walk around, built from the shared world's state. Every
 * building has a door and someone inside (see interiors.ts). Rescue Row fills with a house for every
 * two people brought home; the council's choices put up a granary or open the market. Spots are the
 * things out in the open you stop at: the job board, the market stalls, the north gate.
 */
import type { Block, GameMap, Npc, Round } from './arena';
import type { WorldState } from './story';

/** What talking to someone (or using a spot) opens. */
export type SpotId = 'board' | 'council' | 'church' | 'smith' | 'wright' | 'trainer' | 'market' | 'infirmary' | 'granary' | 'home' | 'chat' | 'yard' | 'gate';
export interface Spot { id: SpotId; x: number; y: number; label: string }

export const SPOTS: Spot[] = [
  { id: 'board', x: 14.6, y: 14.4, label: 'JOB BOARD' },
  { id: 'market', x: 28.5, y: 14.4, label: 'MARKET ROW' },
  { id: 'gate', x: 17.5, y: 1.2, label: 'NORTH GATE' },
];
/** How close you must stand to use a spot or talk to someone. */
export const SPOT_REACH = 1.6;

/** The spots out in the open today (the market is a person once the traders are in). */
export const townSpots = (w: WorldState) => SPOTS.filter((s) => s.id !== 'market' || !marketIn(w));
const marketIn = (w: WorldState) => w.flags['north-fields'] === 'refugees';

/** Up to eight houses on Rescue Row: one per two people home. */
export const HOUSES = [[23, 20.5], [26.5, 20.5], [30, 20.5], [23, 24], [26.5, 24], [30, 24], [19.5, 24], [33, 22]] as const;
export const housesFor = (rescued: number) => Math.min(HOUSES.length, Math.floor(rescued / 2));

export function townMap(w: WorldState): GameMap {
  const blocks: Block[] = [
    { x: 3, y: 2.5, w: 7, h: 4, kind: 'church', label: 'CHURCH', door: 'church' },
    { x: 19, y: 2.5, w: 5, h: 3.5, kind: 'hall', label: 'TOWN HALL', door: 'townhall' },
    { x: 25, y: 2.5, w: 7, h: 4, kind: 'forge', label: 'FORGE', door: 'forge' },
    { x: 1, y: 9.5, w: 6, h: 3, kind: 'hall', label: 'TRAINING HALL', door: 'hall' },
    { x: 3, y: 18, w: 7, h: 3.5, kind: 'house', label: 'INFIRMARY', door: 'infirmary' },
    { x: 13.6, y: 13.3, w: 2, h: 0.5, kind: 'stall', label: 'JOBS' },
    { x: 25, y: 11, w: 3, h: 2, kind: 'stall', label: marketIn(w) ? 'TRADER' : 'EMPTY' },
    { x: 29.5, y: 11, w: 3, h: 2, kind: 'stall' },
  ];
  for (let i = 0; i < housesFor(w.rescued); i++) blocks.push({ x: HOUSES[i][0] - 1.3, y: HOUSES[i][1] - 1.6, w: 2.6, h: 1.8, kind: 'house', door: 'home:' + i });
  if (w.flags['north-fields'] === 'farm') blocks.push({ x: 11, y: 2.5, w: 4, h: 3, kind: 'granary', label: 'GRANARY', door: 'granary' });
  const rounds: Round[] = [
    { x: 17.5, y: 11, r: 0.5, kind: 'lantern' },
    { x: 12, y: 9, r: 0.5, kind: 'well' },
    { x: 33, y: 8, r: 0.6, kind: 'tree' },
    { x: 1.5, y: 25, r: 0.6, kind: 'tree' },
  ];
  const npcs: Npc[] = [
    { x: 16.3, y: 12.2, name: 'OLD WENNA', talk: 'chat', arg: 0, look: 'elder' },
    { x: 13.2, y: 9.6, name: 'TAM', talk: 'chat', arg: 1, look: 'child' },
  ];
  if (marketIn(w)) npcs.push({ x: 26.5, y: 13.7, name: 'DESSA THE TRADER', talk: 'market', look: 'trader' });
  return {
    name: 'WICKHOLD', w: 35, h: 27, wallFace: 3, rounds, blocks, npcs,
    braziers: [{ x: 15, y: 9.5, r: 0.35 }, { x: 20, y: 9.5, r: 0.35 }, { x: 17.5, y: 17, r: 0.35 }],
    torches: [{ x: 6, y: -1.6 }, { x: 13, y: -1.6 }, { x: 22, y: -1.6 }, { x: 29, y: -1.6 }],
    hero: { x: 17.5, y: 15.5 }, exit: null,
    theme: { floor: 'cobble', back: 'stone', ambient: [0.27, 0.25, 0.33], moon: 0.5 },
  };
}
