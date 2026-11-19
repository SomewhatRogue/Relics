/**
 * Tollan's Farm, map 1: THE HOME GROUND (docs/design/territories.md, "2. Tollan's Farm"). 96 by 108, in at the
 * bottom at the lane's end and out at the top up to the farmyard, always by day, all on level ground. Laid by hand
 * round a fixed spine, as THE RISE is:
 *
 *   the lane's end by the milk stand; THE HOME ORCHARD (zone): the apple rows inside their drystone walls, a tree
 *   being shaken bare, the hives kicked over, the sacks piled by the door; the door in the orchard's north wall;
 *   THE PADDOCKS (scape): hurdle lanes between small fields, the dewpond, the field shelter down a side lane with
 *   one of the nine roped there; the lane on up to the yard.
 *
 * The ground: tollanorchardland.ts. Each place: tollanorchardtrees.ts, tollanorchardpaddocks.ts. The goblins:
 * tollanorchardpacks.ts. The seed shuffles details only (trees within their rows, the road's small bends, who holds
 * the bow); never the hero, exit, gate, zones, water, cage or the spots below.
 */
import type { GameMap } from './arena.js';
import { newKit, prop } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import { THEMES } from './terrain.js';
import { layRoad } from './terrkit.js';
import type { TerrPlan, TerrZone } from './territory.js';
import { lightFor } from './timeofday.js';
import { DOG_WALL, HOME, layLand, MILK } from './tollanorchardland.js';
import { layPacks } from './tollanorchardpacks.js';
import { DOG_LANE, layPaddocks, SHELTER } from './tollanorchardpaddocks.js';
import { layOrchard, layRows } from './tollanorchardtrees.js';

/** Where later slices put things: the milk stand, the dog on the orchard wall and ahead in the lane, the cage. */
export const ORCHARD_SPOTS = { milkStand: { ...MILK }, dogWall: { ...DOG_WALL }, dogLane: { ...DOG_LANE }, shelter: { ...SHELTER } };

/** The zone and the scape, in the order you come to them. */
export const ORCHARD_ZONES: TerrZone[] = [
  { name: 'THE HOME ORCHARD', kind: 'zone', x: 6, y: 56, w: 84, h: 37, stretch: 0 },
  { name: 'THE PADDOCKS', kind: 'scape', x: 6, y: 2, w: 84, h: 53, stretch: 1 },
];

export function orchardPlan(job: Job): TerrPlan {
  const k = newKit(new Rng(job.seed * 6151 + 307));
  Object.assign(k, { mw: HOME.w, mh: HOME.h });
  const land = layLand(k);
  // The fixed set pieces first, then the goblins, then what the seed scatters round them.
  prop(k, 'cage', SHELTER.x, SHELTER.y);
  layOrchard(k), layPaddocks(k), layPacks(k), layRows(k);
  layRoad(k, land.road, 1.1);
  const map: GameMap = {
    name: "TOLLAN'S FARM", w: HOME.w, h: HOME.h, wallFace: 3, rounds: k.rounds, blocks: k.blocks, braziers: k.braziers, torches: [],
    hero: { x: 48, y: 105 }, exit: { x: 46.5, y: 0, w: 3, h: 0.9 }, theme: lightFor(THEMES.field, 'field', 'day'),
    water: k.water, soil: k.soil, marks: k.marks, ledges: [], stretches: land.stretches,
  };
  return { map, foes: k.foes, props: k.props, chests: k.chests, zones: ORCHARD_ZONES.map((z) => ({ ...z })) };
}
