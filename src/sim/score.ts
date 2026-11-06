/**
 * What the room counts for each hero on a job, for the recap (Kyle, 2026-11-05: "show them a recap of
 * how they and all players did in that mission. Numbers killed, dodges, damage done etc."). The room
 * hands its board in while it steps (room.ts), each count is made where the thing happens (a blow, a
 * block, a heal), and the run folds the board in after every step (run.ts tally). Keyed by hero id, so
 * a friend's game reads the leader's numbers with its own under `me` (coop.ts swaps the ids).
 */
import type { HeroClass } from '../shared/weapons';

export interface Score {
  /** Goblins killed (not spiders or wolves: the same goblins the run counts). */
  kills: number;
  /** Damage into goblins' health (an overkill counts what it took, not past it), and damage taken. */
  dealt: number;
  taken: number;
  /** Blows dodged: rolled, jumped or blinked out of, or stepped out of a striped one. */
  dodges: number;
  /** Blows held on a block (parry and the perfect parry went on 2026-11-05: an old board's are ignored). */
  blocks: number;
  /** Times downed; friends got back up; health given to friends (never yourself). */
  downs: number;
  raised: number;
  healed: number;
  /** RAISE (sim/raise.ts): friends a Cleric raised when they were out; and the most health this hero lost
   *  to being raised, in % of their full most (optional: a board from before reads 0). */
  rose?: number;
  cut?: number;
  /** The biggest single blow on a goblin. */
  best: number;
  /** Who it is: the hero's name (as the party knows it) and class. */
  name?: string;
  cls?: HeroClass;
}
export type Board = Record<string, Score>;
export type Count = Exclude<keyof Score, 'name' | 'cls'>;

export const COUNTS: readonly Count[] = ['kills', 'dealt', 'taken', 'dodges', 'blocks', 'downs', 'raised', 'healed', 'best', 'rose', 'cut'];
export const blankScore = (): Score => ({ kills: 0, dealt: 0, taken: 0, dodges: 0, blocks: 0, downs: 0, raised: 0, healed: 0, best: 0, rose: 0, cut: 0 });

/** The board of the room stepping now (null between steps: nothing outside a step counts). */
let on: Board | null = null;
export const useBoard = (b: Board | null): void => void (on = b);

/** Count `n` of `k` for hero `id` (the squire and nobody count nothing). */
export function count(id: string | undefined, k: Count, n = 1): void {
  if (!on || !id || id === 'squire' || !(n > 0)) return;
  const s = (on[id] ??= blankScore());
  if (k === 'best') s.best = Math.max(s.best, n);
  else s[k] = (s[k] ?? 0) + n;
}

/** A blow of `n` on a goblin, by `id`: what went into its health (`hp` is after the blow), and the
 *  biggest single blow. A tick (a burn, a bleed) adds to the damage but is never the best hit. */
export function dealt(e: { kind: string; hp: number }, id: string | undefined, n: number, tick = false): void {
  if (e.kind === 'dummy' || e.kind === 'swingDummy') return;
  count(id, 'dealt', n + Math.min(0, e.hp));
  if (!tick) count(id, 'best', n);
}

/** `id` mends `to` by `n`: counted only when it's a friend, not yourself. */
export const gave = (id: string | undefined, to: string, n: number): void => (id !== to ? count(id, 'healed', n) : undefined);

/** Add `from` into `into` (the run's board, from a room's after a step). */
export function foldBoard(into: Board, from: Board): void {
  for (const [id, s] of Object.entries(from)) {
    const t = (into[id] ??= blankScore());
    for (const k of COUNTS) t[k] = k === 'best' ? Math.max(t.best, s.best) : (t[k] ?? 0) + (s[k] ?? 0);
  }
}
