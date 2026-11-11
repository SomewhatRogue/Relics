/**
 * Loot in the room: a goblin may drop a weapon for the nearest player's class (half the time the
 * kind in their hand). Standing on it they can take it into their pack, if there's room; they equip
 * it from the pack.
 */
import { DROPS, ELITE, WEAPONS, itemName, rollAny, rollTier, type Item } from '../shared/tuning';
import { itemLevel } from '../shared/lootlevel';
import type { Rng } from '../shared/rng';
import { full } from './pack';
import type { Drop, Enemy, FightEvent, Hero, Intent } from './types';

let nextId = 1;
/** A fresh drop id (sim/uniquedrop.ts, lootroll.ts make drops too). */
export const dropId = () => nextId++;
/** How close a hero must stand to take a drop. */
export const REACH = 1.4;

/** A drop at the party's level (shared/lootlevel.ts): a level or two up for a strong party (never down, never a hungry piece). */
export const lift = (i: Item, lv: number): Item => (i.hungry || (i.level ?? 0) >= itemLevel(lv) ? i : { ...i, level: itemLevel(lv) });

/**
 * Maybe drop a weapon where this goblin fell (a BIG ONE always drops one). `lv`: the party's level. An
 * elite drops one more often, rolled ELITE.loot.levels up the level curve (shared/elites.ts).
 */
export function dropFrom(e: Enemy, heroes: Hero[], drops: Drop[], rng: Rng, ev: FightEvent[], lv = 1, floor = 0): void {
  // (A boss of the kit leaves nothing on the floor: its sure chest is the loot, sim/bosschest.ts.)
  if ((e.kind !== 'scrapper' && e.kind !== 'butcher') || e.boss) return;
  const elite = !!e.elite?.length;
  if (rng.next() >= (elite ? ELITE.loot.chance : DROPS[e.kind]) && !e.big) return;
  let near: Hero | null = null, bd = Infinity;
  for (const h of heroes) {
    const d = Math.hypot(h.x - e.x, h.y - e.y);
    if (h.id !== 'squire' && d < bd) (bd = d), (near = h);
  }
  if (!near) return;
  // Tier by who fell; butchers sometimes leave armor or a ring instead of a weapon.
  const tier = rollTier(rng, e.name ? 'named' : e.big ? 'butcher' : e.kind, 0, lv + (elite ? ELITE.loot.levels : 0), floor), cls = WEAPONS[near.weapon].cls;
  const slot = e.kind === 'butcher' && rng.next() < 0.3 ? (rng.next() < 0.5 ? 'armor' : 'ring') : 'weapon';
  const item = lift(rollAny(rng, cls, tier, slot, slot === 'weapon' && rng.next() < 0.5 ? near.weapon : undefined, e.name), lv);
  drops.push({ id: nextId++, x: e.x, y: e.y, item, life: DROPS.life });
  ev.push({ k: 'drop', x: e.x, y: e.y, q: item.quality });
}

/** The hero's take press: into the pack, if it's for their class and there's room. */
export function takeLoot(h: Hero, inp: Intent, drops: Drop[], ev: FightEvent[]): void {
  if (inp.takeSeq === h.seen.take) return;
  h.seen.take = inp.takeSeq;
  const i = drops.findIndex((d) => d.id === inp.take);
  const d = drops[i];
  if (!d || (d.owner && d.owner !== h.id) || Math.hypot(d.x - h.x, d.y - h.y) > REACH || (d.item.kit && WEAPONS[d.item.kit].cls !== WEAPONS[h.weapon].cls) || full(h)) return;
  drops.splice(i, 1);
  h.bag.push(d.item);
  ev.push({ k: 'loot', x: h.x, y: h.y, name: itemName(d.item) });
}

/** Drops fade after a while. */
export const stepDrops = (drops: Drop[], dt: number) => drops.filter((d) => (d.life -= dt) > 0);
