/**
 * The living world, L2, the wild's half (ambient.ts): leaves drifting under trees, small birds flushing from cover,
 * crows lifting as you pass, drips in the mines. To be drawn (a builder's slice).
 */
import type { GameMap } from '../shared/arena';
import type { Beast } from './townbeasts';
import type { At } from './ambient';

export function wildAmbient(_m: GameMap, _now: number, _heroes: At[]): Beast[] {
  return [];
}
