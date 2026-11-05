/** A bare field for the newer goblins' tests: one hero, these goblins awake, nothing else. */
import { ARENA, type Block, type GameMap } from '../src/shared/arena';
import type { Foe } from '../src/shared/terrain';
import { TICK, type PropKind } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import type { FightEvent } from '../src/sim/types';

export const FIELD = (blocks: Block[] = []): GameMap => ({ ...ARENA, name: 'FIELD', w: 30, h: 24, rounds: [], blocks, hero: { x: 15, y: 20 }, exit: null, ledges: undefined });

/** A room on the bare field with these goblins (awake unless they say), and heroes at the given spots. */
export function field(foes: Foe[], heroes: [string, number, number][] = [['me', 15, 14]], blocks: Block[] = [], furniture: { kind: PropKind; x: number; y: number }[] = []) {
  const room = new ArenaRoom(5, { map: FIELD(blocks), foes: foes.map((f) => ({ awake: true, ...f })), furniture });
  const hs = heroes.map(([id, x, y]) => Object.assign(room.join(id), { x, y, fx: 0, fy: -1, safeT: 0 }));
  return { room, h: hs[0], hs };
}

/** Step the room `s` seconds (or until `until`), returning every event. */
export function run(room: ArenaRoom, s: number, until?: () => boolean): FightEvent[] {
  const ev: FightEvent[] = [];
  for (let i = 0; i < Math.round(s / TICK) && !until?.(); i++) room.step(), ev.push(...room.events);
  return ev;
}
