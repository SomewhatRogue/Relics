/**
 * What counts in a room right now, and where: the things the goal is about (sim/goal.ts), each with
 * a gold mark over it on screen (client/questmarks.ts). One list, so a mark never points at something
 * that doesn't count, and the goal's numbers are the marks you can see.
 *
 * - Every room: the cages out here (someone to free), and each house door with someone caged or
 *   freed inside (`houses`, the game's count by door). Anyone freed out here: the way you came in,
 *   where they're brought out (indoors, the door).
 * - A middle room: the spiders' nests (the room is cleared when they're gone too).
 * - The last room, by the job: the larder's racks, the dens, or the named butcher.
 *
 * Chests and plain goblins are never marked. Pure: the same on the leader's screen and a friend's.
 */
import type { GameMap } from '../shared/arena';
import { isDead } from './damage';
import type { ArenaRoom } from './room';
import type { Run } from './run';
import type { Enemy } from './types';

export type TargetKind = 'cage' | 'door' | 'out' | 'nest' | 'larder' | 'den' | 'boss';
/** `id`: a goblin or nest's id (it moves, so it's drawn where it's drawn). */
export interface Target { kind: TargetKind; x: number; y: number; id?: number }
/** A house's door and who's caged or freed behind it (sim/goal.ts houseCaptives). */
export interface HouseAt { x: number; y: number; caged: number; waiting: number }

const isFinal = (run: Run) => run.index === run.job.rooms - 1;

/** The larder's racks still standing. */
export const racksLeft = (room: ArenaRoom) => room.props.filter((p) => p.kind === 'larder' && !p.broken);
/** The dens not yet burned down. */
export const densLeft = (map: GameMap) => map.blocks.filter((b) => b.kind === 'den' && !b.ruined);
/** The job's named butcher (hunts, the story, a deep dive), dead or alive, if it's in this room. */
export const bossOf = (room: ArenaRoom): Enemy | undefined => room.enemies.find((e) => e.name);

/** Everything the room's goal wants done, where it is (tiles). Empty off a job. */
export function targets(run: Run | null, room: ArenaRoom, houses: HouseAt[] = []): Target[] {
  if (!run) return [];
  const out: Target[] = [];
  for (const p of room.props) if (p.kind === 'cage' && !p.broken) out.push({ kind: 'cage', x: p.x, y: p.y });
  const freed = room.survivors.some((s) => !s.dead && s.home < 0);
  if (room.indoors) {
    // In a house: the cages, then out of the door with whoever's freed.
    const ex = room.map.exit;
    if (freed && ex) out.push({ kind: 'out', x: ex.x + ex.w / 2, y: ex.y + ex.h / 2 });
    return out;
  }
  for (const h of houses) if (h.caged || h.waiting) out.push({ kind: 'door', x: h.x, y: h.y });
  if (freed) out.push({ kind: 'out', x: room.map.hero.x, y: room.map.hero.y });
  if (!isFinal(run)) {
    for (const e of room.enemies) if (e.kind === 'nest' && !isDead(e)) out.push({ kind: 'nest', x: e.x, y: e.y, id: e.id });
    return out;
  }
  const o = run.job.objective;
  if (o === 'larder') for (const p of racksLeft(room)) out.push({ kind: 'larder', x: p.x, y: p.y });
  if (o === 'burn') for (const b of densLeft(room.map)) out.push({ kind: 'den', x: b.x + b.w / 2, y: b.y + b.h / 2 });
  const boss = bossOf(room);
  if ((o === 'hunt' || o === 'story') && boss && !isDead(boss)) out.push({ kind: 'boss', x: boss.x, y: boss.y, id: boss.id });
  return out;
}
