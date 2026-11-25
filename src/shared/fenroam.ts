/**
 * The Fen (docs/design/the-fen.md; the file is `fenroam`, apart from Fenmere the expedition, shared/fen.ts): the land's
 * second map, north of THE NORTH FIELDS, walked into off their far end. 90 by 150, in at the bottom, nothing beyond
 * the top yet, always by day, no gates: deep water, one causeway and the reeds set the pace.
 *
 *   THE BOG EDGE (zone): the fields going to bog, pools and rushes, three at a drowned sheep.
 *   THE CAUSEWAYS (zone): deep water, the causeway's dog-leg, a shield line, a skimmer on its islet, a ford, an island.
 *   THE EEL STAITHE (scape): the shelter, an eel landing on its island, a fire, its keeper (map.stations).
 *   THE WIDE REEDS (zone): shallows thick with reeds, channels with boards over, bands lying hidden.
 *   THE DROWNED CHAPEL (zone): the landmark, belfry and gable standing in the flooded nave; a hexer's band, a nest.
 *   THE PEAT CUTS (zone): old diggings gone to water, the larder on the drying ground (the lair).
 *   And five nooks off the ways, two with a mini boss to find (shared/fenroamnooks.ts).
 *
 * Built from the job's seed alone on every screen (the map is never sent). The seed scatters the reeds, the trees
 * and the chapel's echoes only. (Grown half again each way on 2026-11-25, Kyle: "each zone can be even bigger.")
 */
import type { GameMap, Stretch } from './arena.js';
import { newKit } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import { THEMES } from './terrain.js';
import type { TerrPlan, TerrZone } from './territory.js';
import { lightFor } from './timeofday.js';
import { layFenBanks } from './fenmist.js';
import { FENROAM, fenRoamGround } from './fenroamground.js';
import { STAITHE, STAITHE_KEEPER, WAY_IN, layChapel, layCountry, layReeds, layStaithe, layTrack } from './fenroamland.js';
import { FEN_PACKS, layFenFoes } from './fenroamfoes.js';
import { FEN_GATHERS, layFenGather } from './fenroamgather.js';
import { NOOK_PACKS, layNooks } from './fenroamnooks.js';

export { FENROAM };
/** The map's name and its shelter's, as the banner and the keeper's panel show them. */
export const FEN_ROAM = 'THE FEN';
export const STAITHE_NAME = 'THE EEL STAITHE';

/** The zones and the scape, south to north. */
export const FEN_ZONES: TerrZone[] = [
  { name: 'THE BOG EDGE', kind: 'zone', x: 4.5, y: 123, w: 81, h: 27, stretch: 0 },
  { name: 'THE CAUSEWAYS', kind: 'zone', x: 4.5, y: 78.6, w: 81, h: 44.4, stretch: 0 },
  { name: STAITHE_NAME, kind: 'scape', x: 54, y: 78, w: 24, h: 14.1, stretch: 0 },
  { name: 'THE WIDE REEDS', kind: 'zone', x: 4.5, y: 51, w: 81, h: 27.6, stretch: 0 },
  { name: 'THE DROWNED CHAPEL', kind: 'zone', x: 4.5, y: 24, w: 81, h: 27, stretch: 0 },
  { name: 'THE PEAT CUTS', kind: 'zone', x: 4.5, y: 3, w: 81, h: 21, stretch: 0 },
];

export function fenRoamPlan(job: Job): TerrPlan {
  const k = newKit(new Rng(job.seed * 7933 + 61)), ground = fenRoamGround();
  Object.assign(k, { mw: FENROAM.w, mh: FENROAM.h });
  k.water = ground.water;
  layTrack(k), layFenFoes(k), layStaithe(k), layChapel(k), layFenGather(k), layNooks(k), layReeds(k), layCountry(k);
  k.blocks.push(...ground.boards);
  const s0: Stretch = { name: FEN_ROAM, keep: [], packs: [...FEN_PACKS, ...NOOK_PACKS] };
  const map: GameMap = {
    name: FEN_ROAM, w: FENROAM.w, h: FENROAM.h, wallFace: 3, rounds: k.rounds, blocks: k.blocks, braziers: k.braziers, torches: [],
    // (No way on yet: the exit is a speck out in the east mere, where nobody stands and no way out is drawn.)
    hero: { ...WAY_IN }, exit: { x: 87, y: 75, w: 0.5, h: 0.5 }, theme: { ...lightFor(THEMES.marsh, 'marsh', 'day'), floor: 'grass', back: 'trees' },
    mist: layFenBanks(job.seed), water: k.water, soil: k.soil, marks: k.marks, stretches: [s0], grim: k.grim,
    grounds: [{ look: 'mossy', x: 0, y: 135, w: 90, h: 15 }, { look: 'reedmoor', x: 0, y: 123, w: 90, h: 12 }, { look: 'drowned', x: 0, y: 78, w: 90, h: 45 }, { look: 'reedmoor', x: 0, y: 51, w: 90, h: 27 }, { look: 'drowned', x: 0, y: 24, w: 90, h: 27 }, { look: 'reedmoor', x: 0, y: 0, w: 90, h: 24 }],
    npcs: [{ ...STAITHE_KEEPER, name: 'KEEPER', talk: 'station:staithe', look: 'villager' }],
    stations: [{ name: STAITHE_NAME, ...STAITHE }], gathers: FEN_GATHERS.map((g) => ({ ...g })),
  };
  return { map, foes: k.foes, props: k.props, chests: k.chests, zones: FEN_ZONES.map((z) => ({ ...z })) };
}
