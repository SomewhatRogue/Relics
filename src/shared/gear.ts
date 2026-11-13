/**
 * Gear: tiers, rolling a piece, upgrades and the sum of what's worn. A weapon's type says HOW it attacks
 * (weapons.ts); its modifiers say how WELL (mods.ts, each worth points); budget.ts holds the weights.
 * Seven tiers, white to red (Kyle, 2026-11-05): PLAIN, FINE, FORGED, PRE-WAR, then the rare and dangerous
 * three, TOUCHED, TURNING and HUNGRY, each stronger and rarer than the last and each with a cost
 * (costs.ts; HUNGRY's are its own, hungry.ts). Ids are as saved; only the names show.
 * Everything here moves a number the fight already uses (gearStats), so the card shows the truth.
 */
import { leanOdds } from './lootlevel.js';
import type { Rng } from './rng.js';
import { ELEMENT_TRAITS, traitsFor, type Item, type Tier } from './loot.js';
import { CLASS_KITS, type HeroClass, type WeaponId } from './weapons.js';
import { CAPS, MODS, MOD_COUNT, PER_MOD, modFits, modPool, modValue, rollMods, type ArmorKind, type ModId, type Slot } from './mods.js';
import { ARMOR, budget } from './budget.js';
import { rollCost } from './costs.js';
import { PLUS, plusCost, plusOf } from './forgeplus.js';
import { deepOdds } from './deeploot.js';
import { jobs } from './coins.js';

export * from './mods.js';
export * from './budget.js';
export * from './forgeplus.js';

/** Each tier: its name, colour and its step up the ladder. Every tier but hungry goes to +5 (forgeplus.ts). */
export const TIERS: Record<Tier, { name: string; col: string; mods: number; step: number }> = {
  plain: { name: 'PLAIN', col: '#e8e4ee', mods: 0, step: 0 },
  fine: { name: 'FINE', col: '#7fd07a', mods: 1, step: 1 },
  forged: { name: 'FORGED', col: '#6aa8ff', mods: 2, step: 2 },
  tolmouth: { name: 'PRE-WAR', col: '#b57aff', mods: 2, step: 3 },
  touched: { name: 'TOUCHED', col: '#f2d54a', mods: 3, step: 4 },
  turning: { name: 'TURNING', col: '#ff9330', mods: 3, step: 5 },
  hungry: { name: 'HUNGRY', col: '#ff3a2e', mods: 3, step: 6 },
};
export const TIER_ORDER: Tier[] = ['plain', 'fine', 'forged', 'tolmouth', 'touched', 'turning', 'hungry'];
/** The rare three: strong, dangerous, each with a cost. */
export const RARE: Tier[] = ['touched', 'turning', 'hungry'];
export const tierAtLeast = (t: Tier, floor: Tier) => TIER_ORDER.indexOf(t) >= TIER_ORDER.indexOf(floor);

/**
 * Striking it yourself at the anvil (forgestrike.ts): a well struck upgrade counts for a little more than
 * a level, at most `max` of a level more (from `floor` to all of that, by the strike's seed). Never more
 * than `max` for every level a piece has, whatever a save says.
 */
export const TEMPER = { max: 0.2, floor: 0.75 };
export const temperOf = (i: Item) => Math.max(0, Math.min(plusOf(i) * TEMPER.max, Number(i.temper) || 0));
/** The levels a piece counts for: its plus and what striking it well added (forgeplus.ts PLUS per level). */
export const levelOf = (i: Item) => plusOf(i) + temperOf(i);

export const slotOf = (i: Item): Slot => i.slot ?? 'weapon';

/** Steel from melting a piece down, by tier. */
export const STEEL: Record<Tier, number> = { plain: 1, fine: 3, forged: 8, tolmouth: 20, touched: 30, turning: 45, hungry: 0 };
export const REROLL = jobs(0.5);
/** The next plus's price, or null at +5 (and never for hungry gear): forgeplus.ts. */
export const nextLevel = plusCost;

/** Ivo's reroll: modifier `k` becomes a different one this piece can roll, worth what it was worth. */
export function reroll(rng: Rng, i: Item, k: number, cls: HeroClass): Item {
  const have = (i.mods ?? []).map((m) => m.id);
  const pool = modPool(slotOf(i), cls, i.kit, i.armor).filter((id) => !have.includes(id) && modFits(id, cls, i.kit));
  if (!pool.length || !i.mods?.[k]) return i;
  const id = rng.pick(pool), mods = [...i.mods], was = i.mods[k];
  mods[k] = { id, v: modValue(id, (MODS[was.id].unit === '' ? was.v : was.v * 100) * MODS[was.id].per) };
  return { ...i, mods };
}

/**
 * Roll a piece of `tier` for `slot`: a weapon of `kit` (or any of the class's), armor of `armor` weight
 * (or any). `cls` null rolls it for nobody in particular (the pawn's stall). `lean` (0 to 1) pushes every
 * roll toward the top of its band: a strong piece. Hungry gear comes from hungry.ts.
 */
export function rollGear(rng: Rng, cls: HeroClass | null, tier: Tier, slot: Slot = 'weapon', kit?: WeaponId, armor?: ArmorKind, lean = 0): Item {
  const t = tier === 'hungry' ? 'turning' : tier, n = MOD_COUNT[t], out: Item = { slot, quality: t, traits: [], mods: [], level: 0 };
  if (slot === 'weapon') out.kit = kit ?? rng.pick(CLASS_KITS[cls ?? 'WARRIOR']);
  if (slot === 'armor') out.armor = armor ?? rng.pick(['light', 'medium', 'heavy'] as ArmorKind[]);
  const pool = modPool(slot, slot === 'weapon' ? null : cls, out.kit, out.armor);
  // Forged: half the time one modifier and an element instead of two.
  const element = slot === 'weapon' && t === 'forged' && rng.next() < 0.5;
  // A weapon's modifiers each take a tier's share; armor and rings spread the whole budget (light's lift too).
  out.mods = slot === 'weapon' ? rollMods(rng, pool, n - (element ? 1 : 0), PER_MOD[t] * (n - (element ? 1 : 0)), lean) : rollMods(rng, pool, n, budget(t, slot, out.armor), lean);
  if (element) out.traits.push(rng.pick(ELEMENT_TRAITS));
  if (slot === 'weapon' && (t === 'tolmouth' || t === 'touched' || t === 'turning')) out.traits.push(rng.pick(traitsFor(out.kit!)));
  const cost = rollCost(rng, t);
  if (cost) out.cost = cost;
  return out;
}

/**
 * Odds of each tier by where it came from. PRE-WAR (purple) is a real find; the rare three are each
 * rarer than the last (Kyle, 2026-11-05: "rare and dangerous").
 */
const ODDS: Record<'scrapper' | 'butcher' | 'named' | 'chest', [Tier, number][]> = {
  scrapper: [['plain', 0.7], ['fine', 0.3]],
  butcher: [['plain', 0.2], ['fine', 0.55], ['forged', 0.22], ['tolmouth', 0.02], ['touched', 0.01]],
  named: [['fine', 0.36], ['forged', 0.5], ['tolmouth', 0.09], ['touched', 0.025], ['turning', 0.015], ['hungry', 0.01]],
  chest: [['plain', 0.45], ['fine', 0.37], ['forged', 0.14], ['tolmouth', 0.02], ['touched', 0.01], ['turning', 0.006], ['hungry', 0.004]],
};
export const DROP_ODDS = ODDS;
/** Danger lifts a roll a tier a step, but only as far as Forged: PRE-WAR and the rare three are found, never lifted into. */
export const LIFT_TO: Tier = 'forged';
/** A tier from a list of odds (the last one if the roll runs off the end). */
export function pickTier(rng: Rng, odds: [Tier, number][]): Tier {
  let r = rng.next();
  for (const [tier, p] of odds) if ((r -= p) < 0) return tier;
  return odds[odds.length - 1][0];
}
/**
 * `lv`: the party's average level (shared/lootlevel.ts): the odds lean up a little a level. `floor`: a Deep
 * floor (shared/deeploot.ts), its band's PRE-WAR and rare odds on top.
 */
export function rollTier(rng: Rng, from: keyof typeof ODDS, shift = 0, lv = 1, floor = 0): Tier {
  const t = pickTier(rng, deepOdds(leanOdds(ODDS[from], lv), floor)), i = TIER_ORDER.indexOf(t), top = TIER_ORDER.indexOf(LIFT_TO);
  return i >= top ? t : TIER_ORDER[Math.min(top, i + shift)];
}

/** Old saves: a weapon with a trait and no modifiers becomes PRE-WAR, keeping what it had. */
export function upgradeOld(i: Item): Item {
  if (i.mods) return i;
  return { ...i, slot: 'weapon', quality: i.traits.length ? 'tolmouth' : 'plain', mods: [], level: 0 };
}

export type GearStats = Record<ModId, number> & { speed: number; taken: number; dodgeDist: number; dodgeCost: number; steady: boolean };

/** What everything worn adds up to (each piece's modifiers grown by its plus, the caps, then what the
 *  pluses add to a weapon's damage, armor's toughness and a ring's health, then any costs). */
export function gearStats(weapon: Item | undefined, armor: Item | null | undefined, rings: Item[] = []): GearStats {
  const s = Object.fromEntries((Object.keys(MODS) as ModId[]).map((k) => [k, 0])) as Record<ModId, number>;
  let taken = 1;
  const costs: Item['cost'][] = [], lift = { damage: 0, tough: 0, health: 0 };
  for (const it of [weapon, armor, ...rings]) {
    if (!it) continue;
    const lv = levelOf(it), grow = 1 + lv * PLUS.mods;
    for (const m of it.mods ?? []) if (m.id in s) s[m.id] += m.v * grow;
    if (slotOf(it) === 'weapon') lift.damage += lv * PLUS.damage;
    if (slotOf(it) === 'armor') lift.tough += lv * PLUS.tough;
    if (slotOf(it) === 'ring') lift.health += lv * PLUS.health;
    if (it.cost) costs.push(it.cost);
  }
  for (const [k, cap] of Object.entries(CAPS)) s[k as ModId] = Math.min(cap!, s[k as ModId]);
  s.damage += lift.damage;
  s.tough += lift.tough;
  s.health += lift.health;
  // What touched and turning gear costs: taken off after the caps, so a cap never hides it.
  for (const c of costs) {
    if (c!.id === 'taken') taken *= 1 + c!.v;
    else if (c!.id === 'winded') s.breath -= c!.v;
    else if (c!.id === 'slow') s.foot -= c!.v;
    else if (c!.id === 'frail') s.health -= c!.v;
    else s.focus -= c!.v;
  }
  const a = ARMOR[armor?.armor ?? 'light'];
  return { ...s, speed: a.speed * (1 + s.foot), taken: a.taken * (1 - s.tough) * taken, dodgeDist: a.dodge, dodgeCost: a.cost, steady: a.steady };
}
