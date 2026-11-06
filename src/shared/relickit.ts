/**
 * The found relics beyond the javelin, the hook and the lodestone (2026-11-03, Kyle: "We should have
 * more relic types", "interactive with the world", "strong based on physics and buff or debuff",
 * "clear that it doesn't have friendly fire"). Any class can carry one on the RELIC button. Every
 * number the room judges and the screen draws for them lives here. None of them ever touches a friend.
 */

/** The gall bomb: lobbed to a spot (`range`, else `fallback` ahead) over `flight`, it bursts `radius`
 *  across: `dmg`, every goblin thrown out (`knock`, as hard whatever it weighs) and knocked down `stun`,
 *  barrels and crates burst. Since 2026-11-05 nothing in it shrugs it off: few uses, each one sure. */
export const BOMB = { cooldown: 5, windup: 0.2, recover: 0.3, range: 7, fallback: 4.5, flight: 0.55, radius: 2.6, dmg: 22, knock: 18, stun: 1.3 };

/** The wind-up bow: set down where you stand, it shoots the nearest goblin within `radius` every
 *  `every` for `time`, then winds down. Each bolt flies at its goblin whatever it does (it never
 *  misses), `dmg` and `knock`, and hobbles it. */
export const SENTRY = { cooldown: 6, windup: 0.3, recover: 0.2, radius: 6, time: 9, every: 0.45, dmg: 8, knock: 5, speed: 24 };

/** Hobbled by a relic: moves and turns at `slow` of its pace for `time`. */
export const HOBBLE = { slow: 0.35, time: 2 };

/** The bone bell: rung at your feet. Every goblin within `radius` drops whatever blow it had wound up,
 *  striped ones too, and reels (small ones `small` seconds, big ones `big`); small ones are pushed
 *  back `push`. Friends within reach are quickened: `quick` times the pace for `quickTime`. */
export const BELL = { cooldown: 5, windup: 0.15, recover: 0.3, radius: 4, small: 1.6, big: 1.0, dmg: 6, push: 8, quick: 1.25, quickTime: 4 };

/** The butcher's knuckle: a blow of force down a line `length` long and `width` wide from your front.
 *  Every goblin in it, whatever it weighs, takes `dmg`, is knocked off its feet for `stun` and thrown
 *  back `knock` (a butcher as far as a scrapper); barrels and crates in it fly; and every goblin it
 *  hit is marked (MARK). */
export const KNUCKLE = { cooldown: 5, windup: 0.25, recover: 0.3, length: 6, width: 1.1, dmg: 18, knock: 20, stun: 1.4, propDmg: 30 };

/** Marked by a relic: the next blow from anyone lands `mult` times as hard (within `time`). */
export const MARK = { mult: 1.5, time: 4 };

/** The hook on a barrel, a crate, a plank: yanked back at you this hard (it can bowl goblins over on the way). */
export const HOOK_PROP = { yank: 16, maxWeight: 4 };
