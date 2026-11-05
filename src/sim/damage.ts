/** Damage to an enemy from anything (blades, shots, blasts, burning), and what death resets. */
import { BROOD, BUTCHER, GUARD, OVERKILL, SCRAPPER, SPIDER, STORM, SWING_DUMMY, TRAIT, WEAK_POP, weakOn, MARK, type Hurt } from '../shared/tuning';
import type { DeathKind, Enemy, FightEvent } from './types';
import { wet } from './wet';
import { clanks, plated } from './ironhide';

const SPEC = { butcher: BUTCHER, scrapper: SCRAPPER, spider: SPIDER, brood: BROOD } as Record<string, { stun: number; respawn: number } | undefined>;
export const stunOf = (e: Enemy) => SPEC[e.kind]?.stun ?? SWING_DUMMY.stun;
export const respawnOf = (e: Enemy) => SPEC[e.kind]?.respawn ?? BUTCHER.respawn;
/** Small enough that any blow knocks it out of its wind-up. */
export const small = (e: Enemy) => (e.kind === 'scrapper' && e.variant !== 'log') || e.kind === 'spider';
/** A function, so a check after something that may have killed it isn't narrowed away. */
export const isDead = (e: Enemy) => e.act === 'dead';
export const isDummy = (e: Enemy) => e.kind === 'dummy' || e.kind === 'swingDummy';
export const frozen = (e: Enemy, now: number) => e.frozenUntil > now;
/** Held fast: can't flinch or act (stunned, pinned, on a javelin or hook, frozen). */
export const snared = (e: Enemy, now: number) => e.snareUntil > now && e.weight <= 1;
export const held = (e: Enemy, now: number) => e.act === 'stunned' || e.act === 'pinned' || e.act === 'carried' || frozen(e, now) || snared(e, now);

export function clearElements(e: Enemy): void {
  e.burnUntil = e.chillUntil = e.frozenUntil = e.snareUntil = 0;
  // The Rogue's bleeds and poison (sim/venom.ts) go with it.
  e.bleedUntil = e.venomUntil = e.pukeUntil = e.venom = 0;
  e.venomHard = false;
}

/** Death, and how (the body left behind and the gore depend on it); (dx, dy) is the blow's direction. */
export function kill(e: Enemy, ev: FightEvent[], how: DeathKind = 'fall', dx = 0, dy = 0): void {
  // Dying alight (burning past the blow that killed it), it passes the fire on (sim/elements.ts).
  if (e.kind !== 'nest' && e.burnUntil > (e.hitAt ?? -9)) e.embers = true;
  Object.assign(e, { hp: 0, act: 'dead', actT: 0, actDur: respawnOf(e), attack: null, kvx: 0, kvy: 0, death: how });
  clearElements(e);
  ev.push({ k: 'death', x: e.x, y: e.y, how, dx, dy, kind: e.kind });
}

export interface DamageOpts {
  heavy?: boolean;
  /** Landed in its back (a Rogue's shot): the BACKSTAB pop. */
  backstab?: boolean;
  /** Light goblins flinch this long (0: no flinch). */
  flinch?: number;
  /** Stunned, pinned and frozen goblins take GUARD.stunnedMult. */
  mult?: boolean;
  /** A tick (a burn, a bleed, poison): a small number, no blood of its own. */
  tick?: boolean;
  /** BRUTAL: the held-fast bonus is bigger. */
  brutal?: boolean;
  /** What landed it, for its sound (a shot's kind). */
  src?: string;
  /** How a kill looks (burn ticks burn; a big overkill always bursts). */
  how?: DeathKind;
  dx?: number;
  dy?: number;
  /** What it's made of, for a kind's weaknesses (shared/weakness.ts); a plain blow when left out. */
  el?: Hurt | '';
}

/** WEAK or RESIST over a foe (`m` the table's multiplier), at most one every WEAK_POP seconds. */
export function sayWeak(e: Enemy, m: number, now: number, ev: FightEvent[], el: Hurt): void {
  if (m === 1 || now - (e.popAt ?? -9) < WEAK_POP) return;
  e.popAt = now;
  ev.push({ k: m > 1 ? 'weak' : 'resist', x: e.x, y: e.y, el });
}

/** Hurt an enemy; true if this killed it. Dummies never die (they refill). */
export function damage(e: Enemy, n: number, now: number, ev: FightEvent[], o: DamageOpts = {}): boolean {
  e.alert = true;
  if (e.act === 'dead') return false;
  // A weakness (fire on a spider) lands harder and says so, a resistance softer; a burn's tick says nothing.
  const weak = weakOn(e, o.el || 'physical');
  if (weak !== 1) n = Math.max(1, Math.round(n * weak));
  // Storm on a wet goblin lands harder (a tick, the stream's, has counted it already).
  const soak = o.el === 'storm' && !o.tick && wet(e);
  if (soak) n = Math.round(n * STORM.wet);
  // (Wet counts as a weakness to storm, so it says WEAK too.)
  if (!o.tick) sayWeak(e, weak * (soak ? STORM.wet : 1), now, ev, o.el || 'physical');
  // Marked by a relic: the next real blow lands harder, and the mark is spent.
  if (!o.tick && (e.markUntil ?? -9) > now) (n = Math.round(n * MARK.mult)), (e.markUntil = 0);
  if (o.mult && (e.act === 'stunned' || e.act === 'pinned' || frozen(e, now) || snared(e, now))) n = Math.round(n * GUARD.stunnedMult * (o.brutal ? TRAIT.brutal : 1));
  // An ironhide's plates: a heavy hit breaks its guard, anything else barely gets through (sim/ironhide.ts).
  const breaks = !!o.heavy && !o.tick, clank = !o.tick && !breaks && clanks(e, now);
  n = plated(e, n, now, breaks, ev);
  e.hp -= n;
  e.hitAt = now;
  ev.push({ k: 'hit', x: e.x, y: e.y, n, heavy: !!o.heavy, on: 'enemy', tick: o.tick, src: o.src, big: e.kind === 'butcher', ...(o.backstab ? { backstab: true } : {}), ...(clank ? { plated: true } : {}) });
  if (isDummy(e)) {
    if (e.hp <= 0) e.hp = e.maxHp;
    return false;
  }
  if (e.hp <= 0) {
    const how = o.tick ? o.how ?? 'burn' : -e.hp >= OVERKILL ? 'burst' : o.how ?? 'fall';
    return kill(e, ev, how, o.dx ?? 0, o.dy ?? 0), true;
  }
  // (Quick shots don't break a rush's wind-up, POISE; a heavy one does.)
  if (o.flinch && small(e) && !held(e, now) && !(e.attack?.rush && !o.heavy)) Object.assign(e, { attack: null, act: 'flinch', actT: 0, actDur: o.flinch });
  return false;
}
