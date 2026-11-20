/**
 * The Want's bands (docs/design/holy-and-hungry.md section 2) and who is corrupt (section 1). The Want is the
 * real price now, both ways: the higher it is, the more hungry gear gives and the more it costs.
 *
 * | Want | Hungry gift | Cost |
 * | 0 to 14 | base | none |
 * | 15 to 29 (eyes) | +10% | goblins notice you sooner |
 * | 30 to 59 (noticed) | +20% | corrupt (the town's side: a later slice) |
 * | 60+ | +35% | heals from others do half |
 *
 * The fight reads it in sim/bites.ts and sim/hungry.ts. Pure: a profile or a hero, whichever has the kit.
 */
import type { Item } from './loot.js';

export interface Band { from: number; gift: number; seen: number; othersHeal: number }
/** Each band from its first Want: the gift on hungry pieces' modifiers, how much further off goblins see you, what others' heals do. */
export const WANT_BANDS: Band[] = [
  { from: 0, gift: 0, seen: 0, othersHeal: 1 },
  { from: 15, gift: 0.1, seen: 0.15, othersHeal: 1 },
  { from: 30, gift: 0.2, seen: 0.15, othersHeal: 1 },
  { from: 60, gift: 0.35, seen: 0.15, othersHeal: 0.5 },
];
/** The Want's band: the last one it has reached. */
export const bandOf = (want: number | undefined): Band => {
  const w = Number(want) || 0;
  return [...WANT_BANDS].reverse().find((b) => w >= b.from) ?? WANT_BANDS[0];
};

/** Corrupt at this Want or above, hungry gear or none (WANT.noticed). */
export const CORRUPT_AT = 30;

/** What's worn, from a profile or a hero. */
interface Worn { weapon: string; arms?: Partial<Record<string, Item>>; armor?: Item | null; legs?: Item | null; rings?: Item[]; want?: number }
export const wornPieces = (k: Worn): Item[] => [k.arms?.[k.weapon], k.armor, k.legs, ...(k.rings ?? [])].filter((x): x is Item => !!x);
/** Wearing any hungry piece. */
export const wearsHungry = (k: Worn) => wornPieces(k).some((it) => it.quality === 'hungry');
/** Corrupt: wearing hungry gear, or the Want at `CORRUPT_AT` or above (section 1). */
export const isCorrupt = (k: Worn) => wearsHungry(k) || (Number(k.want) || 0) >= CORRUPT_AT;

/**
 * What being corrupt costs in town and from the butchers (section 2's 30 band; per hero, whoever they came in with).
 * `price`: what a corrupt hero pays (for the Economy chat's prices, asked). `pull`: how much nearer a named butcher
 * counts a corrupt hero when it picks whom to go for (sim/enemies.ts), as the Butcher's Apron's lure.
 */
export const CORRUPT = { price: 1.25, pull: 6 };
/** A price as this hero pays it. */
export const corruptPrice = (k: Worn, base: number) => (isCorrupt(k) ? Math.ceil(base * CORRUPT.price) : base);
