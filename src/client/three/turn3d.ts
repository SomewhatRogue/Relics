/**
 * A building whose way in isn't its front (the new town's barracks, counting house and infirmary in from the east
 * side, the keep, tower and old chapel from the west, the Rescue Row homes from the back: Kyle's playtest,
 * 2026-11-16) is built as if its door faced south, on its footprint turned a quarter (or half) round, then turned
 * to face the way you really go in: its door, its windows and its dressing on that side. The flat view's doors:
 * ../doorside.ts. Not the parked street look's kit (`?street`), which has its own fronts.
 */
import type { Block } from '../../shared/arena';
import { STREET } from './streetkit';

/** The kinds built with walls, a door and a roof (houses3d.ts). */
export const ROOFED = new Set<Block['kind']>(['house', 'barn', 'hall', 'church', 'forge', 'tavern', 'granary', 'tower', 'shack', 'den']);
/** By the block's face: how far round (radians, about the up axis) its south front is turned. `W`: you push west
 *  into a door on the east side. */
const TURN: Record<string, number> = { W: Math.PI / 2, E: -Math.PI / 2, S: Math.PI };

/** How far round this block is turned (0: its door on the front). */
export const turnOf = (b: Block) => (STREET || !b.door || !ROOFED.has(b.kind) ? 0 : TURN[b.face ?? ''] ?? 0);

/** The block as it's built before it's turned: the same middle, its sides swapped for a quarter turn, door south. */
export function asFront(b: Block): Block {
  const a = turnOf(b);
  if (!a) return b;
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, q = Math.abs(Math.abs(a) - Math.PI / 2) < 0.01;
  const w = q ? b.h : b.w, h = q ? b.w : b.h;
  return { ...b, face: undefined, x: cx - w / 2, y: cy - h / 2, w, h };
}

/** A point (x, height, y in tiles) on the block as built (`asFront`), where it stands once turned. */
export function turned(b: Block, [x, y, z]: [number, number, number]): [number, number, number] {
  const a = turnOf(b);
  if (!a) return [x, y, z];
  const cx = b.x + b.w / 2, cz = b.y + b.h / 2, dx = x - cx, dz = z - cz, c = Math.cos(a), s = Math.sin(a);
  return [cx + dx * c + dz * s, y, cz - dx * s + dz * c];
}
