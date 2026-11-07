/**
 * The statue in Lantern Square in the 2.5D view: the plinth's boxes are built with the map's round things
 * (rounds3d.ts, from ../statuepieces.ts), and on cards (figs3d.ts) the hero in stone stands on its cap and
 * the plate with their name stands at its front face, each drawn by the flat view's own code
 * (../statuedraw.ts), so both views show the same figure and the same name. Only draws.
 */
import type { GameMap } from '../../shared/arena';
import { drawPlate, drawStatueTop } from '../statuedraw';
import { PLATE, PLINTH_TOP } from '../statuepieces';
import { PX } from '../world';
import type { Figs } from './figs3d';

export function putStatue(f: Figs, map: GameMap): void {
  for (const r of map.rounds) if (r.kind === 'plinth') {
    f.put('st-top', r.x, PLINTH_TOP, r.y, (c, px, py) => drawStatueTop(c, r.hero, px, py), { pool: 0 });
    // The plate's card stands at the face, its foot on the floor: the face's foot is the slab's height up it.
    if (r.hero) f.put('st-plate', r.x, 0, r.y + PLATE.z + 0.02, (c, px, py) => drawPlate(c.lit, r.hero!.name, px, Math.round(py - PLATE.y0 * PX)), { pool: 0 });
  }
}
