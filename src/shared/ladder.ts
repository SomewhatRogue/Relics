/**
 * The movement ladder (Kyle, 2026-11-04: "pure upgrades, not just choosing"): three rungs a class, each
 * a step up on the class's dodge or, with no dodge, what stands in for it (the Healer's guard, the
 * Warrior's block). Every class gets every rung, taught by its own trainer one at a time, in order, at
 * LADDER_LEVELS for the `ladder` drill's next rank (drills.ts). The save keeps `drills.ladder` as the
 * count, so an old hero starts with none. Every number the room judges them by is here (re-exported by
 * tuning.ts); the rules are sim/ladder*.ts, sim/taunt.ts and sim/holyguard.ts, the tells client/fxladder.ts.
 */
import { WEAPONS, type HeroClass, type WeaponId } from './weapons.js';
import type { Drills } from './drills.js';

export type RungId =
  | 'airshot' | 'twinsnare' | 'landing'
  | 'blinkburst' | 'blinkthrough' | 'halfblink'
  | 'caltrops' | 'underlegs' | 'shakeoff'
  | 'shelter' | 'allyward' | 'blockmend'
  | 'tauntguard' | 'ironstance' | 'standfast';

/** The levels the three rungs are taught at (the chapter's level cap holds the third back for now). */
export const LADDER_LEVELS = [5, 10, 15];

/** Each class's three, in the order they're taught. */
export const RUNGS: Record<HeroClass, RungId[]> = {
  // (Jump Shot folded into the trainer's lesson, Kyle 2026-11-23: Hard Landing first, Two Arrows, then FULL DRAW in
  // the old Jump Shot's id.)
  RANGER: ['landing', 'twinsnare', 'airshot'],
  MAGE: ['blinkburst', 'blinkthrough', 'halfblink'],
  ROGUE: ['caltrops', 'underlegs', 'shakeoff'],
  HEALER: ['shelter', 'allyward', 'blockmend'],
  WARRIOR: ['tauntguard', 'ironstance', 'standfast'],
};

/** The trainer's section for it: the dodge it climbs, by the name the button wears. */
export const LADDER_TITLE: Record<HeroClass, string> = { RANGER: 'JUMP', MAGE: 'BLINK', ROGUE: 'DASH', HEALER: 'GUARD', WARRIOR: 'GUARD' };

/** The name on the trainer's row and what it does (Kyle's style: the effect first, plainly). */
export const RUNG_WORDS: Record<RungId, { name: string; text: string }> = {
  airshot: { name: 'FULL DRAW', text: 'Leap shot arrows hit as hard as a full draw.' },
  twinsnare: { name: 'TWO ARROWS', text: 'Leap shot fires two arrows.' },
  landing: { name: 'HARD LANDING', text: 'Landing a jump knocks small goblins next to you flat for 0.8 s.' },
  blinkburst: { name: 'BLINK BURST', text: 'Blinking leaves a burst of your element where you stood: 100 damage to goblins in it.' },
  // (Kept its old id: it was BLINK THROUGH, out behind a goblin, till 2026-11-16, Kyle: "not super helpful".)
  blinkthrough: { name: 'RECALL', text: 'Blink again within 3 s to snap back to where you started.' },
  halfblink: { name: 'PERFECT BLINK', text: 'A blink within 2 s of a PERFECT hold costs half the magic.' },
  caltrops: { name: 'CALTROPS', text: 'Your dash drops caltrops where you started, once every 5 s. Goblins on them slow down and bleed.' },
  underlegs: { name: 'SHADOW SMOKE', text: 'Your dash leaves a shadow that goblins chase, and when it fades it bursts into smoke.' },
  shakeoff: { name: 'SHAKE OFF', text: 'Dashing clears your poison, and fire on the floor can\'t burn you for 1 s.' },
  shelter: { name: 'SHELTER', text: 'While you block, friends within 2 tiles take 30% less damage.' },
  // (Kyle, 2026-11-05: "you AND an ally, the ally for free but again stamina drain"; it took COVER's place.)
  allyward: { name: 'SHARED WARD', text: 'Your guard also covers the nearest friend within 3 tiles, and they take no damage. Covering them drains your stamina.' },
  blockmend: { name: 'HEALING BLOCK', text: 'Each blow you block heals friends within 3 tiles for 50.' },
  // The Warrior's guard took the roar's place (Kyle, 2026-11-06).
  tauntguard: { name: 'TAUNT GUARD', text: 'While you hold block, goblins within 4 tiles come for you.' },
  ironstance: { name: 'IRON STANCE', text: 'A blocked blow costs 22 stamina, however hard it hits. The goblin is thrown back, and nothing can hurt you for half a second.' },
  standfast: { name: 'STAND FAST', text: 'Goblins your TAUNT GUARD draws to you do 30% less damage, and no blow knocks you back while you block.' },
};


/** JUMP SHOT: an attack press mid-jump looses the bow at once, `draw` of a full draw (a crossbow its bolt), once a jump. */
export const AIR_SHOT = { draw: 0.6 };
/** TWO SNARES: the jump's snares sit `apart` tiles apart across the jump, and twice as many can be down. */
export const TWIN_SNARE = { apart: 1.1 };
/** The Ranger's trainer lesson (Kyle, 2026-11-16: "a quick shot WHILE it jumps back - not a trap"): `at` s
 *  into the jump it looses an arrow at `draw` of a full draw, turned to the goblins, no sooner than every
 *  `cooldown` s; TWO ARROWS and EXTRA ARROW add one each, `spread` radians apart (sim/ladderranger.ts). */
export const JUMP_SHOT = { at: 0.06, draw: 0.5, cooldown: 2.5, spread: 0.2 };
/** HARD LANDING: small goblins within `r` tiles of where you land are down `down` s, shoved `knock` outward. */
export const LANDING = { r: 1.3, down: 0.8, knock: 4 };
/** BLINK BURST: `r` tiles round where you blinked from, `dmg` and your element on each goblin in it,
 *  drawn for `show` s at the same size. */
export const BLINK_BURST = { r: 1.4, dmg: 10, show: 0.35 };
/** A Mage's blink trap, the trainer's lesson (sim/blinktrap.ts). */
export const BLINK_TRAP = { r: 0.6, burst: 1.6, dmg: 30, stun: 1, life: 12, max: 2, cooldown: 4 };
/** RECALL (the rung's id is still `blinkthrough`): for `window` s after a blink, a dodge press snaps you back
 *  to where it started, whatever the blink's wait, for nothing; once a blink. `safe` s of i-frames on arrival. */
export const RECALL = { window: 3, safe: 0.15 };
/** PERFECT BLINK: a blink begun within `within` s of a PERFECT hold costs `cost` of its magic. */
export const HALF_BLINK = { within: 2, cost: 0.5 };
/** CALTROPS: dropped where the dash began, at most every `every` s, `r` tiles round, for `life` s, `most`
 *  down at once. A goblin on them moves at `slow` and bleeds `bleed` s (a skewer's ticks). */
export const CALTROPS = { every: 5, r: 0.9, life: 6, most: 2, slow: 0.5, bleed: 3 };
/** SHADOW SMOKE (id 'underlegs', from when it was THROUGH THE LEGS): the dash's shadow, faded, leaves smoke
 *  `r` tiles round for `time` s (Kyle, 2026-11-23). The rung gives the shadow itself too. */
export const SHADOW_SMOKE = { r: 1.8, time: 3 };
/** SHAKE IT OFF: a dash clears poison, and fire underfoot can't burn you for `fireproof` s. */
export const SHAKE_OFF = { fireproof: 1 };
/** SHELTER: friends within `reach` tiles of a Healer holding a block take `taken` of a blow. */
export const SHELTER = { reach: 2, taken: 0.7 };
/** HEALING BLOCK: each blow a Healer blocks heals friends within `reach` tiles for `heal` (was HEALING
 *  PARRY, 8 a parry; less now, since a block is far easier to make than a parry was: 2026-11-05). */
export const BLOCK_MEND = { reach: 3, heal: 5 };
/** SHARED WARD: the nearest friend within `reach` tiles of a Cleric holding their guard takes nothing from
 *  a blow the guard could stop (not a striped one); while it covers someone it drains `drain` stamina a second. */
export const ALLY_WARD = { reach: 3, drain: 8 };
/**
 * The Warrior's guard (Kyle, 2026-11-05/06: the guard grows like the dodge does, and replaces the roar).
 * TAUNT GUARD: while the block is held, goblins within `reach` tiles come for the Warrior, and stay on
 * them `linger` s after it drops; its ring is drawn `show` s each time the block goes up (at most every
 * `every` s). IRON STANCE: a blocked blow costs a flat `cost` stamina, the goblin is thrown back `knock`
 * and staggers `stagger` s, and nothing lands on the Warrior for `untouchable` s. No timing. STAND FAST:
 * goblins the guard has drawn hit `soft` as hard, and a block shoves you nowhere.
 */
export const TAUNT_GUARD = { reach: 4, linger: 1, show: 0.45, every: 1 };
export const IRON_STANCE = { cost: 22, knock: 8, stagger: 0.5, untouchable: 0.5 };
export const STAND_FAST = { soft: 0.7 };

/** The rungs known at this rank: the first `rank` of the class's. */
export const rungsAt = (cls: HeroClass, rank: number) => RUNGS[cls].slice(0, Math.max(0, rank));

/** Does this hero (by the class of the weapon in hand, and the rungs paid for) know this rung? */
export function knowsRung(h: { weapon: WeaponId; drills?: Drills }, id: RungId): boolean {
  const cls = WEAPONS[h.weapon]?.cls;
  if (!cls) return false;
  const i = RUNGS[cls].indexOf(id);
  return i >= 0 && i < (h.drills?.ladder ?? 0);
}
