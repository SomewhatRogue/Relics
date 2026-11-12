/**
 * An instance's fork (docs/design/open-cut-arc.md): at the end of a map, two ways on (`map.roads`, `vote`), each
 * leading to its own next map. The party votes by standing on them: once its last stretch is clear and every hero
 * who's up stands on one way or the other, the way with more of them on it is the way (`run.way`); a tie decides
 * nothing (somebody moves). Alone, your way is the way. Then the next map is that way's (sim/instanceroom.ts), and the
 * party walks out by it (client/game.ts). Run state, so a friend's screen and a handed-on job have it.
 */
import { inArea, type GameMap } from '../shared/arena';
import { players } from './party';
import type { ArenaRoom } from './room';
import type { Run } from './run';
import { keepers, lastStretch, stretchOf } from './stretches';
import type { FightEvent } from './types';

/** The map's voting ways, if it ends at a fork. */
export const forkOf = (map: GameMap) => (map.roads?.some((r) => r.vote) ? map.roads : undefined);

/** Who stands on each way (heroes who are up). */
export function votes(room: ArenaRoom): { on: number[]; up: number } {
  const roads = forkOf(room.map) ?? [], ps = players(room.heroes).filter((h) => h.act !== 'down' && !h.out);
  return { on: roads.map((r) => ps.filter((h) => inArea(r.area, h.x, h.y)).length), up: ps.length };
}

/** Is the vote on: the fork reached and its stretch clear. */
export function voting(run: Run, room: ArenaRoom): boolean {
  if (!forkOf(room.map) || run.way !== undefined) return false;
  const st = stretchOf(run, room.map);
  return !st || (lastStretch(run, room.map) && !keepers(st, room).length);
}

/** Once a tick, on the room's leader (sim/run.ts tally). */
export function stepFork(run: Run, room: ArenaRoom, ev: FightEvent[]): void {
  if (!voting(run, room)) return;
  const { on, up } = votes(room), all = on.reduce((a, b) => a + b, 0), top = Math.max(...on);
  if (!up || all < up || on.filter((n) => n === top).length > 1) return;
  run.way = on.indexOf(top);
  const a = room.map.roads![run.way].area;
  ev.push({ k: 'wayopen', x: a.x + a.w / 2, y: a.y + a.h / 2, way: run.way });
}
