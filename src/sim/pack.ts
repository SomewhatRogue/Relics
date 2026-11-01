/**
 * The pack: weapons carried but not in hand, and the relics a hero has won. Changes come in as an
 * intent (sim/types.ts gearOp) and the room applies them, so a friend's pack works the same online.
 * The world doesn't stop while you rummage.
 */
import { CLASS_KITS, RELICS, WEAPONS, abilitiesOf, itemName, slotOf, type Item } from '../shared/tuning';
import { refreshHealth } from './gearstats';
import type { FightEvent, Hero } from './types';

/** Weapons a pack holds. */
export const PACK = 8;
export const GEAR = { equip: 1, drop: 2, carry: 3, front: 4, pour: 5, off: 6 } as const;

/** Put on armor (the old goes in the pack) or a ring (a third pushes out the older). */
function wear(h: Hero, i: number, it: Item, ev: FightEvent[]): void {
  h.bag.splice(i, 1);
  if (slotOf(it) === 'armor') {
    if (h.armor) h.bag.push(h.armor);
    h.armor = it;
  } else {
    // A third ring pushes out the older, never Someone's Wedding Ring (only the church takes that off).
    if (h.rings.length >= 2) {
      const k = h.rings[0].hungry === 'wedding' ? 1 : 0;
      if (h.rings[k].hungry === 'wedding') return void h.bag.splice(i, 0, it);
      h.bag.push(h.rings.splice(k, 1)[0]);
    }
    h.rings.push(it);
  }
  refreshHealth(h);
  ev.push({ k: 'weapon', x: h.x, y: h.y, name: itemName(it) });
}

export function applyGear(h: Hero, op: number, arg: number, ev: FightEvent[]): void {
  const cls = WEAPONS[h.weapon].cls;
  if (op === GEAR.equip) {
    const it = arg >= 0 ? h.bag[arg] : undefined;
    if (arg >= 0 && !it) return;
    if (it && slotOf(it) !== 'weapon') return wear(h, arg, it, ev);
    if (it && WEAPONS[it.kit!].cls !== cls) return;
    const old = h.arms[h.weapon];
    if (it) h.bag.splice(arg, 1);
    if (old) h.bag.push(old);
    h.weapon = it ? it.kit! : CLASS_KITS[cls][0];
    h.arms = it ? { [it.kit!]: it } : {};
    Object.assign(h, { combo: 0, heavy: false, power: 0 });
    refreshHealth(h);
    ev.push({ k: 'weapon', x: h.x, y: h.y, name: it ? itemName(it) : WEAPONS[h.weapon].name });
  } else if (op === GEAR.off) {
    // A ring off, into the pack (if there's room).
    const r = h.rings[arg];
    if (!r || h.bag.length >= PACK || r.hungry === 'wedding') return;
    h.rings.splice(arg, 1);
    h.bag.push(r);
    refreshHealth(h);
  } else if (op === GEAR.drop) {
    // Hungry gear can't be dropped: only given up at the church.
    if (h.bag[arg] && h.bag[arg].quality !== 'hungry') h.bag.splice(arg, 1);
  } else if (op === GEAR.front) {
    // A potion to the front of the belt (drunk next).
    const [p] = h.belt.splice(arg, 1);
    if (p) h.belt.unshift(p);
  } else if (op === GEAR.pour) {
    h.belt.splice(arg, 1);
  } else if (op === GEAR.carry) {
    const r = arg >= 0 ? h.found[arg] : undefined;
    if (arg >= 0 && !r) return;
    h.relics = abilitiesOf(cls, r);
    if (!h.relics.includes(h.relic)) h.relic = h.relics[0];
    ev.push({ k: 'relic', x: h.x, y: h.y, name: r ? RELICS[r].name : RELICS[h.relics[0]].name });
  }
}
