/**
 * The class skills a trainer teaches beyond the first (2026-11-02, Kyle: "think of 3 per class").
 * Every number the room judges and the screen draws for them lives here. Each sits beside the class's
 * first skill at a like cooldown; a hero carries one and changes it at the trainer.
 */

/** The Warrior's shield stamp: the rim brought down on the stone. A ring around you, telegraphed for
 *  `windup`: everything in it is hit and thrown out, small goblins knocked off their feet, big ones
 *  staggered; crates and barrels burst. */
export const STAMP = { cooldown: 14, windup: 0.35, recover: 0.4, radius: 2.6, dmg: 16, knock: 11, stun: 1.4, stagger: 0.6, propDmg: 30 };

/** The Ranger's volley: shot high at a spot (to the pointer on a laptop, the goblin you face on a
 *  phone, else `fallback` ahead). After `delay`, arrows fall there every `every` for `time`: each fall
 *  hits every goblin in `radius` for `dmg`, and small ones flinch (held in it). */
export const VOLLEY = { cooldown: 18, windup: 0.25, recover: 0.3, range: 8, fallback: 5, delay: 0.7, time: 2.4, every: 0.3, radius: 2.2, dmg: 5, flinch: 0.2 };

/** The Ranger's hound sent in: it runs (at `speed` times its pace) at the goblin you face within
 *  `range` and, reaching it, pins a small one flat for `pin` and hangs off a big one (slowed) as long. */
export const SIC = { cooldown: 16, windup: 0.1, recover: 0.15, range: 9, speed: 1.8, pin: 2.6 };

/** The Rogue's vanish: smoke at your feet. Goblins lose you (even close) for `time` or until you
 *  strike; any blow wound up at you is dropped; small ones in `radius` cough and flinch. */
export const VANISH = { cooldown: 18, windup: 0.06, recover: 0.1, time: 4, radius: 2.2, cough: 0.8 };

/** The Rogue's knife fan: `count` knives thrown wide, `spread` radians either side of where you face. */
export const KNIVES = { cooldown: 12, windup: 0.12, recover: 0.25, count: 5, spread: 0.5, dmg: 11, knock: 3, speed: 18, range: 7 };

/** The Mage's fire ring: fire bursts out around you (`radius`), throwing goblins off and setting them
 *  alight, then burns on where it stood for `linger`, lighting anything that walks in (every `every`). */
export const FIRE_RING = { cooldown: 16, windup: 0.2, recover: 0.3, radius: 2.6, dmg: 12, knock: 12, linger: 4, every: 0.5 };

/** The Mage's storm tether: lightning ties you to the goblin you face within `range` for `time`. Every
 *  `every` it strikes for `dmg` (storm, so it jumps on to goblins near it). It snaps past `snap`; when
 *  its goblin dies it takes the nearest other within `range`. */
export const TETHER = { cooldown: 16, windup: 0.15, recover: 0.2, range: 7, snap: 9, time: 4, every: 0.5, dmg: 6 };

/** The Cleric's censer chain: it hauls the friend in most need within `range` (where you point, on a
 *  laptop) to your side at `speed`, blessed for `bless`. With no friend in reach it takes the goblin
 *  you face instead: a small one is dragged in and reels for `stun`; a big one only flinches. */
export const CHAIN = { cooldown: 14, windup: 0.15, recover: 0.2, range: 8, speed: 16, bless: 3, stun: 1, dmg: 6 };

/** The Cleric's lantern light: the censer opened, the coal's light flooding out to `radius` after
 *  `windup`. Goblins in it take `dmg` and are thrown back, small ones blinded for `blind`; friends in it
 *  (you too) mend `heal`. Both grow with the coals in the censer, like every heal. */
export const LIGHT = { cooldown: 18, windup: 0.3, recover: 0.3, radius: 3, dmg: 12, knock: 8, blind: 1, heal: 12 };
