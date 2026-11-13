/**
 * The class techniques: three moves or rules a class, taught by its own trainer one at a time, in
 * order, at TECH_LEVELS (drills.ts), each for the next rank's price (Kyle, 2026-11-04: "pure upgrades,
 * not just choosing"). A hero with technique rank n knows the first n of their class, so an old save
 * keeps its ranks and gets moves for them. Once learned they're always on, with any of the class's
 * weapons. The Mage's first is PRIMED SPELLS, its old ranked bump, so a Mage with ranks keeps it first.
 * Every number they run on is here; the room judges them (sim/techwarrior.ts, techrogue.ts,
 * techranger.ts, techcleric.ts, techmage.ts).
 */
import { WEAPONS, type HeroClass, type WeaponId } from './weapons.js';
import type { Drills } from './drills.js';

export type TechId =
  | 'slam' | 'shoulder' | 'ironfeet'
  | 'knifework' | 'slip' | 'cutpurse'
  | 'trapper' | 'quicknock' | 'steady'
  | 'mending' | 'sanctstep' | 'judgement'
  | 'primed' | 'attuned' | 'spellthief';

/** Each class's three, in the order they're taught. */
export const TECHS: Record<HeroClass, TechId[]> = {
  WARRIOR: ['slam', 'shoulder', 'ironfeet'],
  ROGUE: ['knifework', 'slip', 'cutpurse'],
  RANGER: ['trapper', 'quicknock', 'steady'],
  HEALER: ['mending', 'sanctstep', 'judgement'],
  MAGE: ['primed', 'attuned', 'spellthief'],
};

/** The name on the trainer's row and what it does (Kyle's style: the effect first, plainly). */
export const TECH_WORDS: Record<TechId, { name: string; text: string }> = {
  slam: { name: 'WIDE SLAM', text: 'Slamming a goblin also kills the small goblins right next to it.' },
  shoulder: { name: 'STRIDING BLOW', text: 'Walk one way for 1 s and your next blow knocks the first goblin it hits flat.' },
  ironfeet: { name: 'IRON FEET', text: 'While you charge a blow, hits don\'t knock you back or stagger you.' },
  knifework: { name: 'KNIFEWORK', text: 'Backstabs make the goblin bleed for 3 s.' },
  slip: { name: 'SLIP AWAY', text: 'Kill with a backstab and goblins lose you for 2 s.' },
  cutpurse: { name: 'CUTPURSE', text: 'A backstab has a 1 in 4 chance to knock a few coins loose, once per goblin.' },
  trapper: { name: 'TRAPPER', text: 'Each snare catches two goblins, not one.' },
  quicknock: { name: 'QUICK NOCK', text: 'After a PERFECT shot, your next draw starts part drawn. A crossbow loads at once.' },
  steady: { name: 'STEADY AIM', text: 'Your shots don\'t drift while you move.' },
  mending: { name: 'HELPING HAND', text: 'Help friends up 50% faster.' },
  sanctstep: { name: 'WALKING SANCTUARY', text: 'Sanctuary\'s blessed ground moves with you for its first 3 s.' },
  judgement: { name: 'JUDGEMENT', text: 'Hit a goblin that\'s attacking a friend and it\'s stunned for 1 s.' },
  primed: { name: 'PRIMED SPELLS', text: 'Primed spells do 80% more damage, not 50%.' },
  attuned: { name: 'ATTUNED', text: 'Fire burns 50% longer, three chills in a row freeze a goblin, and storm does 75% more to wet goblins, not 50%.' },
  spellthief: { name: 'MAGIC BACK', text: 'A PERFECT hold gives back half its magic.' },
};

/** SLAM: small goblins within `reach` tiles of the one slammed burst, `most` of them. */
export const SLAM_BURST = { reach: 1.3, most: 4 };
/** SHOULDER CHARGE: `walk` s on the stick within `turn` radians of one way (at least `pace` of a full push)
 *  readies it; it lapses `grace` s after you stop. The first goblin the next blow hits is down `down` s
 *  (a butcher `big` as long), shoved `knock` more. */
export const SHOULDER = { walk: 1, turn: 0.45, pace: 0.5, grace: 0.4, down: 1, big: 0.5, knock: 6 };
/** KNIFEWORK: a backstab's bleed, `time` s (it ticks as a skewer's: shared/venom.ts SKEWER). */
export const KNIFEWORK = { time: 3 };
/** SLIP AWAY: a backstab kill hides you `time` s (the Rogue's vanish rule: no goblin sees you, till you strike). */
export const SLIP = { time: 2 };
/** CUTPURSE: a backstab's `chance` of knocking `min` to `max` gold loose, once a goblin (the floor's
 *  gold was just cut back: about half a coin a goblin, if every one is backstabbed). */
export const CUTPURSE = { chance: 0.25, min: 1, max: 3 };
/** TRAPPER: how many goblins one snare catches. */
export const TRAPPER = { catches: 2 };
/** QUICK NOCK: a perfect shot ends at once, and a draw begun within `within` s of it starts `head` of the
 *  way drawn; a crossbow's perfect bolt loads the next at once (plain, no glint). */
export const QUICK_NOCK = { within: 1.2, head: 0.4 };
/**
 * Aim drift: a Ranger's arrow or bolt loosed on the move strays off the aim, swaying up to `most`
 * radians either way, `sway` radians a second (no dice: it's the bow swaying as you walk). STEADY takes
 * it away. Wind and weather will push here too, later (sim/techranger.ts `drift`).
 */
export const AIM_DRIFT = { most: 0.05, sway: 5.3, moving: 0.05 };
/** MENDING HANDS: a friend comes up `rate` times as fast (on top of a Cleric's own double speed). */
export const MENDING = { rate: 1.5 };
/** SANCTUARY STEP: your blessed ground moves with you for `follow` s after you cast it. */
export const SANCT_STEP = { follow: 3 };
/** JUDGEMENT: a Cleric's blow on a goblin attacking a friend stuns it `stun` s (a butcher `big` as long),
 *  inside the stun cap (shared/stuncap.ts). */
export const JUDGEMENT = { stun: 1, big: 0.5 };

/** PRIMED SPELLS: a primed spell's multiplier goes up by `more` (CHANNEL.primed 1.5 to 1.8). */
export const PRIMED = { more: 0.3 };
/**
 * ATTUNED: fire a Mage sets burns `burn` times as long; chilling hits on a goblin already chilled build
 * up, and the `freezeAt`th freezes it (a wand's icicle counts a third, as one tap is three); storm's
 * bonus on a wet goblin is `wet` (storm's own is 1.5: the wet rule's code reads it through
 * sim/techmage.ts `wetMult`).
 */
export const ATTUNED = { burn: 1.5, freezeAt: 3, wet: 1.75 };
/** SPELLTHIEF: a hold let go on the flash gives back `back` of what it costs (a spellblade's, of what it
 *  would have cost, since its perfect is free already). */
export const SPELLTHIEF = { back: 0.5 };

/** The techniques known at this rank: the first `rank` of the class's. */
export const techsAt = (cls: HeroClass, rank: number) => TECHS[cls].slice(0, Math.max(0, rank));

/** Does this hero (by the class of the weapon in hand, and the ranks paid for) know this technique? */
export function knowsTech(h: { weapon: WeaponId; drills?: Drills }, id: TechId): boolean {
  const cls = WEAPONS[h.weapon]?.cls;
  if (!cls) return false;
  const i = TECHS[cls].indexOf(id);
  return i >= 0 && i < (h.drills?.technique ?? 0);
}
