/**
 * What the Fen gives to whoever looks (docs/design/the-fen.md; docs/design/materials.md, FIERCE FROST's BLACK PEAT
 * "in the fen, the Peat Cuts"): black peat on the drying ground once the larder's band is dead, and at a far cut at a
 * low chance; cold clay at the bog edge's pool, the staithe's bank and the two far islands' edges; water mint at the reed beds' edges
 * and their pools'. Fixed
 * spots, claimed so the scatter keeps off; the room rolls each chance (sim/matdrops.ts). Pure.
 */
import type { GameMap } from './arena.js';
import { claim, type Kit } from './expedkit.js';
import { LARDER_PACK } from './fenroamfoes.js';

export const FEN_GATHERS: NonNullable<GameMap['gathers']> = [
  { x: 38.1, y: 15.9, mat: 'peat', after: LARDER_PACK }, { x: 75.3, y: 16.5, mat: 'peat', chance: 0.15 },
  { x: 13.5, y: 135.3, mat: 'clay', chance: 0.6 }, { x: 55.8, y: 90.6, mat: 'clay', chance: 0.6 },
  { x: 27.4, y: 88.8, mat: 'clay', chance: 0.6 }, { x: 78.4, y: 107.6, mat: 'clay', chance: 0.6 },
  { x: 6.6, y: 54, mat: 'mint', chance: 0.5 }, { x: 83.1, y: 75.9, mat: 'mint', chance: 0.5 },
  { x: 22, y: 62.2, mat: 'mint', chance: 0.5 }, { x: 73.2, y: 72.6, mat: 'mint', chance: 0.5 },
];

export function layFenGather(k: Kit): void {
  for (const g of FEN_GATHERS) claim(k, g.x, g.y, 0.8);
}
