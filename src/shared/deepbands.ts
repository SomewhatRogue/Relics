/**
 * The Deep's floors by band (docs/design/the-deep.md, "Floors and loot"): what each block of five turns
 * up, and how it keeps rising past fifteen. Read by shared/deep.ts (the floor's job), shared/terrain.ts
 * (the room it's laid out as), roombudget.ts and eliteroll.ts (BIG ONEs, elites), sim/run.ts (level and
 * toughness) and shared/deeploot.ts (the tier odds). No imports, so anything can read it.
 *
 * - `ruin`, `deep`: the floor's place and flag, as any job's (hard places and deep dives: bigger rooms,
 *   up to two elites a room and three affixes, chests a tier up).
 * - `room`: the room of a job it's laid out as: its budget, which sorts and packs it can draw (the
 *   harder ones come deeper into a job), its elites. A job's first room has the fewest and no elites.
 * - `hunt`: every `hunt`th floor is a hunt for a named butcher (0 never).
 * - `big`: every `big`th floor that isn't a hunt ends on a BIG ONE (a brute or an ironhide grown huge,
 *   with its stomp: shared/threat.ts BIG).
 * - `elite`, `elites`, `affixes`: elites more often (added to each meaty goblin's chance), up to `elites`
 *   a room, each with at least `affixes` (Quick: faster wind-ups, faster feet, less pause between blows).
 * - `level`: levels on the party's for the goblins' toughness and the loot's lean (capped, shared/threat.ts).
 * - `pre`, `rare`: PRE-WAR and the rare three that many times as likely in a chest or off a goblin.
 * - `edge` (Kyle, 2026-11-11: "too easy to dodge, and bosses felt like self punishment"): the Deep is hard by
 *   how its goblins hit, not how long they take to kill. Health (`hp`) and damage (`harm`) times this; every
 *   wind-up but a boss's times `windup` (never under DEEP_EDGE's floors) and the rest between blows times
 *   `pause`, so they come quicker and more often. Bosses keep their health and own wind-ups (sim/deepedge.ts).
 */
export const DEEP_BANDS = [
  { from: 1, ruin: 2, deep: false, room: 1, hunt: 0, big: 4, elite: 0, elites: 1, affixes: 1, level: 0, pre: 2, rare: 1, edge: { hp: 0.9, harm: 1.25, windup: 0.9, pause: 0.85 } },
  { from: 6, ruin: 3, deep: true, room: 2, hunt: 3, big: 2, elite: 0.1, elites: 2, affixes: 1, level: 2, pre: 5, rare: 2, edge: { hp: 0.9, harm: 1.4, windup: 0.82, pause: 0.75 } },
  { from: 11, ruin: 3, deep: true, room: 3, hunt: 2, big: 1, elite: 0.2, elites: 3, affixes: 2, level: 4, pre: 6, rare: 5, edge: { hp: 0.95, harm: 1.55, windup: 0.75, pause: 0.65 } },
  { from: 16, ruin: 3, deep: true, room: 3, hunt: 2, big: 1, elite: 0.3, elites: 4, affixes: 2, level: 6, pre: 6, rare: 6, edge: { hp: 1, harm: 1.7, windup: 0.7, pause: 0.6 } },
];
export type DeepBand = (typeof DEEP_BANDS)[number];

/**
 * Past floor `from`, each floor on: goblins' health and damage (damage rising faster), the room's budget, and the rare three's
 * odds, this much more again, with no end. (The on-screen caps still hold: a deeper room is longer and
 * harder, never a wall of goblins at once.)
 */
export const DEEP_PAST = { from: 15, hp: 0.03, harm: 0.05, budget: 0.05, rare: 0.15 };

/** A quickened wind-up never under `red` s (a blow you can block) or `striped` (one you can't). */
export const DEEP_EDGE = { red: 0.4, striped: 0.8 };

/** Room `index` of a job as it's laid out (shared/terrain.ts): a Deep floor counts as its band's room. */
export const roomAt = (job: { floor?: number }, index: number) => (job.floor ? index + bandOf(job.floor).room : index);
/** Floor `n`'s band (from 1). */
export const bandOf = (n: number): DeepBand => [...DEEP_BANDS].reverse().find((b) => n >= b.from) ?? DEEP_BANDS[0];
/** Floors past DEEP_PAST.from (0 before). */
export const pastOf = (n: number) => Math.max(0, n - DEEP_PAST.from);
/** Floor `n`'s room budget, and its goblins' health and damage, times this (1 till past fifteen). */
export const deepGrow = (n: number) => ({ budget: 1 + DEEP_PAST.budget * pastOf(n), hp: 1 + DEEP_PAST.hp * pastOf(n), harm: 1 + DEEP_PAST.harm * pastOf(n) });
