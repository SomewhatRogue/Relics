/** The Night Watch's score: points per kill, doubled for a headshot, times the streak; what a shift comes to. */
import { GOBS, SCORE, FOES } from '../shared/watchtune';
import type { Gob, Part, WatchState } from './watchtypes';

/** The streak's multiplier: each SCORE.step hits in a row add SCORE.add, up to SCORE.max. */
export const streakMult = (streak: number) => Math.min(SCORE.max, 1 + Math.floor(streak / SCORE.step) * SCORE.add);

/** An arrow found a goblin (or its helmet, shield or torch): the streak goes on. */
export function scoreHit(s: WatchState): void {
  s.hits++;
  s.streak++;
  s.bestStreak = Math.max(s.bestStreak, s.streak);
}

/** An arrow found nothing, or a goblin got under the wall: the streak's broken. */
export const breakStreak = (s: WatchState) => void (s.streak = 0);

/** A goblin down: its points (doubled for the head, the fire's bonus for a torch-bearer burned), times the streak. */
export function scoreKill(s: WatchState, g: Gob, how: Part | 'fire'): number {
  const base = GOBS[g.kind].points + (how === 'fire' ? FOES.burnBonus : 0);
  const pts = Math.round(base * (how === 'head' ? SCORE.head : 1) * streakMult(s.streak));
  s.score += pts;
  s.kills++;
  if (how === 'head') s.heads++;
  return pts;
}

export interface WatchResult { kills: number; heads: number; bestStreak: number; shots: number; hits: number; accuracy: number; bonus: number; score: number; total: number; lost: number }
/** The shift's card: kills, headshots, best streak, accuracy (and its bonus), the score. */
export function results(s: WatchState): WatchResult {
  const accuracy = s.shots ? Math.round((s.hits / s.shots) * 100) : 0, bonus = Math.round((s.hits * SCORE.accuracy * accuracy) / 100);
  return { kills: s.kills, heads: s.heads, bestStreak: s.bestStreak, shots: s.shots, hits: s.hits, accuracy, bonus, score: s.score, total: s.score + bonus, lost: s.lost };
}
