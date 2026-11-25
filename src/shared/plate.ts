/**
 * Plate that breaks for good (Kyle, 2026-11-24; docs/design/armor.md). A plated goblin (every ironhide, a Plated
 * elite) carries plate as well as health. Until it runs out an ordinary blow does `through` of itself to health
 * and the whole of itself off the plate; a heavy one (charged, a perfect, a burst) lands in full and takes `heavy`
 * times itself off. At none the plates are off for the rest of the fight. Rules: sim/ironhide.ts.
 */
import type { Foe } from './terrain.js';
import { Rng } from './rng.js';

export const PLATE = {
  /** Plate, as a share of the goblin's health. */
  share: 0.5,
  /** What an ordinary blow does to its health while plated (at least 1). */
  through: 0.2,
  /** A heavy blow takes this many times itself off the plate. */
  heavy: 2,
  /** Lightning lands in full and strips this many times itself (iron draws it). */
  storm: 2,
  /** A rod's strike, a column, a cart: this share of the plate off at once. */
  crack: 0.4,
};

/**
 * Straight through the plate, in full and leaving it be (Kyle, 2026-11-24): crits, bleed, poison, crossbow bolts
 * and anything holy (a smite: the Cleric's light, blessing, censer flare, a mace's smite). Lightning goes through
 * too and strips it (`storm`). Backstabs and burns don't.
 */
export const THROUGH_SRC = ['bleed', 'poison', 'bolt', 'smite'];

/**
 * Who wears it (Kyle's picks, 2026-11-24). From level `from` a share of the brutes and unnamed butchers come plated,
 * `per` more a level up to `most`; each takes one small goblin from its pack, so a room gets tougher, not bigger.
 * A rolled elite's first affix is Plated `elite` of the time (the rest as rolled). Plated goblins are `hp` times as
 * tough; a hunt's named boss wears `boss` of its health in plate (and isn't made tougher: it's in a fury already).
 */
export const PLATE_WEAR = { from: 3, first: 0.15, per: 0.05, most: 0.5, elite: 0.4, hp: 1.25, boss: 0.3 };

/** The share of the big ones plated at hero level `lv`. */
export const plateChance = (lv: number) => (lv < PLATE_WEAR.from ? 0 : Math.min(PLATE_WEAR.most, PLATE_WEAR.first + PLATE_WEAR.per * (lv - PLATE_WEAR.from)));


const big = (f: Foe) => !f.name && !f.boss && ((f.kind === 'scrapper' && f.variant === 'heavy') || f.kind === 'butcher') && !f.elite?.includes('plated');
const small = (f: Foe) => f.kind === 'scrapper' && !f.variant && !f.name;

/** A room's goblins for heroes of level `lv`: some of its big ones in plate, a small one fewer in each one's pack. */
export function plateByLevel(foes: Foe[], lv: number, seed: number): Foe[] {
  const p = plateChance(lv);
  if (p <= 0) return foes;
  const rng = new Rng(seed * 31 + 7), drop = new Set<Foe>();
  for (const f of foes) {
    if (!big(f) || rng.next() >= p) continue;
    f.elite = [...(f.elite ?? []), 'plated'];
    const one = foes.find((g) => small(g) && g.pack === f.pack && !drop.has(g));
    if (one) drop.add(one);
  }
  return drop.size ? foes.filter((f) => !drop.has(f)) : foes;
}
