/**
 * Out in the land (a roam job, docs/design/outside-the-gate.md): when to offer the way back in, and the zone
 * the hero stands in. Back is offered within IN tiles of where you came in, once you have been more than OUT
 * tiles from it, and asked again only after you have walked off and come back. On into the next land the same, at
 * the map's far end (shared/landlinks.ts ONWARD).
 */
import { territoryPlan } from '../shared/territory';
import { ONWARD } from '../shared/landlinks';
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

/** Where the gate is on a roam job's map: the plan's way in (a job started at a shelter moves the room's `map.hero`
 *  there, sim/landroom.ts, but the way back in is still the gate). Kept a job, as the zones are. */
const GATES = new Map<string, P>();
export function gateOf(job: Job, index: number): P {
  const key = `${job.id}:${index}`;
  let g = GATES.get(key);
  if (!g) (GATES.size > 4 && GATES.clear()), GATES.set(key, (g = { ...territoryPlan({ ...job, at: undefined }, index).map.hero }));
  return g;
}

export class GateWalk {
  private far = false;
  private farOn = false;
  private run: unknown = null;

  /** 'in' the moment the way back in should be offered, 'on' the way on into the next land; else null. */
  check(game: Game): 'in' | 'on' | null {
    if (game.mode !== 'run' || !game.run?.job.roam || !game.hero) return ((this.far = this.farOn = false), (this.run = null), null);
    // (A new run, or the same run moved onto the next land: crossLand changes its job.)
    const key = game.run.job.id;
    if (this.run !== key) (this.run = key), (this.far = this.farOn = false);
    const w = watchBack(this.far, game.hero, gateOf(game.run.job, game.run.index));
    this.far = w.far;
    const on = game.run.job.land ? ONWARD[game.run.job.land] : undefined;
    if (on) {
      const v = watchBack(this.farOn, game.hero, on.from);
      this.farOn = v.far;
      if (v.ask) return 'on';
    }
    return w.ask ? 'in' : null;
  }
}
