/**
 * What lies on the floor besides weapons: gold and potions. Gold goes to whoever walks over it and is
 * split evenly across the party (the picker keeps the odd coin), so nobody races for coins. A potion
 * goes on the belt of whoever walks over it, if there's room.
 */
import { COINS, POTION, POTION_DROPS, POTION_ORDER, type PotionId } from '../shared/tuning';
import type { Rng } from '../shared/rng';
import type { Enemy, FightEvent, Hero } from './types';
import { HUNGRY_FX, wears } from './hungry';
import { RELIC_DROP, relicName, rollRelic, type RelicItem } from '../shared/relicitems';

export interface Pickup { id: number; x: number; y: number; life: number; gold?: number; potion?: PotionId; relic?: RelicItem }
let nextId = 1;

const kindOf = (e: Enemy) => (e.name ? 'named' : e.kind === 'butcher' ? 'butcher' : e.bow ? 'archer' : 'scrapper');

/** Where a goblin falls: maybe gold, maybe a potion. Dummies and the training butcher leave nothing. */
export function dropPickups(e: Enemy, pickups: Pickup[], rng: Rng): void {
  if ((e.kind !== 'scrapper' && e.kind !== 'butcher') || e.respawns) return;
  const k = kindOf(e), c = COINS[k];
  if (rng.next() < c.chance) pickups.push({ id: nextId++, x: e.x, y: e.y, life: COINS.life, gold: c.min + Math.floor(rng.next() * (c.max - c.min + 1)) });
  if (rng.next() < POTION_DROPS[k]) {
    const w = POTION_DROPS.weights, total = POTION_ORDER.reduce((s, p) => s + w[p], 0);
    let r = rng.next() * total, pick: PotionId = 'bitter';
    for (const p of POTION_ORDER) if ((r -= w[p]) < 0) { pick = p; break; }
    pickups.push({ id: nextId++, x: e.x + 0.4, y: e.y + 0.2, life: COINS.life, potion: pick });
  }
}

/** What a sneak-thief took, dropped where it fell (sim/thief.ts): it waits a good while. */
export function dropLoot(pickups: Pickup[], x: number, y: number, loot: { gold?: number; potion?: PotionId }): void {
  pickups.push({ id: nextId++, x, y, life: COINS.life * 2, ...(loot.gold ? { gold: loot.gold } : {}), ...(loot.potion ? { potion: loot.potion } : {}) });
}

/** A named butcher, now and then, leaves a relic where it fell (its own seeded stream: RELIC_DROP.named). */
export function dropRelic(e: Enemy, pickups: Pickup[], rng: Rng): void {
  if (!e.name || e.respawns || e.kind !== 'butcher') return;
  if (rng.next() >= RELIC_DROP.named) return;
  pickups.push({ id: nextId++, x: e.x - 0.3, y: e.y + 0.3, life: RELIC_LIFE, relic: rollRelic(rng) });
}
/** A relic on the floor waits a long while (it's worth walking back for). */
const RELIC_LIFE = 90;

/** A relic picked up: kept, and carried at once if nothing is. */
function takeRelic(h: Hero, r: RelicItem, ev: FightEvent[]): void {
  h.found = [...(h.found ?? []), r];
  if (!h.relics[1]) {
    h.relics = [h.relics[0], r.kind];
    h.relicItem = r.id;
    h.augments[r.kind] = r.el;
  }
  ev.push({ k: 'relicfound', x: h.x, y: h.y }, { k: 'loot', x: h.x, y: h.y, name: relicName(r) });
}

const players = (heroes: Hero[]) => heroes.filter((h) => h.id !== 'squire');

/** Pick up what heroes walk over; the rest fades. */
export function stepPickups(pickups: Pickup[], heroes: Hero[], ev: FightEvent[], dt: number): Pickup[] {
  return pickups.filter((p) => {
    const h = players(heroes).find((o) => o.act !== 'down' && Math.hypot(o.x - p.x, o.y - p.y) < COINS.reach && (!p.potion || o.belt.length < POTION.belt));
    if (h && p.gold) {
      // The Tooth Ring takes the party's gold near its wearer, and they see it go.
      const tooth = players(heroes).find((o) => wears(o, 'tooth') && Math.hypot(o.x - p.x, o.y - p.y) < HUNGRY_FX.near);
      const party = tooth ? [tooth] : players(heroes), share = Math.floor(p.gold / party.length);
      if (tooth && players(heroes).length > 1) ev.push({ k: 'tooth', x: tooth.x, y: tooth.y });
      for (const o of party) {
        // Someone's Wedding Ring: every coin counts twice.
        const n = (share + (o === (tooth ?? h) ? p.gold - share * party.length : 0)) * (wears(o, 'wedding') ? 2 : 1);
        if (n > 0) (o.purse += n), ev.push({ k: 'gold', id: o.id, x: o.x, y: o.y, n });
      }
      return false;
    }
    if (h && p.relic) return takeRelic(h, p.relic, ev), false;
    if (h && p.potion) {
      h.belt.push(p.potion);
      ev.push({ k: 'potion', x: h.x, y: h.y, kind: p.potion });
      return false;
    }
    return (p.life -= dt) > 0;
  });
}
