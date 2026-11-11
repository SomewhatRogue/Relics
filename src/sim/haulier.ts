/**
 * The Haulier's turn (docs/design/deep-bosses.md; numbers shared/haultune.ts). stepEnemy hands a boss over
 * to sim/doorkeepers.ts, which hands the Haulier here once its blow (if any) has run.
 * STAND-IN (2026-11-11): it wakes when it sees you, walks to whoever it faces and swings its pick. The full
 * rotation (overhead, shove, drag), the carts and the gear come next.
 */
import { HAULIER as H } from '../shared/tuning';
import { begin, walk } from './enemies';
import { bossTarget, turnTo } from './bosskit';
import type { Enemy, FightEvent, Hero } from './types';

export function stepHaulier(e: Enemy, heroes: Hero[], now: number, dt: number, ev: FightEvent[], notice: () => boolean): void {
  const b = e.boss!;
  if (e.alert === false && !notice()) return;
  e.alert = true;
  const t = bossTarget(e, heroes, now);
  if (!t || b.roarUntil > now) return void (t && turnTo(e, t.x - e.x, t.y - e.y, 6, dt));
  const ux = t.x - e.x, uy = t.y - e.y, d = Math.hypot(ux, uy);
  const facing = turnTo(e, ux, uy, 4, dt);
  if (d > H.walk.close) return void walk(e, ux, uy, H.walk.pace * Math.max(0.3, facing), dt);
  if (e.cooldown <= 0 && facing > 0.8) begin(e, 'cleave', H.pick, t, ev);
}
