/**
 * Item level (docs/design/gear-levels.md section 1, Kyle 2026-11-14): the second axis beside the tier.
 * Every drop is the level of where it dropped (the party's level, the Deep's band and an elite's levels
 * on top, a hard place's treasure one more), shown on the card as LV 7. A piece's modifiers (and a rare
 * piece's cost) are about 7% more a level, compounding, so a high purple can out-hit a low red; the
 * level also lifts the base a little (a weapon's damage, armor's toughness, a ring's health), as the old
 * free +1 at level 5 and +2 at 9 did, so even a plain piece from level 8 beats one from level 1.
 * Halvard's pluses (forgeplus.ts) stay on top of all of it.
 *
 * Stored as worth: a piece's modifiers are saved at what they give at its level (`atLevel` grows them
 * once, at the drop), so everything that reads `mods` reads the truth. A piece with no `ilvl` (saved
 * before this, or a unique rolled elsewhere) is read as the level its points say (budget.ts `ilvlOf`),
 * and nothing it gives changes.
 */
import type { Item } from './loot.js';
import { MODS } from './mods.js';
import { COSTS } from './costs.js';

/**
 * `grow`: each level's lift on the modifiers. `most`: the highest level a piece can be (a level-10 party
 * deep in the Deep with an elite on top). `base`: per level past the first, a weapon's damage, armor's
 * less damage taken, a ring's health (added after the caps, as a plus's are).
 */
export const ILVL = { grow: 1.07, most: 20, base: { damage: 0.03, tough: 0.005, health: 0.75 } };

/** A level as a whole number, 1 to ILVL.most. */
export const fitLevel = (lv: number) => Math.max(1, Math.min(ILVL.most, Math.round(Number(lv) || 1)));
/** What a level multiplies a piece's modifiers by (1 at LV 1). */
export const growAt = (lv: number) => ILVL.grow ** (fitLevel(lv) - 1);
/** The item level a drop gets for a party (or room) of level `lv`, `more` on top for a harder place. */
export const dropLevel = (lv: number, more = 0) => fitLevel(lv + more);

/** A value grown by `f`, tidy: percents to a tenth of a percent, flat health to a whole number. */
const tidy = (unit: string, v: number, f: number) => (unit === '' ? Math.max(1, Math.round(v * f)) : Math.round(v * f * 1000) / 1000);

/**
 * The piece raised to item level `lv`: its modifiers and cost grown from its own level to that one. Never
 * lowers a piece, and leaves a piece with no level alone (it reads as its points say). Armor's lighter
 * weights carry points to stand level with plate (budget.ts `lift`); `keep` is that share, which a level
 * doesn't grow, so light and heavy stay level at every level.
 */
export function atLevel(i: Item, lv: number, keep = 0): Item {
  const from = i.ilvl, to = fitLevel(lv);
  if (from === undefined || to <= fitLevel(from)) return i;
  const g = growAt(to) / growAt(from), mods = i.mods ?? [];
  // The share a level grows: everything but the weight's lift, spread over the modifiers by their points.
  const pts = mods.reduce((s, m) => s + (MODS[m.id] ? (MODS[m.id].unit === '' ? m.v : m.v * 100) * MODS[m.id].per : 0), 0);
  const f = pts > 0 ? ((pts - keep) * g + keep) / pts : g;
  const out: Item = { ...i, ilvl: to, mods: mods.map((m) => ({ id: m.id, v: tidy(MODS[m.id]?.unit ?? '%', m.v, f) })) };
  if (i.cost) out.cost = { id: i.cost.id, v: tidy(COSTS[i.cost.id].unit, i.cost.v, g) };
  return out;
}
