/**
 * A side way's gap in a job's room (docs/terrain-nodes.md 3.4): a block at the edge with a door, so it
 * works as a house does (client/jobrooms.ts): walk into it (sideways, or down through the kerb) and
 * you're in the dead end beyond; walk back out and you're where you went in, the street alive meanwhile.
 * Its door names everything the room beyond is planned from (shared/sideroom.ts), so it's the same
 * room on every screen and for every friend who goes in.
 */
import type { Block, Theme } from './arena.js';
import type { PlaceKind } from './jobs.js';
import { SIDE_WORD, type Cache, type Country, type DeadEnd } from './nodeports.js';
import type { Side } from './ports.js';
import type { RoomSpec } from './route.js';

export interface SideDoor { node: DeadEnd; layout: string; cache: Cache; face: Side; country: Country; light: PlaceKind; floor: Theme['floor']; back: Theme['back'] }

export const sideDoor = (d: SideDoor) => ['side', d.node, d.layout, d.cache, d.face, d.country, d.light, d.floor, d.back].join(':');
export function readSide(door: string): SideDoor | null {
  const [k, node, layout, cache, face, country, light, floor, back] = door.split(':');
  return k === 'side' ? ({ node, layout, cache, face, country, light, floor, back } as SideDoor) : null;
}

/** The gap's block: thin, at the edge, 2 wide. */
export function sideBlock(spec: RoomSpec, w: number, h: number): Block | null {
  const sw = spec.side;
  if (!sw) return null;
  const { side, at } = sw.port, t = 0.3;
  const box = side === 'W' ? { x: 0, y: at - 1, w: t, h: 2 } : side === 'E' ? { x: w - t, y: at - 1, w: t, h: 2 } : { x: at - 1, y: h - t, w: 2, h: t };
  const door = sideDoor({ node: sw.node, layout: sw.layout, cache: sw.cache, face: side, country: spec.country ?? 'fields', light: spec.palette.light, floor: spec.palette.floor, back: spec.palette.back });
  return { kind: 'sideway', ...box, door, face: side, label: SIDE_WORD[sw.node] };
}
