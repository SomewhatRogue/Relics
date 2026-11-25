/**
 * What the land's beasts leave besides coin (docs/design/materials.md): HIDE from a wolf or a pouncer, SILK from a spider,
 * BROOD SILK from the nest. Only on a roaming land. One roll of the room's dice per beast that can drop, so a run repeats.
 */
import type { Rng } from '../shared/rng';
import type { MatId } from '../shared/materials';
import { isSpiderKind } from '../shared/spiders';
import { COINS } from '../shared/tuning';
import { pid, type Pickup } from './pickups';
import type { Enemy } from './types';

/** The chance each beast leaves its material. */
export const MAT_DROP = { hide: 0.4, silk: 0.35 } as const;

/** Which material a dead beast might leave, and its chance (1 is sure); null for one that leaves none. */
export function matOf(e: Enemy): { id: MatId; chance: number } | null {
  if (e.kind === 'nest') return { id: 'brood', chance: 1 };
  if (isSpiderKind(e.kind)) return { id: 'silk', chance: MAT_DROP.silk };
  if (e.variant === 'wolf' || e.variant === 'pouncer') return { id: 'hide', chance: MAT_DROP.hide };
  return null;
}

/** Where a beast falls on a roaming land: maybe a material on the ground, to be walked over as coin is. */
export function dropMats(e: Enemy, pickups: Pickup[], rng: Rng, roam: boolean | undefined): void {
  if (!roam) return;
  const m = matOf(e);
  if (!m || (e.respawns && e.kind !== 'nest' && !isSpiderKind(e.kind))) return;
  if (m.chance < 1 && rng.next() >= m.chance) return;
  pickups.push({ id: pid(pickups), x: e.x, y: e.y, life: COINS.life * 2, mat: m.id });
}
