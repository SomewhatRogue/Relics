/**
 * Every shop's and stall's own words (2026-11-02, for the lore keeper and the line editor): what the
 * place is in one plain line (docs/lore/story-bible.md), who keeps it, and the game's own short words
 * for the list of goods and the card that comes up when you tap one.
 */
export interface Place { name: string; line: string; keeper: string }

export const PLACES = {
  tavern: { name: 'THE DROWNED RAT', line: 'Ale that tastes of the cellar.', keeper: 'BARKEEP GANNET' },
  infirmary: { name: 'THE INFIRMARY', line: 'Beds for the ones brought home.', keeper: 'SISTER AGNE' },
  trader: { name: "DESSA'S STALL", line: 'A trader\'s stall on Market Row.', keeper: 'DESSA THE TRADER' },
  pawn: { name: "TOBIN'S STALL", line: 'The pawn stall on Market Row.', keeper: 'TOBIN THE PAWNBROKER' },
  forge: { name: 'THE FORGE', line: "Where the town's steel is melted down and made again.", keeper: 'HALVARD THE SMITH' },
  wright: { name: "IVO'S BENCH", line: "The relic-wright's bench, at the back of the forge.", keeper: 'IVO THE RELIC-WRIGHT' },
  bank: { name: 'THE COUNTING HOUSE', line: 'Half a roof, and a vault under the floor that held.', keeper: 'KEEPER EDDA' },
} satisfies Record<string, Place>;

/** The game's own voice: short, plain, second person. */
export const SHOPW = {
  forSale: 'FOR SALE',
  buy: 'BUY',
  gold: (n: number) => `You have ${n} gold.`,
  belt: (n: number, of: number) => `Belt: ${n} of ${of}.`,
  beltFull: 'Your belt is full.',
  poor: 'Not enough gold.',
  packFull: 'Your pack is full.',
  lasts: (s: number) => `Lasts ${s} seconds.`,
  thrown: 'Thrown where you aim.',
  bought: 'In your pack.',
  fine: 'Fine: one modifier.',
  forged: 'Forged: two modifiers, or one and an element.',
  ring: 'A ring. Forged: two modifiers, or one and an element.',
  reroll: 'Turns this modifier into another.',
  pack: (size: number) => `Two old packs stitched into one. Holds ${size}.`,
  shelves: (size: number) => `Room for ${size} in the vault.`,
  sell: 'SELL FROM YOUR PACK',
};
