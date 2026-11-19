/**
 * An instance on one map, in stretches (docs/design/open-cut-map.md; `map.stretches`). The party is in one stretch
 * at a time (`run.stretch`). Its gate (a `gate` block, solid) opens when the stretch's named ones are dead and every
 * hero who's up stands at it (`at`): the gate waits for the whole party, so the party is in one place and only what's
 * near it wakes. Through it, the next stretch begins: the checkpoint moves there (`run.check`, where the fallen get up:
 * sim/checkpoint.ts) and the wipe count starts again. The stretches behind doze (sim/sleep.ts). Run and block state,
 * plain data, so a friend's screen and a handed-on job have it.
 */
import { unsolved } from './tubs';
import { inArea, type GameMap, type Stretch } from '../shared/arena';
import { isDead } from './damage';
import { players } from './party';
import type { ArenaRoom } from './room';
import type { Run } from './run';
import type { FightEvent, Hero } from './types';

/** The stretch the party's in, if the map has them. */
export const stretchOf = (run: Run, map: GameMap): Stretch | undefined => map.stretches?.[Math.min(run.stretch ?? 0, map.stretches.length - 1)];

/** Its named ones still standing, or its guard packs' goblins. */
export const keepers = (s: Stretch, room: ArenaRoom) =>
  room.allEnemies.filter((e) => !isDead(e) && ((e.name && s.keep.includes(e.name)) || (!!s.packs && e.pack !== undefined && s.packs.includes(e.pack))));

/** Its dens still standing (`Stretch.dens`: the Territories chat's Sallow Carr). */
export const densOf = (s: Stretch, map: GameMap) => (s.dens ?? []).map((i) => map.blocks[i]).filter((b) => b && !b.ruined);

/** Is this the last stretch (no gate: its way out is the map's exit). */
export const lastStretch = (run: Run, map: GameMap) => !!map.stretches && (run.stretch ?? 0) >= map.stretches.length - 1;

/** The gate's open to go through once its named ones are dead; it opens for the whole party at it. */
export const gateReady = (run: Run, room: ArenaRoom) => {
  const s = stretchOf(run, room.map);
  return !!s && s.gate !== undefined && !keepers(s, room).length && !unsolved(room.map, room.props, s.puzzle) && !densOf(s, room.map).length;
};

const up = (h: Hero) => h.act !== 'down' && !h.out;

/** A hauled gate: how much quicker two or more are than one, and how fast it swings back when let go. */
export const HAUL = { many: 2.5, back: 2 };

/** When each hauled gate was last stepped, by the room's clock (the leader's own bookkeeping, not state). */
const hauled = new WeakMap<object, number>();

/** Once a frame, on the room's leader (sim/run.ts tally). */
export function stepStretches(run: Run, room: ArenaRoom, ev: FightEvent[]): void {
  const s = stretchOf(run, room.map);
  if (!s || s.gate === undefined || !s.at || !gateReady(run, room)) return;
  const ps = players(room.heroes).filter(up), b = room.map.blocks[s.gate];
  // (This runs once a frame, not once a tick, so a haul goes by the room's own clock since it was last here.)
  const dt = s.haul && b ? Math.min(0.25, Math.max(0, room.time - (hauled.get(b) ?? room.time))) : 0;
  if (s.haul && b) hauled.set(b, room.time);
  if (!ps.length || !ps.every((h) => inArea(s.at!, h.x, h.y))) {
    // (A hauled gate let go of swings back.)
    if (s.haul && b?.open) b.open = Math.max(0, b.open - (dt / s.haul) * HAUL.back);
    return;
  }
  // Two-leaf doors (the Territories chat, 2026-11-18): hauled open over `haul` seconds by one, quicker by more.
  if (s.haul && b && (b.open ?? 0) < 1) {
    b.open = Math.min(1, (b.open ?? 0) + (dt / s.haul) * (ps.length > 1 ? HAUL.many : 1));
    if (b.open < 1) return;
  }
  if (b) b.ruined = true;
  run.stretch = (run.stretch ?? 0) + 1;
  run.downs = 0;
  run.wipeAt = undefined;
  if (s.check) run.check = { ...s.check };
  ev.push({ k: 'gateopen', x: s.at.x + s.at.w / 2, y: s.at.y + s.at.h / 2 });
}
