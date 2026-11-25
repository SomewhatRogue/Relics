/**
 * The North Fields (docs/design/outside-the-gate.md, "The land's first map"; docs/design/biome-sets.md; the file keeps
 * its working name, gatefields): the first map of the land you walk into from Wickhold's North Gate. 56 by 96, in at the bottom, out at the top, always
 * by day, one road the whole way, bent by the seed, and NO gates: the pace is distance and which foes hold each stretch.
 *
 *   THE GATE ROAD (scape): where the town's refugees camp, asleep under their carts. No goblins.
 *   THE COMMON STRIPS (zone): unploughed, thin barley coming up in patches; goblins with farm tools at the far end.
 *   THE FIELD BARN (scape): the way station, a palisade ring, a fire, safe ground (map.stations).
 *   THE ROUGH PASTURE (zone): wolves in the open, two fodder at a dead beast, a pond, and the den of pouncers.
 *   THE WOOD'S EDGE (zone): the seam into the wood, a spider nest on one side of the road, snarers on the other.
 *
 * The east bank between y 34 and 50 is open (a view is drawn there later) and closed to walking by a river.
 * Laid by gatefieldsland.ts (the ground) and gatefieldsfoes.ts (the packs). The seed shuffles cover and bends the road only.
 */
import type { GameMap, Stretch } from './arena.js';
import { newKit } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import { THEMES } from './terrain.js';
import type { TerrPlan, TerrZone } from './territory.js';
import { lightFor } from './timeofday.js';
import { BARN, GATE_FIELDS, layBarn, layFarmland, layGate, layPasture, layRoadAndEdges, layWood } from './gatefieldsland.js';
import { GATE_PACKS, layFoes } from './gatefieldsfoes.js';
import { CAMP_FOLK, CAMP_POSTS, layCamp } from './gatefieldscamp.js';
import { KEEPER, layDetail } from './gatefieldsdetail.js';

export { GATE_FIELDS };
/** The zones and scapes, south to north. */
export const GATE_ZONES: TerrZone[] = [
  { name: 'THE GATE ROAD', kind: 'scape', x: 3, y: 78, w: 50, h: 18, stretch: 0 },
  { name: 'THE COMMON STRIPS', kind: 'zone', x: 3, y: 58, w: 50, h: 20, stretch: 0 },
  { name: 'THE FIELD BARN', kind: 'scape', x: 32, y: 50, w: 16, h: 8, stretch: 0 },
  { name: 'THE ROUGH PASTURE', kind: 'zone', x: 3, y: 28, w: 50, h: 22, stretch: 0 },
  { name: "THE WOOD'S EDGE", kind: 'zone', x: 3, y: 4, w: 50, h: 24, stretch: 0 },
];

export function gateFieldsPlan(job: Job): TerrPlan {
  const k = newKit(new Rng(job.seed * 7927 + 83));
  Object.assign(k, { mw: GATE_FIELDS.w, mh: GATE_FIELDS.h });
  const line = layRoadAndEdges(k);
  layFoes(k), layBarn(k), layFarmland(k), layCamp(k), layDetail(k), layPasture(k), layWood(k), layGate(k, line);
  const s0: Stretch = { name: 'THE NORTH FIELDS', keep: [], packs: [...GATE_PACKS] };
  const map: GameMap = {
    name: 'THE NORTH FIELDS', w: GATE_FIELDS.w, h: GATE_FIELDS.h, wallFace: 3, rounds: k.rounds, blocks: k.blocks, braziers: k.braziers, torches: [],
    hero: { x: 28, y: 93 }, exit: { x: 26.5, y: 0, w: 3, h: 0.9 }, theme: lightFor(THEMES.field, 'field', 'day'),
    water: k.water, soil: k.soil, marks: k.marks, stretches: [s0],
    grounds: [{ look: 'harvest', x: 0, y: 58, w: 56, h: 38 }, { look: 'fallow', x: 0, y: 28, w: 56, h: 30 }, { look: 'mossy', x: 0, y: 0, w: 56, h: 28 }],
    npcs: [{ ...KEEPER, name: 'KEEPER', talk: 'station:fieldbarn', look: 'villager' }, ...CAMP_FOLK.map((f) => ({ ...f, name: '', talk: '', mute: true })), ...CAMP_POSTS.map((p) => ({ x: p.x, y: p.y, name: '', talk: '', look: 'guard', mute: true }))],
    stations: [{ name: 'THE FIELD BARN', x: BARN.x, y: BARN.y, r: BARN.r }], guards: CAMP_POSTS.map((p) => ({ ...p })),
  };
  return { map, foes: k.foes, props: k.props, chests: k.chests, zones: GATE_ZONES.map((z) => ({ ...z })) };
}
