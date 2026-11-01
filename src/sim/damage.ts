/** Damage to an enemy from anything (blades, shots, blasts, burning), and what death resets. */
import { BUTCHER, GUARD, OVERKILL, SCRAPPER, SWING_DUMMY, TRAIT } from '../shared/tuning';
import type { DeathKind, Enemy, FightEvent } from './types';

export const stunOf = (e: Enemy) => (e.kind === 'butcher' ? BUTCHER.stun : e.kind === 'scrapper' ? SCRAPPER.stun : SWING_DUMMY.stun);
export const respawnOf = (e: Enemy) => (e.kind === 'scrapper' ? SCRAPPER.respawn : BUTCHER.respawn);
/** A function, so a check after something that may have killed it isn't narrowed away. */
export const isDead = (e: Enemy) => e.act === 'dead';
export const isDummy = (e: Enemy) => e.kind === 'dummy' || e.kind === 'swingDummy';
export const frozen = (e: Enemy, now: number) => e.frozenUntil > now;
/** Held fast: can't flinch or act (stunned, pinned, on a javelin or hook, frozen). */
export const snared = (e: Enemy, now: number) => e.snareUntil > now && e.weight <= 1;
export const held = (e: Enemy, now: number) => e.act === 'stunned' || e.act === 'pinned' || e.act === 'carried' || frozen(e, now) || snared(e, now);

export function clearElements(e: Enemy): void {
  e.burnUntil = e.chillUntil = e.frozenUntil = e.snareUntil = 0;
}

/** Death, and how (the body left behind and the gore depend on it); (dx, dy) is the blow's direction. */
export function kill(e: Enemy, ev: FightEvent[], how: DeathKind = 'fall', dx = 0, dy = 0): void {
  Object.assign(e, { hp: 0, act: 'dead', actT: 0, actDur: respawnOf(e), attack: null, kvx: 0, kvy: 0, death: how });
  clearElements(e);
  ev.push({ k: 'death', x: e.x, y: e.y, how, dx, dy, kind: e.kind });
}

export interface DamageOpts {
  heavy?: boolean;
  /** Light goblins flinch this long (0: no flinch). */
  flinch?: number;
  /** Stunned, pinned and frozen goblins take GUARD.stunnedMult. */
  mult?: boolean;
  /** A burn tick: a small number, no blood. */
  tick?: boolean;
  /** BRUTAL: the held-fast bonus is bigger. */
  brutal?: boolean;
  /** What landed it, for its sound (a shot's kind). */
  src?: string;
  /** How a kill looks (burn ticks burn; a big overkill always bursts). */
  how?: DeathKind;
  dx?: number;
  dy?: number;
}

/** Hurt an enemy; true if this killed it. Dummies never die (they refill). */
export function damage(e: Enemy, n: number, now: number, ev: FightEvent[], o: DamageOpts = {}): boolean {
  if (e.act === 'dead') return false;
  if (o.mult && (e.act === 'stunned' || e.act === 'pinned' || frozen(e, now) || snared(e, now))) n = Math.round(n * GUARD.stunnedMult * (o.brutal ? TRAIT.brutal : 1));
  e.hp -= n;
  e.hitAt = now;
  ev.push({ k: 'hit', x: e.x, y: e.y, n, heavy: !!o.heavy, on: 'enemy', tick: o.tick, src: o.src, big: e.kind === 'butcher' });
  if (isDummy(e)) {
    if (e.hp <= 0) e.hp = e.maxHp;
    return false;
  }
  if (e.hp <= 0) {
    const how = o.tick ? 'burn' : -e.hp >= OVERKILL ? 'burst' : o.how ?? 'fall';
    return kill(e, ev, how, o.dx ?? 0, o.dy ?? 0), true;
  }
  if (o.flinch && e.kind === 'scrapper' && !held(e, now)) Object.assign(e, { attack: null, act: 'flinch', actT: 0, actDur: o.flinch });
  return false;
}
