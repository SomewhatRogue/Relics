/**
 * The Mage's spellbook (Kyle, 2026-11-04): the element is the spellbook and the weapon the range. The
 * element (switched on its own button) decides what the tap and the hold are; the wand casts them at
 * range, the staff close and centred on you, the spellblade in melee. Every number the room judges by
 * is here, and the client draws the same shapes from them (client/spellground.ts, fxspells.ts).
 *
 * Balance (measured in tests/spellbook.test.ts, written into docs/DECISIONS.md): on one goblin each
 * element's tap does about the same a second, fire's burn counted (the wand's storm stream a little more
 * once built). The hold is the big hit: fire burns the most goblins, frost trades damage for freezing
 * them, storm hits one hardest, ignores shields and is best on wet goblins.
 */
import type { Element } from './magic.js';

export type MageKit = 'wand' | 'staff' | 'spellblade';
export const MAGE_KITS: MageKit[] = ['wand', 'staff', 'spellblade'];

/**
 * Each kit's tap in each element: the kit's own blow times `dmg`. Fire sets alight, frost chills (slows
 * feet and wind-ups; a tap never freezes), storm ignores shields and jumps only between wet goblins
 * (shared/magic.ts STORM). The wand's frost tap is ICICLES of them, each `dmg` of the spark; its storm
 * tap feeds the STREAM (its ticks are STREAM.tick of the spark).
 */
export const TAPS: Record<MageKit, Record<Element, { dmg: number }>> = {
  wand: { fire: { dmg: 0.9 }, frost: { dmg: 0.45 }, storm: { dmg: 1 } },
  staff: { fire: { dmg: 0.65 }, frost: { dmg: 1.05 }, storm: { dmg: 1.05 } },
  spellblade: { fire: { dmg: 0.6 }, frost: { dmg: 1 }, storm: { dmg: 1 } },
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

/**
 * Wand, storm tap (Kyle, 2026-11-04: "a continuous stream of lightning from the hand that builds the
 * longer it stays on, but you can't move fast while using it"). Each tap (its swing `windup` and
 * `recover` s, quick, so mashing keeps up) keeps the stream on `keep` s more. It latches on the nearest
 * goblin within `reach` tiles and `cone` degrees either side of where you face, and holds it while it
 * stays within `reach` + `slack` and `keepCone` degrees. Every `every` s it deals `tick` of the spark
 * times its build, which climbs from 1 to `top` over `build` s on the same goblin and starts again if
 * the stream breaks off or the goblin dies (it then takes the next one). While it's on, you walk at
 * `pace` of your speed. Wet, it lands STORM.wet harder and jumps on (shared/magic.ts), every tick. The
 * goblin it holds flashes hit once every `flicker` s, not every tick (drawing only).
 */
export const STREAM = { reach: 5, slack: 0.5, cone: 20, keepCone: 50, keep: 0.35, every: 0.1, tick: 0.12, build: 2, top: 2.5, pace: 0.4, windup: 0.08, recover: 0.12, flicker: 0.3 };

/** Wand, storm hold: a lightning bolt thrown from the hand straight along the aim (turned onto a goblin
 *  within `assist` degrees of it), `range` tiles at most (a wall stops it), `width` either side of its line. It hits the first goblin for `dmg` of the hold,
 *  whatever shield it holds. Let go on the flash: it runs through every goblin on the line, and breaks
 *  off whatever they're doing. */
export const THUNDERBOLT = { range: 9, width: 0.3, assist: 12, dmg: 2.5 };

/** The staff's frost and storm holds are centred on the Mage (Kyle: "wall of fire seems hard to aim"):
 *  `r` tiles round at the shortest hold, `rFull` at a full one, `rBig` let go on the white flash. */
export const STAFF_RING = { r: 2.2, rFull: 2.8, rBig: 3.4 };
/**
 * Staff, fire: a fire pit dropped on a goblin (Kyle, 2026-11-05: "Maybe it is a circle on the enemy or
 * something? Like a filled-in AOE? Allies gotta run from it"). Never aimed: at the release it picks the
 * nearest goblin within `reach` tiles and `cone` degrees (all told) of where you face, else the nearest
 * within `reach` anywhere, else a spot `ahead` tiles in front (short of a wall). It catches for `catch` s
 * (drawn as the circle filling), then burns `r` round (`bigR` on the flash) for `life` s (`bigLife`; rain
 * shortens it by the weather's burn share, shared/sky.ts burnFor). Every `every` s each goblin in it takes
 * `dmg` (times the hero's damage) and is set alight; each friend in it, the Mage too, takes `ally` of
 * what a goblin loses a tick there (the pit's `dmg` and a burn's tick), so they step out.
 * Balance (tests/spellbook.test.ts): on one goblin, or a pack, it does about what the charged ring does.
 */
export const FIRE_PIT = { reach: 6, cone: 90, ahead: 3, catch: 0.35, r: 1.8, bigR: 2.4, life: 4, bigLife: 6, every: 0.5, dmg: 2, ally: 1 / 3 };
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
