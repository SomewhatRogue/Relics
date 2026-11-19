/**
 * Sallow Carr, map 1: THE OSIER BEDS (docs/design/territories.md, "3. Sallow Carr"). 96 by 112, in at the bottom at
 * the drove's end and out at the top up the last cut, by day under the willows, all on level ground: its height is
 * water. Laid by hand round a fixed spine, as THE HOME GROUND is:
 *
 *   the drove's end on its raised track; THE OSIER BEDS (zone): the stools in rows between the ditches, the withy
 *   stack, the half-woven pen, the first den on the bank; the first sluice, wound (a hold); THE DROWNED DROVE
 *   (scape): the drained bottom, the causeway half under with its log and boards, the Lowfurrow sickles on a dead
 *   willow; THE HOLM (zone): the second den, the cookpot, the racks, the cage; the second sluice; the last cut.
 *
 * The ground: sallowbedsland.ts. Each place: sallowbedsbeds.ts, sallowbedsdrove.ts, sallowbedsholm.ts. The goblins:
 * sallowbedspacks.ts. The seed shuffles details only (stools within their rows, the road's small bends, who holds
 * the bow and the net); never the hero, exit, gates, zones, water, dens, oil, cage or the spots below.
 */
import type { GameMap, Stretch } from './arena.js';
import { claim, newKit, path, type Kit, type P } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import { DEN1, layBedRows, layBeds } from './sallowbedsbeds.js';
import { layDrove, SICKLES } from './sallowbedsdrove.js';
import { CAGE, DEN2, layHolm } from './sallowbedsholm.js';
import { put, willows } from './sallowbedskit.js';
import { CARR, carrWater, SLUICE1, SLUICE2 } from './sallowbedsland.js';
import { BED_PACKS, HOLM_PACKS, layPacks } from './sallowbedspacks.js';
import { THEMES } from './terrain.js';
import { gateIn, road } from './terrkit.js';
import type { TerrPlan, TerrZone } from './territory.js';
import { lightFor } from './timeofday.js';

const mid = (a: { x: number; y: number }, w: number, h: number): P => ({ x: a.x + w / 2, y: a.y + h / 2 });
/** Where later slices put things: both dens' middles, both sluices, the cage, the tools on the willow. */
export const BEDS_SPOTS = {
  den1: mid(DEN1, 2.6, 1.6), den2: mid(DEN2, 2.6, 1.6), sluice1: mid(SLUICE1, SLUICE1.w, SLUICE1.h), sluice2: mid(SLUICE2, SLUICE2.w, SLUICE2.h),
  cage: { ...CAGE }, sickles: { ...SICKLES },
};

/** The zones and the scape, in the order you come to them (the last cut is nobody's). */
export const BEDS_ZONES: TerrZone[] = [
  { name: 'THE OSIER BEDS', kind: 'zone', x: 10, y: 66.5, w: 76, h: 32, stretch: 0 },
  { name: 'THE DROWNED DROVE', kind: 'scape', x: 10, y: 34, w: 76, h: 28.5, stretch: 1 },
  { name: 'THE HOLM', kind: 'zone', x: 10, y: 9, w: 76, h: 25, stretch: 1 },
];

/** The drove's line through the beds and up the drained bottom, along the causeway, and over the holm to the top. */
function roads(k: Kit): void {
  const beds = road(k, [{ x: 48, y: 111 }, { x: 48, y: 99 }, { x: 48, y: 90 }, { x: 48, y: 80 }, { x: 48, y: 67.6 }, { x: 48, y: 61 }, { x: 47.4, y: 50.4 }], [0, 0.6, 0.5, 0.4, 0, 0.3]);
  road(k, [{ x: 47.4, y: 50.4 }, { x: 47.2, y: 45.4 }, { x: 44, y: 43.2 }, { x: 40.4, y: 41 }, { x: 40.2, y: 33.8 }], [0, 0, 0, 0]);
  const holm = road(k, [{ x: 40.2, y: 33.8 }, { x: 44.4, y: 27 }, { x: 47.6, y: 19 }, { x: 48, y: 12 }, { x: 48, y: 1 }], [0.8, 0.6, 0, 0]);
  path(k, 'earth', beds, 1), path(k, 'earth', holm, 0.9);
}

/** The carr off the way: alder hummocks nobody stands on, the pollards everywhere in the black water. */
function carr(k: Kit): void {
  for (const [x, y] of [[10, 104], [84, 100], [20, 46], [76, 52], [12, 22], [86, 30], [70, 4]] as const) {
    put(k, 'tree', x, y - 0.4, 0.8, 0, 0), put(k, 'bush', x + 1.6, y + 0.6, 0.42, 0, 0), put(k, 'bush', x - 1.5, y + 0.5, 0.38, 0, 0);
  }
  willows(k, 1, 1, CARR.w - 1, CARR.h - 1);
}

export function bedsPlan(job: Job): TerrPlan {
  const k = newKit(new Rng(job.seed * 4057 + 211));
  Object.assign(k, { mw: CARR.w, mh: CARR.h, water: carrWater() });
  roads(k);
  // Kept clear: the way in and out, each sluice's gathering ground and its checkpoint beyond.
  for (const [x, y, r] of [[48, 108.4, 2.6], [48, 1.8, 2], [48, 67, 1.8], [48, 61.7, 2], [48, 10.2, 1.8], [48, 4.9, 1.6]]) claim(k, x, y, r);
  const s0: Stretch = { ...gateIn(k, SLUICE1, 'THE OSIER BEDS', BED_PACKS), haul: 5 };
  const s1: Stretch = { ...gateIn(k, SLUICE2, 'THE HOLM', HOLM_PACKS), haul: 5 };
  // The fixed set pieces first, then the goblins, then what the seed lays round them.
  layBeds(k), layDrove(k), layHolm(k), layPacks(k), layBedRows(k), carr(k);
  const dens = k.blocks.flatMap((b, i) => (b.kind === 'den' ? [i] : []));
  s0.dens = [dens[0]], s1.dens = [dens[1]];
  const map: GameMap = {
    name: 'SALLOW CARR', w: CARR.w, h: CARR.h, wallFace: 3, rounds: k.rounds, blocks: k.blocks, braziers: k.braziers, torches: [],
    hero: { x: 48, y: 109 }, exit: { x: 46.5, y: 0, w: 3, h: 0.9 }, theme: { ...lightFor(THEMES.marsh, 'marsh', 'day'), floor: 'grass', back: 'trees' },
    water: k.water, soil: k.soil, marks: k.marks, ledges: [], stretches: [s0, s1, { name: 'THE LAST CUT', keep: [], packs: [] }],
  };
  return { map, foes: k.foes, props: k.props, chests: k.chests, zones: BEDS_ZONES.map((z) => ({ ...z })) };
}
