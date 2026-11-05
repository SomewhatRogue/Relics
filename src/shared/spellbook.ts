/**
 * The Mage's spellbook (Kyle, 2026-11-04): the element is the spellbook and the weapon the range. The
 * element (switched on its own button) decides what the tap and the hold are; the wand casts them at
 * range, the staff close and centred on you, the spellblade in melee. Every number the room judges by
 * is here, and the client draws the same shapes from them (client/spellground.ts, fxspells.ts).
 *
 * Balance (measured in tests/spellbook.test.ts, written into docs/DECISIONS.md): on one goblin each
 * element's tap does about the same a second, fire's burn counted. The hold is the big hit: fire burns
 * the most goblins, frost trades damage for freezing them, storm trades area for a stun.
 */
import type { Element } from './magic.js';

export type MageKit = 'wand' | 'staff' | 'spellblade';
export const MAGE_KITS: MageKit[] = ['wand', 'staff', 'spellblade'];

/**
 * Each kit's tap in each element: the kit's own blow times `dmg`. Fire sets alight, frost chills (slows
 * feet and wind-ups; a tap never freezes), storm jumps on to `jumps` more goblins (STORM.reach,
 * STORM.share). The wand's frost tap is ICICLES of them, each `dmg` of the spark.
 */
export const TAPS: Record<MageKit, Record<Element, { dmg: number; jumps?: number }>> = {
  wand: { fire: { dmg: 0.45 }, frost: { dmg: 0.45 }, storm: { dmg: 1.35, jumps: 2 } },
  staff: { fire: { dmg: 0.4 }, frost: { dmg: 1.05 }, storm: { dmg: 1.05, jumps: 1 } },
  spellblade: { fire: { dmg: 0.6 }, frost: { dmg: 1 }, storm: { dmg: 1, jumps: 1 } },
};
/** The wand's frost tap: `n` icicles fanned `spread` radians apart, flying `speed` times the spark's. */
export const ICICLES = { n: 3, spread: 0.12, speed: 1.2 };

/** Wand, fire: the held spell is a fireball that bursts `burst` round where it lands and sets all of it
 *  alight (fire then spreads by touch). Let go on the white flash: `big` across, and it breaks blows off. */
export const FIREBALL = { burst: 1.8, big: 2.6 };

/** Wand, frost: a cold blast in a cone from your hand, `range` tiles and `arc` degrees, for `dmg` of the
 *  hold's damage and a shove; everything in it freezes solid. On the flash: `bigRange`, `bigArc`, and it
 *  breaks blows off. */
export const COLD_BLAST = { range: 4, arc: 70, bigRange: 5.2, bigArc: 100, dmg: 0.6, knock: 6 };

/** Wand, storm: lightning called down where you aim (the mouse; on a phone the goblin you face, else
 *  `fallback` ahead), `range` at most. It lands `delay` s later in a red circle with a striped edge (it
 *  can't be blocked, and it hurts friends in a party): `radius` round, `dmg` of the hold, a stun of
 *  `stun` s (a butcher `big` as long), and no jumping on. On the flash: `bigRadius`, `bigStun`. */
export const STRIKE = { range: 8, fallback: 4.5, delay: 0.55, radius: 1.2, bigRadius: 1.6, stun: 1, bigStun: 1.6, big: 0.5, dmg: 1.25 };

/** Every staff hold is centred on the Mage (Kyle: "wall of fire seems hard to aim"): `r` tiles round at
 *  the shortest hold, `rFull` at a full one, `rBig` let go on the white flash. */
export const STAFF_RING = { r: 2.2, rFull: 2.8, rBig: 3.4 };
/** Staff, fire: a ring of fire round where you stood, `band` deep, for `life` s (`bigLife` on the flash).
 *  Anything in the band is scorched `scorch` and set alight, again whenever its burn has gone out. */
export const FLAME_RING = { band: 0.7, life: 4, bigLife: 6, scorch: 6 };
/** Staff, frost: a frost nova all round you, at once: `dmg` of the hold's damage and everything in it frozen. */
export const NOVA = { dmg: 0.6, knock: 5 };
/** Staff, storm: a charged ring round where you stood, for `life` s (`bigLife` on the flash). Every
 *  `every` s anything inside is zapped for `zap` and flinches; on the flash each zap stuns `bigStun` s
 *  instead (once a goblin, the stun cap: shared/stuncap.ts). */
export const STORM_RING = { life: 4, bigLife: 6, every: 0.5, zap: 5, flinch: 0.4, bigStun: 0.6 };

/** Spellblade, fire: a burning lunge `len` tiles ahead in `time` s (`bigLen` on the flash), striking
 *  everything within `reach` of its path once for the hold's damage and setting it alight. */
export const LUNGE = { len: 3.2, bigLen: 4.4, time: 0.22, reach: 0.9 };
/** Spellblade, frost: a blow that smashes everything near you, `r` round (`bigR` on the flash). A frozen
 *  goblin shatters for `frozen`, a chilled one for `chilled`; anything else takes `dmg` of the hold and a chill. */
export const SHATTER_BLOW = { r: 2, bigR: 2.8, frozen: 40, chilled: 24, dmg: 0.6, knock: 5 };
/** Spellblade, storm: a dash `len` tiles through a line of goblins in `time` s (`bigLen` on the flash),
 *  untouchable while it lasts, zapping each within `reach` of its path for `dmg` of the hold and a flinch
 *  (on the flash, a stun of `bigStun`). */
export const DASH = { len: 4, bigLen: 5.5, time: 0.16, reach: 0.9, dmg: 0.8, flinch: 0.4, bigStun: 0.8 };
