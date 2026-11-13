/**
 * The Last Lantern's dais in the middle of Lantern Square, as boxes (pieces.ts: both views build the same
 * list; docs/design/lantern-square.md). Two round stone steps (each a plus of boxes, an octagon from above),
 * a column on them, and the Lantern on top in an iron cage under a brass cap, high enough that its flame
 * shows over the statue standing in front. Gilt name plates cut into the lower step's front: the Roll of the
 * Brave. Paint only; the flame and its light are drawn where LANTERN_Y says.
 */
import type { Bx } from './pieces';

const STONE = 0x57525e, STEP = 0x4a4652, PALE = 0x6a6470, DARK = 0x3a3640, IRON = 0x2a2630, BRASS = 0x8a7038, GILT = 0xb8963e;

/** How high the flame stands (tiles), for its glow and its light. */
export const LANTERN_Y = 4.45;

/** A round step of radius `r` (tiles), `h` high, standing at `y`: a plus of two boxes and a square between, an octagon from above. */
const step = (r: number, y: number, h: number, col: number): Bx[] => [
  [0, y, 0, r * 2, h, r * 1.2, col], [0, y, 0, r * 1.2, h, r * 2, col], [0, y, 0, r * 1.7, h, r * 1.7, col],
];

export function daisBoxes(r: number): Bx[] {
  const out: Bx[] = [...step(r, 0, 0.24, STEP), ...step(r * 0.66, 0.24, 0.24, STONE)];
  // The Roll: gilt plates cut into the lower step's front, either side of where the plinth stands.
  for (const x of [-1.95, 1.95]) out.push([x * (r / 2.2), 0.05, r * 0.6 + 0.01, 0.3, 0.13, 0.03, GILT]);
  for (const x of [-1.45, 1.45]) out.push([x * (r / 2.2), 0.05, r * 0.85 + 0.01, 0.3, 0.13, 0.03, GILT]);
  // The column: a foot, the shaft with a band at a third, a capital.
  out.push([0, 0.48, 0, 0.95, 0.32, 0.95, PALE], [0, 0.8, 0, 0.62, 3.0, 0.62, STONE], [0, 1.8, 0, 0.7, 0.12, 0.7, DARK], [0, 3.8, 0, 0.95, 0.28, 0.95, PALE]);
  // The Lantern: an iron floor, four corner bars round the flame, a brass cap and a finial.
  out.push([0, 4.08, 0, 0.7, 0.1, 0.7, IRON]);
  for (const [x, z] of [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]]) out.push([x, 4.18, z, 0.07, 0.62, 0.07, IRON]);
  out.push([0, 4.8, 0, 0.82, 0.1, 0.82, BRASS], [0, 4.9, 0, 0.5, 0.12, 0.5, IRON], [0, 5.02, 0, 0.22, 0.32, 0.22, BRASS, 'cone']);
  return out;
}
