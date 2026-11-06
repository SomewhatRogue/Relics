/**
 * A room's bosses of the kit, once a tick before the goblins move: whose book it is says whose rules run
 * (the Doorkeepers' pair, sim/doorpair.ts; Hempen's ground, sim/hempenbook.ts).
 */
import { stepPair } from './doorpair';
import { stepHempenBook } from './hempenbook';
import type { BossBook } from './bosskit';
import type { World } from './elements';
import type { Enemy } from './types';

export function stepBosses(bk: BossBook, w: World, spawn: (x: number, y: number) => Enemy): void {
  if (bk.of === 'hempen') stepHempenBook(bk, w, spawn);
  else stepPair(bk, w, spawn);
}
