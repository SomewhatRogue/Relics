/** Damage to an enemy from anything (blades, shots, blasts, burning), and what death resets. */
import { BUTCHER, GUARD, SCRAPPER, SWING_DUMMY } from '../shared/tuning';
import type { Enemy, FightEvent } from './types';

export const stunOf = (e: Enemy) => (e.kind === 'butcher' ? BUTCHER.stun : e.kind === 'scrapper' ? SCRAPPER.stun : SWING_DUMMY.stun);
export const respawnOf = (e: Enemy) => (e.kind === 'scrapper' ? SCRAPPER.respawn : BUTCHER.respawn);
/** A function, so a check after something that may have killed it isn't narrowed away. */
export const isDead = (e: Enemy) => e.act === 'dead';
export const isDummy = (e: Enemy) => e.kind === 'dummy' || e.kind === 'swingDummy';
export const frozen = (e: Enemy, now: number) => e.frozenUntil > now;
/** Held fast: can't flinch or act (stunned, pinned, on a javelin or hook, frozen). */
export const held = (e: Enemy, now: number) => e.act === 'stunned' || e.act === 'pinned' || e.act === 'carried' || frozen(e, now);

export function clearElements(e: Enemy): void {
  e.burnUntil = e.chillUntil = e.frozenUntil = 0;
}

export function kill(e: Enemy, ev: FightEvent[]): void {
  Object.assign(e, { hp: 0, act: 'dead', actT: 0, actDur: respawnOf(e), attack: null, kvx: 0, kvy: 0 });
  clearElements(e);
  ev.push({ k: 'death', x: e.x, y: e.y });
}

export interface DamageOpts {
  heavy?: boolean;
  /** Light goblins flinch this long (0: no flinch). */
  flinch?: number;
  /** Stunned, pinned and frozen goblins take GUARD.stunnedMult. */
  mult?: boolean;
  /** A burn tick: a small number, no blood. */
  tick?: boolean;
}

/** Hurt an enemy; true if this killed it. Dummies never die (they refill). */
export function damage(e: Enemy, n: number, now: number, ev: FightEvent[], o: DamageOpts = {}): boolean {
  if (e.act === 'dead') return false;
  if (o.mult && (e.act === 'stunned' || e.act === 'pinned' || frozen(e, now))) n = Math.round(n * GUARD.stunnedMult);
  e.hp -= n;
  e.hitAt = now;
  ev.push({ k: 'hit', x: e.x, y: e.y, n, heavy: !!o.heavy, on: 'enemy', tick: o.tick });
  if (isDummy(e)) {
    if (e.hp <= 0) e.hp = e.maxHp;
    return false;
  }
  if (e.hp <= 0) return kill(e, ev), true;
  if (o.flinch && e.kind === 'scrapper' && !held(e, now)) Object.assign(e, { attack: null, act: 'flinch', actT: 0, actDur: o.flinch });
  return false;
}
