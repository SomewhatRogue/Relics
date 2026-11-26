/**
 * The High Wood (docs/design/the-high-wood.md; the file is `highwood`): the land's third map, old forest on the high
 * ground beyond the fen, walked into off the fen's far end. 96 by 160, in at the bottom, nothing beyond the top yet,
 * always by day but dark under the canopy, no gates: banks, a ridge and a rise set the pace.
 *
 *   THE ROOT STAIR (zone): the bog giving up to roots and rock, pools between them; the way in.
 *   THE SUNK LANES (zone): lanes worn deep between high banks (real heights: the Rogue climbs them, the rest go round).
 *   THE WOODWARD'S LODGE (scape): the shelter, a palisade, a fire, its keeper Woodward Hild (map.stations).
 *   THE STRUCK OAKS (zone): a ridge of lightning-split oaks, a clearing of fallen trunks.
 *   THE OLD TREES (zone): the oldest trees standing close, a stream in a ravine crossed by one fallen trunk.
 *   THE COIN OAK (zone): the landmark, the biggest oak there is, on its rise. The far edge is rock and thick wood.
 *
 * Slice 1, the land: no foes, gathers, nooks or bounties yet. Built from the job's seed alone on every screen (the map
 * is never sent); the seed scatters the trees only.
 */
import type { GameMap, Stretch } from './arena.js';
import { newKit } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import { THEMES } from './terrain.js';
import type { TerrPlan, TerrZone } from './territory.js';
import { lightFor } from './timeofday.js';
import { HIGHWOOD, highWoodGround, highWoodLedges } from './highwoodground.js';
import { HILD, LODGE, WAY_IN, layEdges, layLodge, layRoads, layStruck, layTrees } from './highwoodland.js';

export { HIGHWOOD };
/** The map's name and its shelter's, as the banner and the keeper's panel show them. */
export const HIGH_WOOD = 'THE HIGH WOOD';
export const LODGE_NAME = "THE WOODWARD'S LODGE";

/** The zones and the scape, south to north. */
export const HIGH_ZONES: TerrZone[] = [
  { name: 'THE ROOT STAIR', kind: 'zone', x: 3, y: 140, w: 90, h: 20, stretch: 0 },
  { name: 'THE SUNK LANES', kind: 'zone', x: 3, y: 110, w: 90, h: 30, stretch: 0 },
  { name: LODGE_NAME, kind: 'scape', x: 54, y: 97, w: 16, h: 13, stretch: 0 },
  { name: 'THE STRUCK OAKS', kind: 'zone', x: 3, y: 70, w: 90, h: 40, stretch: 0 },
  { name: 'THE OLD TREES', kind: 'zone', x: 3, y: 36, w: 90, h: 34, stretch: 0 },
  { name: 'THE COIN OAK', kind: 'zone', x: 3, y: 2, w: 90, h: 34, stretch: 0 },
];

export function highWoodPlan(job: Job): TerrPlan {
  const k = newKit(new Rng(job.seed * 7951 + 47)), ground = highWoodGround();
  Object.assign(k, { mw: HIGHWOOD.w, mh: HIGHWOOD.h });
  k.water = ground.water;
  layRoads(k), layLodge(k), layStruck(k), layTrees(k), layEdges(k);
  k.blocks.push(...ground.boards);
  const s0: Stretch = { name: HIGH_WOOD, keep: [], packs: [] };
  const map: GameMap = {
    name: HIGH_WOOD, w: HIGHWOOD.w, h: HIGHWOOD.h, wallFace: 3, rounds: k.rounds, blocks: k.blocks, braziers: k.braziers, torches: [],
    // (No way on yet: the exit is a speck out in the north rock, where nobody stands and no way out is drawn.)
    hero: { ...WAY_IN }, exit: { x: 94, y: 0.4, w: 0.5, h: 0.5 }, theme: { ...lightFor(THEMES.forest, 'forest', 'day'), floor: 'grass', back: 'trees' },
    water: k.water, soil: k.soil, marks: k.marks, ledges: highWoodLedges(), stretches: [s0], grim: k.grim,
    // (The Coin Oak's ground first: the wood's set takes its landmark from the first part of wood, client/sets.ts.)
    grounds: [{ look: 'mossy', x: 0, y: 0, w: 96, h: 36 }, { look: 'mossy', x: 0, y: 36, w: 96, h: 34 }, { look: 'charcoal', x: 0, y: 70, w: 96, h: 27 }, { look: 'mossy', x: 0, y: 97, w: 96, h: 63 }],
    npcs: [{ ...HILD, name: 'HILD', talk: 'station:lodge', look: 'villager' }],
    stations: [{ name: LODGE_NAME, ...LODGE }], gathers: [],
    trails: k.roads.map((l) => l.map((p) => ({ x: p.x, y: p.y }))),
  };
  return { map, foes: k.foes, props: k.props, chests: k.chests, zones: HIGH_ZONES.map((z) => ({ ...z })) };
}
