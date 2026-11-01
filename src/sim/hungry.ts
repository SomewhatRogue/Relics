/**
 * Hungry gear in the fight (shared/hungry.ts): each piece's gift and its cost, hooked in where the
 * fight already decides those things. `wears` is the one test.
 */
import { CLASS_SKILL, LANTERN, WEAPONS, type HungryId } from '../shared/tuning';
import { isDead } from './damage';
import type { Enemy, FightEvent, Hero } from './types';

export const HUNGRY_FX = { leech: 0.2, fed: 0.1, starve: 8, bite: 3, chain: 4, chainDmg: 0.6, apron: 0.5, lure: 6, ransom: 50, near: 4 };

export function wears(h: Hero | undefined, id: HungryId): boolean {
  if (!h) return false;
  return h.arms?.[h.weapon]?.hungry === id || h.armor?.hungry === id || (h.rings ?? []).some((r) => r.hungry === id);
}

/** Healing `n` from `by` to `to`, as their hungry gear allows. */
export function heals(to: Hero, by: Hero | undefined, n: number): number {
  if (by?.cold) return 0;
  if (wears(to, 'cleaver') && by !== to) return 0;
  if (wears(by, 'keeping')) return n * (by === to ? 2 : 0.5);
  return n;
}

/** A hero's kill: the Larder Pike feeds, the Keeping Mace lights a coal, the Tooth Ring recharges. */
export function onKill(h: Hero, now: number, ev: FightEvent[]): void {
  h.lastKill = now;
  if (wears(h, 'pike')) h.fed++;
  if (wears(h, 'keeping') && h.glow < LANTERN.max) (h.glow++), ev.push({ k: 'coal', x: h.x, y: h.y, n: h.glow });
  if (wears(h, 'tooth')) for (const r of h.relics) h.relicReady[r] = Math.min(h.relicReady[r], now);
}

/** Each tick: the Larder Pike bites if it hasn't eaten, while goblins are up. */
export function stepHungry(heroes: Hero[], enemies: Enemy[], now: number, ev: FightEvent[]): void {
  for (const h of heroes) {
    if (!wears(h, 'pike') || h.act === 'down' || now - h.lastKill < HUNGRY_FX.starve || now < h.biteAt) continue;
    if (!enemies.some((e) => !isDead(e) && e.alert !== false && !e.respawns)) continue;
    h.biteAt = now + 1;
    h.hp = Math.max(1, h.hp - HUNGRY_FX.bite);
    ev.push({ k: 'hit', x: h.x, y: h.y, n: HUNGRY_FX.bite, heavy: false, on: 'hero', src: 'bite' } as FightEvent);
  }
}

/** The damage multiplier the Larder Pike has grown to. */
export const fedMult = (h: Hero) => (wears(h, 'pike') ? 1 + HUNGRY_FX.fed * h.fed : 1);
/** Mother Rust's Needles: breath back at half, none while a goblin is looking at you. */
export function needlesBreath(h: Hero, enemies: Enemy[]): number {
  if (!wears(h, 'needles')) return 1;
  const seen = enemies.some((e) => !isDead(e) && e.alert !== false && Math.hypot(e.x - h.x, e.y - h.y) < 6.5 && ((h.x - e.x) * e.fx + (h.y - e.y) * e.fy) > 0);
  return seen ? 0 : 0.5;
}
/** The Jealous Rod: the skill takes twice as long; the relic won't answer. */
export const jealousCooldown = (h: Hero) => (wears(h, 'jealous') && h.relic === CLASS_SKILL[WEAPONS[h.weapon].cls] ? 2 : 1);
export const jealousBlocks = (h: Hero) => wears(h, 'jealous') && h.relic !== h.relics[0];
