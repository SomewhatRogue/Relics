/**
 * A Deep floor's goblins as its band has them (shared/deepbands.ts `edge`, DEEP_PAST, DEEP_EDGE): health and
 * damage set once as the room is made (sim/run.ts, sim/arenaroom.ts), wind-ups and rests as each blow begins
 * (sim/enemies.ts). Hard by how they hit, not by how long they take to kill (Kyle, 2026-11-11).
 */
import { bandOf, DEEP_EDGE, deepGrow } from '../shared/deepbands';
import type { Enemy, EnemyAttack } from './types';

/** Every goblin on floor `fl` (0: not the Deep) made the band's. Bosses too, health and harm; not their wind-ups. */
export function deepEdge(foes: Enemy[], fl: number): void {
  if (!fl) return;
  const b = bandOf(fl).edge, g = deepGrow(fl);
  for (const e of foes) {
    const hp = b.hp * g.hp;
    e.hp = e.maxHp = Math.max(1, Math.round(e.maxHp * hp));
    e.harm = +((e.harm ?? 1) * b.harm * g.harm).toFixed(3);
    e.edge = { windup: b.windup, pause: b.pause };
  }
}

/** A blow beginning: quicker on a Deep floor, never under the floors, never longer (a boss keeps its own clock). */
export function edgeWind(e: Enemy, a: EnemyAttack): void {
  if (!e.edge || e.boss || a.rush !== undefined) return;
  a.windup = +Math.min(a.windup, Math.max(a.windup * e.edge.windup, a.unblockable ? DEEP_EDGE.striped : DEEP_EDGE.red)).toFixed(3);
}

/** Its rest between blows, as a multiple (bosses keep theirs). */
export const edgePause = (e: Enemy) => (e.edge && !e.boss ? e.edge.pause : 1);
