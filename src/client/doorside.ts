/**
 * Where a building's door shows in the flat view: on its front, or, for one you go into by its side (the new town's
 * barracks, counting house and infirmary from the east, the keep, tower and old chapel from the west: Kyle's
 * playtest, 2026-11-16), on that edge of the building at the doorstep, seen edge-on as a straight-on three-quarter
 * view sees a side wall. One you go into from the back (the Rescue Row homes facing north) shows none on its front: the
 * doorstep's arrow (doorsteps.ts) says where. The 2.5D view turns such a building to face its door
 * (three/turn3d.ts). blocks.ts paints the door, darkdress.ts its columns, shutdraw.ts boards it up, all from here.
 */
import type { Block } from '../shared/arena';
import { PX } from './world';

export type DoorSide = 'front' | 'back' | 'east' | 'west';

/** Which side a block's way in is on (`face` is the way you push to go in: west means a door on the east side). */
export const doorSide = (b: Block): DoorSide => (b.face === 'W' ? 'east' : b.face === 'E' ? 'west' : b.face === 'S' ? 'back' : 'front');

/** The door's left x and width on the block's front wall, `dw` wide; null when it isn't on the front. */
export function doorSlot(b: Block, w: number, dw: number): { x: number; w: number } | null {
  return doorSide(b) === 'front' ? { x: Math.round(w / 2 - dw / 2), w: dw } : null;
}

/**
 * A side door where it really is: on the building's east or west edge at the doorstep's y, seen edge-on as the
 * flat view sees a side wall (a frame, the door swung open, a lintel, a step). `x, y` is the footprint's top-left on
 * screen, `dh` the door's height. Swung open against the wall's line, so its planks face you. Nothing for a front
 * or back door.
 */
export function drawSideDoor(g: CanvasRenderingContext2D, b: Block, x: number, y: number, dh: number): void {
  const s = doorSide(b);
  if (s !== 'east' && s !== 'west') return;
  const rect = (rx: number, ry: number, rw: number, rh: number, col: string) => ((g.fillStyle = col), g.fillRect(Math.round(rx), Math.round(ry), rw, rh));
  const foot = y + (b.h / 2) * PX, e = s === 'east', sx = e ? x + b.w * PX : x;
  const out = (k: number, w: number) => (e ? sx + k : sx - k - w);
  // The doorway in the wall, edge-on: its frame and the dark within.
  rect(out(0, 3), foot - dh - 2, 3, dh + 2, '#3a2a1e');
  rect(out(0, 2), foot - dh, 2, dh, '#0d0b10');
  rect(out(-1, 5), foot - dh - 4, 5, 2, '#3a2a1e');
  // The door swung out flat against the wall's line, its planks to you: iron straps, a ring.
  if (!b.locked) {
    const lx = out(3, 9);
    rect(lx, foot - dh + 1, 9, dh - 1, '#4a3220');
    for (let i = 2; i < 9; i += 3) rect(lx + i, foot - dh + 2, 1, dh - 3, '#2a1e14');
    for (const k of [4, dh - 7]) rect(lx, foot - dh + k, 9, 1, '#6a6674');
    rect(e ? lx + 7 : lx + 1, foot - Math.round(dh / 2), 1, 2, '#b89a4a');
  }
  rect(out(0, 9), foot - 2, 9, 2, '#55505e');
  // Barred: planks nailed across the doorway.
  if (b.locked) for (const k of [0.35, 0.7]) rect(out(-1, 6), foot - dh * k, 6, 2, '#7a5a34');
}
