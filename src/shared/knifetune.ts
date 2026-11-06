/**
 * Knife-throwing at the board in the Drowned Rat (docs/plans/town-activities.md): every number the rules
 * (shared/knives.ts) and the picture (client/knifeview.ts) use. Units are the picture's own pixels
 * (the same 120 by 180 field as the butts), the board up the screen on the back wall.
 *
 * Your hand sways and the point of the knife with it; throw when it's over the middle. The longer you
 * hold a knife the wider it sways, and each knife of the round sways a little quicker than the last. A
 * Rogue's hand is steadier (`steady`), the way a Ranger's is at the butts.
 */
export const KNIVES = {
  fps: 60,
  /** The board's middle and its radius; its rings from the bull out, and their points. */
  board: [60, 66] as const, r: 24,
  rings: [10, 8, 6, 4, 2] as const,
  /** Nine knives a round; `reach` between one and the next; `fly` to the board. */
  knives: 9, reach: 0.7, fly: 0.22,
  /** The longest a round can take and still be replayed for the board (s). */
  longest: 600,
  /** The sway (px), its growth a second held (share, up to `most` times), each knife's quickening. */
  sway: 30, grow: 0.22, most: 2, quicken: 0.06, hz: 1.7,
  /** A Rogue's share of the sway, and of the knife's own wobble (px). */
  steady: 0.62, wobble: 1.4,
  /** Where the hand is (the picture's foot). */
  hand: [60, 164] as const,
} as const;

/** The most a round can score (every knife in the bull). */
export const KNIFE_MAX = KNIVES.knives * KNIVES.rings[0];
/** The card sharp's round, the one to beat for a bet: from `low` to `high`, drawn from the round's seed. */
export const HOUSE = { low: 44, high: 72 } as const;
