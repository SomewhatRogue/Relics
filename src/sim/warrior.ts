/**
 * The Warrior's weapons in the room (numbers: shared/warrior.ts). The sword's shield bash stuns the goblin
 * in front and a quick counter after a parry is a riposte; the greatsword's overhead loosed on the white
 * flash sends out a shockwave; the spear stops a charging or lunging goblin dead, pinned, and its shaft
 * does little up close. All judged here, so a guest's goblins fall the way the leader's do.
 */
import { SHIELD_BASH, PIN, QUAKE, RIPOSTE, SHAFT, WEAPONS, type Swing } from '../shared/tuning';
import { shove } from './bodies';
import { damage, isDead } from './damage';
import { daze } from './venom';
import type { Enemy, FightEvent, Hero } from './types';

/** A counter started this soon after the parry, with a kit that ripostes. */
export const riposteNow = (h: Hero, now: number) => h.counter && !!WEAPONS[h.weapon].ripostes && now - (h.parriedAt ?? -9) <= RIPOSTE.window;

/** The spear's shaft: a goblin inside half its reach takes the shaft, not the point. */
export function shaftMult(h: Hero, s: Swing, e: Enemy): number {
  if (!WEAPONS[h.weapon].shaft) return 1;
  return Math.hypot(e.x - h.x, e.y - h.y) - e.radius < s.range * SHAFT.near ? SHAFT.mult : 1;
}

/** Coming at you: a charge, a spider's pounce, or a lunger's striped stab. */
export const lunging = (e: Enemy) => !!e.attack && (e.attack.kind === 'charge' || e.attack.kind === 'pounce' || (e.variant === 'lunger' && e.attack.kind === 'stab'));

/**
 * After a Warrior's blow has hurt a goblin that still stands: the spear pins a lunging one, the shield
 * bash stuns. True if it took over from the usual flinch.
 */
export function warriorHit(h: Hero, s: Swing, e: Enemy, wasLunging: boolean, now: number, ev: FightEvent[]): boolean {
  if (isDead(e)) return true;
  if (wasLunging && WEAPONS[h.weapon].pins && e.kind !== 'nest' && e.act !== 'carried') {
    Object.assign(e, { attack: null, act: 'pinned', actT: 0, actDur: PIN.time, kvx: 0, kvy: 0 });
    ev.push({ k: 'perfect', x: h.x, y: h.y }, { k: 'pin', x: e.x, y: e.y });
    return true;
  }
  if (s.shieldBash) {
    const t = (SHIELD_BASH.stun + (SHIELD_BASH.stunFull - SHIELD_BASH.stun) * h.power) * (e.kind === 'butcher' ? SHIELD_BASH.big : 1);
    ev.push({ k: 'shieldbash', x: e.x, y: e.y });
    daze(e, t, ev);
    return true;
  }
  return false;
}

/** The greatsword's perfect overhead: a shockwave ahead of you knocks every goblin in it down. */
export function quake(h: Hero, enemies: Enemy[], now: number, ev: FightEvent[]): void {
  const cx = h.x + h.fx * QUAKE.ahead, cy = h.y + h.fy * QUAKE.ahead;
  ev.push({ k: 'quake', x: cx, y: cy });
  for (const e of enemies) {
    if (isDead(e) || e.kind === 'nest' || e.act === 'carried' || (e.z ?? 0) !== (h.z ?? 0)) continue;
    const dx = e.x - cx, dy = e.y - cy, d = Math.hypot(dx, dy);
    if (d > QUAKE.radius + e.radius) continue;
    e.lastBy = h.id;
    if (damage(e, QUAKE.dmg, now, ev, { heavy: true, src: 'slam', how: 'burst', dx, dy })) continue;
    // Knocked flat: a striped blow or wind-up is lost with it; only a charge carries on (the spear's to stop).
    if (e.attack?.kind === 'charge' || e.act === 'pinned') continue;
    shove(e, dx / (d || 1), dy / (d || 1), QUAKE.knock, e.weight);
    Object.assign(e, { attack: null, act: 'stunned', actT: 0, actDur: QUAKE.down * (e.kind === 'butcher' ? QUAKE.big : 1) });
    ev.push({ k: 'stunned', x: e.x, y: e.y });
  }
  h.hitstop = Math.max(h.hitstop, 0.08);
}
