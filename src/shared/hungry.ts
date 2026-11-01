/**
 * Hungry gear: plain steel that sat in a butcher's fist beside a sliver until the hunger took. The best
 * gear there is, and every piece costs something real (names and costs from the lore keeper). It can't
 * be melted, traded or upgraded by Halvard; only given up at the church. Wearing it grows the Want.
 * The gifts and costs are wired into the fight in sim/hungry.ts.
 */
import type { Rng } from './rng.js';
import { MODS, TIERS, rollGear, type ModId } from './gear.js';
import type { Item } from './loot.js';
import type { HeroClass, WeaponId } from './weapons.js';

export type HungryId = 'cleaver' | 'pike' | 'spendthrift' | 'needles' | 'jealous' | 'keeping' | 'apron' | 'ransom' | 'wedding' | 'tooth';
interface Hungry { name: string; slot: 'weapon' | 'armor' | 'ring'; kit?: WeaponId; armor?: 'light' | 'medium' | 'heavy'; cls?: HeroClass; from?: string; gift: string; cost: string; want: number }

export const HUNGRY: Record<HungryId, Hungry> = {
  cleaver: { name: "SKARN'S CLEAVER", slot: 'weapon', kit: 'greatsword', cls: 'WARRIOR', from: 'SKARN', gift: 'Every hit heals you a fifth of what it deals.', cost: "Nobody else's healing takes on you: blessed ground, the mace and the ward pass you by.", want: 5 },
  pike: { name: 'THE LARDER PIKE', slot: 'weapon', kit: 'spear', cls: 'WARRIOR', gift: 'Each kill adds 10% damage for the rest of the job, no cap.', cost: 'Eight seconds without a kill and it bites you every second until you feed it.', want: 5 },
  spendthrift: { name: 'SPENDTHRIFT', slot: 'weapon', kit: 'longbow', cls: 'RANGER', gift: 'Every full draw pierces and lands for double.', cost: "Every arrow costs one gold. With an empty purse it won't draw.", want: 5 },
  needles: { name: "MOTHER RUST'S NEEDLES", slot: 'weapon', kit: 'daggers', cls: 'ROGUE', from: 'MOTHER RUST', gift: 'A backstab kills anything short of a butcher.', cost: 'Your breath comes back at half speed, and not at all while a goblin can see you.', want: 5 },
  jealous: { name: 'THE JEALOUS ROD', slot: 'weapon', kit: 'rod', cls: 'MAGE', gift: 'Charged spells jump to every goblin near what they hit.', cost: "Your relic won't answer while it's in your hand, and your skill takes twice as long.", want: 5 },
  keeping: { name: 'THE KEEPING MACE', slot: 'weapon', kit: 'mace', cls: 'HEALER', gift: 'Every kill feeds a coal to your censer.', cost: 'Your heals land at half on others and double on you.', want: 5 },
  apron: { name: "THE BUTCHER'S APRON", slot: 'armor', armor: 'medium', gift: 'Every blow against you lands at half.', cost: 'The hungry smell their own on you: every goblin comes for you first, and a named butcher looks at no one else.', want: 5 },
  ransom: { name: 'THE RANSOM COAT', slot: 'armor', armor: 'light', gift: 'Once a room, a killing blow takes 50 gold instead of your life.', cost: "You can't give at the Lantern while you wear it; driven back, you lose all your gold, not half.", want: 5 },
  wedding: { name: "SOMEONE'S WEDDING RING", slot: 'ring', gift: 'Every coin you pick up counts twice.', cost: "It won't come off your finger; only the church can take it. And it gets into you faster than anything.", want: 15 },
  tooth: { name: 'THE TOOTH RING', slot: 'ring', gift: 'Every kill recharges your skill and relic at once.', cost: "The party's gold from kills near you goes into your purse, and they see it go.", want: 5 },
};
/** How the Want moves: per gold given at the Lantern, per piece given up, per kill made in hungry gear; when it shows (the eyes). */
export const WANT = { perGold: 0.1, giveUp: 30, perKill: 0.2, eyes: 15, noticed: 30 };
export const HUNGRY_ORDER = Object.keys(HUNGRY) as HungryId[];

/** A hungry piece for this class: from a named butcher whose own piece it is, if it has one; never another butcher's. */
export function rollHungry(rng: Rng, cls: HeroClass, from?: string): Item {
  const fits = HUNGRY_ORDER.filter((id) => (!HUNGRY[id].cls || HUNGRY[id].cls === cls) && (!HUNGRY[id].from || HUNGRY[id].from === from));
  const own = fits.find((id) => HUNGRY[id].from && HUNGRY[id].from === from);
  const id = own && rng.next() < 0.6 ? own : rng.pick(fits), d = HUNGRY[id];
  const pool = (Object.keys(MODS) as ModId[]).filter((m) => MODS[m].on.includes(d.slot) && (m !== 'mending' || cls === 'HEALER'));
  const mods: Item['mods'] = [];
  for (let i = 0; i < TIERS.hungry.mods && pool.length; i++) {
    const m = pool.splice(Math.floor(rng.next() * pool.length), 1)[0];
    const v = MODS[m].mid[3] * (0.8 + rng.next() * 0.4);
    mods.push({ id: m, v: MODS[m].unit === '' ? Math.round(v) : Math.round(v * 100) / 100 });
  }
  return { slot: d.slot, kit: d.kit, armor: d.armor, quality: 'hungry', traits: [], mods, level: 0, hungry: id };
}

/** Any tier: hungry pieces from rollHungry, the rest from rollGear. */
export function rollAny(rng: Rng, cls: HeroClass, tier: Item['quality'], slot: 'weapon' | 'armor' | 'ring' = 'weapon', kit?: WeaponId, from?: string): Item {
  return tier === 'hungry' ? rollHungry(rng, cls, from) : rollGear(rng, cls, tier, slot, kit);
}
