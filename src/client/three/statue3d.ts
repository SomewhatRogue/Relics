/**
 * The statue in Lantern Square in the 2.5D view: the plinth's boxes are built with the map's round things
 * (rounds3d.ts, from ../statuepieces.ts), and on cards (figs3d.ts) the hero in stone stands on its cap and
 * the plate with their name stands at its front face, each drawn by the flat view's own code
 * (../statuedraw.ts), so both views show the same figure and the same name. Only draws.
 */
import type { GameMap } from '../../shared/arena';
import { STATUE_TALL, drawPlate, drawStatueTop } from '../statuedraw';
import { PLATE, PLINTH_TOP } from '../statuepieces';
import { PX } from '../world';
import { CELL, type Figs } from './figs3d';

/** Where the statue's upper card takes over (pixels above its feet): the most one card holds, less a little. */
const UPPER = CELL.fy - 8;

export function putStatue(f: Figs, map: GameMap): void {
  for (const r of map.rounds) if (r.kind === 'plinth') {
    // A card holds CELL.fy pixels above its foot: a figure taller than that would stand on two, its lower part on
    // the cap and a second card raised UPPER pixels (each drawing only its own rows). At a hero's size one does.
    f.put('st-top', r.x, PLINTH_TOP, r.y, (c, px, py) => drawStatueTop(c, r.hero, px, py, 0, UPPER), { pool: 0 });
    if (r.hero && STATUE_TALL > UPPER) f.put('st-top2', r.x, PLINTH_TOP + UPPER / PX, r.y, (c, px, py) => drawStatueTop(c, r.hero, px, py + UPPER, UPPER), { pool: 0 });
    // The plate's card stands at the face, its foot on the floor: the face's foot is the slab's height up it.
    if (r.hero) f.put('st-plate', r.x, 0, r.y + PLATE.z + 0.02, (c, px, py) => drawPlate(c.lit, r.hero!.name, px, Math.round(py - PLATE.y0 * PX)), { pool: 0 });
  }
}
