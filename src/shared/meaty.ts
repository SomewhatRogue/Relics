/**
 * The first three of the six new meaty goblins (docs/plans/bosses.md section 3; Kyle, 2026-11-05: "things
 * that take a few hits", "a mix of splatting and tactical", "it's a bit too easy to kite"). Each is one
 * thing to read and one answer that works for a class that blocks and a class that dodges alike. Numbers
 * only: the rules are sim/meaty.ts, the drawing client/meatydraw.ts. Barrowfields farm kit, every one:
 * a barn door, a threshing flail, a pitchfork. Each bleeds in through shared/debut.ts, one after another.
 *
 * Names (all proposals for the lore keeper, code and docs only for now: nothing on screen names sorts):
 * the Planker, the Swingle, the Forker.
 */
import type { Debut } from './debut.js';
import type { EnemyAttackSpec } from './tuning.js';

/** Switch the three off (the composer lays none and nothing is staged): the pins' switch-off check. */
export const MEATY_ON = { on: true };

/** The six (the second three: shared/meaty2.ts), by their variant. */
export const MEATY_SORTS = new Set(['planker', 'swingle', 'forker', 'kegman', 'pouncer', 'gorger']);
export const meatySort = (e: { variant?: string }) => !!e.variant && MEATY_SORTS.has(e.variant);
/** How much bigger than a small goblin each is drawn (its body in the room is its `radius`). */
export const MEATY_DRAW = 1.2;

/**
 * The Planker: a barn door off its hinges on its arm. Its front takes nothing (`cone`: the cosine off its
 * facing a blow or shot must come from to meet the door; 0.35 is about 70 degrees either side), from a
 * blade, a shot, a charged blow or a perfect alike; bursts and fire go round it, and a goblin stunned,
 * frozen, netted or caught unaware has the door down. It turns slowly (`turn` radians a second, a small
 * goblin's 7) and never while it swings or stands after it, so you get round it: block or dodge the
 * bash, then step to its side in the `bash.recover` it stands there. Walks at `speed` of a small goblin's.
 * Debut: staged in the DRUMS way's room in the Barrowfields, at the front of the war band.
 */
export const PLANKER = {
  hp: 120, radius: 0.46, weight: 2.2, speed: 0.7, turn: 1.6, reach: 1.55, cone: 0.35,
  bash: { windup: 1.0, active: 0.1, recover: 1.3, dmg: 14, knock: 9, range: 1.8, arc: 110, unblockable: false } as EnemyAttackSpec,
  debut: { staged: 'drums', home: 'Barrowfields', from: 60, rare: 2, common: 5, weight: 0.6 } as Debut,
};

/**
 * The Swingle: a threshing flail. With a hero within `from` it spins it round itself, a striped ring
 * (`spin.radius`, nothing blocks it) over `spin.windup`, then reels, dizzy, for `reel` seconds: stunned,
 * so blows land GUARD.stunnedMult as hard (the punish: walk or dodge out, then hit it while it staggers).
 * Between spins, `every` seconds at least.
 * Debut: staged in the SMOKE way's room in the Barrowfields, in the yard of the house catching.
 */
export const SWINGLE = {
  hp: 100, radius: 0.42, weight: 1.6, speed: 0.8, from: 2.1, every: 2.4, reel: 1.5,
  spin: { windup: 1.3, active: 0.2, recover: 0.1, dmg: 16, knock: 10, radius: 2.3, ahead: 0, unblockable: true } as EnemyAttackSpec,
  debut: { staged: 'smoke', home: 'Barrowfields', from: 62, rare: 2, common: 5, weight: 0.6 } as Debut,
};

/**
 * The Forker: a pitchfork. From `reach` it jabs a red lane (blockable, `jab`), pushing you well off
 * (`jab.knock`): kiting it is a losing game. The tines start `inner` tiles out, so inside that it can't
 * touch you: it backs off at `back` of its pace to get its reach again, slower than you walk, and you
 * stay in on it. A blocker blocks the jab and walks in; a dodger dodges in through it.
 * Debut: staged in the CRIES way's room in the Barrowfields, prodding the captives along with its fork.
 */
export const FORKER = {
  hp: 90, radius: 0.4, weight: 1.4, speed: 0.85, inner: 1.2, reach: 3.2, back: 0.6,
  jab: { windup: 0.9, active: 0.1, recover: 0.8, dmg: 12, knock: 13, range: 1.9, arc: 18, unblockable: false } as EnemyAttackSpec,
  debut: { staged: 'cries', home: 'Barrowfields', from: 64, rare: 2, common: 5, weight: 0.6 } as Debut,
};
