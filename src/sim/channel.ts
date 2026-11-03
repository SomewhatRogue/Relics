/**
 * The Mage's magic: the channel (a tap turns the spells to the next element at once, and primes the
 * next spell), and the spell each kit casts in each element.
 */
import { CHANNEL, HERO, STORM, technique, type Augment, type Element, type Swing, type TraitId } from '../shared/tuning';
import { shoot } from './bolts';
import { knack } from './gearstats';
import type { Bolt, FightEvent, Hero } from './types';

/** The element a Mage's spells are cast in now: fire to start with, and fire again while they carry
 *  another skill than the Channel (the fire ring, the storm tether). */
export const castElement = (h: Hero): Element => (h.relics.includes('channel') ? h.augments.channel || 'fire' : 'fire') as Element;

/** The channel: the next element at once, and the first spell after it primed. */
export function turnElement(h: Hero, ev: FightEvent[]): void {
  const order = CHANNEL.order, next = order[(order.indexOf(castElement(h)) + 1) % order.length];
  h.augments.channel = next;
  h.primed = true;
  // TWICE PRIMED: more than one spell; CLEAR HEAD: a little breath back.
  h.primeLeft = 1 + knack(h, 'twice');
  h.stamina = Math.min(HERO.stamina, h.stamina + knack(h, 'clear'));
  ev.push({ k: 'channeled', x: h.x, y: h.y, el: next });
}

/** A spell's primed multiplier (spent by this spell): CHANNEL.primed, more with the Mage's technique. */
export function spendPrimed(h: Hero): number {
  if (!h.primed) return 1;
  h.primeLeft = (h.primeLeft ?? 1) - 1;
  h.primed = h.primeLeft > 0;
  return CHANNEL.primed + technique(h.drills, 'MAGE') + knack(h, 'primed');
}

/**
 * A Mage's spell, shaped by its element: fire a firebolt or a burning fireball; frost three icicles or
 * a burst that freezes; storm a spark or lance that jumps on to the next goblins (lighter on the first).
 */
export function castSpell(h: Hero, s: Swing, el: Augment, mult: number, traits: TraitId[]): Bolt[] {
  if (el === 'frost' && !h.heavy) {
    return [-0.2, 0, 0.2].map((a) => {
      const c = Math.cos(a), n = Math.sin(a), aim = { ...h, fx: h.fx * c - h.fy * n, fy: h.fx * n + h.fy * c };
      return shoot(aim, { ...s, shot: 'lance', burst: 0, dmg: Math.round(s.dmg * 0.55), speed: (s.speed ?? 20) * 1.2 }, el, mult, traits);
    });
  }
  // (A rod's lance keeps running through its line: its element rides it, no burst.)
  const b = shoot(h, h.heavy && el !== 'storm' && !s.pierce ? { ...s, burst: Math.max(s.burst ?? 0, el === 'frost' ? 2.2 : 1.8) } : s, el, el === 'storm' ? mult * STORM.single : mult, traits);
  if (h.heavy && el === 'frost') b.freeze = true;
  if (el === 'storm') b.chain = true;
  return [b];
}
