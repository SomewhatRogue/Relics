/**
 * The Warrior's weapons in the room (numbers: shared/warrior.ts). Every perfect is a hold let go on the
 * white flash: the sword's shield bash stuns every goblin in its arc, the greatsword's overhead sends out
 * a shockwave, the spear's lunge pins what it runs through. Bonuses on top: a quick counter after a
 * parry is a riposte, and the spear pins a goblin it catches charging or lunging. The shaft does little
 * up close. All judged here, so a guest's goblins fall the way the leader's do.
 */
import { SHIELD_BASH, PIN, QUAKE, RIPOSTE, SHAFT, WEAPONS, type Swing } from '../shared/tuning';
import { shove } from './bodies';
import { damage, isDead } from './damage';
import { daze } from './venom';
import { stun } from './stuns';
import type { Enemy, FightEvent, Hero } from './types';

/** A counter started this soon after the parry, with a kit that ripostes. */
export const riposteNow = (h: Hero, now: number) => h.counter && !!WEAPONS[h.weapon].ripostes && now - (h.parriedAt ?? -9) <= RIPOSTE.window;

/** The spear's shaft: a goblin inside half its reach takes the shaft, not the point (a quick thrust;
 *  the held lunge drives the point home, since it carries you in among them). */
export function shaftMult(h: Hero, s: Swing, e: Enemy): number {
  if (!WEAPONS[h.weapon].shaft || h.heavy) return 1;
  return Math.hypot(e.x - h.x, e.y - h.y) - e.radius < s.range * SHAFT.near ? SHAFT.mult : 1;
}

/** Coming at you: a charge, a spider's pounce, or a lunger's striped stab. */
export const lunging = (e: Enemy) => !!e.attack && (e.attack.kind === 'charge' || e.attack.kind === 'pounce' || (e.variant === 'lunger' && e.attack.kind === 'stab'));

/**
 * After a Warrior's blow has hurt a goblin that still stands: the spear pins one it catches lunging (a
 * bonus) and, let go on the white flash, whatever its lunge runs through (the perfect); the shield bash
 * stuns, on the flash every goblin in its arc for a full second. True if it took over from the usual flinch.
 */
export function warriorHit(h: Hero, s: Swing, e: Enemy, wasLunging: boolean, now: number, ev: FightEvent[]): boolean {
  if (isDead(e)) return true;
  const pins = WEAPONS[h.weapon].pins && e.kind !== 'nest' && e.act !== 'carried';
  if (pins && (wasLunging || (h.heavy && h.perfect))) {
    if (!stun(e, h.id, now, wasLunging ? PIN.caught : PIN.flash, ev, 'pinned', true)) return false;
    return ev.push({ k: 'pin', x: e.x, y: e.y }), true;
  }
  if (s.shieldBash) {
    const t = (h.perfect ? SHIELD_BASH.perfect : SHIELD_BASH.stun + (SHIELD_BASH.stunFull - SHIELD_BASH.stun) * h.power) * (e.kind === 'butcher' ? SHIELD_BASH.big : 1);
    ev.push({ k: 'shieldbash', x: e.x, y: e.y });
    return daze(e, t, h.id, now, ev);
  }
  return false;
}

/** The sword's perfect bash, let go on the flash: every goblin in a wider arc in front, not just one. */
export const flashBash = (h: Hero, s: Swing): Swing => (s.shieldBash && h.heavy && h.perfect ? { ...s, arc: SHIELD_BASH.arc, hits: undefined } : s);

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
    if (stun(e, h.id, now, QUAKE.down * (e.kind === 'butcher' ? QUAKE.big : 1), ev)) ev.push({ k: 'stunned', x: e.x, y: e.y });
  }
  h.hitstop = Math.max(h.hitstop, 0.08);
}
