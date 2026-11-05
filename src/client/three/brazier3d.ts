/**
 * A brazier in 2.5D, as the flat view's sprite has it (sprites.ts `brazier`): an iron bowl, its rim
 * catching the light and a bed of coals in it, here standing on three splayed legs on a foot ring.
 * Its flames sit in the bowl and its light is the room's (lamps3d.ts: a camp's always, the town's by
 * the hour). Built into the map's one merged mesh.
 */
import type { GameMap } from '../../shared/arena';
import type { Boxes } from './boxes';
import type { Lamp3 } from './lamps3d';

/** The sprite's colours: the iron, the bowl, its rim, the coals. */
const IRON = 0x2a2630, BOWL = 0x3a3640, RIM = 0x57525e, COAL = 0x7a2a10, HOT = 0xc84a1a;
/** How high the bowl's lip stands (tiles). */
export const BRAZIER_TOP = 0.66;

export function addBrazier(B: Boxes, b: GameMap['braziers'][number], lamps: Lamp3[]): void {
  const x = b.x, z = b.y, s = Math.max(0.85, Math.min(1.1, b.r / 0.38));
  // Three legs splayed out from under the bowl to a ring on the ground.
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3, dx = Math.cos(a), dz = Math.sin(a);
    // Leaning in: its foot out on the ring, its top under the bowl.
    B.c(x + dx * 0.17 * s, 0.22, z + dz * 0.17 * s, 0.05, 0.48, 0.05, IRON, Math.atan2(dx, dz), -0.32, 0);
    B.b(x + dx * 0.25 * s, 0, z + dz * 0.25 * s, 0.09, 0.03, 0.09, IRON);
  }
  // The bowl, flaring out course by course (each an octagon of two turned boxes), then its rim.
  for (const [w, y, h] of [[0.26, 0.4, 0.07], [0.4, 0.46, 0.08], [0.52, 0.53, 0.09]] as const) for (const t of [0, Math.PI / 4]) B.b(x, y, z, w * s, h, w * s, BOWL, t);
  for (const t of [0, Math.PI / 4]) B.b(x, BRAZIER_TOP - 0.05, z, 0.58 * s, 0.05, 0.58 * s, RIM, t);
  // The coals in it, a few glowing hotter.
  B.b(x, BRAZIER_TOP - 0.06, z, 0.44 * s, 0.04, 0.44 * s, COAL, Math.PI / 8);
  for (const [dx, dz] of [[-0.1, 0.06], [0.08, -0.05], [0.04, 0.12]]) B.b(x + dx * s, BRAZIER_TOP - 0.03, z + dz * s, 0.08, 0.03, 0.08, HOT, dx * 9);
  const top = BRAZIER_TOP - 0.03;
  lamps.push({ x, y: z, always: b.wild, fires: [[x - 0.09, top, z, 0.95], [x + 0.1, top, z + 0.05, 0.85]], light: { x, y: 1.4, z, r: 6, i: 0.95, c: [1, 0.6, 0.3], f: 11 } });
}
