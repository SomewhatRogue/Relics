/**
 * Ports: where a room is come into and left by (docs/terrain-nodes.md 3.4). A port is a side of the
 * room (N, E, S, W) and a place along it, in tiles (x along the top and bottom, y down the sides).
 * Leaving by E means the next room is come into by W, and so on. The way out is a 0.9-deep strip at
 * the edge, 2 wide; the way in puts the party 2 tiles inside it. Pure geometry, shared by the route,
 * the room's frame, the rules that judge leaving, and both views that draw the gap.
 */
import type { Area } from './arena.js';
import type { Pt } from './spine.js';

export type Side = 'N' | 'E' | 'S' | 'W';
export interface Port { side: Side; at: number }

export const OPP: Record<Side, Side> = { N: 'S', S: 'N', E: 'W', W: 'E' };
/** The way into the room from each side (a unit step). */
export const INWARD: Record<Side, Pt> = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };
export const SIDE_WORD: Record<Side, 'north' | 'east' | 'south' | 'west'> = { N: 'north', E: 'east', S: 'south', W: 'west' };

/** The ordinary room, and the wider, shorter one for a leg that runs left to right (Kyle: yes). */
export const TALL = { w: 28, h: 24 };
export const WIDE = { w: 34, h: 20 };
const across = (s: Side) => s === 'E' || s === 'W';
/** A room's size: wide when it's come into and left by the sides, straight across. */
export const sizeFor = (inSide: Side, outs: Side[]) => (across(inSide) && outs.length > 0 && outs.every((o) => across(o) && o !== inSide) ? WIDE : TALL);

/** The point on the edge where a port is. */
export function edgePt(p: Port, w: number, h: number): Pt {
  return p.side === 'N' ? [p.at, 0] : p.side === 'S' ? [p.at, h] : p.side === 'W' ? [0, p.at] : [w, p.at];
}

/** `d` tiles into the room from a port. */
export function innerPt(p: Port, w: number, h: number, d: number): Pt {
  const [x, y] = edgePt(p, w, h), [dx, dy] = INWARD[p.side];
  return [x + dx * d, y + dy * d];
}

/** The strip at the edge you walk into to go through (2 wide, 0.9 deep). */
export function wayArea(p: Port, w: number, h: number, wide = 2): Area {
  if (p.side === 'N') return { x: p.at - wide / 2, y: 0, w: wide, h: 0.9 };
  if (p.side === 'S') return { x: p.at - wide / 2, y: h - 0.9, w: wide, h: 0.9 };
  if (p.side === 'W') return { x: 0, y: p.at - wide / 2, w: 0.9, h: wide };
  return { x: w - 0.9, y: p.at - wide / 2, w: 0.9, h: wide };
}

/** Where the party stands on coming in by a port. */
export function spawnAt(p: Port, w: number, h: number): { x: number; y: number } {
  const [x, y] = innerPt(p, w, h, 2);
  return { x, y };
}

/** Which side of the room an area at its edge is on (null if it's nowhere near one). */
export function sideOfArea(a: Area, w: number, h: number): Side | null {
  if (a.y < 1 && a.h < 1.5) return 'N';
  if (a.y + a.h > h - 1 && a.h < 1.5) return 'S';
  if (a.x < 1 && a.w < 1.5) return 'W';
  if (a.x + a.w > w - 1 && a.w < 1.5) return 'E';
  return null;
}

/** How long a side is (tiles), and the range along it a port may sit in (away from the corners). */
export const sideLen = (s: Side, w: number, h: number) => (s === 'N' || s === 'S' ? w : h);
export function portRange(s: Side, w: number, h: number): [number, number] {
  // Down the sides, clear of the back wall's face at the top and the kerb at the bottom.
  return s === 'N' || s === 'S' ? [Math.round(w * 0.22), Math.round(w * 0.78)] : [Math.max(5, Math.round(h * 0.3)), Math.round(h * 0.78)];
}
