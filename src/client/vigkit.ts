/** What the scenes past the wood's trees are made of (vignettes.ts, vigshots.ts): goblin figures posed by hand, drawn by foes.ts. */
import { newEnemy } from '../sim/enemies';
import type { Enemy, EnemyAttack } from '../sim/types';
import type { Vignette } from '../shared/woodscenes';
import type { Ctx } from './draw';
import { drawEnemy } from './foes';

export interface VigFig { key: string; x: number; y: number; floor?: boolean; draw: (c: Ctx, px: number, py: number) => void }
/** What a scene adds this frame: `s` is when it started playing (undefined: you've not come near yet). */
export type Script = (out: VigFig[], v: Vignette, t: number, s: number | undefined, i: number) => void;

/** One of them, posed: facing (fx, fy), and whatever else it's doing (`stab`, `feeding`, `moving`, dead). */
export function gob(id: number, fx: number, fy: number, more: Partial<Enemy> = {}): Enemy {
  const l = Math.hypot(fx, fy) || 1;
  return Object.assign(newEnemy(900 + id, 'scrapper', 0, 0), { act: 'idle', alert: true, fx: fx / l, fy: fy / l }, more);
}
/** A stab `k` seconds in (its wind-up, the blow, the recovery), as the real ones' (shared/tuning's scrapper). */
export const STAB = { windup: 0.45, active: 0.12, recover: 0.35 };
export function stab(k: number, fx: number, fy: number): Partial<Enemy> {
  if (k < 0 || k > STAB.windup + STAB.active + STAB.recover) return {};
  return { act: 'attack', attack: { kind: 'stab', t: k, ...STAB, dmg: 0, knock: 0, unblockable: false, dx: fx, dy: fy } as unknown as EnemyAttack };
}
/** A goblin figure; `hit`: seconds since it was struck (white, snapped back), as foes.ts reads it. */
export function put(out: VigFig[], key: string, x: number, y: number, e: Enemy, hit?: number): void {
  out.push({ key, x, y, draw: (c, px, py) => {
    if (hit !== undefined && hit >= 0 && hit < 0.3) e.hitAt = (c.t ?? c.now) - hit;
    drawEnemy(c, e, px, py);
  } });
}
export const ease = (k: number) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
/** 0 to 1 and back, across a beat (for a knock back and the step in again). */
export const bump = (u: number, a: number, len: number) => (u < a || u > a + len ? 0 : Math.sin(((u - a) / len) * Math.PI));
