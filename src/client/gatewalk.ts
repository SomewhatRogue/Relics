/**
 * Out in the land (a roam job, docs/design/outside-the-gate.md): when to offer the way back in, and the zone
 * the hero stands in. Back is offered within IN tiles of where you came in, once you have been more than OUT
 * tiles from it, and asked again only after you have walked off and come back.
 */
import { territoryPlan } from '../shared/territory';
import type { Job } from '../shared/jobs';
import type { Game } from './game';

const IN = 2.2, OUT = 8;
type P = { x: number; y: number };

/** One step of the watch: `far` is whether you have been away; returns the new state and whether to ask now. */
export function watchBack(far: boolean, me: P, home: P): { far: boolean; ask: boolean } {
  const d = Math.hypot(me.x - home.x, me.y - home.y);
  if (d > OUT) return { far: true, ask: false };
  if (far && d < IN) return { far: false, ask: true };
  return { far, ask: false };
}

/** The name of the zone at this spot of a roam job's map, or null. (The zones kept a job and map: a plan is a deep copy each time it is asked for, and this is asked every frame.) */
const ZONES = new Map<string, { name: string; x: number; y: number; w: number; h: number }[]>();
export function zoneAt(job: Job, index: number, me: P): string | null {
  const key = `${job.id}:${index}`;
  let zs = ZONES.get(key);
  if (!zs) (ZONES.size > 4 && ZONES.clear()), ZONES.set(key, (zs = territoryPlan(job, index).zones));
  // (The smallest box that holds you: a station's ground lies inside a wider stretch.)
  const z = zs.filter((q) => me.x >= q.x && me.x < q.x + q.w && me.y >= q.y && me.y < q.y + q.h).sort((a, b) => a.w * a.h - b.w * b.h)[0];
  return z?.name ?? null;
}

export class GateWalk {
  private far = false;
  private run: unknown = null;

  /** True the moment the way back in should be offered. */
  check(game: Game): boolean {
    if (game.mode !== 'run' || !game.run?.job.roam || !game.hero) return ((this.far = false), (this.run = null), false);
    if (this.run !== game.run) (this.run = game.run), (this.far = false);
    const w = watchBack(this.far, game.hero, game.room.map.hero);
    this.far = w.far;
    return w.ask;
  }
}
