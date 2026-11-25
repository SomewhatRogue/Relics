/**
 * What the Fen gives to whoever looks (docs/design/the-fen.md; docs/design/materials.md, FIERCE FROST's BLACK PEAT
 * "in the fen, the Peat Cuts"): black peat on the drying ground once the larder's band is dead, and at a far cut at a
 * low chance; cold clay at the bog edge's pool and the staithe's bank; water mint at the reed beds' edges. Fixed
 * spots, claimed so the scatter keeps off; the room rolls each chance (sim/matdrops.ts). Pure.
 */
import type { GameMap } from './arena.js';
import { claim, type Kit } from './expedkit.js';
import { LARDER_PACK } from './fenroamfoes.js';

export const FEN_GATHERS: NonNullable<GameMap['gathers']> = [
  { x: 25.4, y: 10.6, mat: 'peat', after: LARDER_PACK }, { x: 50.2, y: 11, mat: 'peat', chance: 0.15 },
  { x: 9, y: 90.2, mat: 'clay', chance: 0.6 }, { x: 37.2, y: 60.4, mat: 'clay', chance: 0.6 },
  { x: 4.4, y: 36, mat: 'mint', chance: 0.5 }, { x: 55.4, y: 50.6, mat: 'mint', chance: 0.5 },
];

export function layFenGather(k: Kit): void {
  for (const g of FEN_GATHERS) claim(k, g.x, g.y, 0.8);
}
