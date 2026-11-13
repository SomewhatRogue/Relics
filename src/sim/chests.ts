/**
 * Chests: stand beside one and USE it; it takes CHEST.open seconds, and the fight doesn't wait (walk
 * off or get knocked down and it shuts again). Light the colour of the best thing inside leaks from the
 * seams; hungry light is wrong, and goblins near look up. Every player in the room gets their own roll,
 * seen only by them. A chained chest (deep jobs) opens only once the named butcher is dead.
 */
import { COINS, POTION_ORDER, TIER_ORDER, WEAPONS, rollAny, rollTier, type Item, type Tier } from '../shared/tuning';
import type { Rng } from '../shared/rng';
import { isDead } from './damage';
import type { Drop, Enemy, FightEvent, Hero } from './types';
import type { Pickup } from './pickups';

/** `boss`: a boss's sure chest, its seed (sim/bosschest.ts), and the relics in it, by hero. */
export interface Chest { id: number; x: number; y: number; state: 'shut' | 'opening' | 'open'; t: number; by: string; tier: Tier; chained: boolean; rolls: Record<string, Item[]>; boss?: number; relics?: Record<string, import('../shared/relicitems').RelicItem>; sure?: 'hempen' }
export const CHEST = { open: 1.2, reach: 1.3, leave: 1.8, alert: 6 };
/** A plain chest's copper, half the time (economy.md slice 2: copper, the job's pay is the most of it). */
export const CHEST_COPPER = [4, 12] as const;
import { lift } from './loot';
import { openBossChest, rollBossChest } from './bosschest';
let nextId = 1, dropId = 50000;

export const newChest = (x: number, y: number, chained = false, boss?: number): Chest => ({ id: nextId++, x, y, state: 'shut', t: 0, by: '', tier: 'plain', chained, rolls: {}, ...(boss !== undefined ? { boss } : {}) });
const players = (heroes: Hero[]) => heroes.filter((h) => h.id !== 'squire');

/** Start opening: roll for every player now (so the light is true), best of the opener's sets the colour. */
export function startChest(c: Chest, h: Hero, heroes: Hero[], enemies: Enemy[], rng: Rng, shift: number, ev: FightEvent[], lv = 1, floor = 0): void {
  if (c.state !== 'shut' || Math.hypot(h.x - c.x, h.y - c.y) > CHEST.reach || h.act === 'down') return;
  if (c.chained && enemies.some((e) => e.name && !isDead(e))) return void ev.push({ k: 'chained', x: c.x, y: c.y });
  if (c.boss !== undefined) rollBossChest(c, players(heroes), lv);
  else for (const p of players(heroes)) {
    if (c.rolls[p.id]) continue;
    const n = rng.next() < 0.4 || c.chained ? 2 : 1, cls = WEAPONS[p.weapon].cls;
    c.rolls[p.id] = Array.from({ length: n }, () => {
      const slot = rng.next() < 0.55 ? 'weapon' : rng.next() < 0.5 ? 'armor' : 'ring';
      return lift(rollAny(rng, cls, rollTier(rng, 'chest', shift + (c.chained ? 1 : 0), lv, floor), slot), lv);
    });
  }
  c.tier = c.rolls[h.id].reduce<Tier>((best, it) => (TIER_ORDER.indexOf(it.quality) > TIER_ORDER.indexOf(best) ? it.quality : best), 'plain');
  Object.assign(c, { state: 'opening', t: 0, by: h.id });
  ev.push({ k: 'chest', x: c.x, y: c.y, tier: c.tier, state: 'opening' });
  if (c.tier === 'hungry') for (const e of enemies) if (!isDead(e) && Math.hypot(e.x - c.x, e.y - c.y) < CHEST.alert) e.alert = true;
}

/** Each tick: keep opening while the opener stays; then out it all comes. */
export function stepChests(chests: Chest[], heroes: Hero[], drops: Drop[], pickups: Pickup[], rng: Rng, ev: FightEvent[], dt: number): void {
  for (const c of chests) {
    if (c.state !== 'opening') continue;
    const h = heroes.find((o) => o.id === c.by);
    if (!h || h.act === 'down' || h.act === 'hurt' || Math.hypot(h.x - c.x, h.y - c.y) > CHEST.leave) {
      c.state = 'shut';
      ev.push({ k: 'chest', x: c.x, y: c.y, tier: c.tier, state: 'shut' });
      continue;
    }
    if ((c.t += dt) < CHEST.open) continue;
    c.state = 'open';
    ev.push({ k: 'chest', x: c.x, y: c.y, tier: c.tier, state: 'open' });
    for (const [id, items] of Object.entries(c.rolls))
      items.forEach((item, i) => drops.push({ id: dropId++, x: c.x - 0.6 + i * 1.2, y: c.y + 0.9, item, life: 120, owner: id }));
    // A boss's sure chest: each hero's relic, and its pile of gold (nothing left to chance on the room's dice).
    if (c.boss !== undefined) {
      openBossChest(c, heroes, pickups, () => dropId++, ev);
      continue;
    }
    if (rng.next() < 0.5) pickups.push({ id: dropId++, x: c.x + 0.9, y: c.y + 0.4, life: COINS.life, gold: CHEST_COPPER[0] + Math.floor(rng.next() * (CHEST_COPPER[1] - CHEST_COPPER[0] + 1)) });
    if (rng.next() < 0.3) pickups.push({ id: dropId++, x: c.x - 0.9, y: c.y + 0.4, life: COINS.life, potion: rng.pick(POTION_ORDER) });
  }
}
