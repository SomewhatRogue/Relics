/**
 * The Mage's element, which is its spellbook (shared/spellbook.ts): its own button (ELEMENT, X) turns it
 * to the next at once, again in CHANNEL.cooldown, and primes the next spell. Kept on the hero
 * (`augments.channel`, as saves have always had it), so a guest's screen has it too.
 */
import { CHANNEL, HERO, INPUT_BUFFER, STREAM, TAPS, WEAPONS, technique, type Element, type MageKit, type Swing } from '../shared/tuning';
import { knack } from './gearstats';
import type { FightEvent, Hero, Intent } from './types';

/** The element a Mage's spells are cast in now: fire to start with. */
export const castElement = (h: Hero): Element => (h.augments.channel || 'fire') as Element;

/** A Mage's tap, as the element makes it: the kit's blow times its TAPS damage (anyone else's as it is).
 *  The wand's storm tap is quick, so a mash keeps its stream on (sim/stream.ts). */
export function tapSwing(h: Hero, s: Swing): Swing {
  const row = WEAPONS[h.weapon]?.cls === 'MAGE' ? TAPS[h.weapon as MageKit]?.[castElement(h)] : undefined;
  if (h.weapon === 'wand' && castElement(h) === 'storm') s = { ...s, windup: STREAM.windup, recover: STREAM.recover, range: STREAM.reach };
  return row && row.dmg !== 1 ? { ...s, dmg: Math.max(1, Math.round(s.dmg * row.dmg)) } : s;
}

/** The next element at once, and the first spell after it primed. */
export function turnElement(h: Hero, ev: FightEvent[], now?: number): void {
  const order = CHANNEL.order, next = order[(order.indexOf(castElement(h)) + 1) % order.length];
  h.augments.channel = next;
  h.primed = true;
  // TWICE PRIMED: more than one spell; CLEAR HEAD: a little breath back.
  h.primeLeft = 1 + knack(h, 'twice');
  h.stamina = Math.min(HERO.stamina, h.stamina + knack(h, 'clear'));
  if (now !== undefined) h.relicReady.channel = now + CHANNEL.cooldown;
  ev.push({ k: 'channeled', x: h.x, y: h.y, el: next });
}

/** The ELEMENT press, each tick: a Mage on its feet turns as soon as the switch is ready (a press in the
 *  cooldown waits for it, so a tap is never lost; presses don't stack). */
export function stepElement(h: Hero, inp: Intent, now: number, ev: FightEvent[]): void {
  const seq = inp.elementSeq ?? h.seen.element ?? 0;
  if (seq !== (h.seen.element ?? 0)) (h.seen.element = seq), (h.elementQueuedAt = now);
  const at = h.elementQueuedAt ?? -9;
  if (at < 0) return;
  if (now - at > INPUT_BUFFER + CHANNEL.cooldown || WEAPONS[h.weapon]?.cls !== 'MAGE') return void (h.elementQueuedAt = -9);
  if (h.act === 'down' || h.act === 'stun' || h.act === 'hurt' || now < (h.relicReady.channel ?? 0)) return;
  h.elementQueuedAt = -9;
  turnElement(h, ev, now);
}

/** A spell's primed multiplier (spent by this spell): CHANNEL.primed, more with the Mage's technique. */
export function spendPrimed(h: Hero): number {
  if (!h.primed) return 1;
  h.primeLeft = (h.primeLeft ?? 1) - 1;
  h.primed = h.primeLeft > 0;
  return CHANNEL.primed + technique(h.drills, 'MAGE') + knack(h, 'primed');
}
