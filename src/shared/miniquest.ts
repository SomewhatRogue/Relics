/**
 * Mini quests (docs/design/territories.md, "Mini quests"; Kyle, 2026-11-17: "talk to a person who tells you to
 * hunt something that doesn't spawn until you talk to it"): people on a territory with a small job of their own.
 * A map carries its mini quests as plain data (`map.minis`); the room keeps each one's record and makes its
 * goblins only when someone has talked to the giver (sim/minis.ts). Pure.
 */
import type { Foe } from './terrain.js';

/** `hunt`: kill what the talk wakes. `find`: someone is hidden; kill what's hunting them and they come out. */
export type MiniKind = 'hunt' | 'find';

export interface Mini {
  id: string;
  kind: MiniKind;
  /**
   * The person: where they are and how they're drawn (an `Npc` look). `low`: keeping low, hiding (behind a cart).
   * `up`: off the ground by this many pixels (up a tree); paint only, you still talk from the ground beside them.
   */
  giver: { x: number; y: number; look: string; low?: boolean; up?: number };
  /** Packs that must be dead before they'll say a word (the ones standing over them). */
  after?: number[];
  /** What the talk wakes: made only then, wherever these stand. */
  foes: Foe[];
  /** Where it is: the gold mark while it's taken. */
  at: { x: number; y: number; r: number };
  /** Done: who comes out of hiding there and goes home. */
  frees?: { x: number; y: number }[];
  /** The giver goes home too: `done`, as soon as it's done; `seen`, once a hero is back in sight of them (their last word is said then). */
  giverLeaves?: 'done' | 'seen';
  /** Done: a chest that was hidden is shown. */
  chest?: { x: number; y: number };
}

/** How near a hero stands to talk; how near any hero must be before a giver's mark shows; and before a giver who waits to be seen goes home. */
export const MINI = { reach: 1.8, near: 18, seen: 9 };
