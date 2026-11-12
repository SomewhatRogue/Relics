/**
 * Each class's own built-in move on its own button (Kyle, 2026-11-05): the Warrior's GRAB and the Mage's
 * ELEMENT had one; the Rogue, Ranger and Healer get theirs here. Taught in the wood (sim/woodsign.ts),
 * there from the start for anyone past it. One button a hero, so one press counter (`Intent.signSeq`)
 * and one key on a laptop, V (beside the Mage's X). The room's rules: sim/signature.ts.
 * In the code the Healer's is `heal` (Kyle's word; the town works own "mend"); MEND is its button word.
 */
import { SHADOWSTEP } from './magic.js';
import type { HeroClass } from './weapons.js';

export type SignId = 'shadow' | 'mark' | 'heal';

/** Whose is which (a Warrior's GRAB and a Mage's ELEMENT have their own buttons already). */
export const SIGN_OF: Partial<Record<HeroClass, SignId>> = { ROGUE: 'shadow', RANGER: 'mark', HEALER: 'heal' };
export const signOf = (cls: HeroClass): SignId | null => SIGN_OF[cls] ?? null;

/** The laptop's key for it. */
export const SIGN_KEY = 'V';

/**
 * The Ranger's MARK: the goblin nearest the aim (a laptop's mouse; a phone's, the one faced, within
 * `face` radians, else the nearest) within `range` tiles is marked for `time` s, `cooldown` s apart.
 * It takes `dmg` times the damage from everyone; this Ranger's arrows and bolts bend toward it at up to
 * `bend` radians a second while it's within `cone` radians of their path; the hound goes for it.
 * One mark a Ranger: a new one takes the old one off.
 */
/**
 * MARK's bite (Kyle, 2026-11-05: "doesn't feel like it really does more... a set increase for small
 * hits and a percent increase for all heavy attacks"): every quick blow, arrow or bolt on a marked
 * goblin takes `flat` more on top, every heavy one `heavy` times as much, and a burn or poison tick
 * `tick` times. Each real hit says so: a gold number, a gold ring, and a little more weight (fx.ts).
 */
export const MARK_SIGN = { cooldown: 10, range: 9, time: 8, flat: 5, heavy: 1.4, tick: 1.15, bend: 0.6, cone: 0.35, face: 0.8 };

/**
 * The Healer's MEND (`heal` in the code): `heal` health to the worst-off hurt friend within `range` tiles
 * (the nearer of two within `tie` of each other), or to yourself if nobody near is hurt or you're worse
 * off than them by more than `selfFirst` of your health (Kyle, 2026-11-06: "Cleric could heal friends
 * only self with V": it went to you whenever you were the least bit worse off, and reached only 4 tiles).
 * `cooldown` s apart, `cost` stamina. Never a goblin. Nobody hurt, or short of breath: the press does
 * nothing and costs nothing. Who it would reach now wears a gold mark while it's ready (client/signdraw.ts).
 */
export const HEAL_SIGN = { cooldown: 12, range: 6, heal: 25, cost: 20, selfFirst: 0.25, tie: 0.02 };

/** Each one's button word and its wait. */
export const SIGNS: Record<SignId, { name: string; cooldown: number }> = {
  shadow: { name: 'SHADOW STEP', cooldown: SHADOWSTEP.cooldown },
  mark: { name: 'MARK', cooldown: MARK_SIGN.cooldown },
  heal: { name: 'MEND', cooldown: HEAL_SIGN.cooldown },
};

/** What each does, in a line (BUTTONS, the class card). Kyle's style; for the lore keeper and line editor. */
export const SIGN_WORDS: Record<SignId, string> = {
  shadow: "Step out of the dark behind the goblin you face. It's stunned for a second.",
  mark: "Mark the goblin you aim at for 8 s. Anyone's quick hits on it do +50 damage, heavy hits +40%. Your arrows bend toward it, and your hound goes for it.",
  heal: "Heal whichever friend near you is worst hurt for 25. If nobody near is hurt, or you're in a much worse way than they are, it heals you. Costs 20 stamina. The gold mark shows who it'll reach.",
};

/** Marked by a Ranger now (for the room, and to draw it on every screen). */
export const isMarked = (e: { markedBy?: string; markedUntil?: number }, now: number) => !!e.markedBy && (e.markedUntil ?? -9) > now;
