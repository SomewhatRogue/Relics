/**
 * What one friend's screen needs of a big room (an expedition, the load test): every hero always (names
 * over heads, the party's health, the map screen's friends), and everything else only within `radius`
 * tiles of that friend's hero; the buildings too (by their place in the map's list, `b<i>`, since the
 * friend built the same map from its seed and only needs what changed near them); the same for the
 * events, but for those everyone hears (an expedition's horn, a friend down). Each friend has their own
 * Encoder (snap.ts), so a goblin far off costs them nothing, and one leaving their ring is dropped.
 *
 * Quiet clocks: a goblin's `cooldown` is never drawn, so it isn't sent; its `actT` ticks every tick, so
 * it goes as `a0`, the room time its act began, which only changes when the act does (the friend works
 * actT out as t - a0: `loud`). Measured, these two were half of every patch (DECISIONS 2026-11-03).
 */
import type { ArenaRoom } from '../sim/room';
import type { FightEvent } from '../sim/types';
import { stateOf } from './snap';

export const INTEREST = { radius: 20, blocks: 26, hear: 30 };
type State = ReturnType<typeof stateOf>;
type Ent = Record<string, unknown>;
/** Events every friend gets, wherever they happened. */
const EVERYONE = new Set(['exped', 'down', 'pickedup', 'gotup', 'raising', 'grudge', 'dread']);

const near = (e: Ent, x: number, y: number, r2: number) => {
  if (typeof e.x !== 'number' || typeof e.y !== 'number') return true;
  const dx = e.x - x, dy = e.y - y;
  return dx * dx + dy * dy <= r2;
};

/** A big room: one with far goblins dozing (a friend there gets only what's near them). */
export const isBig = (room: ArenaRoom) => room.sleepFar;

/** The room as friend `id` needs it: the party, and what's near them. */
export function stateFor(room: ArenaRoom, id: string, radius = INTEREST.radius): State {
  const all = stateOf(room), h = room.heroes.find((x) => x.id === id);
  if (!h) return all;
  const r2 = radius * radius, b2 = INTEREST.blocks * INTEREST.blocks, out = {} as Record<string, Ent[]>;
  for (const [c, list] of Object.entries(all)) {
    if (c === 'heroes') out[c] = list;
    else if (c === 'blocks') out[c] = list.flatMap((b, i) => (near({ x: (b.x as number) + (b.w as number) / 2, y: (b.y as number) + (b.h as number) / 2 }, h.x, h.y, b2) ? [{ ...b, id: 'b' + i }] : []));
    else out[c] = (list ?? []).filter((e) => near(e, h.x, h.y, r2));
  }
  return out as State;
}

/** Goblins' clocks as `a0` (see above). */
export function quiet(s: State, t: number): State {
  const enemies = (s.enemies ?? []).map((e) => {
    // (Where it was put, `home`, is the room's alone: a patrol moves it as it walks.)
    const { cooldown: _c, home: _h, actT, ...rest } = e as Ent & { actT: number; cooldown: number };
    return { ...rest, a0: Math.round((t - actT) * 30) / 30 };
  });
  return { ...s, enemies };
}

/** A friend's end: each goblin's actT back from its a0. */
export function loud(enemies: Ent[], t: number): void {
  for (const e of enemies) if (typeof e.a0 === 'number') e.actT = Math.max(0, t - e.a0);
}

/** The events a friend would see or hear: near them (a wider ring, for sounds a little off screen), and the ones everyone hears. */
export function eventsFor(room: ArenaRoom, id: string, ev: FightEvent[], radius = INTEREST.hear): FightEvent[] {
  const h = room.heroes.find((x) => x.id === id);
  if (!h) return ev;
  const r2 = radius * radius;
  return ev.filter((e) => EVERYONE.has(e.k) || near(e as unknown as Ent, h.x, h.y, r2));
}

/** The buildings a friend has: the map's own from the seed, with what the leader said of those near them (by `b<i>`). */
export function mergeBlocks<T>(base: T[], near: Ent[], known: Map<number, T>): T[] {
  for (const b of near) {
    const i = Number(String(b.id).slice(1));
    if (!Number.isInteger(i) || i < 0 || i >= base.length) continue;
    const { id: _id, ...rest } = b;
    known.set(i, rest as T);
  }
  return base.map((b, i) => known.get(i) ?? b);
}
