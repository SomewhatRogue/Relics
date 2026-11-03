/**
 * The fight's numbers as a hero's knacks move them (shared/perks.ts). Each is the one the room judges
 * and the one the client draws: the parry flash on a telegraph, the white flash at full draw.
 */
import { BASH, BLESSING, DECOY, GUARD, HEAL_RADIUS, HORN, HOUND, RELEASE, SNARE, STEALTH, WARD, WEAPONS, type Swing } from '../shared/tuning';
import { knack, statsOf } from './gearstats';
import type { Hero } from './types';

/** How long before a blow lands a tap of block still parries it (the kit's, gear's, knacks', and the easy setting's). */
export const parryWindow = (h: Hero) => WEAPONS[h.weapon].parryWindow + statsOf(h).parry + (h.lenience ?? 0);
/** After a parry, how long the next blow started is a counter. */
export const counterWindow = (h: Hero) => GUARD.counterWindow + knack(h, 'counterTime');
/** How long after a full draw a release is perfect (the white flash). */
export const releaseWindow = (h: Hero) => RELEASE.perfect + knack(h, 'flash');
/** A shot loosed on the white flash: this times as hard (DEADEYE on top). */
export const perfectMult = (h: Hero) => 1 + knack(h, 'perfect');

/** How far the dodge goes (armor and knacks), and its breath as a share of the kit's. */
export const dodgeReach = (h: Hero) => WEAPONS[h.weapon].dodge.distance * statsOf(h).dodgeDist * (1 + knack(h, 'leap'));
export const dodgeBreath = (h: Hero) => statsOf(h).dodgeCost * (1 - knack(h, 'light'));
/** Out from under a blow this soon after the dodge started still counts as the last moment (the goblin reels). */
export const slipWindow = (h: Hero) => WEAPONS[h.weapon].dodge.iTo + (h.lenience ?? 0) + knack(h, 'slip');
/** Behind a goblin: where its facing points away by more than this (a dot product; higher is wider). */
export const rearCos = (h: Hero) => GUARD.rearCos + knack(h, 'angle');
/** Creeping: goblins at rest see you at this share of their sight. */
export const sneakSight = (h: Hero) => STEALTH.sneak * (1 - knack(h, 'quiet'));
/** How long the blink's image stays. */
export const decoyTime = (h: Hero) => DECOY.time + knack(h, 'image');

/** The Ranger's snare: the wait for the next, how long it holds, how many can be down. */
export const snareWait = (h: Hero) => SNARE.cooldown * (1 - knack(h, 'snareCd'));
export const snareHold = (h: Hero) => SNARE.hold * (1 + knack(h, 'snareHold'));
export const snareMax = (h: Hero) => SNARE.max + knack(h, 'snares');
/** The hound: seconds at heel between runs, a bite, bites a run. */
export const houndWait = (h: Hero) => HOUND.every * (1 - knack(h, 'houndEvery'));
export const houndBite = (h: Hero) => HOUND.bite + knack(h, 'houndBite');
export const houndBites = (h: Hero) => HOUND.bites + knack(h, 'houndBites');

/** The Warrior's skills: the shield charge's run and stun, the war cry's reach and hold. */
export const bashReach = (h: Hero) => BASH.distance * (1 + knack(h, 'skillFar'));
export const bashStun = (h: Hero) => BASH.stun * (1 + knack(h, 'skillHold'));
export const hornReach = (h: Hero) => HORN.radius * (1 + knack(h, 'skillFar'));
export const hornTime = (h: Hero) => HORN.time * (1 + knack(h, 'skillHold'));

/** The Healer's: blessed ground and the ward (size and time), the healing blow's reach. */
export const blessRadius = (h: Hero) => BLESSING.radius * (1 + knack(h, 'bless'));
export const blessTime = (h: Hero) => BLESSING.time + knack(h, 'blessTime');
export const wardHp = (h: Hero) => WARD.hp * (1 + knack(h, 'bless'));
export const wardTime = (h: Hero) => WARD.time + knack(h, 'blessTime');
export const healReach = (h: Hero) => HEAL_RADIUS * (1 + knack(h, 'mercyReach'));

/** What a swing heals: its own, or (QUICK MERCY) a share of the next blow's when that's the healing one. */
export function healOf(h: Hero, s: Swing): number {
  if (s.heal) return s.heal;
  const next = h.heavy ? undefined : WEAPONS[h.weapon].combo[h.combo + 1];
  return next?.heal ? next.heal * knack(h, 'mercy') : 0;
}
/** A spell's burst radius, as a share of its own (WIDE BURST). */
export const burstMult = (h: Hero) => 1 + knack(h, 'burst');
/** A smite's stun. */
export const smiteStun = (h: Hero, s: Swing) => (s.stun ?? 1) + knack(h, 'smiteStun');
