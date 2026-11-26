/**
 * What the High Wood gives to whoever looks (docs/design/the-high-wood.md, "Gathers"): THUNDERSTONE on the struck oaks'
 * ridge, one spot laid only once the ironhides' band is dead, two at a chance; more HIDE, SILK and FATWOOD than the
 * fields give, for the forge's higher pluses. Fixed spots, claimed so the scatter keeps off; the room rolls each chance
 * (sim/matdrops.ts). Pure.
 */
import type { GameMap } from './arena.js';
import { claim, type Kit } from './expedkit.js';
import { IRONHIDES_PACK } from './highwoodfoes.js';

export const WOOD_GATHERS: NonNullable<GameMap['gathers']> = [
  { x: 60.8, y: 84.4, mat: 'thunder', after: IRONHIDES_PACK }, { x: 44.5, y: 81.4, mat: 'thunder', chance: 0.5 }, { x: 36.4, y: 87, mat: 'thunder', chance: 0.4 },
  { x: 22.6, y: 120.6, mat: 'hide', chance: 0.5 }, { x: 84.6, y: 116, mat: 'hide', chance: 0.5 }, { x: 22.4, y: 104.4, mat: 'hide', chance: 0.5 },
  { x: 63.4, y: 67.4, mat: 'silk', chance: 0.5 }, { x: 33.2, y: 43.6, mat: 'silk', chance: 0.5 }, { x: 81, y: 45.5, mat: 'silk', chance: 0.5 },
  { x: 20.4, y: 74.2, mat: 'fatwood', chance: 0.6 }, { x: 74, y: 90, mat: 'fatwood', chance: 0.6 }, { x: 7.4, y: 66, mat: 'fatwood', chance: 0.6 }, { x: 88.4, y: 28.6, mat: 'fatwood', chance: 0.6 },
];

export function layWoodGather(k: Kit): void {
  for (const g of WOOD_GATHERS) claim(k, g.x, g.y, 0.8);
}
