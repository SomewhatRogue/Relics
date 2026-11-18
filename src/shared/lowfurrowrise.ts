/**
 * Lowfurrow Fields, map 2: THE RISE (docs/design/territories.md, "1. Lowfurrow Fields", "Map 2, THE RISE"; heights
 * by docs/design/elevation.md). 96 by 104, in at the bottom off the drain's far bank and out at the top over the
 * stile, always by day. Laid by hand round a fixed spine, as Hangman's Wood and Fenmere are:
 *
 *   the drain's far bank; THE BARN ROAD (scape): the foot of the hill, the hollow lane climbing in one long bend
 *   between earth banks, the orchard gone wild on the west shoulder, the great barn in its yard on the east; the
 *   fold gate across the top; THE FOLD YARD (zone): the sheepfold used as a pen with one caged in it, the sorting
 *   pens, the dewpond, the shepherd's hut; THE BROW (scape): up the last slope to the stile.
 *
 * The ground: lowfurrowriseland.ts. Each place: lowfurrowriselane.ts, lowfurrowriseorchard.ts, lowfurrowrisebarn.ts,
 * lowfurrowrisefold.ts. The goblins: lowfurrowrisepacks.ts. The seed shuffles details only (trees within their
 * groves, the road's small bends, who holds a bow); never the hero, exit, gate, zones, ledges, water, cage, barn,
 * carts or the spots below.
 */
import type { GameMap } from './arena.js';
import { newKit, prop } from './expedkit.js';
import type { Job } from './jobs.js';
import { BARN_GROUND, CARTS, layBarn } from './lowfurrowrisebarn.js';
import { CAGE, layFold } from './lowfurrowrisefold.js';
import { layLand, RISE } from './lowfurrowriseland.js';
import { layLane } from './lowfurrowriselane.js';
import { GIVER, GIVER_TREE, layOrchard } from './lowfurrowriseorchard.js';
import { layPacks } from './lowfurrowrisepacks.js';
import { Rng } from './rng.js';
import { THEMES } from './terrain.js';
import { riseMinis } from './lowfurrowminis.js';
import { giverNpc, layRoad } from './terrkit.js';
import type { TerrPlan, TerrZone } from './territory.js';
import { lightFor } from './timeofday.js';

/** Where later slices put things: the man up the orchard's tree, the yard by the barn's carts, the fold's cage. */
export const RISE_SPOTS = { giver: { ...GIVER }, barnGround: { ...BARN_GROUND }, cage: { ...CAGE } };

/** The zones and scapes, in the order you come to them. */
export const RISE_ZONES: TerrZone[] = [
  { name: 'THE BARN ROAD', kind: 'scape', x: 8, y: 56, w: 80, h: 44, stretch: 0 },
  { name: 'THE FOLD YARD', kind: 'zone', x: 12, y: 16, w: 72, h: 38, stretch: 1 },
  { name: 'THE BROW', kind: 'scape', x: 8, y: 0, w: 80, h: 16, stretch: 1 },
];

export function risePlan(job: Job): TerrPlan {
  const k = newKit(new Rng(job.seed * 7951 + 101));
  Object.assign(k, { mw: RISE.w, mh: RISE.h });
  const land = layLand(k);
  // The fixed set pieces first, then the goblins, then what the seed scatters round them.
  prop(k, 'cage', CAGE.x, CAGE.y);
  layBarn(k), layFold(k, land.road), layPacks(k, land), layOrchard(k), layLane(k, land);
  layRoad(k, land.road, 1.1);
  // The chest the rope job pays in: just south of the middle cart, in the yard.
  const minis = riseMinis(land.lv, RISE_SPOTS, GIVER_TREE, { x: CARTS[1].x + CARTS[1].w / 2, y: CARTS[1].y + CARTS[1].h + 1.1 });
  const map: GameMap = {
    name: 'LOWFURROW FIELDS', w: RISE.w, h: RISE.h, wallFace: 3, rounds: k.rounds, blocks: k.blocks, braziers: k.braziers, torches: [],
    hero: { x: 48, y: 101 }, exit: { x: 50.5, y: 0, w: 3, h: 0.9 }, theme: lightFor(THEMES.field, 'field', 'day'),
    water: k.water, soil: k.soil, marks: k.marks, ledges: land.ledges, stretches: land.stretches,
    // Most of the land is raised: anything set down on it (the cage, someone freed, a hero up at the gate) stands on it.
    settle: true,
    minis, npcs: minis.map(giverNpc),
  };
  return { map, foes: k.foes, props: k.props, chests: k.chests, zones: RISE_ZONES.map((z) => ({ ...z })) };
}
