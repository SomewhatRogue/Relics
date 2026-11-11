/**
 * Boss loot (docs/design/boss-loot.md): in the Deep, a boss of the kit, a named butcher or a BIG ONE may
 * leave one unique piece of its pool for the whole group. Alone, it is an ordinary floor drop; in a group
 * it goes up for a roll (sim/lootroll.ts).
 */
import { DEEP_BANDS, bandOf } from '../shared/deepbands';
import { DROPS } from '../shared/tuning';
import { BUTCHER_POOLS, UNIQUE_DROP, poolOf, uniqueItem, type PoolId } from '../shared/uniques';
import type { Rng } from '../shared/rng';
import { dropId } from './loot';
import { isDead } from './damage';
import { openRoll, players } from './lootroll';
import type { ArenaRoom } from './room';
import type { Enemy } from './types';

/** The pool a fallen goblin drops from, and the chance. */
export function poolFor(e: Enemy, floor: number): { pool: PoolId; chance: number } | null {
  if (e.boss) return e.boss.who === 'haulier' ? { pool: 'haulier', chance: UNIQUE_DROP.boss } : null;
  if (e.name && BUTCHER_POOLS[e.name]) return { pool: BUTCHER_POOLS[e.name], chance: UNIQUE_DROP.butcher };
  if (e.big) return { pool: e.role === 'ironhide' || e.variant === 'ironhide' ? 'iron' : 'brute', chance: UNIQUE_DROP.big[DEEP_BANDS.indexOf(bandOf(floor))] };
  return null;
}

/** The newly dead this tick: give each its drop (the Doorkeepers once, when both are down). */
export function uniqueDrops(room: ArenaRoom, dead: Enemy[], rng: Rng): void {
  for (const e of dead) {
    if (e.boss?.who === 'latch' || e.boss?.who === 'hasp') {
      const pair = room.enemies.filter((o) => o.boss?.who === 'latch' || o.boss?.who === 'hasp');
      if (room.keeperDrop || !pair.every((o) => isDead(o))) continue;
      room.keeperDrop = true;
      give(room, 'doorkeepers', e.x, e.y, rng);
      continue;
    }
    const p = poolFor(e, room.floor);
    if (p && (p.chance >= 1 || rng.next() < p.chance)) give(room, p.pool, e.x, e.y, rng);
  }
}

function give(room: ArenaRoom, pool: PoolId, x: number, y: number, rng: Rng): void {
  const ids = poolOf(pool);
  if (!ids.length) return;
  const item = uniqueItem(rng.pick(ids));
  if (players(room.heroes).length <= 1) {
    room.drops.push({ id: dropId(), x, y, item, life: DROPS.life });
    room.events.push({ k: 'drop', x, y, q: item.quality });
  } else openRoll(room, item, x, y);
}
