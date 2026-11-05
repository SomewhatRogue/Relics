/**
 * Poison on heroes (numbers: POISON). A spider's bite or a puddle adds a stack; it ticks once a second
 * for a little a stack and never takes the last point of health; it wears off a stack at a time once
 * the biting stops. A Bitter cures it; a Healer's heal takes a stack off. The room judges it all, and
 * the stacks ride on the hero to friends' screens like the rest of a hero.
 */
import { POISON } from '../shared/tuning';
import type { FightEvent, Hero } from './types';
import { count } from './score';

export const poisoned = (h: Hero) => (h.poison ?? 0) > 0;

/** A bite (or a puddle) lands: one more stack (up to POISON.most), and the clock starts over. */
export function poison(h: Hero, now: number, ev: FightEvent[]): void {
  if (h.act === 'down' || h.id === 'squire') return;
  const was = h.poison ?? 0;
  h.poison = Math.min(POISON.most, was + 1);
  h.poisonUntil = now + POISON.time;
  if (!was) h.poisonNext = now + POISON.every;
  ev.push({ k: 'poisoned', x: h.x, y: h.y });
}

/** Cured (a Bitter: all of it) or eased (a heal: a stack). True if there was any to cure. */
export function cure(h: Hero, all: boolean, ev: FightEvent[]): boolean {
  if (!poisoned(h)) return false;
  h.poison = all ? 0 : h.poison! - 1;
  ev.push({ k: 'cured', x: h.x, y: h.y });
  return true;
}

/** Once a tick: ticks of damage, and stacks wearing off. Going down clears it. */
export function stepPoison(heroes: Hero[], now: number, ev: FightEvent[]): void {
  for (const h of heroes) {
    if (!poisoned(h)) continue;
    if (h.act === 'down') {
      h.poison = 0;
      continue;
    }
    if (now >= (h.poisonUntil ?? 0)) {
      h.poison = h.poison! - 1;
      h.poisonUntil = now + POISON.fade;
      if (!h.poison) continue;
    }
    if (now < (h.poisonNext ?? 0)) continue;
    h.poisonNext = now + POISON.every;
    const n = Math.min(h.hp - 1, POISON.dmg * h.poison!);
    if (n <= 0) continue;
    h.hp -= n;
    count(h.id, 'taken', n);
    ev.push({ k: 'hit', x: h.x, y: h.y, n, heavy: false, on: 'hero', tick: true, src: 'poison' });
  }
}
