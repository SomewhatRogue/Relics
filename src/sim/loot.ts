/**
 * Loot in the room: a goblin may drop a weapon for the nearest player's class (half the time the
 * kind in their hand). Standing on it they can take it into their pack, if there's room; they equip
 * it from the pack.
 */
import { DROPS, WEAPONS, itemName, rollItem } from '../shared/tuning';
import type { Rng } from '../shared/rng';
import { PACK } from './pack';
import type { Drop, Enemy, FightEvent, Hero, Intent } from './types';

let nextId = 1;
/** How close a hero must stand to take a drop. */
export const REACH = 1.4;

/** Maybe drop a weapon where this goblin fell. */
export function dropFrom(e: Enemy, heroes: Hero[], drops: Drop[], rng: Rng, ev: FightEvent[]): void {
  if (e.kind !== 'scrapper' && e.kind !== 'butcher') return;
  if (rng.next() >= DROPS[e.kind]) return;
  let near: Hero | null = null, bd = Infinity;
  for (const h of heroes) {
    const d = Math.hypot(h.x - e.x, h.y - e.y);
    if (h.id !== 'squire' && d < bd) (bd = d), (near = h);
  }
  if (!near) return;
  const item = rollItem(rng, WEAPONS[near.weapon].cls, DROPS.forged[e.kind], rng.next() < 0.5 ? near.weapon : undefined);
  drops.push({ id: nextId++, x: e.x, y: e.y, item, life: DROPS.life });
  ev.push({ k: 'drop', x: e.x, y: e.y, q: item.quality });
}

/** The hero's take press: into the pack, if it's for their class and there's room. */
export function takeLoot(h: Hero, inp: Intent, drops: Drop[], ev: FightEvent[]): void {
  if (inp.takeSeq === h.seen.take) return;
  h.seen.take = inp.takeSeq;
  const i = drops.findIndex((d) => d.id === inp.take);
  const d = drops[i];
  if (!d || Math.hypot(d.x - h.x, d.y - h.y) > REACH || WEAPONS[d.item.kit].cls !== WEAPONS[h.weapon].cls || h.bag.length >= PACK) return;
  drops.splice(i, 1);
  h.bag.push(d.item);
  ev.push({ k: 'loot', x: h.x, y: h.y, name: itemName(d.item) });
}

/** Drops fade after a while. */
export const stepDrops = (drops: Drop[], dt: number) => drops.filter((d) => (d.life -= dt) > 0);
