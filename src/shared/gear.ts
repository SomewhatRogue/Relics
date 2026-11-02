/**
 * Gear: tiers, modifiers, armor and rings. A weapon's type says HOW it attacks (weapons.ts); its
 * modifiers say how WELL. Plain (white) has none; Fine (green) one small; Forged (blue) two, or one
 * and an element; Tolmouth (purple) two large and a trait; Hungry (red) is the greed tier (hungry.ts).
 * Everything here moves a number the fight already uses (gearStats), so the card shows the truth.
 */
import type { Rng } from './rng.js';
import { ELEMENT_TRAITS, traitsFor, type Item, type Tier } from './loot.js';
import { CLASS_KITS, type HeroClass, type WeaponId } from './weapons.js';

export const TIERS: Record<Tier, { name: string; col: string; mods: number; step: number; cap: number }> = {
  plain: { name: 'PLAIN', col: '#e8e4ee', mods: 0, step: 0, cap: 2 },
  fine: { name: 'FINE', col: '#7fd07a', mods: 1, step: 0, cap: 3 },
  forged: { name: 'FORGED', col: '#6aa8ff', mods: 2, step: 1, cap: 4 },
  tolmouth: { name: 'TOLMOUTH', col: '#b57aff', mods: 2, step: 2, cap: 5 },
  hungry: { name: 'HUNGRY', col: '#ff4a3a', mods: 3, step: 3, cap: 0 },
};
export const TIER_ORDER: Tier[] = ['plain', 'fine', 'forged', 'tolmouth', 'hungry'];

export type ModId = 'damage' | 'quick' | 'reach' | 'draw' | 'parry' | 'guard' | 'knock' | 'health' | 'tough' | 'breath' | 'foot' | 'dodge' | 'focus' | 'mending';
export interface Mod { id: ModId; v: number }
type Slot = 'weapon' | 'armor' | 'ring';

/** Each modifier: its name, where it rolls, and the middle of its band at Fine, Forged, Tolmouth, Hungry. */
export const MODS: Record<ModId, { name: string; on: Slot[]; mid: [number, number, number, number]; unit: '%' | 's' | '' }> = {
  damage: { name: 'DAMAGE', on: ['weapon', 'ring'], mid: [0.05, 0.1, 0.15, 0.25], unit: '%' },
  quick: { name: 'QUICKNESS', on: ['weapon', 'ring'], mid: [0.04, 0.08, 0.12, 0.18], unit: '%' },
  reach: { name: 'REACH', on: ['weapon'], mid: [0.05, 0.1, 0.15, 0.2], unit: '%' },
  draw: { name: 'DRAW', on: ['weapon'], mid: [0.06, 0.12, 0.18, 0.25], unit: '%' },
  parry: { name: 'PARRY', on: ['weapon', 'ring'], mid: [0.02, 0.04, 0.06, 0.08], unit: 's' },
  guard: { name: 'GUARD', on: ['weapon', 'armor'], mid: [0.06, 0.12, 0.18, 0.25], unit: '%' },
  knock: { name: 'KNOCK', on: ['weapon'], mid: [0.1, 0.2, 0.3, 0.45], unit: '%' },
  health: { name: 'HEALTH', on: ['armor', 'ring'], mid: [5, 10, 15, 25], unit: '' },
  tough: { name: 'TOUGHNESS', on: ['armor'], mid: [0.03, 0.05, 0.08, 0.12], unit: '%' },
  breath: { name: 'BREATH', on: ['armor', 'ring'], mid: [0.05, 0.1, 0.15, 0.25], unit: '%' },
  foot: { name: 'FOOTWORK', on: ['armor', 'ring'], mid: [0.03, 0.05, 0.08, 0.1], unit: '%' },
  dodge: { name: 'DODGE', on: ['armor', 'ring'], mid: [0.06, 0.12, 0.18, 0.25], unit: '%' },
  focus: { name: 'FOCUS', on: ['ring'], mid: [0.05, 0.1, 0.15, 0.2], unit: '%' },
  mending: { name: 'MENDING', on: ['weapon', 'ring'], mid: [0.05, 0.1, 0.15, 0.25], unit: '%' },
};
/** What each modifier does, in words, for the card (sign shown by the value). */
export const MOD_TEXT: Record<ModId, string> = {
  damage: 'every hit and shot', quick: 'faster swings and casts', reach: 'blade reach, shot range', draw: 'faster to a full charge or draw',
  parry: 'a longer parry window', guard: 'less through a block, less breath to block', knock: 'hits throw further', health: 'more health',
  tough: 'less damage taken', breath: 'breath comes back faster', foot: 'faster on your feet', dodge: 'dodge again sooner',
  focus: 'skill and relic recharge sooner', mending: 'every heal you give',
};
/** Most a full set can stack, so gear never breaks the fight. */
export const CAPS: Partial<Record<ModId, number>> = { damage: 0.5, quick: 0.3, tough: 0.3, draw: 0.5, guard: 0.6, foot: 0.25, dodge: 0.4, focus: 0.4, breath: 0.6, reach: 0.4 };

export type ArmorKind = 'light' | 'medium' | 'heavy';
/** How armor moves and takes: walking speed, damage taken, dodge distance and its breath cost. */
export const ARMOR: Record<ArmorKind, { name: string; speed: number; taken: number; dodge: number; cost: number; steady: boolean }> = {
  light: { name: 'LEATHERS', speed: 1, taken: 1, dodge: 1, cost: 1, steady: false },
  medium: { name: 'MAIL SHIRT', speed: 0.95, taken: 0.88, dodge: 1, cost: 1, steady: false },
  heavy: { name: 'PLATE', speed: 0.88, taken: 0.75, dodge: 0.75, cost: 1.3, steady: true },
};
export const CLASS_ARMOR: Record<HeroClass, ArmorKind> = { WARRIOR: 'heavy', RANGER: 'light', ROGUE: 'light', MAGE: 'light', HEALER: 'medium' };
/** Upgrades: per level, mods grow by a sixth; a weapon +3% damage, armor 1% less taken, a ring +2 health. */
export const LEVEL = { mods: 1 / 6, damage: 0.03, tough: 0.01, health: 2 };

export const slotOf = (i: Item): Slot => i.slot ?? 'weapon';

/** Halvard's levels: gold and steel for each next level (index = the level reached). Steel from melting by tier. */
export const UPGRADE = [null, { gold: 30, steel: 2 }, { gold: 60, steel: 5 }, { gold: 120, steel: 10 }, { gold: 200, steel: 20 }, { gold: 320, steel: 35 }];
export const STEEL: Record<Tier, number> = { plain: 1, fine: 3, forged: 8, tolmouth: 20, hungry: 0 };
export const REROLL = 40;
/** What Halvard pays for a packed piece (never a hungry one), plus a little for each level on it. Given
 *  to the town works instead, a piece counts for `GIVE_MULT` times that toward the work. */
export const SELL: Record<Tier, number> = { plain: 4, fine: 12, forged: 35, tolmouth: 90, hungry: 0 };
export const GIVE_MULT = 1.5;
export const sellValue = (i: Item) => (i.quality === 'hungry' ? 0 : SELL[i.quality] + (i.level ?? 0) * 8);
export const giveValue = (i: Item) => Math.round(sellValue(i) * GIVE_MULT);
/** The next level's price, or null at the tier's cap (and never for hungry gear). */
export const nextLevel = (i: Item) => ((i.level ?? 0) < TIERS[i.quality].cap ? UPGRADE[(i.level ?? 0) + 1] : null);

/** Ivo's reroll: modifier `k` becomes a different one this slot can roll, at the same tier. */
export function reroll(rng: Rng, i: Item, k: number, cls: HeroClass): Item {
  const slot = slotOf(i), have = (i.mods ?? []).map((m) => m.id);
  const pool = (Object.keys(MODS) as ModId[]).filter((id) => MODS[id].on.includes(slot) && !have.includes(id) && (id !== 'mending' || cls === 'HEALER'));
  if (!pool.length || !i.mods?.[k]) return i;
  const id = rng.pick(pool), mods = [...i.mods];
  mods[k] = { id, v: value(rng, id, TIERS[i.quality].step) };
  return { ...i, mods };
}

/** Roll a modifier's value in its band (a fifth either side of the middle), rounded to look tidy. */
function value(rng: Rng, id: ModId, step: number): number {
  const v = MODS[id].mid[step] * (0.8 + rng.next() * 0.4);
  return MODS[id].unit === '' ? Math.round(v) : MODS[id].unit === 's' ? Math.round(v * 100) / 100 : Math.round(v * 100) / 100;
}

/** Roll a piece of gear of `tier` for `slot` (a weapon of `kit`, or any of the class's). Hungry gear comes from hungry.ts. */
export function rollGear(rng: Rng, cls: HeroClass, tier: Tier, slot: Slot = 'weapon', kit?: WeaponId, armor?: ArmorKind): Item {
  const t = tier === 'hungry' ? 'tolmouth' : tier, n = TIERS[t].mods, out: Item = { slot, quality: t, traits: [], mods: [], level: 0 };
  if (slot === 'weapon') out.kit = kit ?? rng.pick(CLASS_KITS[cls]);
  if (slot === 'armor') out.armor = armor ?? rng.pick(['light', 'medium', 'heavy'] as ArmorKind[]);
  const pool = (Object.keys(MODS) as ModId[]).filter((id) => MODS[id].on.includes(slot) && (id !== 'mending' || cls === 'HEALER'));
  // Forged: half the time one modifier and an element instead of two.
  const element = slot === 'weapon' && t === 'forged' && rng.next() < 0.5;
  for (let i = 0; i < n - (element ? 1 : 0) && pool.length; i++) {
    const id = pool.splice(Math.floor(rng.next() * pool.length), 1)[0];
    out.mods!.push({ id, v: value(rng, id, TIERS[t].step) });
  }
  if (element) out.traits.push(rng.pick(ELEMENT_TRAITS));
  if (slot === 'weapon' && t === 'tolmouth') out.traits.push(rng.pick(traitsFor(out.kit!)));
  return out;
}

/** Odds of each tier by where it came from (danger shifts every roll one tier up). */
const ODDS: Record<'scrapper' | 'butcher' | 'named' | 'chest', [Tier, number][]> = {
  scrapper: [['plain', 0.6], ['fine', 0.4]],
  butcher: [['fine', 0.55], ['forged', 0.3], ['tolmouth', 0.15]],
  named: [['forged', 0.65], ['tolmouth', 0.3], ['hungry', 0.05]],
  chest: [['plain', 0.4], ['fine', 0.3], ['forged', 0.18], ['tolmouth', 0.09], ['hungry', 0.03]],
};
export function rollTier(rng: Rng, from: keyof typeof ODDS, shift = 0): Tier {
  let r = rng.next(), t: Tier = ODDS[from][ODDS[from].length - 1][0];
  for (const [tier, p] of ODDS[from]) if ((r -= p) < 0) { t = tier; break; }
  return t === 'hungry' ? t : TIER_ORDER[Math.min(3, TIER_ORDER.indexOf(t) + shift)];
}

/** Old saves: a weapon with a trait and no modifiers becomes Tolmouth, keeping what it had. */
export function upgradeOld(i: Item): Item {
  if (i.mods) return i;
  return { ...i, slot: 'weapon', quality: i.traits.length ? 'tolmouth' : 'plain', mods: [], level: 0 };
}

export type GearStats = Record<ModId, number> & { speed: number; taken: number; dodgeDist: number; dodgeCost: number; steady: boolean };

/** What everything worn adds up to (with each item's level, and the caps). */
export function gearStats(weapon: Item | undefined, armor: Item | null | undefined, rings: Item[] = []): GearStats {
  const s = Object.fromEntries((Object.keys(MODS) as ModId[]).map((k) => [k, 0])) as Record<ModId, number>;
  for (const it of [weapon, armor, ...rings]) {
    if (!it) continue;
    const lv = it.level ?? 0, grow = 1 + lv * LEVEL.mods;
    for (const m of it.mods ?? []) s[m.id] += m.v * grow;
    if (slotOf(it) === 'weapon') s.damage += lv * LEVEL.damage;
    if (slotOf(it) === 'armor') s.tough += lv * LEVEL.tough;
    if (slotOf(it) === 'ring') s.health += lv * LEVEL.health;
  }
  for (const [k, cap] of Object.entries(CAPS)) s[k as ModId] = Math.min(cap!, s[k as ModId]);
  const a = ARMOR[armor?.armor ?? 'light'];
  return { ...s, speed: a.speed * (1 + s.foot), taken: a.taken * (1 - s.tough), dodgeDist: a.dodge, dodgeCost: a.cost, steady: a.steady };
}
