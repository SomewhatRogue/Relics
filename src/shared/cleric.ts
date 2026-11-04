/**
 * The Cleric's kit rules (Kyle's weapons rework, 2026-11-04). A Cleric never hurts a friend (the class
 * perk, like the Rogue's backstab: sim/mercy.ts). Every Cleric perfect is a held attack let go on the
 * white flash, and every one puts a holy shield on the friends it reaches: the mace's smite, the censer's
 * spin, the flail's spun release. The room judges with these numbers and the client draws from the same.
 */

/** The shield a Cleric's perfect gives: it soaks up to `hp` of damage and lingers `time` s, the Cleric's
 *  own included. A fresh one tops an old one up; it never stacks past `hp`. */
export const HOLY_SHIELD = { hp: 20, time: 5 };

/** The mace. Its quick blows are short (reach 1.2 to 1.35, the sword's is 1.45). Held, the smite: its holy
 *  light mends every friend in the burst `heal` (as every heal, grown by the censer's coals). Let go on
 *  the white flash, it lands `perfect` times as hard and shields every friend in the burst and the Cleric. */
export const MACE = { heal: 10, perfect: 1.5 };

/**
 * The censer. Its swung arc (the third blow) drops `drop` coals along the arc at `at` of its reach; each
 * burns `life` s and sets alight any goblin standing within `radius` of it. A Cleric keeps `max` at most
 * (the oldest goes out). Swinging the censer through your own coals (at least `arm` s old) bursts them:
 * every friend within `burst` of one mends `heal` (once a swing). Let the spin go on the white flash and
 * every coal of yours within `reach` flares: goblins within `flare` of it take `flareDmg` and catch, and
 * friends near you are shielded. Weakness: a wall within the censer's swing snags its chain: the blow
 * does `snag` of its damage, drops no coals, and jars you `jar` s.
 */
export const CENSER = { drop: 3, at: 0.8, life: 6, radius: 0.5, max: 6, arm: 0.4, burst: 1.8, heal: 6, reach: 5, flare: 1.3, flareDmg: 14, snag: 0.5, jar: 0.18 };

/** The flail. Held, rooted, it spins up; the release is a long sweep (reach 2.6, the quick blows 1.85).
 *  Quick blows shove a goblin a little; a shield-bearer's board stops the shove. Let the spin go on the
 *  white flash and what it hits is stunned `stun` s (a butcher `big` as long), and friends near you are shielded. */
export const FLAIL = { stun: 1, big: 0.5 };
