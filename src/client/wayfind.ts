/**
 * On a job, where the gold arrow at your feet points (the scene's `pointTo`, the wood's own arrow), and
 * the words over you the moment the way on opens. In a house: to the cage, then out of the door once
 * someone's freed. Outside, once the way is open: to it. Before that: to the nearest cage out here, back
 * to where you came in with anyone freed out here, or to a house where someone freed is waiting. Close
 * by, no arrow (you can see it). The same on a friend's screen: it reads the room and the leader's count.
 */
import type { Area } from '../shared/arena';
import { wayDir } from '../sim/goal';
import type { ArenaRoom } from '../sim/room';
import type { Game } from './game';
import { waysOut } from './wayout';

type P = { x: number; y: number };
const mid = (a: Area): P => ({ x: a.x + a.w / 2, y: a.y + a.h / 2 });
const NEAR = 3.5;

function nearest(me: P, list: P[]): P | null {
  let best: P | null = null, bd = Infinity;
  for (const p of list) {
    const d = Math.hypot(p.x - me.x, p.y - me.y);
    if (d < bd) (bd = d), (best = p);
  }
  return best;
}

export function wayTarget(game: Game): P | null {
  const room = game.room, me = game.hero;
  if (game.mode !== 'run' || !game.run || !me) return null;
  const t = target(room, me, game.houses());
  return t && Math.hypot(t.x - me.x, t.y - me.y) > NEAR ? t : null;
}

function target(room: ArenaRoom, me: P, houses: { x: number; y: number; waiting: number }[]): P | null {
  const cages = room.props.filter((p) => p.kind === 'cage' && !p.broken);
  const freed = room.survivors.some((s) => !s.dead && s.home < 0);
  if (room.indoors) return nearest(me, cages) ?? (freed && room.map.exit ? mid(room.map.exit) : null);
  if (room.exitOpen) return nearest(me, waysOut(room.map).map(mid));
  return nearest(me, cages) ?? (freed ? room.map.hero : nearest(me, houses.filter((h) => h.waiting)));
}

/** Watches the way out: returns the words to show the moment it opens (once per room), else null. */
export class WayWatch {
  private room: ArenaRoom | null = null;
  private open = true;

  check(game: Game): string | null {
    const room = game.room, was = this.room === room ? this.open : true;
    this.room = room;
    this.open = room.exitOpen;
    if (game.mode !== 'run' || !game.run || room.indoors || was || !room.exitOpen) return null;
    if (room.map.roads) return 'PICK A ROAD';
    const last = game.run.index === game.run.job.rooms - 1;
    return `${last ? 'WAY HOME' : 'WAY ON'}: ${wayDir(room.map).toUpperCase()}`;
  }
}
