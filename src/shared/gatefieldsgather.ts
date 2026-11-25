/**
 * What the North Fields give to whoever looks (docs/design/materials.md "Gathered"; the lore keeper, 2026-11-25): the
 * burners' charcoal by the clamp, fatwood at old pine stumps, saltpetre in the pasture den (only once its pouncers are
 * dead), cold clay on the pond's lowest step, water mint and amber on the east river's bank, and splinters at the foot of
 * the one lightning-struck pine. Fixed spots, claimed so the scatter keeps off; the room rolls each chance (sim/landroom.ts).
 * Black peat and thunderstone belong to lands still to come. Pure.
 */
import type { GameMap } from './arena.js';
import { block, claim, round, type Kit } from './expedkit.js';

/** The old pine stumps at the wood's edge, new ones apart from the clearing's, and the fatwood lying at each. */
export const STUMPS = [{ x: 17.5, y: 20.5 }, { x: 46.5, y: 11.5 }, { x: 20.5, y: 9 }];
/** The struck pine's block (its feet at y + h) and the splinters at its foot. */
export const STRUCK = { x: 32.4, y: 8.4, w: 1.2, h: 1.0 };

export const GATHERS: NonNullable<GameMap['gathers']> = [
  { x: 35.4, y: 26.3, mat: 'charcoal', chance: 0.6 }, { x: 38, y: 24.4, mat: 'charcoal', chance: 0.6 },
  ...STUMPS.map((s) => ({ x: s.x + 0.9, y: s.y + 0.5, mat: 'fatwood' as const, chance: 0.5 })),
  // The white crust in the den, laid only once pack 406 is dead.
  { x: 6.7, y: 36, mat: 'saltpetre', after: 406 },
  { x: 9.6, y: 49.5, mat: 'clay', chance: 0.7 },
  { x: 52.2, y: 37.5, mat: 'mint', chance: 0.5 }, { x: 52.2, y: 45, mat: 'mint', chance: 0.5 },
  { x: STRUCK.x + 0.6, y: STRUCK.y + STRUCK.h + 0.9, mat: 'struck', chance: 0.8 },
  { x: 52.8, y: 41, mat: 'amber', chance: 0.35 }, { x: 52.8, y: 47.5, mat: 'amber', chance: 0.35 },
];

export function layGather(k: Kit): void {
  for (const s of STUMPS) round(k, 'stump', s.x, s.y, 0.4);
  block(k, 'struckpine', STRUCK.x, STRUCK.y, STRUCK.w, STRUCK.h);
  claim(k, STRUCK.x + STRUCK.w / 2, STRUCK.y + STRUCK.h + 1, 2.8);
  for (const g of GATHERS) claim(k, g.x, g.y, 0.8);
}
