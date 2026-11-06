/**
 * The town's pastimes and where they sit in the shared town (docs/plans/town-activities.md, Kyle
 * 2026-11-05: "All mini games will happen locally on their own computer ... but in town you can see their
 * character sitting and fishing or something ... till they rejoin the town and then it checks again").
 *
 * Starting one, your hero goes to its spot and the town hears one word: you're parked there doing it.
 * Everyone else draws you there in a loop (client/parked.ts) and hears nothing more from you until you
 * finish and walk off, when one more word says you're back. About two words a game, however long.
 */

/** What a parked hero is doing: fishing at the millpond, or shooting at the archery butts. */
export type PastimeId = 'fish' | 'range';
export const PASTIMES: readonly PastimeId[] = ['fish', 'range'];
export const isPastime = (v: unknown): v is PastimeId => v === 'fish' || v === 'range';

/**
 * The millpond under the east wall, where the mill stream comes in: its water (deep: nobody wades it),
 * the reeds along its edges, Old Pennock by the bank, and the seat on the bank you fish from (`seat`,
 * facing the water: `face`).
 */
export const MILLPOND = {
  water: { x: 49.6, y: 30.4, w: 3.4, h: 6.4 },
  reeds: [[49.7, 30.3], [50.6, 30.25], [49.5, 36.9], [50.8, 37], [49.45, 31.6], [49.5, 35.6]] as [number, number][],
  npc: [48.3, 30.5] as const,
  seat: [48.85, 33.4] as const,
  face: [1, 0] as const,
};

/** The archery butts in front of the hunters' lodge: Corin, and the line you shoot from (facing the targets). */
export const BUTTS = {
  npc: [42.1, 23.5] as const,
  seat: [45.4, 23.6] as const,
  face: [0, -1] as const,
};

/** Where a pastime parks you, and which way you face there. */
export const spotOf = (id: PastimeId) => (id === 'fish' ? MILLPOND : BUTTS);
