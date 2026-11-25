/**
 * What the North Fields give to whoever looks (docs/design/materials.md "Gathered"; the lore keeper, 2026-11-25): the
 * burners' charcoal by the clamp, fatwood at old pine stumps, saltpetre in the pasture den (only once its pouncers are
 * dead), cold clay on the pond's lowest step, water mint and amber on the east river's bank, and splinters at the foot of
 * the one lightning-struck pine. Fixed spots, claimed so the scatter keeps off; the room rolls each chance (sim/landroom.ts).
 * Black peat and thunderstone belong to lands still to come. Pure.
 */
import type { GameMap } from './arena.js';
import { block, claim, round, type Kit } from './expedkit.js';
import { HUT } from './gatefieldsland.js';

/** The old pine stumps at the wood's edge, new ones apart from the clearing's, and the fatwood lying at each (the last
 *  two came with the bigger map, 2026-11-25). */
export const STUMPS = [{ x: 26.25, y: 30.75 }, { x: 69.75, y: 17.25 }, { x: 30.75, y: 13.5 }, { x: 8.6, y: 38.4 }, { x: 57.5, y: 8.2 }];
/** The struck pine's block (its feet at y + h) and the splinters at its foot. */
export const STRUCK = { x: 44.4, y: 12.6, w: 1.2, h: 1.0 };

export const GATHERS: NonNullable<GameMap['gathers']> = [
  { x: HUT.x + 2.4, y: HUT.y + 3.8, mat: 'charcoal', chance: 0.6 }, { x: HUT.x + 5, y: HUT.y + 1.9, mat: 'charcoal', chance: 0.6 },
  ...STUMPS.map((s) => ({ x: s.x + 0.9, y: s.y + 0.5, mat: 'fatwood' as const, chance: 0.5 })),
  // The white crust in the den, laid only once pack 406 is dead.
  { x: 7.1, y: 54, mat: 'saltpetre', after: 406 },
  { x: 14.2, y: 72.3, mat: 'clay', chance: 0.7 },
  { x: 80.2, y: 56.25, mat: 'mint', chance: 0.5 }, { x: 80.2, y: 67.5, mat: 'mint', chance: 0.5 }, { x: 80.2, y: 73.4, mat: 'mint', chance: 0.5 },
  { x: STRUCK.x + 0.6, y: STRUCK.y + STRUCK.h + 0.9, mat: 'struck', chance: 0.8 },
  { x: 80.8, y: 53.4, mat: 'amber', chance: 0.35 }, { x: 80.8, y: 61.5, mat: 'amber', chance: 0.35 }, { x: 80.8, y: 71.25, mat: 'amber', chance: 0.35 },
];

export function layGather(k: Kit): void {
  for (const s of STUMPS) round(k, 'stump', s.x, s.y, 0.4);
  block(k, 'struckpine', STRUCK.x, STRUCK.y, STRUCK.w, STRUCK.h);
  claim(k, STRUCK.x + STRUCK.w / 2, STRUCK.y + STRUCK.h + 1, 2.8);
  // (1.3: the kit looks for claims only in the cell a new thing would stand in, so a claim must reach as far as anything
  //  that could block the spot: a tree of r 0.8 against a hero's 0.45.)
  for (const g of GATHERS) claim(k, g.x, g.y, 1.3);
}
