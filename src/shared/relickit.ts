/**
 * The found relics beyond the javelin, the hook and the lodestone (2026-11-03, Kyle: "We should have
 * more relic types", "interactive with the world", "strong based on physics and buff or debuff",
 * "clear that it doesn't have friendly fire"). Any class can carry one on the RELIC button. Every
 * number the room judges and the screen draws for them lives here. None of them ever touches a friend.
 */

/** The gall bomb: lobbed to a spot (`range`, else `fallback` ahead) over `flight`, it bursts `radius`
 *  across: `dmg`, everything thrown out (`knock`, the heavy sliding less), barrels and crates burst,
 *  small goblins dazed `stun`. */
export const BOMB = { cooldown: 14, windup: 0.2, recover: 0.3, range: 7, fallback: 4.5, flight: 0.55, radius: 2.2, dmg: 16, knock: 15, stun: 1.0 };

/** The wind-up bow: set down where you stand, it shoots the nearest goblin within `radius` every
 *  `every` for `time`, then winds down. Each bolt `dmg` and `knock`, and hobbles (`slow` pace) for `hobble`. */
export const SENTRY = { cooldown: 18, windup: 0.3, recover: 0.2, radius: 5.5, time: 7, every: 0.55, dmg: 6, knock: 5, speed: 18 };

/** Hobbled by a relic: moves and turns at `slow` of its pace for `time`. */
export const HOBBLE = { slow: 0.6, time: 1.6 };

/** The bone bell: rung at your feet. Every goblin within `radius` flinches (small ones `small`
 *  seconds, big ones `big`) and drops a wound-up blow unless it's a striped one; small ones are pushed
 *  back `push`. Friends within reach are quickened: `quick` times the pace for `quickTime`. */
export const BELL = { cooldown: 14, windup: 0.15, recover: 0.3, radius: 3.4, small: 1.4, big: 0.6, dmg: 4, push: 7, quick: 1.25, quickTime: 4 };

/** The butcher's knuckle: a blow of force down a line `length` long and `width` wide from your front.
 *  Everything in it takes `dmg` and is thrown back `knock` (small ones off their feet, stunned `stun`);
 *  barrels and crates in it fly; and every goblin it hit is marked (MARK). */
export const KNUCKLE = { cooldown: 12, windup: 0.25, recover: 0.3, length: 5, width: 0.9, dmg: 12, knock: 16, stun: 0.9, propDmg: 20 };

/** Marked by a relic: the next blow from anyone lands `mult` times as hard (within `time`). */
export const MARK = { mult: 1.5, time: 4 };

/** The hook on a barrel, a crate, a plank: yanked back at you this hard (it can bowl goblins over on the way). */
export const HOOK_PROP = { yank: 16, maxWeight: 4 };
