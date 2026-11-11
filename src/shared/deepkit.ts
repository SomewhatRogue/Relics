/**
 * The Deep's run snapshot (docs/design/the-deep.md, "What's at risk"). At the way down each hero's kit
 * (weapon in hand, every weapon, the pack, armor and rings) is copied. Die below and the copy comes
 * back whole, even a sword swapped out for a find and left in the pack; the run's finds and its gold are
 * gone. At each floor's end a mark is copied too: leaving early, or dropping out, counts as leaving
 * there. Leaving at a checkpoint banks the lot. Relics, potions and gold spent are not gear and stand.
 */
import type { Item } from './loot.js';
import type { Profile } from './progress.js';
import type { WeaponId } from './weapons.js';

export interface DeepKit { weapon: WeaponId; arms: Partial<Record<WeaponId, Item>>; bag: Item[]; armor: Item | null; rings: Item[] }
/** Kept on the hero's save, so a reload mid-floor still settles it (game.ts). */
export interface DeepRun {
  /** The floor being fought (from 1), and the run's seed (each floor's map: shared/deep.ts). */
  floor: number;
  seed: number;
  /** The kit at the way down. */
  entry: DeepKit;
  /** Gone down or gone on with friends at any point (the boards list parties apart: shared/deepboard.ts). */
  party?: boolean;
  /** The last checkpoint passed: its floor, the kit there, and the run's gold there. */
  mark?: { floor: number; kit: DeepKit; gold: number };
}

const copy = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** The hero's kit now, copied. */
export const kitNow = (p: Profile): DeepKit => copy({ weapon: p.weapon, arms: p.arms, bag: p.bag, armor: p.armor, rings: p.rings });

/** Put a copied kit back on the hero. */
export function putKit(p: Profile, k: DeepKit): void {
  const c = copy(k);
  Object.assign(p, { weapon: c.weapon, arms: c.arms, bag: c.bag, armor: c.armor, rings: c.rings });
}

const pieces = (k: DeepKit): Item[] => [...k.bag, ...Object.values(k.arms), ...(k.armor ? [k.armor] : []), ...k.rings].filter(Boolean) as Item[];

/** What `now` holds beyond `was`, piece by piece (two of the same are two): the finds since. */
export function foundSince(was: DeepKit, now: DeepKit): Item[] {
  const left = new Map<string, number>();
  for (const i of pieces(was)) left.set(JSON.stringify(i), (left.get(JSON.stringify(i)) ?? 0) + 1);
  return pieces(now).filter((i) => {
    const k = JSON.stringify(i), n = left.get(k) ?? 0;
    return n > 0 ? (left.set(k, n - 1), false) : true;
  });
}

/** Set out: the snapshot taken at the way down. */
export const setOut = (p: Profile, seed: number): DeepRun => ({ floor: 1, seed, entry: kitNow(p) });

/** A floor's end reached: the mark moves here (`gold`: the run's gold so far). */
export function markHere(d: DeepRun, p: Profile, gold: number): void {
  d.mark = { floor: d.floor, kit: kitNow(p), gold };
}

/**
 * How a Deep run ends for one hero, and what it leaves them: `out`, up at a checkpoint with everything
 * (gold: the run's); `early`, gone mid-floor or dropped, as at the last mark (none: as at the way down);
 * `dead`, back to the way down's kit and no gold. Returns the gold to pay and the finds left below.
 */
export function endDeep(d: DeepRun, p: Profile, how: 'out' | 'early' | 'dead', runGold: number): { gold: number; lost: Item[]; floor: number } {
  const now = kitNow(p);
  if (how === 'out') return { gold: runGold, lost: [], floor: d.floor };
  const back = how === 'early' && d.mark ? d.mark : null, to = back?.kit ?? d.entry;
  putKit(p, to);
  return { gold: back?.gold ?? 0, lost: foundSince(to, now), floor: back?.floor ?? (how === 'dead' ? d.floor : 0) };
}
