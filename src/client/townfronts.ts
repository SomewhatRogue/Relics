/**
 * The living world, L3 (docs/design/living-world.md): the lived-in look by the town's doors and between its houses,
 * as small cosmetic figures a frame, drawn in both views as ambient.ts's are (three/cards3d.ts, scene.ts). Paint
 * only: nothing here is in the room, so nothing blocks a step. Clutter on doorsteps, laundry lines between houses,
 * shop signs that swing, notices on the JOBS house. To be drawn (a builder's slice).
 */
import type { GameMap } from '../shared/arena';
import type { Beast } from './townbeasts';

export function frontFigs(_m: GameMap, _now: number): Beast[] {
  return [];
}
