/**
 * A burst on the floor's one shape (sim/blast.ts decides them): the circle the room judges and the
 * telegraph both views draw are the same (x, y, r) and the same fuse, so the striped circle you see is the
 * one that hurts. A Kegman's keg (KEGMAN.keg), an Oil-soaked elite alight (ELITE.oiled), a Smouldering
 * one's embers (ELITE.ember). Pure.
 */
import { ELITE, KEGMAN, type BurstSpec } from '../shared/tuning';
import type { Enemy, EnemyAttack } from './types';

export type BlastKind = NonNullable<Enemy['blast']>['k'];
export const blastSpec = (k: BlastKind): BurstSpec => (k === 'keg' ? KEGMAN.keg : k === 'oiled' ? ELITE.oiled : ELITE.ember);

/** The burst as a round blow nothing blocks (kind 'slam': drawn and judged as one), `t` into its fuse. */
export function blastAttack(b: NonNullable<Enemy['blast']>, t: number): EnemyAttack {
  const s = blastSpec(b.k);
  return {
    kind: 'slam', t: Math.max(0, s.fuse - (b.at - t)), windup: s.fuse, active: 0.05, recover: 0, dmg: s.dmg, knock: s.knock, unblockable: true,
    dx: 0, dy: 1, ox: b.x, oy: b.y, range: b.r, arc: 360, cx: b.x, cy: b.y, radius: b.r, done: false,
  };
}

/** Its telegraph now, while the fuse burns; null before it's lit, once it has gone off, or after. */
export function blastShape(e: Enemy, t: number): EnemyAttack | null {
  const b = e.blast;
  if (!b || b.done || t >= b.at) return null;
  return blastAttack(b, t);
}
