/**
 * The Cleric's kit rules (Kyle's weapons rework, 2026-11-04). A Cleric never hurts a friend (the class
 * perk, like the Rogue's backstab: sim/mercy.ts). Every Cleric perfect is a held attack let go on the
 * white flash, and every one puts a holy shield on the friends it reaches: the mace's smite, the censer's
 * spin, the flail's spun release. The room judges with these numbers and the client draws from the same.
 */

/** The shield a Cleric's perfect gives: it soaks up to `hp` of damage and lingers `time` s, the Cleric's
 *  own included. A fresh one tops an old one up; it never stacks past `hp`. */
export const HOLY_SHIELD = { hp: 20, time: 5 };
/**
 * The Cleric's guard: a holy ward round them, held on the block button (Kyle, 2026-11-05; sim/holyguard.ts).
 * It meets blows from every side and costs stamina for what it stops, as a block does. Standing within
 * `coalReach` tiles of one of your own censer coals while you hold it gives back `coals` stamina a second.
 * A Cleric's stamina comes back slower than other heroes' (Kyle, 2026-11-07: "the cleric's shield is too strong
 * because your stamina recharges too quickly"): nothing for `regenDelay` s after it was last spent (HERO's is
 * 0.6), then at `regen` times the usual rate.
 */
export const HOLY_GUARD = { coals: 25, coalReach: 1, regenDelay: 1.5, regen: 0.55 };

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

/** The flail. Held, it spins up as you walk (slower); the release is a long sweep (reach 2.6, the quick blows 1.85).
 *  Quick blows shove a goblin a little; a shield-bearer's board stops the shove. Let the spin go on the
 *  white flash and what it hits is stunned `stun` s (a butcher `big` as long), and friends near you are shielded. */
export const FLAIL = { stun: 1, big: 0.5 };

/**
 * RAISE (Kyle, 2026-11-05: "Clerics should be able to res someone multiplayer even if they're fully
 * down ... less max health for who they res for that instance"; sim/raise.ts). In a party, a Cleric on
 * their feet presses GRAB by a friend who is out for the job and kneels there `time` s, the light going
 * into them; goblins within `draw` tiles come for the Cleric meanwhile (and `linger` s after), and a red
 * ring that wide shows round the Cleric for `show` s as it begins. A hit, a
 * swing, a block or walking off breaks it, and it starts again from nothing. Each Cleric raises a given
 * friend once a job, and then waits `cooldown` s before raising anyone. The friend gets up with `hp` of
 * their new most, and `grace` s with nothing landing on them. Each raise takes `cut` of their full most
 * health off for the rest of the job (two Clerics: twice), never below `floor` of it.
 */
export const RAISE = { time: 4, reach: 1.4, hp: 0.35, cut: 0.25, floor: 0.5, cooldown: 45, draw: 5, linger: 1, grace: 1.5, /** The red ring round the Cleric as it begins (s). */ show: 0.6 };

/** The most health a hero has with `cut` of it taken off by being raised (shared by the room and the HUD). */
export const cutMax = (full: number, cut = 0): number => Math.max(1, Math.round(full * (1 - cut)));
