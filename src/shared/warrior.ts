/**
 * The Warrior's kit rules (Kyle's weapons rework, 2026-11-03): no roll, a short step; the sword's shield
 * bash (stuns a crowd on the flash) and riposte; the greatsword's parry-only guard and shockwave; the spear's pin and its shaft. The
 * room judges with these numbers and the client draws from the same ones.
 */
import { CLASS_DODGES, type Dodge, type HeroClass, type Weapon } from './weapons.js';

/** A Warrior has no roll: a short shoulder step, about half a roll's distance and quicker, with no
 *  protection at all (no frames to dodge through a blow: a striped blow still has to be stepped out of). */
export const STEP: Dodge = { kind: 'step', distance: 1.2, time: 0.16, iFrom: 1, iTo: 0, stamina: 12, cooldown: 0.55 };
/** The step a class without a dodge takes instead (only the Warrior; a Healer has neither). */
export const CLASS_STEP: Partial<Record<HeroClass, Dodge>> = { WARRIOR: STEP };
/** What the dodge button does for this kit: its own dodge, the class's step, or nothing. */
export const dodgeOf = (w: Weapon): Dodge | undefined => (CLASS_DODGES[w.cls] ? w.dodge : CLASS_STEP[w.cls]);

/** The sword's held attack, a shield bash: the goblin in front is stunned `stun` s, `stunFull` at a full
 *  charge (a butcher `big` as long). Its perfect: let go on the white flash and every goblin in `arc`
 *  degrees in front is stunned `perfect` s. It breaks a wind-up, but not a striped blow or a charge. */
export const SHIELD_BASH = { stun: 0.4, stunFull: 0.7, big: 0.5, perfect: 1.0, arc: 140 };
/** The sword's bonus (not its perfect): a counter started within `window` s of the parry is a riposte, `mult` times the counter. */
export const RIPOSTE = { window: 0.5, mult: 2 };
/** The greatsword's perfect release: the overhead lands `ahead` tiles in front and a shockwave of `radius`
 *  knocks every goblin in it down for `down` s (a butcher `big` as long), with `dmg` and a shove. */
export const QUAKE = { ahead: 1.4, radius: 2.6, down: 1.2, big: 0.5, dmg: 12, knock: 9 };
/** The spear's perfect: the held lunge let go on the white flash pins whatever it runs through `flash` s.
 *  Its bonus: a goblin caught charging or lunging is stopped dead and pinned `caught` s. */
export const PIN = { flash: 1.0, caught: 1.6 };
/** The spear's weakness: a goblin inside `near` of its reach takes `mult` from a quick thrust (the shaft, not the point). */
export const SHAFT = { near: 0.5, mult: 0.5 };
