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
 * Plated, Quick, Gorging; then Oil-soaked, Hornblower, Smouldering (behind AFFIX2_ON).
 * - Plated: grey plates; the ironhide rule (shared/raiders.ts IRONHIDE): a fifth of anything till a
 *   charged blow, a perfect or storm breaks the plates for IRONHIDE.broken seconds.
 * - Quick: dust at its heels; `quick.pace` its pace, `quick.windup` its wind-ups, but never under the
 *   floors (`quick.red` for a blow you can block, `quick.striped` for one you can't), and never longer;
 *   `quick.pause` its rest between blows, so it swings more often too (Kyle, 2026-11-11).
 * - Gorging: blood to the chin; with no hero on it, it eats a small one's body in `gorging.time` to heal
 *   `gorging.heal` of its health (the butcher's meal, sim/meal.ts). Burn the dead and it has nothing.
 * - Oil-soaked: a dark sheen; set alight it stands, flailing, and bursts `oiled` (a striped circle,
 *   sim/blast.ts) where it stood, its own pack and itself in it. Burn it inside its own pack.
 * - Hornblower: a horn at its belt; at `horn.at` of its health, with a hero within `horn.near`, it stands
 *   and blows (`horn.time` s, a channel shown on it and at the room's edge where its call will come from:
 *   sim/hornblow.ts), then `horn.call` small ones run in from that edge, on screen. A charged blow, a
 *   perfect, a stun, a freeze, a net or its death cuts it off, and it never blows again. Burst it down,
 *   or interrupt the horn. It costs the small ones it may call on top of its affix.
 * - Smouldering: embers; `ember` after it dies, a striped circle round its body. Walk out after the kill.
 */
import { THREAT } from './threat.js';

export type Affix = 'plated' | 'quick' | 'gorging' | 'oiled' | 'horn' | 'ember';

/** The first three, in the order they're rolled from; the second three after them (AFFIX2_ON). */
export const AFFIXES: Affix[] = ['plated', 'quick', 'gorging'];
export const AFFIXES2: Affix[] = ['oiled', 'horn', 'ember'];
/** Switch the second three off (none rolled): the pins' switch-off check. */
export const AFFIX2_ON = { on: true };
/** What a sort can be rolled with: an ironhide is plated already, a Kegman has its own keg, a Gorger eats already. */
export function affixPool(role: string): Affix[] {
  const all = AFFIX2_ON.on ? [...AFFIXES, ...AFFIXES2] : AFFIXES;
  return all.filter((a) => !(a === 'plated' && role === 'ironhide') && !((a === 'oiled' || a === 'ember') && role === 'kegman') && !(a === 'gorging' && role === 'gorger'));
}

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
  quick: { pace: 1.25, windup: 0.85, red: 0.9, striped: 1.1, pause: 0.7 },
  gorging: { heal: 0.3, time: 2 },
  oiled: { fuse: 1.0, r: 1.6, dmg: 18, foe: 30, knock: 9, burn: 8 },
  horn: { at: 0.5, near: 7, time: 2.0, call: 3, screen: [5, 8] as [number, number], clear: 3 },
  ember: { fuse: 1.2, r: 1.8, dmg: 14, foe: 12, knock: 7, burn: 4 },
  loot: { chance: 0.35, levels: 2 },
};

/**
 * What an elite costs on top of its sort's `base` threat: `affixes` (a list, or how many). A Hornblower
 * pays for the small ones it may call too (each a chaff's half point, shared/threat.ts).
 */
export const eliteThreat = (base: number, affixes: number | readonly Affix[]) => {
  const n = typeof affixes === 'number' ? affixes : affixes.length, horn = typeof affixes !== 'number' && affixes.includes('horn');
  return n > 0 ? base * ELITE.mult + ELITE.perAffix * n + (horn ? ELITE.horn.call * THREAT.chaff : 0) : base;
};

/** A wind-up quickened by Quick: `windup` times ELITE.quick.windup, never under its floor, never longer. */
export const quickWind = (windup: number, unblockable: boolean) =>
  Math.min(windup, Math.max(windup * ELITE.quick.windup, unblockable ? ELITE.quick.striped : ELITE.quick.red));
