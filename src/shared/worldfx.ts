/**
 * World effects (Kyle, 2026-11-05: "more elemental and world effects" like the blood in the water and
 * the lightning). One kit for biomes and foes; the room's rules are in sim/rods.ts, pools.ts, meal.ts,
 * ice.ts, steam.ts and worldfire.ts, and the drawing reads these same numbers.
 */

/** Rods: an ironhide (iron on its back) draws lightning to it. A storm strike (the wand's, or the sky's)
 *  that would fall within `reach` tiles of one falls on it instead; the storm stream, taking a new goblin,
 *  takes an ironhide within `reach` of that one (and in the stream's reach). Struck or jolted, its guard
 *  breaks (sim/ironhide.ts, IRONHIDE.broken). The sky's own strike looks for one as for a banner (`weight`).
 *  It shows crackling on it `glow` seconds. */
export const ROD = { reach: 4, weight: 3, glow: 1.6 };

/** Lightning through a pool: storm landing on a goblin standing in water jolts everyone in that same body
 *  of water (shared/waterbody.ts) within `reach` tiles, nearest first, `cap` bodies at most (friends count).
 *  Goblins take what a wet jump takes (STORM.share of the blow, at least STORM.min, then STORM.wet).
 *  Friends in the water take nothing from a friend's storm (the strike spares them too); the sky's own
 *  lightning landing in water jolts goblins `wildFoe` and friends `wild` (it's on nobody's side). */
export const POOL = { reach: 12, cap: 8, wild: 4, wildFoe: 12 };

/** A butcher eats the dead (a small goblin's body, or one of the freed killed): a body within `seek` tiles
 *  draws it, unless a hero is within `guard` (then it fights). Within `reach` of the body (past its own
 *  radius) it eats for `time` s: a clock, not a blow, drawn as a red ring filling. Done, it heals `heal`
 *  of its health and is FED `fedTime` s: blows `fed.dmg` harder, wind-ups `fed.windup` as long, walking
 *  `fed.pace` as fast. A heavy hit, a stun, a freeze or the body burned takes it off the meal; it tries
 *  again after `again` s. */
export const MEAL = { seek: 4, guard: 1.5, reach: 0.45, time: 2, heal: 0.25, fedTime: 15, again: 5, fed: { dmg: 1.25, windup: 0.85, pace: 1.2 } };

/** Ice on water: frost on shallows ices them `time` s, a circle `r` round the frost (a tap's `tapR`, a
 *  blast's and the nova's their own size), only where the water is shallow. Goblins wading it are held:
 *  `held` of their wading pace. A frozen goblin skidding over it slows `slip` as fast (FLING), so it goes
 *  further. At most `max` patches (the oldest goes). Friends walk it as plain shallows. */
export const ICE = { time: 6, tapR: 0.9, held: 0.35, slip: 0.4, max: 12 };

/** Steam: fire on ice (it melts), or on a goblin standing in water (the water puts the fire out), makes a
 *  cloud `r` round for `time` s. It hides whoever is inside from goblins by the smoke's rules
 *  (sim/flasks.ts, smokebomb.ts) and scalds every `every` s: goblins `dmg`, friends `heroDmg`. A cloud near
 *  another (within `merge` of its size) keeps that one going instead; at most `max` at once. */
export const STEAM_CLOUD = { r: 1.4, time: 4, every: 1, dmg: 3, heroDmg: 1, merge: 0.7, max: 6 };
