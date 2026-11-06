/**
 * The town's pastimes and where they sit in the shared town (docs/plans/town-activities.md, Kyle
 * 2026-11-05: "All mini games will happen locally on their own computer ... but in town you can see their
 * character sitting and fishing or something ... till they rejoin the town and then it checks again").
 *
 * Starting one, your hero goes to its spot and the town hears one word: you're parked there doing it.
 * Everyone else draws you there in a loop (client/parked.ts) and hears nothing more from you until you
 * finish and walk off, when one more word says you're back. About two words a game, however long.
 * Some are out in the square (the millpond, the butts), some in a hall (the Drowned Rat, the forge):
 * each can only be started in its own place, and those in that place see you at it.
 */

/** What a parked hero is doing: fishing, the butts, arm-wrestling or knives at the Rat, striking at the anvil. */
export type PastimeId = 'fish' | 'range' | 'arm' | 'knives' | 'anvil';
export const PASTIMES: readonly PastimeId[] = ['fish', 'range', 'arm', 'knives', 'anvil'];
export const isPastime = (v: unknown): v is PastimeId => PASTIMES.includes(v as PastimeId);

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

/** The archery butts in front of the hunters' lodge: Abel, and the line you shoot from (facing the targets). */
export const BUTTS = {
  npc: [42.1, 23.5] as const,
  seat: [45.4, 23.6] as const,
  face: [0, -1] as const,
};

/** The Drowned Rat inside (shared/townhalls.ts): the arm-wrestling table in the corner by the door. */
export const ARM_TABLE = {
  table: { x: 15.2, y: 6.6, w: 1.4, h: 0.8 },
  /** Whoever's at the table (off duty from the watch), across it from your seat. */
  npc: [17.05, 7] as const,
  seat: [14.75, 7] as const,
  face: [1, 0] as const,
};

/** The knife board on the Rat's back wall (a hang), the card sharp who keeps it, and the line you throw from. */
export const KNIFE_LINE = {
  board: { x: 15.7, w: 1.4 },
  npc: [17.3, 4.1] as const,
  seat: [16.4, 4.7] as const,
  face: [0, -1] as const,
};

/** The forge inside: the front of Halvard's anvil, where you strike while he holds the piece. */
export const ANVIL = {
  seat: [4, 3.75] as const,
  face: [0, -1] as const,
};

/** Where a pastime parks you, and which way you face there. */
export const spotOf = (id: PastimeId) => ({ fish: MILLPOND, range: BUTTS, arm: ARM_TABLE, knives: KNIFE_LINE, anvil: ANVIL })[id];
/** The place (a map's name) a pastime is played in: the square, the Drowned Rat or the forge. */
export const placeOf = (id: PastimeId): string => (id === 'fish' || id === 'range' ? 'WICKHOLD' : id === 'anvil' ? 'THE FORGE' : 'THE DROWNED RAT');
