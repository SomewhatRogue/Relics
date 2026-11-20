/**
 * Odric's shelf and what amends pay (shared/shelf.ts): the church's words, through the lore keeper and
 * line editor, 2026-11-20.
 */
export const SHELFW = {
  /** The church panel's button when a payout is waiting. */
  owedButton: 'ODRIC HAS SOMETHING FOR YOU',
  /** Odric, offering the payout: the hero picks a slot. */
  owedLine: "I've had something put by for you, as it happens, and I'd like you to have it. Which would you sooner, something for your hand, or your back, or a finger?",
  slots: { weapon: 'A WEAPON', armor: 'ARMOR', ring: 'A RING' },
  /** Odric, handing it over; `name` said in title case. */
  paid: (name: string) => `This is ${name}. It's been through a few hands before yours, I think, and none of them did it any harm.`,
  /** The church panel's button to the shelf. */
  shelfButton: "ODRIC'S SHELF",
  /** Odric at the shelf. */
  shelfLine: "I don't sell what's on this shelf, you understand, it isn't mine to sell. Make your gift at the Lantern, and then take whichever one you like.",
  /** A piece's button: `coins` is the gift as coins. */
  take: (coins: string) => `GIVE ${coins} AND TAKE IT`,
  taken: 'TAKEN',
  full: 'Your pack is full.',
  /** Under the shelf: when it changes. */
  restock: (mins: number) => `The shelf changes in ${mins} min.`,
};
