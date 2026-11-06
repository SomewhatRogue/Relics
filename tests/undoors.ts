/** Test helper: a street as it was before the doors rule (shared/doors.ts), for tests about going in and out of houses, not about which houses open. */
import type { Block } from '../src/shared/arena';
import { baseDoor, mergedOf } from '../src/shared/doors';

export function undoDoors(blocks: Block[]): void {
  for (const b of blocks) if (b.door) for (const [i, d] of mergedOf(b.door)) (blocks[i].door = d), delete blocks[i].shut;
  for (const b of blocks) if (b.door?.includes(':big')) (b.door = baseDoor(b.door)), (b.big = false);
}
