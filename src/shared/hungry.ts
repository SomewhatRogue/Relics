/**
 * Hungry gear: plain steel that sat in a butcher's fist beside a sliver until the hunger took. The best
 * gear there is, and every piece costs something real (names and costs from the lore keeper). It can't
 * be melted, traded or upgraded by Halvard; only given up at the church. Wearing it grows the Want.
 * The gifts and costs are wired into the fight in sim/hungry.ts.
 */
import type { Rng } from './rng.js';
import { MOD_COUNT, budget, modPool, rollGear, rollMods } from './gear.js';
import type { Item } from './loot.js';
import type { HeroClass, WeaponId } from './weapons.js';

export type HungryId = 'cleaver' | 'pike' | 'spendthrift' | 'needles' | 'jealous' | 'keeping' | 'apron' | 'ransom' | 'wedding' | 'tooth';
interface Hungry { name: string; slot: 'weapon' | 'armor' | 'ring'; kit?: WeaponId; armor?: 'light' | 'medium' | 'heavy'; cls?: HeroClass; from?: string; gift: string; cost: string; want: number }

export const HUNGRY: Record<HungryId, Hungry> = {
  cleaver: { name: "SKARN'S CLEAVER", slot: 'weapon', kit: 'greatsword', cls: 'WARRIOR', from: 'SKARN', gift: 'Every hit heals you 20% of its damage.', cost: "Nobody else's heals work on you.", want: 5 },
  pike: { name: 'THE LARDER PIKE', slot: 'weapon', kit: 'spear', cls: 'WARRIOR', gift: 'Each kill: +10% damage for the rest of the job, no cap.', cost: 'Go 8 s without a kill and it hurts you every second until you kill again.', want: 5 },
  spendthrift: { name: 'SPENDTHRIFT', slot: 'weapon', kit: 'longbow', cls: 'RANGER', gift: 'Full draws go through goblins and do double damage.', cost: "Each arrow costs 1 gold. No gold, no draw.", want: 5 },
  needles: { name: "MOTHER RUST'S NEEDLES", slot: 'weapon', kit: 'daggers', cls: 'ROGUE', from: 'MOTHER RUST', gift: 'A backstab kills anything but a butcher.', cost: 'Stamina refills at half speed, and not at all while a goblin can see you.', want: 5 },
  jealous: { name: 'THE JEALOUS WAND', slot: 'weapon', kit: 'wand', cls: 'MAGE', gift: 'Spell bursts also hit every goblin near the target.', cost: "No relic while you hold it. Skill takes twice as long to recharge.", want: 5 },
  keeping: { name: 'THE KEEPING MACE', slot: 'weapon', kit: 'mace', cls: 'HEALER', gift: 'Every kill feeds your censer a coal: stronger heals, for good.', cost: 'Your heals do half on others, double on you.', want: 5 },
  apron: { name: "THE BUTCHER'S APRON", slot: 'armor', armor: 'medium', gift: 'Take half damage.', cost: 'Every goblin goes for you first. A named butcher attacks only you.', want: 5 },
  ransom: { name: 'THE RANSOM COAT', slot: 'armor', armor: 'light', gift: 'Once per room, a blow that would put you down takes 50 gold instead.', cost: "Can't give gold at the Lantern. Driven back, you lose all your gold, not half.", want: 5 },
  wedding: { name: "SOMEONE'S WEDDING RING", slot: 'ring', gift: 'Coins you pick up count twice.', cost: "Won't come off; only the church can take it. Changes you faster than any other hungry gear.", want: 15 },
  tooth: { name: 'THE TOOTH RING', slot: 'ring', gift: 'Every kill recharges your skill and relic.', cost: "Gold from kills near you goes to you, not the party, and they see it.", want: 5 },
};
/** How the Want moves: per gold given at the Lantern, per piece given up, per kill made in hungry gear; when it shows (the eyes). */
export const WANT = { perGold: 0.1, giveUp: 30, perKill: 0.2, eyes: 15, noticed: 30 };
export const HUNGRY_ORDER = Object.keys(HUNGRY) as HungryId[];

/** A hungry piece for this class: from a named butcher whose own piece it is, if it has one; never another butcher's. */
export function rollHungry(rng: Rng, cls: HeroClass, from?: string): Item {
  const fits = HUNGRY_ORDER.filter((id) => (!HUNGRY[id].cls || HUNGRY[id].cls === cls) && (!HUNGRY[id].from || HUNGRY[id].from === from));
  const own = fits.find((id) => HUNGRY[id].from && HUNGRY[id].from === from);
  const id = own && rng.next() < 0.6 ? own : rng.pick(fits), d = HUNGRY[id];
  // Three modifiers, the biggest there are, from what the piece can roll for this class (mods.ts).
  const mods = rollMods(rng, modPool(d.slot, cls, d.kit, d.armor), MOD_COUNT.hungry, d.slot === 'weapon' ? budget('hungry', 'weapon') : budget('hungry', d.slot, d.armor));
  return { slot: d.slot, kit: d.kit, armor: d.armor, quality: 'hungry', traits: [], mods, level: 0, hungry: id };
}

/** Any tier: hungry pieces from rollHungry, the rest from rollGear. */
export function rollAny(rng: Rng, cls: HeroClass, tier: Item['quality'], slot: 'weapon' | 'armor' | 'ring' = 'weapon', kit?: WeaponId, from?: string): Item {
  return tier === 'hungry' ? rollHungry(rng, cls, from) : rollGear(rng, cls, tier, slot, kit);
}
