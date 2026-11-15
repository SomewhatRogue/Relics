/**
 * The streak (Kyle, 2026-11-14, after Heroes of Hammerwatch: "hits within x time or hits given without getting
 * hit encouraged him to do more risk reward and make the number go up"). Hits on goblins, kills, blocks and
 * dodges add to it while they keep coming; any blow that gets through to your health ends it (a Warrior's
 * block or a Rogue's dodge keeps it: which you need depends on the class); a quiet spell only halves it.
 * Steps along the way make you a little stronger for as long as it lasts (sim/streak.ts, sim/gearstats.ts);
 * your best goes on the job's recap and the board. Power only: it pays nothing (Kyle).
 */
export const STREAK = {
  /** Seconds between adds before it starts to halve (and again each `window` after). */
  window: 3,
  /** What adds: a hit, a heavy one (`heavyAt` damage or more), a kill, a block held, a dodge. */
  hit: 1, heavy: 2, heavyAt: 25, kill: 1, block: 1, dodge: 1,
  /** A break below this is quiet (no crack). */
  loud: 5,
};

/** The steps and what each gives, on top of those below it. */
export const STREAK_STEPS = [
  { at: 10, damage: 0.08 },
  { at: 25, speed: 0.05, breath: 0.2 },
  { at: 50, crit: 0.08, damage: 0.08 },
] as const;

/** Which step `n` is on: 0 below the first. */
export const streakStep = (n: number): number => STREAK_STEPS.filter((s) => n >= s.at).length;

/** All a step gives, its own and those below. */
export function streakBonus(step: number): { damage: number; speed: number; breath: number; crit: number } {
  const b = { damage: 0, speed: 0, breath: 0, crit: 0 };
  for (const s of STREAK_STEPS.slice(0, step)) for (const k of Object.keys(b) as (keyof typeof b)[]) b[k] += (s as Partial<typeof b>)[k] ?? 0;
  return b;
}
