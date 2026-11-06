/**
 * The Staithe in numbers (re-exported by tuning.ts; Kyle approved the biomes proposal, 2026-11-05): the
 * eel-catchers's jetty over deep water, the log the carriers are laying across to it, the netted on the
 * bank, the smokehouse, the hold while the punt takes them over, and the two new sorts that work it
 * (the gaffer and the skimmer). Every ring and lane drawn is these same numbers.
 */
import type { EnemyAttackSpec } from './tuning.js';

export const STAITHE = {
  /** A share of the job's pay more for each one brought over (the NETS way, and the room's recap line). */
  perSaved: 0.1,
  /** The river's breadth at a staithe (deep enough for the jetty to stand in), and the jetty's: the gap to it, its depth and length, the log's width. */
  river: 5.8, gap: 1.3, deep: 2.3, long: 5.2, log: 1.4,
  /** On the jetty, and netted on the bank, as you come in. */
  folk: 4, netted: 1,
  /** The log: seconds from the bank to across with the carriers at it; how far along it is as the room begins. */
  lay: 14, staged: 0.35,
  /** Shoving the laid log off: GRAB (SHOVE) at its bank end, this close. */
  shoveReach: 1.3,
  /** A goblin on the jetty takes someone off it every `take` seconds (gone: LOST). */
  take: 4,
  /** The jetty ring on the bank at the gap: its radius, how long it's held while the punt takes them over, its trips, the grace stepping out. */
  ring: 2.6, hold: 45, trips: 3, grace: 1.5,
  /** With no goblin left standing, the punt goes this many times quicker (nothing to hold off). */
  clear: 4,
  /** During the hold, goblins come along the bank: this many at each trip's turn. */
  holdWave: 2,
  /** Hung nets: held this long, and not again for `again` seconds. */
  snag: 1, snagAgain: 2.5,
  /** The smokehouse alight: smokes this long (its timbers burn away over the same), the smoke's reach. */
  smoke: 40, smokeR: 2.4,
  /** A jetty burnt through throws whoever's on it to the bank: hurt this much, held this long. */
  thrown: 6, thrownStun: 0.8,
  /** GRAB (CUT FREE) cuts one of the netted out from this close. */
  cut: 1.25,
  /** Oil on water drifts downstream this fast (tiles a second, the painted current: client/waterfield.ts); lit on water it burns this long. */
  drift: 0.42, waterBurn: 12, slickR: 1.1,
  /** The big map: ALARM levels at which the smokehouse catches and at which they're lost. */
  catchAt: 3, lostAt: 5,
  /** The big map: rolled on this share of maps (with the ones where it won't fit, about 1 map in 3 has it); this share of those pin it as a job (else a side job). */
  chance: 0.45, pinned: 0.5,
  /** The big map: tiles of plain river kept between the broadened water and either ford. */
  fordGap: 3,
};

/**
 * The gaffer (a squad goblin; Kyle's proposal: "hooks a hero 4 tiles to its brute"). A fishing gaff taken off
 * the eel-catchers (never a billhook): a long pole, its iron hook on the end. From up to `reach` it throws the hook down a thin red lane: blocked or dodged
 * out of, nothing (it snapped on a parry until parry went, 2026-11-05); landed, the hero
 * is hauled to the nearest brute within `toBrute` (its own feet if none) and held `pullStun`. Keeps its
 * distance (`keep`). At the Staithe, before it sees you, it hooks folk off the jetty's end every `gaff` s.
 */
export const GAFFER = {
  hp: 34, reach: 4, keep: 2.4, flee: 0.8, toBrute: 8, pullStun: 0.6, gaff: 7,
  hook: { windup: 0.9, active: 0.1, recover: 0.9, dmg: 6, knock: 0, range: 4, arc: 6, unblockable: false } as EnemyAttackSpec,
};

/**
 * The skimmer (a world-effect goblin): it stands at the water upstream with a pot of lamp oil from the hoard, pours it
 * on the water and lights it (a striped circle: nothing to block), and the burning oil drifts down onto
 * whatever's below. Every `every` seconds while it's awake. Frost on it pins it `pin` seconds (it can't
 * pour, and what it was pouring is spilt). Light on its feet: kill it upstream.
 */
export const SKIMMER = {
  hp: 22, every: 9, keep: 3.5, flee: 0.9,
  pour: { windup: 1.5, active: 0.1, recover: 1.1, dmg: 0, knock: 0, radius: 1.1, unblockable: true } as EnemyAttackSpec,
  pin: 4,
};
