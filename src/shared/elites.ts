/**
 * Elites (docs/plans/bosses.md section 3; Kyle, 2026-11-05: "mini bosses also work. Things that require a
 * few hits"): a meaty goblin now and then comes with one to three affixes, each shown on its body and each
 * with a counter. Numbers only: rolled by shared/eliteroll.ts as a room is laid out, played by
 * sim/elite.ts, drawn by client/elitedraw.ts.
 *
 * - `chance` for each meaty goblin from room `from` on (the second room), plus `perRuin` a point of the
 *   place's ruin; at most `most` a room, `deep` on a deep job.
 * - A second affix `two` of the time (plus `twoRuin` a point of ruin), a third only on a deep job (`three`).
 * - What one costs in the room's threat budget (shared/threat.ts): its sort's points times `mult`, plus
 *   `perAffix` an affix; the room lays fewer small ones to pay for it.
 * - Loot: it drops a piece `loot.chance` of the time (a small goblin 2%), rolled `loot.levels` levels up the
 *   party's level curve (shared/lootlevel.ts), so a small bump that grows with the party as everything does.
 *
 * Affix names (proposals for the lore keeper; code and docs only, nothing on screen names them):
 * Plated, Quick, Gorging.
 * - Plated: grey plates; the ironhide rule (shared/raiders.ts IRONHIDE): a fifth of anything till a
 *   charged blow, a perfect or storm breaks the plates for IRONHIDE.broken seconds.
 * - Quick: dust at its heels; `quick.pace` its pace, `quick.windup` its wind-ups, but never under the
 *   floors (`quick.red` for a blow you can block, `quick.striped` for one you can't), and never longer.
 * - Gorging: blood to the chin; with no hero on it, it eats a small one's body in `gorging.time` to heal
 *   `gorging.heal` of its health (the butcher's meal, sim/meal.ts). Burn the dead and it has nothing.
 */
export type Affix = 'plated' | 'quick' | 'gorging';

/** The affixes built so far, in the order they're rolled from. */
export const AFFIXES: Affix[] = ['plated', 'quick', 'gorging'];

export const ELITE = {
  /** Switch them off (none rolled): the pins' switch-off check. */
  on: true,
  from: 1,
  chance: 0.1,
  perRuin: 0.05,
  most: 1,
  deep: 2,
  two: 0.15,
  twoRuin: 0.05,
  three: 0.25,
  mult: 1.5,
  perAffix: 1,
  quick: { pace: 1.25, windup: 0.85, red: 0.9, striped: 1.1 },
  gorging: { heal: 0.3, time: 2 },
  loot: { chance: 0.35, levels: 2 },
};

/** What an elite costs on top of its sort's `base` threat. */
export const eliteThreat = (base: number, affixes: number) => (affixes > 0 ? base * ELITE.mult + ELITE.perAffix * affixes : base);

/** A wind-up quickened by Quick: `windup` times ELITE.quick.windup, never under its floor, never longer. */
export const quickWind = (windup: number, unblockable: boolean) =>
  Math.min(windup, Math.max(windup * ELITE.quick.windup, unblockable ? ELITE.quick.striped : ELITE.quick.red));
