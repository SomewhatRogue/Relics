/**
 * Tollan's Farm, map 2: THE YARD (docs/design/territories.md, "2. Tollan's Farm"; heights by docs/design/elevation.md,
 * "Raised areas"). 96 by 104, in at the bottom off the paddocks and out through the barn's doors, always by day.
 * Laid by hand round a fixed spine, as THE RISE is:
 *
 *   THE HOME CLOSE (scape): the rickyard, the hay cart, the troughs and the duck pond under the yard's wall, bows on
 *   its lip; THE YARD (zone): the levelled terrace behind that wall, up a flight where the cart road climbs or the
 *   steps at the east corner: the farmhouse with its door open, the cart shed, the well, the midden, the house's
 *   goods being carried across to the barn; the barn's great doors, shut till the yard's are dead. The way out is
 *   in at those doors: the barn's inside is the next map (tollanbarn.ts). The yard gate at the top stands open, as it was left.
 *
 * The ground: tollanyardland.ts. Each place: tollanyardclose.ts, tollanyardhouse.ts, tollanyardbarn.ts. The goblins:
 * tollanyardpacks.ts. The seed shuffles details only (stooks, trees, the road's small bends, who has the sack);
 * never the hero, exit, gate, zones, terrace, flights or the spots below.
 */
import type { GameMap } from './arena.js';
import { newKit } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import { THEMES } from './terrain.js';
import { layRoad } from './terrkit.js';
import type { TerrPlan, TerrZone } from './territory.js';
import { lightFor } from './timeofday.js';
import { layBarn, PORCH } from './tollanyardbarn.js';
import { layClose } from './tollanyardclose.js';
import { DOG_YARD, KITCHEN, layYard, WELL } from './tollanyardhouse.js';
import { DOORS, layLand, YARD } from './tollanyardland.js';
import { layPacks } from './tollanyardpacks.js';

/** Where later slices put things: the barn's doors, the farmhouse door, the dog's place by the wall, the well. */
export const YARD_SPOTS = {
  doors: { x: DOORS.x + DOORS.w / 2, y: DOORS.y + DOORS.h / 2 }, kitchen: { ...KITCHEN }, dogYard: { ...DOG_YARD }, well: { ...WELL },
};

/** The zones and scapes, in the order you come to them. */
export const YARD_ZONES: TerrZone[] = [
  { name: 'THE HOME CLOSE', kind: 'scape', x: 6, y: 60, w: 84, h: 40, stretch: 0 },
  { name: 'THE YARD', kind: 'zone', x: 2, y: 25, w: 92, h: 35, stretch: 0 },
];

export function yardPlan(job: Job): TerrPlan {
  const k = newKit(new Rng(job.seed * 7963 + 211));
  Object.assign(k, { mw: YARD.w, mh: YARD.h });
  const land = layLand(k);
  // The fixed set pieces first, then the goblins, then what the seed scatters round them.
  layBarn(k), layYard(k), layPacks(k, land), layClose(k);
  layRoad(k, land.road, 1.1), layRoad(k, land.track, 0.8);
  const map: GameMap = {
    name: "TOLLAN'S FARM", w: YARD.w, h: YARD.h, wallFace: 3, rounds: k.rounds, blocks: k.blocks, braziers: k.braziers, torches: [],
    hero: { x: 48, y: 101 }, exit: { ...PORCH }, theme: lightFor(THEMES.field, 'field', 'day'),
    water: k.water, soil: k.soil, marks: k.marks, ledges: land.ledges, stretches: land.stretches,
    // The yard is raised: whatever is set down there stands on the terrace.
    settle: true,
    // The dog, ahead on the quiet way up: by the paddock gate, the foot of the corner steps, its place by the yard
    // wall, and home at the farmhouse door.
    dog: { posts: [[44.4, 91.6], [87, 63.6], [DOG_YARD.x, DOG_YARD.y], [KITCHEN.x - 1.8, KITCHEN.y + 1.2]] },
  };
  return { map, foes: k.foes, props: k.props, chests: k.chests, zones: YARD_ZONES.map((z) => ({ ...z })) };
}
