/**
 * What the land's beasts leave besides coin (docs/design/materials.md): HIDE from a wolf or a pouncer, SILK from a spider,
 * BROOD SILK from the nest. Only on a roaming land. One roll of the room's dice per beast that can drop, so a run repeats.
 */
import type { GameMap } from '../shared/arena';
import { Rng } from '../shared/rng';
import type { MatId } from '../shared/materials';
import { isSpiderKind } from '../shared/spiders';
import { COINS } from '../shared/tuning';
import { isDead } from './damage';
import { pid, type Pickup } from './pickups';
import type { Enemy } from './types';

/** The chance each beast leaves its material. */
export const MAT_DROP = { hide: 0.4, silk: 0.35 } as const;

/** Which material a dead beast might leave, and its chance (1 is sure); null for one that leaves none. */
export function matOf(e: Enemy): { id: MatId; chance: number } | null {
  if (e.kind === 'nest') return { id: 'brood', chance: 1 };
  if (isSpiderKind(e.kind)) return { id: 'silk', chance: MAT_DROP.silk };
  if (e.variant === 'wolf' || e.variant === 'pouncer') return { id: 'hide', chance: MAT_DROP.hide };
  return null;
}

/** Where a beast falls on a roaming land: maybe a material on the ground, to be walked over as coin is. */
export function dropMats(e: Enemy, pickups: Pickup[], rng: Rng, roam: boolean | undefined): void {
  if (!roam) return;
  const m = matOf(e);
  if (!m || (e.respawns && e.kind !== 'nest' && !isSpiderKind(e.kind))) return;
  if (m.chance < 1 && rng.next() >= m.chance) return;
  pickups.push({ id: pid(pickups), x: e.x, y: e.y, life: COINS.life * 2, mat: m.id });
}

/** A gathered dressing lies till taken, so long a life it never fades in a trip. */
const GATHER_LIFE = 86400;
/** The salt for the gathers' own stream: no other roll of the room moves. */
const GATHER_SALT = 0x6a7e3;

/** The room's spot-gathers (shared/gatefieldsgather.ts) rolled at the trip's start, each with its own chance, from a stream of the seed alone. `after` ones wait (layAfter). */
export function layGathers(room: { map: GameMap; pickups: Pickup[]; roam?: boolean }, seed: number): void {
  if (!room.roam) return;
  const rng = new Rng((seed * 7919 + GATHER_SALT) >>> 0);
  for (const g of room.map.gathers ?? []) {
    const roll = rng.next();
    if (g.after !== undefined || roll >= (g.chance ?? 1)) continue;
    room.pickups.push({ id: pid(room.pickups), x: g.x, y: g.y, life: GATHER_LIFE, mat: g.mat });
  }
}

const seen = new WeakMap<object, { met: Set<number>; laid: Set<number> }>();
/** Each tick on a roaming land: once every foe of a pack is dead (and the pack was there to kill), its `after` gathers are laid, once. */
export function layAfter(room: { map: GameMap; allEnemies: Enemy[]; pickups: Pickup[]; roam?: boolean }): void {
  const list = room.map.gathers?.filter((g) => g.after !== undefined);
  if (!room.roam || !list?.length) return;
  let st = seen.get(room);
  if (!st) seen.set(room, (st = { met: new Set(), laid: new Set() }));
  for (const pack of new Set(list.map((g) => g.after!))) {
    if (st.laid.has(pack)) continue;
    const foes = room.allEnemies.filter((e) => e.pack === pack);
    if (foes.some((e) => !isDead(e))) { st.met.add(pack); continue; }
    if (!st.met.has(pack)) continue;
    st.laid.add(pack);
    for (const g of list) if (g.after === pack) room.pickups.push({ id: pid(room.pickups), x: g.x, y: g.y, life: GATHER_LIFE, mat: g.mat });
  }
}
