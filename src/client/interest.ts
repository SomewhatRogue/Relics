/**
 * Prototype, for the big map's load test (scripts/bigmap/): what one friend's screen needs of the room.
 * Every hero always (names over heads, the party's health), the buildings always (few, and they burn),
 * and everything else only within `radius` tiles of that friend's hero; the same for the events. Each
 * friend then gets their own patch (snap.ts Encoder per friend), so a goblin far off costs them nothing.
 * Not wired into CoopHost yet: docs/DECISIONS.md has what that would take.
 */
import type { ArenaRoom } from '../sim/room';
import type { FightEvent } from '../sim/types';
import { stateOf } from './snap';

export const INTEREST = { radius: 20 };
type State = ReturnType<typeof stateOf>;
type Ent = Record<string, unknown>;
const ALWAYS = new Set(['heroes', 'blocks']);

const near = (e: Ent, x: number, y: number, r2: number) => {
  if (typeof e.x !== 'number' || typeof e.y !== 'number') return true;
  const dx = e.x - x, dy = e.y - y;
  return dx * dx + dy * dy <= r2;
};

/** The room as friend `id` needs it: theirs and the party's, and what's near them. */
export function stateFor(room: ArenaRoom, id: string, radius = INTEREST.radius): State {
  const all = stateOf(room), h = room.heroes.find((x) => x.id === id);
  if (!h) return all;
  const r2 = radius * radius, out = {} as Record<string, Ent[]>;
  for (const [c, list] of Object.entries(all)) out[c] = ALWAYS.has(c) ? list : (list ?? []).filter((e) => near(e, h.x, h.y, r2));
  return out as State;
}

/**
 * Quiet clocks: a goblin's `cooldown` is never drawn, so it isn't sent; its `actT` ticks every tick, so
 * it goes as `a0`, the room time its act began, which only changes when the act does (a friend works
 * actT out as t - a0). Measured, these two were half of every patch.
 */
export function quiet(s: State, t: number): State {
  const enemies = (s.enemies ?? []).map((e) => {
    const { cooldown: _c, actT, ...rest } = e as Ent & { actT: number; cooldown: number };
    return { ...rest, a0: Math.round((t - actT) * 30) / 30 };
  });
  return { ...s, enemies };
}

/** The events a friend would see or hear: near them (a wider ring, for sounds a little off screen). */
export function eventsFor(room: ArenaRoom, id: string, ev: FightEvent[], radius = INTEREST.radius): FightEvent[] {
  const h = room.heroes.find((x) => x.id === id);
  if (!h) return ev;
  const r2 = radius * radius * 1.5;
  return ev.filter((e) => near(e as unknown as Ent, h.x, h.y, r2));
}
