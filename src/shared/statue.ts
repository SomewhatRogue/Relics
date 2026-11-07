/**
 * The statue in Lantern Square (Kyle, 2026-11-06): a hero pays Foreman Judd's masons to put their likeness on
 * the plinth, with their name under it. The first costs 1000 gold. After that anyone can take the plinth by
 * paying more than the last hero did, from 1 gold more to 1000 more, and what they paid is the price to beat.
 *
 * The world decides (api/_world.ts): a bid names the price it was made over (`over`), and only a bid over the
 * price as it stands now is taken, so two heroes bidding at once can't both win. Gold is the hero's, in their
 * save: it's taken when they bid and noted (`Profile.statueBid`); the next world they see says whether it
 * won, and a bid that lost comes back to them. Pure and isomorphic.
 */
import type { WeaponId } from './weapons.js';
import type { WorldState } from './story.js';
import { STATUE_GIVEN } from './tuning.js';

export const STATUE = {
  /** The first statue's price. */
  first: 1000,
  /** How far over the price a bid may go. */
  most: 1000,
  /** Earlier statues kept, so a bid that went out of reach can still be told won or lost. */
  kept: 8,
};

/** Where the plinth stands in Lantern Square: east of the brazier, clear of the bard, the cart, the bench and Dunn's round. */
export const PLINTH = { x: 31.8, y: 21.5, r: 0.8 };

/** Who stands on the plinth: their name, and how they looked (the weapon says the class). */
export interface StatueHero { id: string; name: string; w: WeaponId; l: number }
export interface Statue {
  by: StatueHero;
  /** What they paid: the price to beat. */
  price: number;
  /** Which statue this is (1 for the first). */
  n: number;
  /** The ones before, newest first: which statue, and whose. */
  past: { n: number; id: string }[];
}
/** A bid as it goes to the world: the price it's over (0 for the first), what's paid, the hero's look, and the
 *  gold they've given the town all told (it must be STATUE_GIVEN or more). */
export interface StatueBid { over: number; pay: number; w: WeaponId; l: number; given: number }

/** How much more a hero must give the town before the masons will take their coin (0: enough). */
export const giveMore = (given: number) => Math.max(0, STATUE_GIVEN - Math.floor(given || 0));
/** A bid as the hero's save remembers it while the world's answer is out: also which statue it was for (so it can go again). */
export interface BidNote extends StatueBid { n: number }

/** The price as it stands (what the hero on the plinth paid), or 0 with nobody on it. */
export const statuePrice = (w: WorldState) => w.statue?.price ?? 0;

/** What a bid may be now: [least, most]. The first statue is 1000 exactly. */
export function bidRange(w: WorldState): [number, number] {
  const p = statuePrice(w);
  return p ? [p + 1, p + STATUE.most] : [STATUE.first, STATUE.first];
}

/** Whether a bid of `pay` over `over` is good against this world. */
export function bidFits(w: WorldState, over: number, pay: number): boolean {
  const [lo, hi] = bidRange(w);
  return Number.isInteger(pay) && over === statuePrice(w) && pay >= lo && pay <= hi;
}

/** Put a hero on the plinth if the bid is good; false (nothing changed) if it isn't. */
export function placeBid(w: WorldState, hero: { id: string; name: string }, b: StatueBid): boolean {
  if (giveMore(b.given) > 0 || !bidFits(w, b.over, b.pay)) return false;
  const was = w.statue, past = was ? [{ n: was.n, id: was.by.id }, ...was.past].slice(0, STATUE.kept) : [];
  w.statue = { by: { id: hero.id, name: hero.name, w: b.w, l: b.l }, price: b.pay, n: (was?.n ?? 0) + 1, past };
  return true;
}

/** What a hero's bid came to, by this world: won, lost (someone got there first), or not in yet. */
export function bidOutcome(w: WorldState, note: BidNote, heroId: string): 'won' | 'lost' | 'open' {
  const s = w.statue, now = s?.n ?? 0;
  if (now <= note.n) return 'open';
  const it = s!.n === note.n + 1 ? s!.by.id : s!.past.find((p) => p.n === note.n + 1)?.id;
  // Gone past what's kept (eight more statues since, unseen): kept as won, never paid back twice.
  return it === undefined || it === heroId ? 'won' : 'lost';
}

/** The gold-holding part of a hero's save, and what they've given the town (their Roll line). */
export interface Purse { id: string; gold: number; statueBid?: BidNote; stats?: { given: number } }

/** Take the gold for a bid and note it; null (nothing taken) if they haven't given the town enough, it doesn't fit, they can't pay, or one is still out. */
export function startBid(p: Purse, w: WorldState, pay: number, look: { w: WeaponId; l: number }): BidNote | null {
  const over = statuePrice(w), given = p.stats?.given ?? 0;
  if (p.statueBid || giveMore(given) > 0 || p.gold < pay || !bidFits(w, over, pay)) return null;
  p.gold -= pay;
  return (p.statueBid = { over, pay, w: look.w, l: look.l, given, n: w.statue?.n ?? 0 });
}

/** The bid as it goes to the world. */
export const bidOf = (n: BidNote): StatueBid => ({ over: n.over, pay: n.pay, w: n.w, l: n.l, given: n.given });

/** Settle a hero's bid against the world as the server has it: a lost bid's gold comes back. */
export function settleBid(p: Purse, w: WorldState): 'won' | 'lost' | 'open' | null {
  const note = p.statueBid;
  if (!note) return null;
  const r = bidOutcome(w, note, p.id);
  if (r === 'lost') p.gold += note.pay;
  if (r !== 'open') delete p.statueBid;
  return r;
}

/** The world turned a bid away as malformed: the gold back, the note gone. */
export function refundBid(p: Purse): void {
  if (p.statueBid) p.gold += p.statueBid.pay;
  delete p.statueBid;
}
