/**
 * Modifiers (Kyle, 2026-11-05: "Weapons should reflect upgrades to their core functionalities", "light
 * armor high level can and should be just as good as heavy", "stats and bonuses rolled as attributes
 * need to be related"). Every modifier is worth budget points (one point is about 1% less damage taken),
 * every tier gives each modifier a share of points, and a roll turns those points into a value. So a
 * piece's worth is countable, the card shows the truth, and light and heavy armor can be held level.
 *
 * Where each rolls (the rule, said once):
 * - A weapon rolls only what improves its own job, for its own class: a sweep widens, a thrust reaches,
 *   a bow draws, knives stab in the back, a Mage's focus casts stronger and cheaper. BLOCK only on a kit
 *   that holds a block. No flat DAMAGE on a weapon.
 * - Armor rolls its weight's list: heavy is BLOCK, TOUGHNESS and HEALTH; light is DODGE, STAMINA, SPEED
 *   and CRIT; medium a bit of both.
 * - Rings roll what any class can use, and, rolled for a class, that class's own (BLOCK, DODGE...).
 * - PARRY is gone (Kyle, 2026-11-05: no parry anywhere); old pieces with it: shared/oldparry.ts.
 * - Rolled for a class (your drops, your class's vendor), nothing that class can't use. Rolled for nobody
 *   (the pawn's stall), armor keeps its weight's whole list; on the card a modifier the wearer can't use
 *   shows dim, "no use to you", and changes nothing.
 */
import type { Rng } from './rng.js';
import type { Tier } from './loot.js';
import { CLASS_DODGES, CLASS_KITS, WEAPONS, guardOf, type HeroClass, type WeaponId } from './weapons.js';

export type ModId = 'damage' | 'quick' | 'reach' | 'draw' | 'guard' | 'knock' | 'health' | 'tough' | 'breath' | 'foot' | 'dodge' | 'focus' | 'mending'
  | 'arc' | 'crit' | 'backstab' | 'finisher' | 'spell' | 'thrift';
export interface Mod { id: ModId; v: number }
export type Slot = 'weapon' | 'armor' | 'ring';
export type ArmorKind = 'light' | 'medium' | 'heavy';

/** Each modifier: its name, its unit (1% / 0.01 s / 1 health), and `per`, the points one unit is worth. */
export const MODS: Record<ModId, { name: string; unit: '%' | 's' | ''; per: number }> = {
  damage: { name: 'DAMAGE', unit: '%', per: 1.2 },
  quick: { name: 'QUICKNESS', unit: '%', per: 1 },
  reach: { name: 'REACH', unit: '%', per: 0.8 },
  arc: { name: 'SWEEP', unit: '%', per: 0.6 },
  draw: { name: 'QUICK HOLD', unit: '%', per: 0.67 },
  finisher: { name: 'FINISHER', unit: '%', per: 0.5 },
  knock: { name: 'KNOCKBACK', unit: '%', per: 0.4 },
  backstab: { name: 'BACKSTAB', unit: '%', per: 0.4 },
  crit: { name: 'CRIT', unit: '%', per: 1.5 },
  guard: { name: 'BLOCK', unit: '%', per: 0.67 },
  mending: { name: 'HEALING', unit: '%', per: 0.8 },
  spell: { name: 'SPELL POWER', unit: '%', per: 0.8 },
  thrift: { name: 'CHEAPER SPELLS', unit: '%', per: 1 },
  health: { name: 'HEALTH', unit: '', per: 0.6 },
  tough: { name: 'TOUGHNESS', unit: '%', per: 1 },
  breath: { name: 'STAMINA', unit: '%', per: 0.5 },
  foot: { name: 'SPEED', unit: '%', per: 1 },
  dodge: { name: 'DODGE', unit: '%', per: 0.6 },
  focus: { name: 'RECHARGE', unit: '%', per: 0.8 },
};
/** What each modifier does, after its name and value on the card ('' when the name says it). */
export const MOD_TEXT: Record<ModId, string> = {
  damage: 'all hits, shots and spells', quick: 'faster swings and casts', reach: 'longer reach and range', arc: 'wider swings',
  draw: 'held attacks and bow draws build faster', finisher: 'the last blow of a combo hits harder', knock: 'knocks goblins further',
  backstab: 'more damage from behind', crit: 'chance a hit does 50% more damage',
  guard: 'less damage through a block, cheaper blocks', mending: 'bigger heals', spell: 'held spells hit harder',
  thrift: 'held spells cost less magic', health: '', tough: 'less damage taken', breath: 'refills faster', foot: 'move faster',
  dodge: 'dodge recharges faster', focus: 'skill and relic recharge faster',
};
/** Most a full set can stack, so gear never breaks the fight. */
export const CAPS: Partial<Record<ModId, number>> = {
  damage: 0.5, quick: 0.3, tough: 0.3, draw: 0.5, guard: 0.6, foot: 0.25, dodge: 0.4, focus: 0.4, breath: 0.6, reach: 0.4,
  arc: 0.5, crit: 0.3, backstab: 1, finisher: 0.8, spell: 0.5, thrift: 0.4,
};

/** Points each modifier gets at a tier, and how many modifiers a piece has. */
export const PER_MOD: Record<Tier, number> = { plain: 0, fine: 5, forged: 8, tolmouth: 12, touched: 14, turning: 17, hungry: 20 };
export const MOD_COUNT: Record<Tier, number> = { plain: 0, fine: 1, forged: 2, tolmouth: 2, touched: 3, turning: 3, hungry: 3 };

/** What a weapon's own job is: the modifiers that make this kit better at it. */
export function weaponMods(kit: WeaponId): ModId[] {
  const k = WEAPONS[kit], cls = k.cls, g = guardOf(k), out: ModId[] = ['quick', 'reach', 'draw'];
  if (k.combo.some((s) => !s.thrust && !s.shot && s.arc >= 100)) out.push('arc');
  if (k.combo.length >= 2) out.push('finisher');
  if (cls === 'WARRIOR' || cls === 'HEALER' || k.breaker || kit === 'crossbow') out.push('knock');
  if (k.backstab) out.push('backstab');
  if (cls === 'RANGER' || cls === 'ROGUE') out.push('crit');
  if (g === 'full') out.push('guard');
  if (cls === 'HEALER') out.push('mending');
  if (cls === 'MAGE') out.push('spell', 'thrift');
  return out;
}
export const ARMOR_MODS: Record<ArmorKind, ModId[]> = {
  heavy: ['guard', 'tough', 'health'],
  medium: ['health', 'tough', 'breath', 'foot'],
  light: ['dodge', 'breath', 'foot', 'crit'],
};
/** Rings: anyone's, then (rolled for a class) the class's own. */
export const RING_MODS: ModId[] = ['damage', 'health', 'breath', 'focus', 'crit', 'foot'];
const RING_OWN: ModId[] = ['guard', 'dodge', 'mending', 'spell', 'thrift'];

/**
 * Whether a modifier does anything for `cls` (holding `kit`, if known). Without a kit: whether any of
 * the class's kits could use it.
 */
export function modFits(id: ModId, cls: HeroClass, kit?: WeaponId): boolean {
  if (!kit) return CLASS_KITS[cls].some((k) => modFits(id, cls, k));
  const k = WEAPONS[kit];
  if (id === 'guard') return guardOf(k) === 'full';
  if (id === 'dodge') return CLASS_DODGES[cls];
  if (id === 'mending') return cls === 'HEALER';
  if (id === 'spell' || id === 'thrift') return cls === 'MAGE';
  if (id === 'backstab') return !!k.backstab;
  return true;
}
/** The list a piece rolls from: its kit's, its weight's or a ring's, trimmed to `cls` when rolled for one. */
export function modPool(slot: Slot, cls: HeroClass | null, kit?: WeaponId, armor?: ArmorKind): ModId[] {
  if (slot === 'weapon') return weaponMods(kit!);
  const base = slot === 'armor' ? ARMOR_MODS[armor ?? 'light'] : [...RING_MODS, ...(cls ? RING_OWN : [])];
  return cls ? base.filter((id) => modFits(id, cls)) : base;
}

/** A value worth `pts` points for modifier `id`, rounded to look tidy. */
export function modValue(id: ModId, pts: number): number {
  const m = MODS[id], units = pts / m.per;
  return m.unit === '' ? Math.max(1, Math.round(units)) : Math.round(units) / 100;
}
/** The points a rolled modifier is worth. */
export const modPoints = (m: Mod) => (MODS[m.id] ? (MODS[m.id].unit === '' ? m.v : m.v * 100) * MODS[m.id].per : 0);

/** A roll in its band: a fifth either side of the middle; `lean` (0 to 1) pushes it toward the top. */
export const band = (rng: Rng, lean = 0) => 0.8 + 0.4 * (lean + (1 - lean) * rng.next());

/** `n` different modifiers from `pool`, sharing `total` points (fewer if the pool is short; the points still all go). */
export function rollMods(rng: Rng, pool: ModId[], n: number, total: number, lean = 0): Mod[] {
  const left = [...pool], k = Math.min(n, left.length), out: Mod[] = [];
  for (let i = 0; i < k; i++) {
    const id = left.splice(Math.floor(rng.next() * left.length), 1)[0];
    out.push({ id, v: modValue(id, (total / k) * band(rng, lean)) });
  }
  return out;
}
