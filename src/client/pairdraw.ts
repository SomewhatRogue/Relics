/**
 * THE SLUICER lying in the water while THE RAKER drags it out (sim/pairfall.ts): the lift's clock as a ring at its
 * feet on the glow layer, as cutting the Drover's diggers loose is drawn (captives.ts). From the two goblins' own
 * `fallen` and `lift`, the same on every screen.
 */
import { PAIR } from '../shared/tuning';
import type { Enemy } from '../sim/types';
import { ring, type Ctx } from './draw';
import { OX, OY, PX } from './world';

export function drawPairLift(c: Ctx, all: Enemy[], cx: number, cy: number): void {
  const sl = all.find((e) => e.pair === 'sluicer' && e.fallen !== undefined), rk = all.find((e) => e.pair === 'raker');
  if (!sl) return;
  ring(c, Math.round(OX + sl.x * PX - cx), Math.round(OY + sl.y * PX - cy), 9, '#ff8a6a', Math.min(1, (rk?.lift ?? 0) / PAIR.lift), '#2a3440');
}
