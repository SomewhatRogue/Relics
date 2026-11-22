/**
 * The living world, L2, the town's half (ambient.ts): moths round lit lamps at night, bats at dusk, the forge's
 * sparks. To be drawn (a builder's slice).
 */
import type { GameMap } from '../shared/arena';
import type { Beast } from './townbeasts';
import type { At } from './ambient';

export function townAmbient(_m: GameMap, _now: number, _heroes: At[]): Beast[] {
  return [];
}
