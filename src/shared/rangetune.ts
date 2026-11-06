/**
 * The archery range at the hunters' lodge (docs/plans/town-activities.md): the butts in three lanes,
 * the targets that stand, slide and swing, the round's clock and the score. Every number the rules
 * (shared/range.ts) and the picture (client/rangeview.ts) use, so what's drawn is what's judged.
 * Units are the range picture's own pixels: 120 across, 180 down, the butts up the screen.
 */

export type LaneId = 0 | 1 | 2;
export type TargetKind = 'post' | 'slide' | 'swing';

/**
 * The three lanes, far to near: where a target's middle stands (`y`), how big it's drawn (`k`), its
 * radius (`r`), what its rings are multiplied by (`mult`), how long it stays up (`life`), and the beam
 * a swinging one hangs from (`hang`, above the middle).
 */
export const LANES = [
  { y: 52, k: 0.55, r: 4.5, mult: 3, life: [4.5, 7] as const, hang: 13 },
  { y: 86, k: 0.75, r: 6.5, mult: 2, life: [5, 8] as const, hang: 18 },
  { y: 124, k: 1, r: 9, mult: 1, life: [5.5, 9] as const, hang: 24 },
] as const;

/**
 * - `w`, `h`: the picture; `from`, `to`: where a target's middle may go across.
 * - `round`: seconds; `fps`: the rules' fixed steps (the replay's too); `slots`: targets up at once.
 * - `rise`, `drop`: a target coming up and going down (it can't be hit till it's up).
 * - `gap`: before a slot's next target; `fly`: an arrow's flight (it's judged where it lands).
 * - `nock`: between one arrow and the next. `rings`: points from the gold out.
 * - `slideFrom`, `swingFrom`, `farFrom`: seconds in before slides, swings and the far lane come up.
 * - `sway`: how far the sight wanders (pixels); `steady`: a Ranger's share of it.
 * - `shots`: the most arrows a round's record carries.
 */
export const RANGE = {
  w: 120, h: 180, from: 16, to: 104,
  round: 60, fps: 60, slots: 3,
  rise: 0.35, drop: 0.3, gap: [0.5, 1.1] as const, fly: 0.28, nock: 0.4,
  rings: [10, 8, 6, 4, 2] as const,
  slideFrom: 6, swingFrom: 18, farFrom: 10,
  sway: 2.6, steady: 0.55,
  shots: 160,
  /** Where the archer stands (the picture's foot) and the bow. */
  archer: [60, 168] as const,
} as const;

/** A slide's run either way (px) and speed (cycles a second); a swing's arc (a share of a half turn) and speed. */
export const MOTION = { slide: [14, 32] as const, slideHz: [0.14, 0.32] as const, swing: [0.18, 0.32] as const, swingHz: [0.25, 0.42] as const };

/** The most a perfect round could score: every arrow on the far gold (the server's sanity cap). */
export const RANGE_MAX = Math.ceil(RANGE.round / RANGE.nock) * RANGE.rings[0] * LANES[0].mult;
/** How many on the town's board. */
export const RANGE_BOARD = 10;
