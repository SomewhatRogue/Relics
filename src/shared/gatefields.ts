/**
 * The North Fields (docs/design/outside-the-gate.md, "The land's first map"; docs/design/biome-sets.md; the file keeps
 * its working name, gatefields): the first map of the land you walk into from Wickhold's North Gate. 84 by 144 (Kyle, 2026-11-25: "each zone can be even bigger"), in at the bottom, out at the top, always
 * by day, one road the whole way, bent by the seed, and NO gates: the pace is distance and which foes hold each stretch.
 *
 *   THE GATE ROAD (scape): where the town's refugees camp, asleep under their carts. No goblins.
 *   THE COMMON STRIPS (zone): unploughed, thin barley coming up in patches; goblins with farm tools at the far end.
 *   THE FIELD BARN (scape): the way station, a palisade ring, a fire, safe ground (map.stations).
 *   THE ROUGH PASTURE (zone): wolves in the open, two fodder at a dead beast, a pond, and the den of pouncers.
 *   THE WOOD'S EDGE (zone): the seam into the wood, a spider nest on one side of the road, snarers on the other.
 *   THE CHARCOAL HUT (scape): the second shelter, east of the road at the wood's edge: a hut, a fire, a woodpile, the burners' clamp.
 *
 * Five nooks off the paths, two with a mini boss (gatefieldsnooks.ts).
 * The east bank between y 51 and 75 is open (a view is drawn there later) and closed to walking by a river.
 * Laid by gatefieldsland.ts (the ground) and gatefieldsfoes.ts (the packs). The seed shuffles cover and bends the road only.
 */
import type { GameMap, Stretch } from './arena.js';
import { newKit } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import { THEMES } from './terrain.js';
import type { TerrPlan, TerrZone } from './territory.js';
import { lightFor } from './timeofday.js';
import { BARN, GATE_FIELDS, HUT, layBarn, layFarmland, layGate, layPasture, layRoadAndEdges, layWood } from './gatefieldsland.js';
import { GATE_PACKS, layFoes } from './gatefieldsfoes.js';
import { CAMP_FOLK, CAMP_POSTS, layCamp } from './gatefieldscamp.js';
import { GATHERS, layGather } from './gatefieldsgather.js';
import { HUT_KEEPER, KEEPER, layDetail } from './gatefieldsdetail.js';
import { layStrips } from './gatefieldsstrips.js';
import { NOOK_PACKS, layNooks } from './gatefieldsnooks.js';

export { GATE_FIELDS };
/** The zones and scapes, south to north. */
export const GATE_ZONES: TerrZone[] = [
  { name: 'THE GATE ROAD', kind: 'scape', x: 3, y: 117, w: 78, h: 27, stretch: 0 },
  { name: 'THE COMMON STRIPS', kind: 'zone', x: 3, y: 87, w: 78, h: 30, stretch: 0 },
  { name: 'THE FIELD BARN', kind: 'scape', x: 48, y: 75, w: 24, h: 12, stretch: 0 },
  { name: 'THE ROUGH PASTURE', kind: 'zone', x: 3, y: 42, w: 78, h: 33, stretch: 0 },
  { name: 'THE CHARCOAL HUT', kind: 'scape', x: 37.5, y: 27.75, w: 24, h: 12, stretch: 0 },
  { name: "THE WOOD'S EDGE", kind: 'zone', x: 3, y: 6, w: 78, h: 36, stretch: 0 },
];

export function gateFieldsPlan(job: Job): TerrPlan {
  const k = newKit(new Rng(job.seed * 7927 + 83));
  Object.assign(k, { mw: GATE_FIELDS.w, mh: GATE_FIELDS.h });
  const lines = layRoadAndEdges(k);
  layNooks(k), layFoes(k), layBarn(k), layFarmland(k), layCamp(k), layDetail(k), layStrips(k), layGather(k), layPasture(k), layWood(k), layGate(k, lines);
  const s0: Stretch = { name: 'THE NORTH FIELDS', keep: [], packs: [...GATE_PACKS, ...NOOK_PACKS] };
  const map: GameMap = {
    name: 'THE NORTH FIELDS', w: GATE_FIELDS.w, h: GATE_FIELDS.h, wallFace: 3, rounds: k.rounds, blocks: k.blocks, braziers: k.braziers, torches: [],
    hero: { x: 42, y: 141 }, exit: { x: 38.5, y: 0, w: 3, h: 0.9 }, theme: lightFor(THEMES.field, 'field', 'day'),
    water: k.water, soil: k.soil, marks: k.marks, grim: k.grim, stretches: [s0],
    grounds: [{ look: 'harvest', x: 0, y: 87, w: 84, h: 57 }, { look: 'fallow', x: 0, y: 42, w: 84, h: 45 }, { look: 'mossy', x: 0, y: 0, w: 84, h: 42 }],
    npcs: [{ ...KEEPER, name: 'KEEPER', talk: 'station:fieldbarn', look: 'villager' }, { ...HUT_KEEPER, name: 'KEEPER', talk: 'station:charcoalhut', look: 'villager' }, ...CAMP_FOLK.map((f) => ({ ...f, name: '', talk: '', mute: true })), ...CAMP_POSTS.map((p) => ({ x: p.x, y: p.y, name: '', talk: '', look: 'guard', mute: true }))],
    stations: [{ name: 'THE FIELD BARN', x: BARN.x, y: BARN.y, r: BARN.r }, { name: 'THE CHARCOAL HUT', x: HUT.x, y: HUT.y, r: HUT.r }], guards: CAMP_POSTS.map((p) => ({ ...p })), gathers: GATHERS.map((g) => ({ ...g })),
    trails: k.roads.map((l) => l.map((p) => ({ x: p.x, y: p.y }))),
  };
  return { map, foes: k.foes, props: k.props, chests: k.chests, zones: GATE_ZONES.map((z) => ({ ...z })) };
}
