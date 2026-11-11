/**
 * What an elite's affixes do in the room (numbers: shared/elites.ts). Small hooks the room's rules call:
 * - Plated: the ironhide rule (sim/ironhide.ts reads `armoured`);
 * - Quick: its pace (sim/enemies.ts, with the rest of its feet) and its wind-ups (`quicken`, in `begin`,
 *   so the telegraph you see is the one judged);
 * - Gorging: it eats the dead as a butcher does (sim/meal.ts), healing ELITE.gorging.heal.
 */
import { ELITE, quickWind, type Affix } from '../shared/tuning';
import type { Enemy, EnemyAttack } from './types';

export const hasAffix = (e: { elite?: Affix[] }, a: Affix) => !!e.elite?.includes(a);
export const isElite = (e: { elite?: Affix[] }) => !!e.elite?.length;

/** Its pace as a multiple (Quick). */
export const quickPace = (e: Enemy) => (hasAffix(e, 'quick') ? ELITE.quick.pace : 1);
/** Its rest between blows as a multiple (Quick: it swings more often; never a boss of the kit's). */
export const quickPause = (e: Enemy) => (hasAffix(e, 'quick') && !e.boss ? ELITE.quick.pause : 1);

/** A Quick one's wind-up, shortened as it begins (a pack rush keeps the rush's own clock). */
export function quicken(e: Enemy, a: EnemyAttack): void {
  // (Never a boss's: its tell pose is added after, sim/bosskit.ts, and a boss is never an elite anyway.)
  if (hasAffix(e, 'quick') && a.rush === undefined && !e.boss) a.windup = +quickWind(a.windup, a.unblockable).toFixed(3);
}

/** A small goblin that eats the dead (Gorging). */
export const gorges = (e: Enemy) => e.kind === 'scrapper' && hasAffix(e, 'gorging');
