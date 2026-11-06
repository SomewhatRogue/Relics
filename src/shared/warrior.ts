/**
 * The Warrior's kit rules (Kyle's weapons rework, 2026-11-03): no dodge at all (walk out of a striped
 * blow; GRAB sits where a dodge would, Kyle 2026-11-04); the sword's shield
 * bash (stuns a crowd on the flash); the greatsword's slow, dear block and shockwave; the spear's pin and its shaft. The
 * room judges with these numbers and the client draws from the same ones.
 */

/** The sword's held attack, a shield bash: the goblin in front is stunned `stun` s, `stunFull` at a full
 *  charge (a butcher `big` as long). Its perfect: let go on the white flash and every goblin in `arc`
 *  degrees in front is stunned `perfect` s. It breaks a wind-up, but not a striped blow or a charge. */
export const SHIELD_BASH = { stun: 0.4, stunFull: 0.7, big: 0.5, perfect: 1.0, arc: 140 };
/** The greatsword's perfect release: the overhead lands `ahead` tiles in front and a shockwave of `radius`
 *  knocks every goblin in it down for `down` s (a butcher `big` as long), with `dmg` and a shove. */
export const QUAKE = { ahead: 1.4, radius: 2.6, down: 1.2, big: 0.5, dmg: 12, knock: 9 };
/** The spear's perfect: the held lunge let go on the white flash pins whatever it runs through `flash` s.
 *  Its bonus: a goblin caught charging or lunging is stopped dead and pinned `caught` s. */
export const PIN = { flash: 1.0, caught: 1.6 };
/** The spear's weakness: a goblin inside `near` of its reach takes `mult` from a quick thrust (the shaft, not the point). */
export const SHAFT = { near: 0.5, mult: 0.5 };
