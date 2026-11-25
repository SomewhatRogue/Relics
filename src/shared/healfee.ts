/**
 * The healer's fee for a full fall out on the land (docs/design/outside-the-gate.md, "Falling, and way stations"; Kyle,
 * 2026-11-25): a quarter of the coin the hero holds, the trip's coin already in it. It hurts more the more is carried;
 * nothing when nothing is held. Materials, gear and bounty counts are never touched.
 */
export const HEAL_FEE = 0.25;

/** Copper taken from a purse of `gold`. */
export const healFee = (gold: number): number => Math.max(0, Math.floor(HEAL_FEE * gold));
