/**
 * The Haulier's working once a tick, before the goblins move (docs/design/deep-bosses.md; numbers
 * shared/haultune.ts): the fight begins when it sees you; below HAULIER.phase2 of its health, phase 2 (a
 * roar, nothing landing either way).
 * STAND-IN (2026-11-11): the phase change only. The carts, the gear and the adds come next.
 */
import { BOSS, HAULIER as H } from '../shared/tuning';
import { isDead } from './damage';
import type { BossBook } from './bosskit';
import type { World } from './elements';
import type { Enemy } from './types';

export function stepHaulBook(bk: BossBook, w: World, _spawn: (x: number, y: number) => Enemy): void {
  const now = w.now, e = w.enemies.find((x) => x.boss?.who === 'haulier');
  if (!e || isDead(e)) return;
  const b = e.boss!;
  if (bk.started < 0 && e.alert) bk.started = now;
  if (b.phase === 1 && e.hp <= e.maxHp * H.phase2) Object.assign(b, { phase: 2, roarUntil: now + BOSS.roar }), (bk.phase = 2);
}
