/**
 * An instance on one map, in stretches (docs/design/open-cut-map.md; `map.stretches`). The party is in one stretch
 * at a time (`run.stretch`). Its gate (a `gate` block, solid) opens when the stretch's named ones are dead and every
 * hero who's up stands at it (`at`): the gate waits for the whole party, so the party is in one place and only what's
 * near it wakes. Through it, the next stretch begins: the checkpoint moves there (`run.check`, where the fallen get up:
 * sim/checkpoint.ts) and the wipe count starts again. The stretches behind doze (sim/sleep.ts). Run and block state,
 * plain data, so a friend's screen and a handed-on job have it.
 */
import { inArea, type GameMap, type Stretch } from '../shared/arena';
import { isDead } from './damage';
import { players } from './party';
import type { ArenaRoom } from './room';
import type { Run } from './run';
import type { FightEvent, Hero } from './types';

/** The stretch the party's in, if the map has them. */
export const stretchOf = (run: Run, map: GameMap): Stretch | undefined => map.stretches?.[Math.min(run.stretch ?? 0, map.stretches.length - 1)];

/** Its named ones still standing. */
export const keepers = (s: Stretch, room: ArenaRoom) => room.allEnemies.filter((e) => e.name && s.keep.includes(e.name) && !isDead(e));

/** Is this the last stretch (no gate: its way out is the map's exit). */
export const lastStretch = (run: Run, map: GameMap) => !!map.stretches && (run.stretch ?? 0) >= map.stretches.length - 1;

/** The gate's open to go through once its named ones are dead; it opens for the whole party at it. */
export const gateReady = (run: Run, room: ArenaRoom) => {
  const s = stretchOf(run, room.map);
  return !!s && s.gate !== undefined && !keepers(s, room).length;
};

const up = (h: Hero) => h.act !== 'down' && !h.out;

/** Once a tick, on the room's leader (sim/run.ts tally). */
export function stepStretches(run: Run, room: ArenaRoom, ev: FightEvent[]): void {
  const s = stretchOf(run, room.map);
  if (!s || s.gate === undefined || !s.at || !gateReady(run, room)) return;
  const ps = players(room.heroes).filter(up);
  if (!ps.length || !ps.every((h) => inArea(s.at!, h.x, h.y))) return;
  const b = room.map.blocks[s.gate];
  if (b) b.ruined = true;
  run.stretch = (run.stretch ?? 0) + 1;
  run.downs = 0;
  run.wipeAt = undefined;
  if (s.check) run.check = { ...s.check };
  ev.push({ k: 'gateopen', x: s.at.x + s.at.w / 2, y: s.at.y + s.at.h / 2 });
}
