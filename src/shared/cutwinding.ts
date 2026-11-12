/**
 * The Open Cut, over the top: THE WINDING HOUSE (docs/design/open-cut-arc.md). The headframe over the shaft and its
 * great drum, half burnt; a wooden gantry along the east side with a stair at its south end. Two at the drum, two
 * at the way in; and on the gantry above you archers with a shield at the stair's foot, coming down: kill them and
 * the gate behind opens (`WINDING_GUARDS`).
 *
 * Fixed by hand; the seed only places the clutter.
 */
import type { Ledge } from './arena.js';
import { block, mark, newKit, patch, round } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { RoomPlan } from './terrain.js';
import { areaPlan, body, pack } from './cutkit.js';

export const WINDING = { w: 22, h: 32, name: 'THE WINDING HOUSE' };
/** The pack on the gantry: the gate opens when it's dead (sim/stretches.ts `packs`). */
export const WINDING_GUARDS = 2;
export const WINDING_AT = { drum: { x: 16.4, y: 11 }, gantry: { x: 15.4, y: 16.4, w: 5.4, h: 6.2 }, stair: { x: 15.8, y: 22.6, w: 1.6, h: 1.4 }, door: { x: 6.4, y: 25 } };

export function windingPlan(job: Job): RoomPlan {
  const { w, h } = WINDING, A = WINDING_AT, k = newKit(new Rng(job.seed * 4421 + 73));
  patch(k, 'earth', 0, 0, w, h, false), patch(k, 'ash', 5, 4, 12, 9);
  // The headframe over the shaft, burnt; the drum on its frame; charred timbers fallen.
  block(k, 'headframe', 8, 5, 6, 3.2);
  round(k, 'stone', A.drum.x, A.drum.y, 1.1);
  mark(k, 'scorch', 5.4, 8.4, 11, 4.4), mark(k, 'fallenpost', 4.2, 14.2, 4.6, 0.6), mark(k, 'debris', 12, 13.6, 3.4, 2);
  for (const [x, y] of [[2.2, 6], [3.6, 18.4], [19.8, 4.6], [1.6, 28.6], [20.2, 29.4]] as [number, number][]) round(k, 'rock', x, y, 0.42 + k.rng.range(0, 0.2));
  body(k, 9.6, 19.6, 'villager');
  k.braziers.push({ x: 4, y: 11.6, r: 0.3, wild: true }, { x: 11, y: 15.4, r: 0.28, wild: true }, { x: 19.6, y: 26.4, r: 0.3, wild: true });
  // The gantry: a wooden walk along the east side, its stair at the south end.
  const gantry: Ledge = { ...A.gantry, kind: 'wood', ramps: [{ ...A.stair }] };

  // 1. Two at the drum, 3. two at the way in.
  pack(k, 1, { x: A.drum.x - 2.4, y: A.drum.y + 0.6 }, ['hexer', 'fodder'], 0.9);
  pack(k, 3, A.door, ['lunger', 'fodder'], 1);
  // 2. On the gantry, archers; a shield at the stair's foot. The gate's kept by them.
  pack(k, WINDING_GUARDS, { x: A.gantry.x + A.gantry.w / 2, y: A.gantry.y + 2.2 }, ['archer', 'archer'], 1.1);
  pack(k, WINDING_GUARDS, { x: A.stair.x + 0.8, y: A.stair.y + 2.4 }, ['shield'], 0);
  return areaPlan(k, job, { name: WINDING.name, w, h, kind: 'village', torches: [4, w - 4] }, { ledges: [gantry] });
}
