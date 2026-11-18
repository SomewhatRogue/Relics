/**
 * Lowfurrow Fields, map 1: THE FIELDS (docs/design/territories.md, "1. Lowfurrow Fields"; heights by
 * docs/design/elevation.md, "The rethink"). 96 by 112, in at the bottom from the Wickhold road and out at
 * the top over the drain, always by day:
 *
 *   the green lane and its stile; THE HEADLAND (zone), the gleaners' camp an hour or two after they were
 *   taken; the field gate; THE LONG STRIPS (scape), rye and rides up the first lynchet, the pond in the
 *   willows, the scarecrow, the fallen hovel, the trodden road the nine were walked up; THE STOOKS (zone),
 *   the cut strip being loaded, the half-built rick and the one caged by it; the drain and its bridge (the
 *   second gate); THE FAR BANK (scape), a little climb and the way on to the next map.
 *
 * Laid by hand: the ground (shared/lowfurrowfieldsland.ts), then each zone's scene (lowfurrowfieldsfoot.ts,
 * lowfurrowfieldsstrips.ts, lowfurrowfieldsstooks.ts). The seed shuffles details only: which goblin holds the
 * bow, loose hay, the trees behind the hedges, the rye's clumps, the road's small bends. It never moves the
 * hero, the exit, the gates, the zones, the ledges, the water, the cage, the carts or FIELDS_SPOTS.
 */
import type { GameMap } from './arena.js';
import { newKit, prop, type Line } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import { THEMES } from './terrain.js';
import type { TerrPlan, TerrZone } from './territory.js';
import { lightFor } from './timeofday.js';
import { FIELDS, layGround, layWays } from './lowfurrowfieldsland.js';
import { GIVER, headland } from './lowfurrowfieldsfoot.js';
import { HIDING, RYE_GROUND, strips } from './lowfurrowfieldsstrips.js';
import { CAGE, stooks } from './lowfurrowfieldsstooks.js';
import { fieldsMinis } from './lowfurrowminis.js';
import { giverNpc } from './terrkit.js';

/** The zones and scapes, in the order you come to them. */
export const FIELDS_ZONES: TerrZone[] = [
  { name: 'THE HEADLAND', kind: 'zone', x: 12, y: 80, w: 72, h: 24, stretch: 0 },
  { name: 'THE LONG STRIPS', kind: 'scape', x: 8, y: 40, w: 80, h: 38, stretch: 1 },
  { name: 'THE STOOKS', kind: 'zone', x: 12, y: 12, w: 72, h: 28, stretch: 1 },
  { name: 'THE FAR BANK', kind: 'scape', x: 8, y: 0, w: 80, h: 8, stretch: 2 },
];
/** Where the mini quests stand (docs/design/territories.md, "Mini quests"): the woman under the near cart, the rye her sister's beaters wake in, the willows she hides in, the cage. */
export const FIELDS_SPOTS = { giver: { ...GIVER }, ryeGround: { ...RYE_GROUND }, hiding: { ...HIDING }, cage: { ...CAGE } };

/** THE FIELDS' plan, and the road as laid (for the tests: nothing solid on it). */
export interface FieldsPlan extends TerrPlan { road: Line }

export function fieldsPlan(job: Job): FieldsPlan {
  const k = newKit(new Rng(job.seed * 7933 + 101));
  Object.assign(k, { mw: FIELDS.w, mh: FIELDS.h });
  const land = layGround(k);
  prop(k, 'cage', CAGE.x, CAGE.y);
  headland(k, land), stooks(k, land), strips(k, land);
  layWays(k, land.road);
  const minis = fieldsMinis(land.lv, FIELDS_SPOTS);
  const map: GameMap = {
    name: 'LOWFURROW FIELDS', w: FIELDS.w, h: FIELDS.h, wallFace: 3, rounds: k.rounds, blocks: k.blocks, braziers: [], torches: [],
    hero: { x: 48, y: 109 }, exit: { x: 46.5, y: 0, w: 3, h: 0.9 }, theme: lightFor(THEMES.field, 'field', 'day'),
    water: k.water, soil: k.soil, marks: k.marks, ledges: land.ledges, stretches: land.stretches,
    // Most of the land is raised: anything set down on it (the freed, a hero up at a gate) stands on it.
    settle: true,
    minis, npcs: minis.map(giverNpc),
  };
  return { map, foes: k.foes, props: k.props, chests: k.chests, zones: FIELDS_ZONES.map((z) => ({ ...z })), road: land.road };
}
