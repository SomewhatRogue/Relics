/**
 * The numbers for a shift at Halvard's forge (shared/forgeshift.ts has the rules; Kyle, 2026-11-06: "I'd
 * like you to be able to work in the forge for gold, and high scores also, as a mini-game"). Re-exported
 * through tuning.ts, so what's drawn and what's judged come from here.
 *
 * - `length`: the shift (s). `fps`: fixed steps, as the anvil's.
 * - `pieces`: each kind of town work, the good strikes it takes and the points it's worth finished.
 * - `spare`: glows a piece gets beyond the strikes it needs; miss that many and it's spoiled.
 * - `gap`: between one glow's peak and the next, at the start of the shift and at its end (the pace rises
 *   in a straight line between); `jitter`: a share either way, seeded. `lead`: a fresh piece's first peak
 *   after it's laid on, start and end. `swap`: Halvard taking a piece off and laying the next;
 *   `first`: before the first.
 * - `rise`: how long a glow takes to come up and to fade, at most, and never more than `riseShare` of the gap.
 * - `clean`, `fair`: how near a peak a strike must land (s), the anvil's own. `lock`: after a strike.
 * - `knight`: a Warrior's windows, as a share of `clean` and `fair` (Kyle, 2026-11-06: "Forge is for knight! Same
 *   as arm wrestle"), the way a Rogue's hand is steadier at the knives and a Ranger's at the butts.
 * - `points`: a clean and a near strike; `streak`: each good strike in a row after the first adds `per`,
 *   up to `cap` of them. A cold strike, a glow let go by, or a spoiled piece ends the streak.
 * - `mix`: how often each kind comes up, at the start of the shift and at its end.
 */
export type PieceKind = 'nail' | 'shoe' | 'hinge' | 'blank';
export const PIECE_KINDS: readonly PieceKind[] = ['nail', 'shoe', 'hinge', 'blank'];

export const SHIFT = {
  fps: 60,
  length: 75,
  pieces: { nail: { strikes: 1, pts: 4 }, shoe: { strikes: 2, pts: 8 }, hinge: { strikes: 3, pts: 14 }, blank: { strikes: 4, pts: 20 } } as Record<PieceKind, { strikes: number; pts: number }>,
  spare: 2,
  gap: [1.2, 0.62] as const,
  jitter: 0.12,
  lead: [0.9, 0.55] as const,
  swap: 0.45,
  /** Before Halvard lays the first piece on. */
  first: 0.6,
  rise: 0.42,
  riseShare: 0.6,
  clean: 0.08,
  fair: 0.17,
  lock: 0.22,
  knight: 1.35,
  points: { clean: 10, fair: 4 },
  streak: { per: 2, cap: 5 },
  mix: { nail: [3, 1], shoe: [3, 3], hinge: [1, 3], blank: [0.3, 2.5] } as Record<PieceKind, readonly [number, number]>,
  /** No real shift can strike more often than this (a claim with more is no shift). */
  most: 400,
} as const;

/**
 * Pay for a shift: a gold for every `per` points, at most `cap`, and only one paid shift every
 * `rest` seconds after the last paid one ends (you can still work one in the rest, for the board).
 * At the most, 25 gold every 75 + 240 s is under 5 gold a minute; a short job at the gentlest place
 * pays 36 for about five minutes before its kill gold (jobs.ts payFor), and 100 or more with it, so the
 * forge stays a side earner, not a farm.
 */
export const SHIFT_PAY = { per: 50, cap: 25, rest: 240 } as const;

/** The forge's board: the top ten, each hero once. */
export const SHIFT_BOARD = 10;
