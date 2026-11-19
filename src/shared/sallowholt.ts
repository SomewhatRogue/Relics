/**
 * Sallow Carr, map 2: THE WILLOW HOLT (docs/design/territories.md, "3. Sallow Carr"; heights by
 * docs/design/elevation.md, "Raised areas"). 96 by 100, in at the bottom up the drained cut from the second sluice,
 * out at the top edge along the main bank, by day but dark under the trees. Laid by hand round a fixed spine:
 *
 *   THE WILLOW HOLT (scape): a duckboard twisting through pollard willows standing in black water, deep off the
 *   boards; the hungry's camp on a hummock, spiders at the bend, a web pocket with a chest off to the east. The
 *   hurdle gate where the boards come out onto the towpath at the foot of the main bank. THE SLUICE HOUSE (zone): the
 *   main bank, a level up, stone-faced toward the holt, archers on its lip; the hut, the great sluice's frame, the
 *   den built against the hut's wall, the oil heaped to the eaves. Burn the den, then out west along the bank.
 *
 * The ground: sallowholtland.ts. Each place: sallowholtholt.ts, sallowholthouse.ts. The goblins: sallowholtpacks.ts.
 * The seed shuffles details only (the willows, the bank road's bends, who has the keg); never the hero, exit, gate,
 * zones, water, the bank and its flights, the den, the oil or the spots below.
 */
import type { GameMap } from './arena.js';
import { newKit } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import { layHolt, layWood, WEB_CHEST } from './sallowholtholt.js';
import { DEN, DOOR, HOARD, layBank } from './sallowholthouse.js';
import { GATE, HOLT, layLand, OUT } from './sallowholtland.js';
import { layPacks } from './sallowholtpacks.js';
import { THEMES } from './terrain.js';
import type { TerrPlan, TerrZone } from './territory.js';
import { lightFor } from './timeofday.js';

/** Where later slices put things: the den, the hoard, the hut's door, the web pocket's chest, the gate. */
export const HOLT_SPOTS = {
  den: { x: DEN.x + DEN.w / 2, y: DEN.y + DEN.h / 2 }, hoard: { ...HOARD }, hut: { ...DOOR }, webChest: { ...WEB_CHEST },
  gate: { x: GATE.x + GATE.w / 2, y: GATE.y + GATE.h / 2 },
};

/** The zones and scapes, in the order you come to them. */
export const HOLT_ZONES: TerrZone[] = [
  { name: 'THE WILLOW HOLT', kind: 'scape', x: 2, y: 38, w: 92, h: 62, stretch: 0 },
  { name: 'THE SLUICE HOUSE', kind: 'zone', x: 2, y: 0, w: 92, h: 38, stretch: 1 },
];

/** By day, but the carr's grey-green, and darker again under the willows' crowns. */
function theme(): GameMap['theme'] {
  const t = lightFor(THEMES.marsh, 'marsh', 'day');
  return { ...t, floor: 'grass', back: 'trees', ambient: t.ambient.map((v) => v * 0.8) as typeof t.ambient };
}

export function holtPlan(job: Job): TerrPlan {
  const k = newKit(new Rng(job.seed * 7841 + 433));
  Object.assign(k, { mw: HOLT.w, mh: HOLT.h });
  const land = layLand(k);
  // The fixed set pieces first, then the goblins and spiders, then the wood round them.
  layBank(k), layHolt(k), layPacks(k, land), layWood(k);
  const map: GameMap = {
    name: 'SALLOW CARR', w: HOLT.w, h: HOLT.h, wallFace: 3, rounds: k.rounds, blocks: k.blocks, braziers: k.braziers, torches: [],
    hero: { x: 48, y: 97 }, exit: { ...OUT }, theme: theme(),
    water: k.water, soil: k.soil, marks: k.marks, ledges: land.ledges, stretches: land.stretches,
    // The bank is raised: whatever is set down there stands on it.
    settle: true,
  };
  return { map, foes: k.foes, props: k.props, chests: k.chests, zones: HOLT_ZONES.map((z) => ({ ...z })) };
}
