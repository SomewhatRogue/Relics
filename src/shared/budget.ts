/**
 * What a piece is worth, in points (mods.ts): the armor weights, each weight's frame, the budget a tier
 * gives, and what a rolled piece adds up to. Light and heavy armor are held level here: heavy's frame
 * (a quarter less damage taken, paid for in speed and a shorter, dearer dodge) is worth points light's
 * isn't, so from Fine up light and medium armor get those points back in bigger modifiers. At every
 * tier a light piece and a heavy one add up the same; they spend it differently (Kyle, 2026-11-05).
 * Plain armor has no modifiers to carry it, so plain plate is the better plain piece.
 */
import type { Item, Tier } from './loot.js';
import { MODS, MOD_COUNT, PER_MOD, modPoints, type ArmorKind, type Slot } from './mods.js';
import { costPoints } from './costs.js';
import type { HeroClass } from './weapons.js';

/** How armor moves and takes: walking speed, damage taken, dodge distance and its stamina cost. */
export const ARMOR: Record<ArmorKind, { name: string; speed: number; taken: number; dodge: number; cost: number; steady: boolean }> = {
  light: { name: 'LEATHERS', speed: 1, taken: 1, dodge: 1, cost: 1, steady: false },
  medium: { name: 'MAIL SHIRT', speed: 0.95, taken: 0.88, dodge: 1, cost: 1, steady: false },
  heavy: { name: 'PLATE', speed: 0.88, taken: 0.75, dodge: 0.75, cost: 1.3, steady: true },
};
export const CLASS_ARMOR: Record<HeroClass, ArmorKind> = { WARRIOR: 'heavy', RANGER: 'light', ROGUE: 'light', MAGE: 'light', HEALER: 'medium' };

/** Points for what a frame does that no modifier does: a shorter dodge, a dearer one, standing fast. */
const FRAME_PTS = { dodgeDist: 0.2, dodgeCost: 0.1, steady: 4 };
/** What a weight's frame is worth: less taken counts as TOUGHNESS, slower as SPEED, then the dodge. */
export function frame(kind: ArmorKind): number {
  const a = ARMOR[kind];
  return (1 - a.taken) * 100 * MODS.tough.per - (1 - a.speed) * 100 * MODS.foot.per - (1 - a.dodge) * 100 * FRAME_PTS.dodgeDist -
    (a.cost - 1) * 100 * FRAME_PTS.dodgeCost + (a.steady ? FRAME_PTS.steady : 0);
}
/** The points a lighter weight gets back in its modifiers, to stand level with plate. */
export const lift = (kind: ArmorKind) => Math.max(0, frame('heavy') - frame(kind));

/** The points a tier spends on a piece's modifiers (armor gets its weight's lift from Fine up). */
export function budget(tier: Tier, slot: Slot, armor?: ArmorKind): number {
  const n = MOD_COUNT[tier];
  return n ? n * PER_MOD[tier] + (slot === 'armor' ? lift(armor ?? 'light') : 0) : 0;
}

/** What a piece adds up to: its modifiers, its frame if it's armor, less its cost. */
export function itemPoints(it: Item): number {
  const mods = (it.mods ?? []).reduce((s, m) => s + modPoints(m), 0);
  return mods + (it.slot === 'armor' ? frame(it.armor ?? 'light') : 0) - (it.cost ? costPoints(it.cost) : 0);
}

/** How well a piece rolled for its tier: 1 is the middle of the band, 0.8 the bottom, 1.2 the top. */
export function rollQuality(it: Item): number {
  if (!it.mods?.length) return 1;
  // A weapon's modifiers each take a tier's share (a Forged one with an element has one fewer); armor
  // and rings spread the whole budget over however many their list allowed.
  const want = (it.slot ?? 'weapon') === 'weapon' ? PER_MOD[it.quality] * it.mods.length : budget(it.quality, it.slot!, it.armor);
  if (!want) return 1;
  return it.mods.reduce((s, m) => s + modPoints(m), 0) / want;
}
